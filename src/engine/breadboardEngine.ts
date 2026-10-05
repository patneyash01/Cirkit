import { CircuitComponent, Connection } from '../types/circuit';

export interface BreadboardHoleInfo {
  holeId: string;
  groupId: string; // Electrical node identifier on breadboard
  col: number; // 1 to 36
  row: string; // 'A'..'J' or 'pos_top' | 'neg_top' | 'pos_bot' | 'neg_bot'
  x: number; // Global canvas X
  y: number; // Global canvas Y
}

export const BREADBOARD_ORIGIN_X = 260;
export const BREADBOARD_ORIGIN_Y = 140;
export const BREADBOARD_COLS = 30;
export const BREADBOARD_COL_SPACING = 20;
export const BREADBOARD_START_X = 40;

// Precompute all breadboard holes and their electrical connectivity groups
export const ALL_BREADBOARD_HOLES: BreadboardHoleInfo[] = (() => {
  const holes: BreadboardHoleInfo[] = [];

  const rowTopDefs: { row: string; ry: number }[] = [
    { row: 'A', ry: 68 },
    { row: 'B', ry: 82 },
    { row: 'C', ry: 96 },
    { row: 'D', ry: 110 },
    { row: 'E', ry: 124 },
  ];

  const rowBotDefs: { row: string; ry: number }[] = [
    { row: 'F', ry: 172 },
    { row: 'G', ry: 186 },
    { row: 'H', ry: 200 },
    { row: 'I', ry: 214 },
    { row: 'J', ry: 228 },
  ];

  for (let c = 0; c < BREADBOARD_COLS; c++) {
    const colNum = c + 1;
    const gx = BREADBOARD_ORIGIN_X + BREADBOARD_START_X + c * BREADBOARD_COL_SPACING;

    // Top power rails: (+) ry=24, (-) ry=44
    holes.push({
      holeId: `hole-pos-top-${colNum}`,
      groupId: 'bb-rail-pos-top',
      col: colNum,
      row: 'pos_top',
      x: gx,
      y: BREADBOARD_ORIGIN_Y + 24,
    });

    holes.push({
      holeId: `hole-neg-top-${colNum}`,
      groupId: 'bb-rail-neg-top',
      col: colNum,
      row: 'neg_top',
      x: gx,
      y: BREADBOARD_ORIGIN_Y + 44,
    });

    // Rows A to E (share electrical tie strip `bb-col-top-${colNum}`)
    for (const r of rowTopDefs) {
      holes.push({
        holeId: `hole-${r.row}-${colNum}`,
        groupId: `bb-col-top-${colNum}`,
        col: colNum,
        row: r.row,
        x: gx,
        y: BREADBOARD_ORIGIN_Y + r.ry,
      });
    }

    // Rows F to J (share electrical tie strip `bb-col-bot-${colNum}`)
    for (const r of rowBotDefs) {
      holes.push({
        holeId: `hole-${r.row}-${colNum}`,
        groupId: `bb-col-bot-${colNum}`,
        col: colNum,
        row: r.row,
        x: gx,
        y: BREADBOARD_ORIGIN_Y + r.ry,
      });
    }

    // Bottom power rails: (-) ry=256, (+) ry=276
    holes.push({
      holeId: `hole-neg-bot-${colNum}`,
      groupId: 'bb-rail-neg-bot',
      col: colNum,
      row: 'neg_bot',
      x: gx,
      y: BREADBOARD_ORIGIN_Y + 256,
    });

    holes.push({
      holeId: `hole-pos-bot-${colNum}`,
      groupId: 'bb-rail-pos-bot',
      col: colNum,
      row: 'pos_bot',
      x: gx,
      y: BREADBOARD_ORIGIN_Y + 276,
    });
  }

  return holes;
})();

export const BREADBOARD_HOLES_BY_ID = new Map<string, BreadboardHoleInfo>(
  ALL_BREADBOARD_HOLES.map(h => [h.holeId, h])
);

/**
 * Finds the nearest breadboard hole for a given canvas coordinate within snap radius.
 */
export function findNearestBreadboardHole(
  canvasX: number,
  canvasY: number,
  maxDistance: number = 14
): BreadboardHoleInfo | null {
  let closest: BreadboardHoleInfo | null = null;
  let minDist = maxDistance * maxDistance;

  for (const hole of ALL_BREADBOARD_HOLES) {
    const dx = hole.x - canvasX;
    const dy = hole.y - canvasY;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDist) {
      minDist = distSq;
      closest = hole;
    }
  }

  return closest;
}

/**
 * Calculates all component terminal locations and maps any terminals that land in
 * breadboard holes into their respective breadboard electrical groups.
 * Also handles explicit wire connections from components/boards to breadboard holes,
 * generating virtual tie-connections so the simulation engine models real breadboard connectivity.
 */
export function buildBreadboardConnections(
  components: CircuitComponent[],
  connections: Connection[],
  showBreadboard: boolean = true
): {
  augmentedConnections: Connection[];
  terminalToHole: Map<string, BreadboardHoleInfo>;
  activeBreadboardGroups: Map<string, { x: number; y: number; label: string }[]>;
} {
  const terminalToHole = new Map<string, BreadboardHoleInfo>();
  const groupToNodes = new Map<string, { compId: string; termId: string }[]>();
  const activeBreadboardGroups = new Map<string, { x: number; y: number; label: string }[]>();

  if (!showBreadboard) {
    return {
      augmentedConnections: [...connections],
      terminalToHole,
      activeBreadboardGroups,
    };
  }

  // 1. Check each component's physical terminals against breadboard holes
  for (const comp of components) {
    // Arduino and ESP32 might be placed off the breadboard or jumper wired to it
    const rad = (comp.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    for (const term of comp.terminals) {
      const termX = comp.x + (term.x * cos - term.y * sin);
      const termY = comp.y + (term.x * sin + term.y * cos);

      const hole = findNearestBreadboardHole(termX, termY, 14);
      if (hole) {
        const termKey = `${comp.id}:${term.id}`;
        terminalToHole.set(termKey, hole);

        if (!groupToNodes.has(hole.groupId)) {
          groupToNodes.set(hole.groupId, []);
        }
        groupToNodes.get(hole.groupId)!.push({ compId: comp.id, termId: term.id });

        if (!activeBreadboardGroups.has(hole.groupId)) {
          activeBreadboardGroups.set(hole.groupId, []);
        }
        activeBreadboardGroups.get(hole.groupId)!.push({
          x: hole.x,
          y: hole.y,
          label: `${hole.row}-${hole.col}`,
        });
      }
    }
  }

  // 2. Process explicit wire connections involving breadboard holes
  const regularConnections: Connection[] = [];
  let virtualIdCounter = 1;

  for (const conn of connections) {
    const isFromBB = conn.fromComponentId === 'breadboard';
    const isToBB = conn.toComponentId === 'breadboard';

    if (isFromBB && isToBB) {
      // Wire from one breadboard hole to another breadboard hole
      const holeFrom = BREADBOARD_HOLES_BY_ID.get(conn.fromTerminalId);
      const holeTo = BREADBOARD_HOLES_BY_ID.get(conn.toTerminalId);
      if (holeFrom && holeTo) {
        const nodeFrom = { compId: 'breadboard', termId: holeFrom.groupId };
        const nodeTo = { compId: 'breadboard', termId: holeTo.groupId };

        if (!groupToNodes.has(holeFrom.groupId)) groupToNodes.set(holeFrom.groupId, []);
        groupToNodes.get(holeFrom.groupId)!.push(nodeFrom);

        if (!groupToNodes.has(holeTo.groupId)) groupToNodes.set(holeTo.groupId, []);
        groupToNodes.get(holeTo.groupId)!.push(nodeTo);

        regularConnections.push({
          id: conn.id,
          fromComponentId: 'breadboard',
          fromTerminalId: holeFrom.groupId,
          toComponentId: 'breadboard',
          toTerminalId: holeTo.groupId,
          color: conn.color,
        });
      }
    } else if (isFromBB) {
      const holeFrom = BREADBOARD_HOLES_BY_ID.get(conn.fromTerminalId);
      if (holeFrom) {
        const pseudoNode = { compId: 'breadboard', termId: holeFrom.groupId };
        if (!groupToNodes.has(holeFrom.groupId)) groupToNodes.set(holeFrom.groupId, []);
        groupToNodes.get(holeFrom.groupId)!.push(pseudoNode);

        regularConnections.push({
          id: conn.id,
          fromComponentId: 'breadboard',
          fromTerminalId: holeFrom.groupId,
          toComponentId: conn.toComponentId,
          toTerminalId: conn.toTerminalId,
          color: conn.color,
        });
      }
    } else if (isToBB) {
      const holeTo = BREADBOARD_HOLES_BY_ID.get(conn.toTerminalId);
      if (holeTo) {
        const pseudoNode = { compId: 'breadboard', termId: holeTo.groupId };
        if (!groupToNodes.has(holeTo.groupId)) groupToNodes.set(holeTo.groupId, []);
        groupToNodes.get(holeTo.groupId)!.push(pseudoNode);

        regularConnections.push({
          id: conn.id,
          fromComponentId: conn.fromComponentId,
          fromTerminalId: conn.fromTerminalId,
          toComponentId: 'breadboard',
          toTerminalId: holeTo.groupId,
          color: conn.color,
        });
      }
    } else {
      regularConnections.push(conn);
    }
  }

  // 3. Synthesize internal tie-connections for any breadboard group with 2 or more nodes attached
  const virtualBreadboardConnections: Connection[] = [];

  groupToNodes.forEach((nodeList, groupId) => {
    // Deduplicate any repeated references
    const unique = nodeList.filter(
      (item, idx, self) => idx === self.findIndex(t => t.compId === item.compId && t.termId === item.termId)
    );

    if (unique.length >= 2) {
      const base = unique[0];
      for (let i = 1; i < unique.length; i++) {
        const target = unique[i];
        virtualBreadboardConnections.push({
          id: `bb-internal-${groupId}-${virtualIdCounter++}`,
          fromComponentId: base.compId,
          fromTerminalId: base.termId,
          toComponentId: target.compId,
          toTerminalId: target.termId,
          color: '#3b82f6',
        });
      }
    }
  });

  return {
    augmentedConnections: [...regularConnections, ...virtualBreadboardConnections],
    terminalToHole,
    activeBreadboardGroups,
  };
}

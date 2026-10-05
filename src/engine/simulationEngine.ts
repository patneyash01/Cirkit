import {
  CircuitComponent,
  Connection,
  SimulationResults,
  ComponentSimulationData,
  DiagnosticIssue,
} from '../types/circuit';
import { validateCircuit } from './circuitValidator';
import { buildBreadboardConnections, ALL_BREADBOARD_HOLES } from './breadboardEngine';

interface NodeMapping {
  terminalToNode: Map<string, number>;
  nodeCount: number;
  groundNodeId: number | null;
}

class UnionFind {
  private parent: Map<string, string> = new Map();

  find(item: string): string {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      return item;
    }
    const p = this.parent.get(item)!;
    if (p !== item) {
      const root = this.find(p);
      this.parent.set(item, root);
      return root;
    }
    return item;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }
}

function buildNodeMapping(components: CircuitComponent[], connections: Connection[]): NodeMapping {
  const uf = new UnionFind();

  for (const comp of components) {
    for (const term of comp.terminals) {
      const key = `${comp.id}:${term.id}`;
      uf.find(key);
    }
    // Union internal grounds for multi-ground boards
    if (comp.type === 'arduino_uno') {
      const gnds = ['gnd', 'GND', 'gnd1', 'gnd2', 'gnd_d'].filter(id => comp.terminals.some(t => t.id === id));
      for (let i = 1; i < gnds.length; i++) {
        uf.union(`${comp.id}:${gnds[0]}`, `${comp.id}:${gnds[i]}`);
      }
    } else if (comp.type === 'esp32') {
      const gnds = ['gnd', 'GND', 'gnd2'].filter(id => comp.terminals.some(t => t.id === id));
      for (let i = 1; i < gnds.length; i++) {
        uf.union(`${comp.id}:${gnds[0]}`, `${comp.id}:${gnds[i]}`);
      }
    }
  }

  for (const conn of connections) {
    const key1 = `${conn.fromComponentId}:${conn.fromTerminalId}`;
    const key2 = `${conn.toComponentId}:${conn.toTerminalId}`;
    uf.union(key1, key2);
  }

  const rootToNodeId = new Map<string, number>();
  let nextNodeId = 1;

  let groundRoot: string | null = null;
  for (const comp of components) {
    if (comp.type === 'ground') {
      groundRoot = uf.find(`${comp.id}:gnd`);
      break;
    }
    if (comp.type === 'arduino_uno' || comp.type === 'esp32') {
      const gndTerm = comp.terminals.find(t =>
        t.id === 'gnd' || t.id === 'GND' || t.id === 'gnd1' || t.id === 'gnd2' || t.id === 'gnd_d'
      );
      if (gndTerm) {
        groundRoot = uf.find(`${comp.id}:${gndTerm.id}`);
        break;
      }
    }
  }

  if (!groundRoot) {
    for (const comp of components) {
      if (comp.type === 'battery' || comp.type === 'battery_holder' || comp.type === 'dc_source') {
        groundRoot = uf.find(`${comp.id}:neg`);
        break;
      }
    }
  }

  if (groundRoot) {
    rootToNodeId.set(groundRoot, 0);
  }

  const terminalToNode = new Map<string, number>();
  // 1. Map component terminals
  for (const comp of components) {
    for (const term of comp.terminals) {
      const key = `${comp.id}:${term.id}`;
      const root = uf.find(key);
      if (!rootToNodeId.has(root)) {
        rootToNodeId.set(root, nextNodeId++);
      }
      terminalToNode.set(key, rootToNodeId.get(root)!);
    }
  }

  // 2. Map breadboard hole/group connections and any other connection endpoints
  for (const conn of connections) {
    const keys = [`${conn.fromComponentId}:${conn.fromTerminalId}`, `${conn.toComponentId}:${conn.toTerminalId}`];
    for (const key of keys) {
      if (!terminalToNode.has(key)) {
        const root = uf.find(key);
        if (!rootToNodeId.has(root)) {
          rootToNodeId.set(root, nextNodeId++);
        }
        terminalToNode.set(key, rootToNodeId.get(root)!);
      }
    }
  }

  return {
    terminalToNode,
    nodeCount: rootToNodeId.size,
    groundNodeId: groundRoot ? 0 : null,
  };
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > maxVal) {
        maxVal = Math.abs(M[r][i]);
        maxRow = r;
      }
    }

    if (maxVal < 1e-12) {
      continue;
    }

    if (maxRow !== i) {
      const temp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = temp;
    }

    const pivot = M[i][i];
    for (let j = i; j <= n; j++) {
      M[i][j] /= pivot;
    }

    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = M[r][i];
        if (Math.abs(factor) > 1e-14) {
          for (let c = i; c <= n; c++) {
            M[r][c] -= factor * M[i][c];
          }
        }
      }
    }
  }

  return M.map(row => (isNaN(row[n]) ? 0 : row[n]));
}

/**
 * Core DC Electrical Simulation Engine using Modified Nodal Analysis (MNA)
 * Supports breadboard physical connectivity, non-linear semiconductors, microcontrollers, and sensors.
 */
export function runCircuitSimulation(
  components: CircuitComponent[],
  connections: Connection[],
  showBreadboard: boolean = true,
  arduinoPinOutputs?: Record<string, number>,
  simTime?: number,
  prevCapacitorVoltages?: Map<string, number>
): SimulationResults {
  const timestamp = Date.now();

  // 1. Augment connections with breadboard tie-points
  const { augmentedConnections } = buildBreadboardConnections(components, connections, showBreadboard);

  // 2. Validate circuit
  const diagnostics = validateCircuit(components, augmentedConnections);

  if (components.length === 0) {
    return {
      isRunning: true,
      timestamp,
      totalVoltage: 0,
      totalCurrent: 0,
      totalPower: 0,
      nodeVoltages: {},
      componentResults: {},
      diagnostics,
      warnings: [],
    };
  }

  const { terminalToNode, nodeCount, groundNodeId } = buildNodeMapping(components, augmentedConnections);

  // Identify voltage sources: batteries, DC sources, and active Arduino output pins
  const standardVoltageSources = components.filter(
    c => c.type === 'battery' || c.type === 'battery_holder' || c.type === 'dc_source' || c.type === 'ac_source'
  );

  interface ExtraVSource {
    id: string;
    nPos: number;
    nNeg: number;
    voltage: number;
  }
  const extraSources: ExtraVSource[] = [];

  for (const comp of components) {
    if (comp.type === 'arduino_uno' || comp.type === 'esp32') {
      const gndNode =
        terminalToNode.get(`${comp.id}:gnd`) ??
        terminalToNode.get(`${comp.id}:GND`) ??
        terminalToNode.get(`${comp.id}:gnd1`) ??
        terminalToNode.get(`${comp.id}:gnd_d`) ??
        0;

      const v5Node = terminalToNode.get(`${comp.id}:5v`) ?? terminalToNode.get(`${comp.id}:5V`) ?? terminalToNode.get(`${comp.id}:vcc`);
      if (v5Node !== undefined) {
        extraSources.push({ id: `${comp.id}:5V`, nPos: v5Node, nNeg: gndNode, voltage: 5.0 });
      }
      const v33Node = terminalToNode.get(`${comp.id}:3v3`) ?? terminalToNode.get(`${comp.id}:3V3`);
      if (v33Node !== undefined) {
        extraSources.push({ id: `${comp.id}:3V3`, nPos: v33Node, nNeg: gndNode, voltage: 3.3 });
      }

      if (comp.type === 'arduino_uno') {
        const vinNode = terminalToNode.get(`${comp.id}:vin`) ?? terminalToNode.get(`${comp.id}:VIN`);
        if (vinNode !== undefined) {
          extraSources.push({ id: `${comp.id}:vin`, nPos: vinNode, nNeg: gndNode, voltage: 5.0 });
        }
        // Digital pins D0-D13
        for (let p = 0; p <= 13; p++) {
          const pStr = String(p);
          const pinNode =
            terminalToNode.get(`${comp.id}:d${pStr}`) ??
            terminalToNode.get(`${comp.id}:${pStr}`) ??
            terminalToNode.get(`${comp.id}:pin${pStr}`);
          if (pinNode !== undefined) {
            let pinV = 0.0;
            if (arduinoPinOutputs && (arduinoPinOutputs[pStr] !== undefined || arduinoPinOutputs[`d${pStr}`] !== undefined)) {
              pinV = arduinoPinOutputs[pStr] ?? arduinoPinOutputs[`d${pStr}`] ?? 0.0;
            } else if (p === 13) {
              pinV = 5.0; // Default D13 is active HIGH
            }
            extraSources.push({ id: `${comp.id}:d${pStr}`, nPos: pinNode, nNeg: gndNode, voltage: pinV });
          }
        }
      } else if (comp.type === 'esp32') {
        const vinNode = terminalToNode.get(`${comp.id}:vin`) ?? terminalToNode.get(`${comp.id}:VIN`);
        if (vinNode !== undefined) {
          extraSources.push({ id: `${comp.id}:vin`, nPos: vinNode, nNeg: gndNode, voltage: 5.0 });
        }
        const d2Node = terminalToNode.get(`${comp.id}:d2`) ?? terminalToNode.get(`${comp.id}:gpio2`);
        if (d2Node !== undefined) {
          const d2V = arduinoPinOutputs?.['2'] ?? arduinoPinOutputs?.['d2'] ?? 3.3;
          extraSources.push({ id: `${comp.id}:d2`, nPos: d2Node, nNeg: gndNode, voltage: d2V });
        }
      }
    } else if (comp.type === 'temp_sensor') {
      // TMP36 outputs 10mV/°C, with 500mV offset at 0°C (e.g. 750mV at 25°C)
      const voutNode = terminalToNode.get(`${comp.id}:vout`) ?? terminalToNode.get(`${comp.id}:out`);
      const gndNode = terminalToNode.get(`${comp.id}:gnd`) ?? 0;
      if (voutNode !== undefined) {
        const temp = comp.properties.temperature ?? 25;
        const vOut = Math.max(0.1, Math.min(2.0, 0.5 + temp * 0.01));
        extraSources.push({ id: `${comp.id}:vout`, nPos: voutNode, nNeg: gndNode, voltage: vOut });
      }
    }
  }

  const numUnknownNodes = nodeCount;
  const numVsources = standardVoltageSources.length + extraSources.length;
  const matrixSize = numUnknownNodes + numVsources;

  let nodeVoltagesArray = new Array(numUnknownNodes).fill(0);

  type NonLinearState = { conducting: boolean; vDrop: number; rEq: number; isBreakdown?: boolean };
  const nonLinearStates = new Map<string, NonLinearState>();

  for (const c of components) {
    if (c.type === 'led' || c.type === 'diode' || c.type === 'zener_diode') {
      const vFwd = c.type === 'led' ? (c.properties.forwardVoltage ?? 2.0) : 0.7;
      nonLinearStates.set(c.id, {
        conducting: false,
        vDrop: vFwd,
        rEq: 1e7,
        isBreakdown: false,
      });
    } else if (c.type === 'transistor_npn' || c.type === 'transistor_pnp') {
      nonLinearStates.set(c.id, {
        conducting: false,
        vDrop: 0.7,
        rEq: 1e6,
      });
    }
  }

  const maxIterations = 8;
  for (let iter = 0; iter < maxIterations; iter++) {
    const G: number[][] = Array.from({ length: matrixSize }, () => new Array(matrixSize).fill(0));
    const I_vec: number[] = new Array(matrixSize).fill(0);

    const gndNode = groundNodeId ?? 0;
    if (gndNode < numUnknownNodes) {
      G[gndNode][gndNode] = 1;
      I_vec[gndNode] = 0;
    }

    const addConductance = (n1: number, n2: number, conductance: number) => {
      if (conductance <= 0 || isNaN(conductance)) return;
      if (n1 !== gndNode) {
        G[n1][n1] += conductance;
        if (n2 !== gndNode) G[n1][n2] -= conductance;
      }
      if (n2 !== gndNode) {
        G[n2][n2] += conductance;
        if (n1 !== gndNode) G[n2][n1] -= conductance;
      }
    };

    const addNortonBranch = (nPlus: number, nMinus: number, g: number, iEq: number) => {
      addConductance(nPlus, nMinus, g);
      if (nPlus !== gndNode) I_vec[nPlus] -= iEq;
      if (nMinus !== gndNode) I_vec[nMinus] += iEq;
    };

    // Linear components & state-dependent elements
    for (const comp of components) {
      if (comp.type === 'resistor') {
        const n1 = terminalToNode.get(`${comp.id}:t1`) ?? 0;
        const n2 = terminalToNode.get(`${comp.id}:t2`) ?? 0;
        const r = Math.max(0.1, comp.properties.resistance ?? 220);
        addConductance(n1, n2, 1 / r);
      } else if (comp.type === 'potentiometer') {
        const n1 = terminalToNode.get(`${comp.id}:t1`) ?? 0;
        const nw = terminalToNode.get(`${comp.id}:wiper`) ?? 0;
        const n2 = terminalToNode.get(`${comp.id}:t2`) ?? 0;
        const maxR = comp.properties.maxResistance ?? 10000;
        const pos = Math.min(0.999, Math.max(0.001, comp.properties.potentiometerPosition ?? 0.5));
        const rA = Math.max(0.1, maxR * pos);
        const rB = Math.max(0.1, maxR * (1 - pos));
        addConductance(n1, nw, 1 / rA);
        addConductance(nw, n2, 1 / rB);
      } else if (comp.type === 'switch' || comp.type === 'push_button') {
        const n1 = terminalToNode.get(`${comp.id}:t1`) ?? 0;
        const n2 = terminalToNode.get(`${comp.id}:t2`) ?? 0;
        const isOpen = !comp.properties.state;
        addConductance(n1, n2, isOpen ? 1 / 1e8 : 1 / 0.001);
      } else if (comp.type === 'buzzer' || comp.type === 'dc_motor') {
        const n1 = terminalToNode.get(`${comp.id}:pos`) ?? terminalToNode.get(`${comp.id}:t1`) ?? 0;
        const n2 = terminalToNode.get(`${comp.id}:neg`) ?? terminalToNode.get(`${comp.id}:t2`) ?? 0;
        const r = Math.max(1, comp.properties.resistance ?? 100);
        addConductance(n1, n2, 1 / r);
      } else if (comp.type === 'ldr') {
        const n1 = terminalToNode.get(`${comp.id}:t1`) ?? 0;
        const n2 = terminalToNode.get(`${comp.id}:t2`) ?? 0;
        const lux = comp.properties.lightLevel ?? 50;
        const r = Math.max(200, 100000 / (1 + (lux / 10) * 8));
        addConductance(n1, n2, 1 / r);
      } else if (comp.type === 'capacitor') {
        const n1 = terminalToNode.get(`${comp.id}:pos`) ?? 0;
        const n2 = terminalToNode.get(`${comp.id}:neg`) ?? 0;
        const C = comp.properties.capacitance ?? 0.0001;
        const dt = 0.01;
        const gC = Math.max(1e-6, Math.min(1e4, C / dt));
        const vPrev = prevCapacitorVoltages?.get(comp.id) ?? 0;
        addNortonBranch(n1, n2, gC, gC * vPrev);
      } else if (comp.type === 'led' || comp.type === 'diode') {
        const nAnode = terminalToNode.get(`${comp.id}:anode`) ?? 0;
        const nCathode = terminalToNode.get(`${comp.id}:cathode`) ?? 0;
        const st = nonLinearStates.get(comp.id)!;
        if (st.conducting) {
          const rf = 12.0;
          const g = 1 / rf;
          const iEq = st.vDrop * g;
          addNortonBranch(nAnode, nCathode, g, iEq);
        } else {
          addConductance(nAnode, nCathode, 1 / 1e7);
        }
      } else if (comp.type === 'zener_diode') {
        const nAnode = terminalToNode.get(`${comp.id}:anode`) ?? 0;
        const nCathode = terminalToNode.get(`${comp.id}:cathode`) ?? 0;
        const st = nonLinearStates.get(comp.id)!;
        if (st.conducting) {
          // Forward conduction
          const g = 1 / 10.0;
          addNortonBranch(nAnode, nCathode, g, 0.7 * g);
        } else if (st.isBreakdown) {
          // Reverse breakdown (Cathode positive relative to Anode >= Vz)
          const vz = comp.properties.zenerVoltage ?? 5.1;
          const g = 1 / 15.0;
          addNortonBranch(nCathode, nAnode, g, vz * g);
        } else {
          addConductance(nAnode, nCathode, 1 / 1e7);
        }
      } else if (comp.type === 'transistor_npn') {
        const nC = terminalToNode.get(`${comp.id}:collector`) ?? 0;
        const nB = terminalToNode.get(`${comp.id}:base`) ?? 0;
        const nE = terminalToNode.get(`${comp.id}:emitter`) ?? 0;
        const st = nonLinearStates.get(comp.id)!;
        if (st.conducting) {
          // Base-emitter drop ~0.7V
          addNortonBranch(nB, nE, 1 / 25, 0.7 / 25);
          // Collector-emitter saturation conductance
          addConductance(nC, nE, 1 / 3.0);
        } else {
          addConductance(nB, nE, 1 / 1e6);
          addConductance(nC, nE, 1 / 1e7);
        }
      } else if (comp.type === 'relay') {
        const nC1 = terminalToNode.get(`${comp.id}:coil1`) ?? 0;
        const nC2 = terminalToNode.get(`${comp.id}:coil2`) ?? 0;
        const nCom = terminalToNode.get(`${comp.id}:com`) ?? 0;
        const nNO = terminalToNode.get(`${comp.id}:no`) ?? 0;
        const nNC = terminalToNode.get(`${comp.id}:nc`) ?? 0;

        // Coil resistance ~70 ohms
        addConductance(nC1, nC2, 1 / 70);

        const vCoil = Math.abs((nodeVoltagesArray[nC1] ?? 0) - (nodeVoltagesArray[nC2] ?? 0));
        const isEnergized = vCoil >= 3.5;

        if (isEnergized) {
          addConductance(nCom, nNO, 1 / 0.05); // Contact closed
          addConductance(nCom, nNC, 1 / 1e8);
        } else {
          addConductance(nCom, nNC, 1 / 0.05); // Normally closed contact
          addConductance(nCom, nNO, 1 / 1e8);
        }
      }
    }

    // Voltage Sources (Standard batteries + auxiliary sources)
    let vRow = numUnknownNodes;
    standardVoltageSources.forEach(src => {
      const nPos = terminalToNode.get(`${src.id}:pos`) ?? terminalToNode.get(`${src.id}:live`) ?? 0;
      const nNeg = terminalToNode.get(`${src.id}:neg`) ?? terminalToNode.get(`${src.id}:neutral`) ?? 0;
      let vNominal = src.properties.voltage ?? (src.type === 'battery_holder' ? 3.0 : 9.0);
      if (src.type === 'ac_source') {
        const freq = src.properties.frequency ?? 50;
        const vPeak = src.properties.voltage ?? 5.0;
        const t = simTime ?? 0;
        vNominal = vPeak * Math.sin(2 * Math.PI * freq * t);
      }

      if (nPos !== gndNode) {
        G[nPos][vRow] += 1;
        G[vRow][nPos] += 1;
      }
      if (nNeg !== gndNode) {
        G[nNeg][vRow] -= 1;
        G[vRow][nNeg] -= 1;
      }
      I_vec[vRow] = vNominal;
      vRow++;
    });

    extraSources.forEach(src => {
      if (src.nPos !== gndNode) {
        G[src.nPos][vRow] += 1;
        G[vRow][src.nPos] += 1;
      }
      if (src.nNeg !== gndNode) {
        G[src.nNeg][vRow] -= 1;
        G[vRow][src.nNeg] -= 1;
      }
      I_vec[vRow] = src.voltage;
      vRow++;
    });

    const solution = solveLinearSystem(G, I_vec);
    nodeVoltagesArray = solution.slice(0, numUnknownNodes);

    let stateChanged = false;
    for (const comp of components) {
      if (comp.type === 'led' || comp.type === 'diode') {
        const nA = terminalToNode.get(`${comp.id}:anode`) ?? 0;
        const nK = terminalToNode.get(`${comp.id}:cathode`) ?? 0;
        const vDiff = (nodeVoltagesArray[nA] ?? 0) - (nodeVoltagesArray[nK] ?? 0);
        const st = nonLinearStates.get(comp.id)!;
        const vTh = comp.type === 'led' ? (comp.properties.forwardVoltage ?? 2.0) : 0.7;
        const shouldConduct = vDiff >= vTh * 0.95;
        if (shouldConduct !== st.conducting) {
          st.conducting = shouldConduct;
          stateChanged = true;
        }
      } else if (comp.type === 'zener_diode') {
        const nA = terminalToNode.get(`${comp.id}:anode`) ?? 0;
        const nK = terminalToNode.get(`${comp.id}:cathode`) ?? 0;
        const vA = nodeVoltagesArray[nA] ?? 0;
        const vK = nodeVoltagesArray[nK] ?? 0;
        const st = nonLinearStates.get(comp.id)!;
        const vz = comp.properties.zenerVoltage ?? 5.1;
        const isFwd = vA - vK >= 0.65;
        const isRevBreak = vK - vA >= vz * 0.95;
        if (isFwd !== st.conducting || isRevBreak !== st.isBreakdown) {
          st.conducting = isFwd;
          st.isBreakdown = isRevBreak;
          stateChanged = true;
        }
      } else if (comp.type === 'transistor_npn') {
        const nB = terminalToNode.get(`${comp.id}:base`) ?? 0;
        const nE = terminalToNode.get(`${comp.id}:emitter`) ?? 0;
        const vBE = (nodeVoltagesArray[nB] ?? 0) - (nodeVoltagesArray[nE] ?? 0);
        const st = nonLinearStates.get(comp.id)!;
        const shouldConduct = vBE >= 0.65;
        if (shouldConduct !== st.conducting) {
          st.conducting = shouldConduct;
          stateChanged = true;
        }
      }
    }

    if (!stateChanged && iter > 0) break;
  }

  const nodeVoltages: Record<string, number> = {};
  terminalToNode.forEach((nodeId, termKey) => {
    nodeVoltages[termKey] = Number((nodeVoltagesArray[nodeId] ?? 0).toFixed(4));
  });

  // Also populate individual breadboard holes so probes and multimeter can directly read hole IDs
  ALL_BREADBOARD_HOLES.forEach(hole => {
    const groupKey = `breadboard:${hole.groupId}`;
    if (terminalToNode.has(groupKey)) {
      const nodeId = terminalToNode.get(groupKey)!;
      const v = Number((nodeVoltagesArray[nodeId] ?? 0).toFixed(4));
      nodeVoltages[`breadboard:${hole.holeId}`] = v;
      nodeVoltages[hole.holeId] = v;
    }
  });

  const componentResults: Record<string, ComponentSimulationData> = {};
  let totalCircuitCurrent = 0;
  let totalCircuitPower = 0;
  let supplyVoltage = 0;
  const warnings: string[] = [];

  for (const comp of components) {
    if (comp.type === 'battery' || comp.type === 'battery_holder' || comp.type === 'dc_source' || comp.type === 'ac_source') {
      const vDrop = comp.properties.voltage ?? (comp.type === 'battery_holder' ? 3.0 : 9.0);
      supplyVoltage = Math.max(supplyVoltage, vDrop);
      componentResults[comp.id] = {
        voltageDrop: vDrop,
        current: 0,
        power: 0,
        state: 'active',
      };
    } else if (comp.type === 'resistor') {
      const n1 = terminalToNode.get(`${comp.id}:t1`) ?? 0;
      const n2 = terminalToNode.get(`${comp.id}:t2`) ?? 0;
      const vDrop = Math.abs((nodeVoltagesArray[n1] ?? 0) - (nodeVoltagesArray[n2] ?? 0));
      const r = Math.max(0.1, comp.properties.resistance ?? 220);
      const current = vDrop / r;
      const power = vDrop * current;
      const rating = comp.properties.powerRating ?? 0.25;

      totalCircuitCurrent += current;
      totalCircuitPower += power;

      if (power > rating) {
        diagnostics.push({
          id: `res-power-${comp.id}`,
          type: 'warning',
          title: 'Resistor Power Rating Exceeded',
          message: `${comp.name} is dissipating ${power.toFixed(2)}W, exceeding its ${rating}W thermal rating.`,
          suggestedFix: 'Use a higher power rated resistor or increase resistance value.',
          componentIds: [comp.id],
        });
      }

      componentResults[comp.id] = {
        voltageDrop: Number(vDrop.toFixed(3)),
        current: Number(current.toFixed(5)),
        power: Number(power.toFixed(4)),
        state: power > rating * 1.5 ? 'burnt' : current > 1e-4 ? 'active' : 'off',
      };
    } else if (comp.type === 'led') {
      const nA = terminalToNode.get(`${comp.id}:anode`) ?? 0;
      const nK = terminalToNode.get(`${comp.id}:cathode`) ?? 0;
      const vDiff = (nodeVoltagesArray[nA] ?? 0) - (nodeVoltagesArray[nK] ?? 0);
      const vFwd = comp.properties.forwardVoltage ?? 2.0;

      let current = 0;
      let state: 'on' | 'off' | 'burnt' = 'off';
      let brightness = 0;

      if (vDiff >= vFwd * 0.9) {
        current = Math.max(0, (vDiff - vFwd) / 12.0);
        if (current >= 0.001) {
          state = 'on';
          brightness = Math.min(1.0, Math.max(0.1, current / 0.02));
        }
        if (current > 0.03) {
          warnings.push(`LED ${comp.name} current (${(current * 1000).toFixed(1)}mA) exceeds 30mA safe maximum.`);
        }
        if (current > 0.1) {
          state = 'burnt';
        }
      }

      componentResults[comp.id] = {
        voltageDrop: Number(vDiff.toFixed(3)),
        current: Number(current.toFixed(5)),
        power: Number((Math.max(0, vDiff * current)).toFixed(4)),
        state,
        brightness: Number(brightness.toFixed(2)),
      };
    } else if (comp.type === 'diode' || comp.type === 'zener_diode') {
      const nA = terminalToNode.get(`${comp.id}:anode`) ?? 0;
      const nK = terminalToNode.get(`${comp.id}:cathode`) ?? 0;
      const vDiff = (nodeVoltagesArray[nA] ?? 0) - (nodeVoltagesArray[nK] ?? 0);
      const current = vDiff >= 0.65 ? (vDiff - 0.65) / 12 : 0;
      componentResults[comp.id] = {
        voltageDrop: Number(vDiff.toFixed(3)),
        current: Number(current.toFixed(5)),
        power: Number((Math.max(0, vDiff * current)).toFixed(4)),
        state: current > 1e-4 ? 'on' : 'off',
      };
    } else if (comp.type === 'transistor_npn' || comp.type === 'transistor_pnp') {
      const nC = terminalToNode.get(`${comp.id}:collector`) ?? 0;
      const nB = terminalToNode.get(`${comp.id}:base`) ?? 0;
      const nE = terminalToNode.get(`${comp.id}:emitter`) ?? 0;
      const vBE = (nodeVoltagesArray[nB] ?? 0) - (nodeVoltagesArray[nE] ?? 0);
      const isConducting = vBE >= 0.65;
      const vCE = Math.abs((nodeVoltagesArray[nC] ?? 0) - (nodeVoltagesArray[nE] ?? 0));
      const iC = isConducting ? Math.max(0.001, (comp.properties.beta ?? 100) * 0.0005) : 0;

      componentResults[comp.id] = {
        voltageDrop: Number(vCE.toFixed(3)),
        current: Number(iC.toFixed(5)),
        power: Number((vCE * iC).toFixed(4)),
        state: isConducting ? 'on' : 'off',
      };
    } else if (comp.type === 'switch' || comp.type === 'push_button') {
      const n1 = terminalToNode.get(`${comp.id}:t1`) ?? 0;
      const n2 = terminalToNode.get(`${comp.id}:t2`) ?? 0;
      const vDrop = Math.abs((nodeVoltagesArray[n1] ?? 0) - (nodeVoltagesArray[n2] ?? 0));
      componentResults[comp.id] = {
        voltageDrop: Number(vDrop.toFixed(3)),
        current: comp.properties.state ? 0.02 : 0,
        power: 0,
        state: comp.properties.state ? 'on' : 'off',
      };
    } else if (comp.type === 'dc_motor') {
      const n1 = terminalToNode.get(`${comp.id}:pos`) ?? terminalToNode.get(`${comp.id}:t1`) ?? 0;
      const n2 = terminalToNode.get(`${comp.id}:neg`) ?? terminalToNode.get(`${comp.id}:t2`) ?? 0;
      const vDrop = Math.abs((nodeVoltagesArray[n1] ?? 0) - (nodeVoltagesArray[n2] ?? 0));
      const current = vDrop / Math.max(1, comp.properties.resistance ?? 50);
      componentResults[comp.id] = {
        voltageDrop: Number(vDrop.toFixed(3)),
        current: Number(current.toFixed(5)),
        power: Number((vDrop * current).toFixed(4)),
        state: vDrop >= 1.5 ? 'on' : 'off',
      };
    } else if (comp.type === 'buzzer') {
      const n1 = terminalToNode.get(`${comp.id}:pos`) ?? terminalToNode.get(`${comp.id}:t1`) ?? 0;
      const n2 = terminalToNode.get(`${comp.id}:neg`) ?? terminalToNode.get(`${comp.id}:t2`) ?? 0;
      const vDrop = Math.abs((nodeVoltagesArray[n1] ?? 0) - (nodeVoltagesArray[n2] ?? 0));
      componentResults[comp.id] = {
        voltageDrop: Number(vDrop.toFixed(3)),
        current: Number((vDrop / 100).toFixed(5)),
        power: Number((vDrop * (vDrop / 100)).toFixed(4)),
        state: vDrop >= 2.5 ? 'on' : 'off',
      };
    } else {
      componentResults[comp.id] = {
        voltageDrop: 0,
        current: 0,
        power: 0,
        state: 'active',
      };
    }
  }

  standardVoltageSources.forEach(src => {
    if (componentResults[src.id]) {
      componentResults[src.id].current = Number(totalCircuitCurrent.toFixed(5));
      componentResults[src.id].power = Number((src.properties.voltage! * totalCircuitCurrent).toFixed(4));
    }
  });

  return {
    isRunning: true,
    timestamp,
    totalVoltage: Number(supplyVoltage.toFixed(2)),
    totalCurrent: Number((totalCircuitCurrent * 1000).toFixed(2)),
    totalPower: Number((totalCircuitPower * 1000).toFixed(2)),
    nodeVoltages,
    componentResults,
    diagnostics,
    warnings,
  };
}

export function calculateRCTransient(
  supplyVoltage: number,
  resistanceOhms: number,
  capacitanceFarads: number,
  durationSeconds: number,
  steps: number = 100,
  mode: 'charging' | 'discharging' = 'charging'
): { t: number; v: number; i: number }[] {
  const tau = resistanceOhms * capacitanceFarads;
  const timeStep = durationSeconds / steps;
  const points: { t: number; v: number; i: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i * timeStep;
    let v = 0;
    let current = 0;

    if (mode === 'charging') {
      v = supplyVoltage * (1 - Math.exp(-t / Math.max(1e-9, tau)));
      current = ((supplyVoltage - v) / Math.max(0.1, resistanceOhms)) * 1000;
    } else {
      v = supplyVoltage * Math.exp(-t / Math.max(1e-9, tau));
      current = (v / Math.max(0.1, resistanceOhms)) * 1000;
    }

    points.push({
      t: Number(t.toFixed(4)),
      v: Number(v.toFixed(3)),
      i: Number(current.toFixed(3)),
    });
  }

  return points;
}

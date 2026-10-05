import React, { useState } from 'react';
import {
  BreadboardHoleInfo,
  BREADBOARD_ORIGIN_X,
  BREADBOARD_ORIGIN_Y,
  BREADBOARD_COLS,
  BREADBOARD_HOLES_BY_ID,
} from '../../engine/breadboardEngine';

interface Props {
  x?: number;
  y?: number;
  cols?: number;
  onHoleClick?: (hole: BreadboardHoleInfo, e: React.MouseEvent) => void;
  hoveredHoleId?: string | null;
  highlightGroupId?: string | null;
  activeHoleIds?: Set<string>;
}

export const BreadboardCanvasOverlay: React.FC<Props> = ({
  x = BREADBOARD_ORIGIN_X,
  y = BREADBOARD_ORIGIN_Y,
  cols = BREADBOARD_COLS,
  onHoleClick,
  hoveredHoleId,
  highlightGroupId: externalHighlightGroupId,
  activeHoleIds,
}) => {
  const [internalHoverHole, setInternalHoverHole] = useState<BreadboardHoleInfo | null>(null);
  const activeHover = hoveredHoleId ? BREADBOARD_HOLES_BY_ID.get(hoveredHoleId) || null : internalHoverHole;
  const currentGroupId = externalHighlightGroupId || activeHover?.groupId;

  const colSpacing = 20;
  const startX = 40;
  const boardWidth = cols * colSpacing + 80;
  const boardHeight = 300;

  return (
    <g transform={`translate(${x}, ${y})`} className="select-none">
      <defs>
        {/* Realistic Workbench Drop Shadow for Breadboard */}
        <filter id="breadboard-shadow" x="-10%" y="-10%" width="125%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.16" />
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>

        {/* Center IC trough gradient for depth */}
        <linearGradient id="bb-trough" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.5" />
          <stop offset="15%" stopColor="#cbd5e1" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#f1f5f9" stopOpacity="0.9" />
          <stop offset="85%" stopColor="#cbd5e1" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" />
        </linearGradient>

        {/* Beveled edge plastic rim gradient */}
        <linearGradient id="bb-chassis-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="4%" stopColor="#f8fafc" />
          <stop offset="96%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        {/* Power rail colored gradients */}
        <linearGradient id="red-rail-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id="blue-rail-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      {/* 0. Black adhesive foam backing tape layer visible at edges */}
      <rect
        x="-3"
        y="4"
        width={boardWidth + 6}
        height={boardHeight}
        rx="10"
        fill="#1e293b"
        opacity="0.3"
        className="pointer-events-none"
      />

      {/* 1. Interlocking Side Tabs */}
      <rect x="-6" y="60" width="7" height="18" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" className="pointer-events-none" />
      <rect x="-6" y="220" width="7" height="18" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" className="pointer-events-none" />
      <rect x={boardWidth - 1} y="60" width="7" height="18" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" className="pointer-events-none" />
      <rect x={boardWidth - 1} y="220" width="7" height="18" rx="2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" className="pointer-events-none" />

      {/* 2. Main Breadboard ABS Molded Plastic Chassis */}
      <rect
        x="0"
        y="0"
        width={boardWidth}
        height={boardHeight}
        rx="10"
        fill="url(#bb-chassis-grad)"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        filter="url(#breadboard-shadow)"
        className="pointer-events-none"
      />

      {/* Inner chamfer highlight line for realistic molded plastic bevel */}
      <rect
        x="2"
        y="2"
        width={boardWidth - 4}
        height={boardHeight - 4}
        rx="8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.8"
        className="pointer-events-none"
      />

      {/* Corner mounting screw recesses */}
      {[
        { cx: 16, cy: 16 },
        { cx: boardWidth - 16, cy: 16 },
        { cx: 16, cy: boardHeight - 16 },
        { cx: boardWidth - 16, cy: boardHeight - 16 },
      ].map((pos, idx) => (
        <g key={idx} className="pointer-events-none">
          <circle cx={pos.cx} cy={pos.cy} r="5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
          <circle cx={pos.cx} cy={pos.cy} r="2.5" fill="#64748b" />
          <line x1={pos.cx - 2} y1={pos.cx - 2} x2={pos.cx + 2} y2={pos.cx + 2} stroke="#cbd5e1" strokeWidth="0.6" />
        </g>
      ))}

      {/* 3. Center IC Separation Trough / DIP Valley (0.3" standard pitch) */}
      <rect
        x="12"
        y="142"
        width={boardWidth - 24}
        height="16"
        rx="2"
        fill="url(#bb-trough)"
        stroke="#94a3b8"
        strokeWidth="0.8"
        opacity="0.75"
        className="pointer-events-none"
      />

      {/* Embossed brand text in center channel */}
      <text
        x={boardWidth / 2}
        y="153"
        fill="#94a3b8"
        fontSize="7.5"
        fontWeight="800"
        letterSpacing="2.5"
        textAnchor="middle"
        fontFamily="sans-serif"
        opacity="0.85"
        className="pointer-events-none"
      >
        CIRKIT LAB • 830-TIE POINT SOLDERLESS BREADBOARD
      </text>

      {/* 4. Power Distribution Rails - Top (Red + and Blue -) */}
      <line x1="26" y1="24" x2={boardWidth - 26} y2="24" stroke="url(#red-rail-grad)" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
      <line x1="26" y1="44" x2={boardWidth - 26} y2="44" stroke="url(#blue-rail-grad)" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />

      {/* Top Rail Labels (+ and -) */}
      <text x="14" y="28" fill="#ef4444" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">+</text>
      <text x={boardWidth - 14} y="28" fill="#ef4444" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">+</text>
      <text x="14" y="48" fill="#3b82f6" fontSize="15" fontWeight="900" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">-</text>
      <text x={boardWidth - 14} y="48" fill="#3b82f6" fontSize="15" fontWeight="900" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">-</text>

      {/* 5. Power Distribution Rails - Bottom (Blue - and Red +) */}
      <line x1="26" y1="256" x2={boardWidth - 26} y2="256" stroke="url(#blue-rail-grad)" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
      <line x1="26" y1="276" x2={boardWidth - 26} y2="276" stroke="url(#red-rail-grad)" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />

      {/* Bottom Rail Labels (- and +) */}
      <text x="14" y="260" fill="#3b82f6" fontSize="15" fontWeight="900" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">-</text>
      <text x={boardWidth - 14} y="260" fill="#3b82f6" fontSize="15" fontWeight="900" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">-</text>
      <text x="14" y="280" fill="#ef4444" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">+</text>
      <text x={boardWidth - 14} y="280" fill="#ef4444" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">+</text>

      {/* 6. Row Letter Labels (A B C D E and F G H I J) on Left, Center, and Right */}
      {['A', 'B', 'C', 'D', 'E'].map((letter, i) => {
        const ry = 68 + i * 14;
        return (
          <g key={letter} className="pointer-events-none">
            <text x="22" y={ry + 3} fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{letter}</text>
            <text x={boardWidth - 22} y={ry + 3} fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{letter}</text>
          </g>
        );
      })}

      {['F', 'G', 'H', 'I', 'J'].map((letter, i) => {
        const ry = 172 + i * 14;
        return (
          <g key={letter} className="pointer-events-none">
            <text x="22" y={ry + 3} fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{letter}</text>
            <text x={boardWidth - 22} y={ry + 3} fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{letter}</text>
          </g>
        );
      })}

      {/* Active Electrical Continuity Strip / Rail Highlights */}
      {currentGroupId && (
        <g className="pointer-events-none animate-pulse">
          {currentGroupId.startsWith('bb-col-top-') && (() => {
            const col = parseInt(currentGroupId.replace('bb-col-top-', ''), 10);
            const cx = startX + (col - 1) * colSpacing;
            return (
              <rect
                x={cx - 6}
                y={68 - 6}
                width={12}
                height={124 - 68 + 12}
                rx={6}
                fill="#38bdf8"
                fillOpacity={0.25}
                stroke="#0284c7"
                strokeWidth={1.5}
              />
            );
          })()}
          {currentGroupId.startsWith('bb-col-bot-') && (() => {
            const col = parseInt(currentGroupId.replace('bb-col-bot-', ''), 10);
            const cx = startX + (col - 1) * colSpacing;
            return (
              <rect
                x={cx - 6}
                y={172 - 6}
                width={12}
                height={228 - 172 + 12}
                rx={6}
                fill="#38bdf8"
                fillOpacity={0.25}
                stroke="#0284c7"
                strokeWidth={1.5}
              />
            );
          })()}
          {currentGroupId === 'bb-rail-pos-top' && (
            <rect x={24} y={24 - 7} width={boardWidth - 48} height={14} rx={7} fill="#ef4444" fillOpacity={0.2} stroke="#dc2626" strokeWidth={1.5} />
          )}
          {currentGroupId === 'bb-rail-neg-top' && (
            <rect x={24} y={44 - 7} width={boardWidth - 48} height={14} rx={7} fill="#3b82f6" fillOpacity={0.2} stroke="#2563eb" strokeWidth={1.5} />
          )}
          {currentGroupId === 'bb-rail-neg-bot' && (
            <rect x={24} y={256 - 7} width={boardWidth - 48} height={14} rx={7} fill="#3b82f6" fillOpacity={0.2} stroke="#2563eb" strokeWidth={1.5} />
          )}
          {currentGroupId === 'bb-rail-pos-bot' && (
            <rect x={24} y={276 - 7} width={boardWidth - 48} height={14} rx={7} fill="#ef4444" fillOpacity={0.2} stroke="#dc2626" strokeWidth={1.5} />
          )}
        </g>
      )}

      {/* 7. Numbered Columns & Sockets across the entire board (Interactive) */}
      {Array.from({ length: cols }).map((_, c) => {
        const cx = startX + c * colSpacing;
        const num = c + 1;
        const showNum = num === 1 || num % 5 === 0;

        return (
          <g key={c}>
            {/* Column Numbers at Top and Bottom of terminal bank */}
            {showNum && (
              <>
                <text x={cx} y="57" fill="#64748b" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">
                  {num}
                </text>
                <text x={cx} y="247" fill="#64748b" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="monospace" className="pointer-events-none">
                  {num}
                </text>
              </>
            )}

            {/* Top Power Rails Sockets: (+) y=24, (-) y=44 */}
            {[
              { ry: 24, row: 'pos_top', holeId: `hole-pos-top-${num}`, groupId: 'bb-rail-pos-top', label: `(+) Rail Col ${num}` },
              { ry: 44, row: 'neg_top', holeId: `hole-neg-top-${num}`, groupId: 'bb-rail-neg-top', label: `(-) Rail Col ${num}` },
            ].map(item => {
              const isHovered = activeHover?.holeId === item.holeId;
              const isTied = currentGroupId === item.groupId;
              const hasWire = activeHoleIds?.has(item.holeId);

              const holeInfo: BreadboardHoleInfo = {
                holeId: item.holeId,
                groupId: item.groupId,
                col: num,
                row: item.row,
                x: x + cx,
                y: y + item.ry,
              };

              return (
                <g
                  key={item.holeId}
                  className="cursor-crosshair group/bbhole"
                  onMouseEnter={() => setInternalHoverHole(holeInfo)}
                  onMouseLeave={() => setInternalHoverHole(null)}
                  onClick={e => {
                    e.stopPropagation();
                    onHoleClick?.(holeInfo, e);
                  }}
                >
                  {/* Invisible enlarged hit target for effortless clicking */}
                  <rect x={cx - 7} y={item.ry - 7} width="14" height="14" fill="transparent" />

                  {/* Socket outer lead-in chamfer */}
                  <rect
                    x={cx - 3}
                    y={item.ry - 3}
                    width="6"
                    height="6"
                    rx="1.2"
                    fill={isHovered ? '#38bdf8' : isTied ? '#0369a1' : hasWire ? '#e2e8f0' : '#1e293b'}
                    stroke={isHovered ? '#0284c7' : isTied ? '#38bdf8' : 'none'}
                    strokeWidth="1"
                  />
                  {/* Socket cavity */}
                  <rect x={cx - 2} y={item.ry - 2} width="4" height="4" rx="0.8" fill="#0f172a" />
                  {/* Metallic spring contact clip highlight */}
                  <line x1={cx - 1} y1={item.ry - 1.5} x2={cx - 1} y2={item.ry + 1.5} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.65" />
                  <line x1={cx + 1} y1={item.ry - 1.5} x2={cx + 1} y2={item.ry + 1.5} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.65" />

                  {/* Hover indicator ring */}
                  {isHovered && (
                    <circle cx={cx} cy={item.ry} r="5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                  )}
                  <title>{item.label}</title>
                </g>
              );
            })}

            {/* Terminal Rows A through E (y: 68, 82, 96, 110, 124) */}
            {[
              { row: 'A', ry: 68 },
              { row: 'B', ry: 82 },
              { row: 'C', ry: 96 },
              { row: 'D', ry: 110 },
              { row: 'E', ry: 124 },
            ].map(r => {
              const holeId = `hole-${r.row}-${num}`;
              const groupId = `bb-col-top-${num}`;
              const isHovered = activeHover?.holeId === holeId;
              const isTied = currentGroupId === groupId;
              const hasWire = activeHoleIds?.has(holeId);

              const holeInfo: BreadboardHoleInfo = {
                holeId,
                groupId,
                col: num,
                row: r.row,
                x: x + cx,
                y: y + r.ry,
              };

              return (
                <g
                  key={holeId}
                  className="cursor-crosshair group/bbhole"
                  onMouseEnter={() => setInternalHoverHole(holeInfo)}
                  onMouseLeave={() => setInternalHoverHole(null)}
                  onClick={e => {
                    e.stopPropagation();
                    onHoleClick?.(holeInfo, e);
                  }}
                >
                  <rect x={cx - 7} y={r.ry - 7} width="14" height="14" fill="transparent" />
                  <rect
                    x={cx - 3.2}
                    y={r.ry - 3.2}
                    width="6.4"
                    height="6.4"
                    rx="1.2"
                    fill={isHovered ? '#38bdf8' : isTied ? '#0369a1' : hasWire ? '#e2e8f0' : '#1e293b'}
                    stroke={isHovered ? '#0284c7' : isTied ? '#38bdf8' : 'none'}
                    strokeWidth="1"
                  />
                  <rect x={cx - 2.2} y={r.ry - 2.2} width="4.4" height="4.4" rx="0.8" fill="#0f172a" />
                  <line x1={cx - 1.2} y1={r.ry - 1.8} x2={cx - 1.2} y2={r.ry + 1.8} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.75" />
                  <line x1={cx + 1.2} y1={r.ry - 1.8} x2={cx + 1.2} y2={r.ry + 1.8} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.75" />

                  {isHovered && (
                    <circle cx={cx} cy={r.ry} r="5.5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                  )}
                  <title>{`Hole ${r.row}${num} (Tie strip: Col ${num})`}</title>
                </g>
              );
            })}

            {/* Terminal Rows F through J (y: 172, 186, 200, 214, 228) */}
            {[
              { row: 'F', ry: 172 },
              { row: 'G', ry: 186 },
              { row: 'H', ry: 200 },
              { row: 'I', ry: 214 },
              { row: 'J', ry: 228 },
            ].map(r => {
              const holeId = `hole-${r.row}-${num}`;
              const groupId = `bb-col-bot-${num}`;
              const isHovered = activeHover?.holeId === holeId;
              const isTied = currentGroupId === groupId;
              const hasWire = activeHoleIds?.has(holeId);

              const holeInfo: BreadboardHoleInfo = {
                holeId,
                groupId,
                col: num,
                row: r.row,
                x: x + cx,
                y: y + r.ry,
              };

              return (
                <g
                  key={holeId}
                  className="cursor-crosshair group/bbhole"
                  onMouseEnter={() => setInternalHoverHole(holeInfo)}
                  onMouseLeave={() => setInternalHoverHole(null)}
                  onClick={e => {
                    e.stopPropagation();
                    onHoleClick?.(holeInfo, e);
                  }}
                >
                  <rect x={cx - 7} y={r.ry - 7} width="14" height="14" fill="transparent" />
                  <rect
                    x={cx - 3.2}
                    y={r.ry - 3.2}
                    width="6.4"
                    height="6.4"
                    rx="1.2"
                    fill={isHovered ? '#38bdf8' : isTied ? '#0369a1' : hasWire ? '#e2e8f0' : '#1e293b'}
                    stroke={isHovered ? '#0284c7' : isTied ? '#38bdf8' : 'none'}
                    strokeWidth="1"
                  />
                  <rect x={cx - 2.2} y={r.ry - 2.2} width="4.4" height="4.4" rx="0.8" fill="#0f172a" />
                  <line x1={cx - 1.2} y1={r.ry - 1.8} x2={cx - 1.2} y2={r.ry + 1.8} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.75" />
                  <line x1={cx + 1.2} y1={r.ry - 1.8} x2={cx + 1.2} y2={r.ry + 1.8} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.75" />

                  {isHovered && (
                    <circle cx={cx} cy={r.ry} r="5.5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                  )}
                  <title>{`Hole ${r.row}${num} (Tie strip: Col ${num})`}</title>
                </g>
              );
            })}

            {/* Bottom Power Rails Sockets: (-) y=256, (+) y=276 */}
            {[
              { ry: 256, row: 'neg_bot', holeId: `hole-neg-bot-${num}`, groupId: 'bb-rail-neg-bot', label: `(-) Rail Col ${num}` },
              { ry: 276, row: 'pos_bot', holeId: `hole-pos-bot-${num}`, groupId: 'bb-rail-pos-bot', label: `(+) Rail Col ${num}` },
            ].map(item => {
              const isHovered = activeHover?.holeId === item.holeId;
              const isTied = currentGroupId === item.groupId;
              const hasWire = activeHoleIds?.has(item.holeId);

              const holeInfo: BreadboardHoleInfo = {
                holeId: item.holeId,
                groupId: item.groupId,
                col: num,
                row: item.row,
                x: x + cx,
                y: y + item.ry,
              };

              return (
                <g
                  key={item.holeId}
                  className="cursor-crosshair group/bbhole"
                  onMouseEnter={() => setInternalHoverHole(holeInfo)}
                  onMouseLeave={() => setInternalHoverHole(null)}
                  onClick={e => {
                    e.stopPropagation();
                    onHoleClick?.(holeInfo, e);
                  }}
                >
                  <rect x={cx - 7} y={item.ry - 7} width="14" height="14" fill="transparent" />
                  <rect
                    x={cx - 3}
                    y={item.ry - 3}
                    width="6"
                    height="6"
                    rx="1.2"
                    fill={isHovered ? '#38bdf8' : isTied ? '#0369a1' : hasWire ? '#e2e8f0' : '#1e293b'}
                    stroke={isHovered ? '#0284c7' : isTied ? '#38bdf8' : 'none'}
                    strokeWidth="1"
                  />
                  <rect x={cx - 2} y={item.ry - 2} width="4" height="4" rx="0.8" fill="#0f172a" />
                  <line x1={cx - 1} y1={item.ry - 1.5} x2={cx - 1} y2={item.ry + 1.5} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.65" />
                  <line x1={cx + 1} y1={item.ry - 1.5} x2={cx + 1} y2={item.ry + 1.5} stroke="#cbd5e1" strokeWidth="0.6" opacity="0.65" />

                  {isHovered && (
                    <circle cx={cx} cy={item.ry} r="5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                  )}
                  <title>{item.label}</title>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};


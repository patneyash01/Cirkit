import React from 'react';
import { CircuitComponent, ComponentSimulationData, Terminal } from '../../types/circuit';

interface Props {
  component: CircuitComponent;
  isSelected: boolean;
  simulationData?: ComponentSimulationData;
  connectedTerminals: Set<string>;
  activeTerminalId: string | null;
  onTerminalClick: (componentId: string, terminalId: string, e: React.MouseEvent) => void;
  onComponentClick: (componentId: string, e: React.MouseEvent) => void;
  onComponentDoubleClick: (componentId: string, e: React.MouseEvent) => void;
  onComponentMouseDown?: (componentId: string, e: React.MouseEvent) => void;
  onToggleSwitch?: (componentId: string, e: React.MouseEvent) => void;
}

export const ComponentRenderer: React.FC<Props> = ({
  component,
  isSelected,
  simulationData,
  connectedTerminals,
  activeTerminalId,
  onTerminalClick,
  onComponentClick,
  onComponentDoubleClick,
  onComponentMouseDown,
  onToggleSwitch,
}) => {
  const { id, type, name, x, y, rotation, properties, terminals } = component;
  const isSimOn = simulationData?.state === 'on' || simulationData?.state === 'active';
  const isBurnt = simulationData?.state === 'burnt';

  const renderSymbol = () => {
    switch (type) {
      case 'resistor':
        return (
          <g>
            {/* Leads */}
            <line x1="-40" y1="0" x2="-25" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="25" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Zigzag resistor body */}
            <path
              d="M -25 0 L -20 -10 L -10 10 L 0 -10 L 10 10 L 20 -10 L 25 0"
              fill="none"
              stroke={isSelected ? '#38bdf8' : '#38bdf8'}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Label */}
            <text x="0" y="-14" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="monospace">
              {properties.resistance ? `${properties.resistance}Ω` : name}
            </text>
          </g>
        );

      case 'battery':
      case 'dc_source':
        return (
          <g>
            {/* Negative lead & plate */}
            <line x1="-40" y1="0" x2="-10" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="-10" y1="-12" x2="-10" y2="12" stroke="#64748b" strokeWidth="3" />
            {/* Positive plate & lead */}
            <line x1="10" y1="-20" x2="10" y2="20" stroke="#38bdf8" strokeWidth="3.5" />
            <line x1="10" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Polarity signs */}
            <text x="22" y="-12" fill="#38bdf8" fontSize="13" fontWeight="bold">+</text>
            <text x="-24" y="-10" fill="#94a3b8" fontSize="14" fontWeight="bold">-</text>
            <text x="0" y="28" fill="#e2e8f0" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="monospace">
              {properties.voltage}V
            </text>
          </g>
        );

      case 'ground':
        return (
          <g>
            <line x1="0" y1="-25" x2="0" y2="-5" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="-18" y1="-5" x2="18" y2="-5" stroke="#38bdf8" strokeWidth="3" />
            <line x1="-12" y1="2" x2="12" y2="2" stroke="#38bdf8" strokeWidth="2.5" />
            <line x1="-6" y1="9" x2="6" y2="9" stroke="#38bdf8" strokeWidth="2" />
            <text x="0" y="24" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              GND
            </text>
          </g>
        );

      case 'led': {
        const color = properties.color || 'red';
        const glowColor =
          color === 'red' ? '#ef4444' : color === 'green' ? '#22c55e' : color === 'blue' ? '#3b82f6' : '#eab308';
        const isGlowing = isSimOn && (simulationData?.brightness ?? 0) > 0.1;

        return (
          <g>
            {/* Leads */}
            <line x1="-40" y1="0" x2="-14" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="14" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Glowing halo if active */}
            {isGlowing && (
              <circle cx="0" cy="0" r="26" fill={glowColor} opacity="0.3" filter="blur(6px)" />
            )}

            {/* Diode Triangle */}
            <polygon
              points="-14,-14 -14,14 14,0"
              fill={isGlowing ? glowColor : '#1e293b'}
              stroke={isGlowing ? glowColor : '#38bdf8'}
              strokeWidth="2.5"
            />
            {/* Cathode bar */}
            <line x1="14" y1="-14" x2="14" y2="14" stroke={isGlowing ? glowColor : '#38bdf8'} strokeWidth="3" />

            {/* Light emission arrows */}
            <g transform="translate(6, -16) rotate(-45)">
              <line x1="0" y1="0" x2="8" y2="0" stroke={isGlowing ? glowColor : '#94a3b8'} strokeWidth="1.8" />
              <polyline points="5,-3 8,0 5,3" fill="none" stroke={isGlowing ? glowColor : '#94a3b8'} strokeWidth="1.8" />
            </g>
            <g transform="translate(14, -10) rotate(-45)">
              <line x1="0" y1="0" x2="8" y2="0" stroke={isGlowing ? glowColor : '#94a3b8'} strokeWidth="1.8" />
              <polyline points="5,-3 8,0 5,3" fill="none" stroke={isGlowing ? glowColor : '#94a3b8'} strokeWidth="1.8" />
            </g>

            {isBurnt && (
              <text x="0" y="5" fill="#f87171" fontSize="16" fontWeight="bold" textAnchor="middle">💥</text>
            )}

            <text x="0" y="24" fill={isGlowing ? glowColor : '#cbd5e1'} fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="monospace">
              {isGlowing ? `ON (${((simulationData?.current ?? 0) * 1000).toFixed(1)}mA)` : 'OFF'}
            </text>
          </g>
        );
      }

      case 'diode':
        return (
          <g>
            <line x1="-40" y1="0" x2="-14" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="14" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <polygon points="-14,-14 -14,14 14,0" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
            <line x1="14" y1="-14" x2="14" y2="14" stroke="#e2e8f0" strokeWidth="3.5" />
            <text x="0" y="24" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="monospace">
              1N4007
            </text>
          </g>
        );

      case 'zener_diode':
        return (
          <g>
            <line x1="-40" y1="0" x2="-14" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="14" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <polygon points="-14,-14 -14,14 14,0" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
            {/* Zener cathode bent wings */}
            <path d="M 8 -18 L 14 -14 L 14 14 L 20 18" fill="none" stroke="#f59e0b" strokeWidth="3" />
            <text x="0" y="24" fill="#cbd5e1" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {properties.zenerVoltage ?? 5.1}V ZENER
            </text>
          </g>
        );

      case 'transistor_npn':
      case 'transistor_pnp': {
        const isNpn = type === 'transistor_npn';
        return (
          <g>
            {/* Base bar */}
            <line x1="-35" y1="0" x2="-10" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="-10" y1="-20" x2="-10" y2="20" stroke="#38bdf8" strokeWidth="4" />
            {/* Collector */}
            <line x1="-10" y1="-10" x2="18" y2="-22" stroke="#38bdf8" strokeWidth="2.5" />
            <line x1="18" y1="-22" x2="30" y2="-25" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Emitter */}
            <line x1="-10" y1="10" x2="18" y2="22" stroke="#38bdf8" strokeWidth="2.5" />
            <line x1="18" y1="22" x2="30" y2="25" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Emitter Arrow */}
            {isNpn ? (
              <polygon points="12,18 18,22 10,24" fill="#38bdf8" />
            ) : (
              <polygon points="-4,12 -10,10 -2,6" fill="#38bdf8" />
            )}
            <text x="0" y="-30" fill="#cbd5e1" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {isNpn ? 'NPN (2N2222)' : 'PNP (2N3906)'}
            </text>
          </g>
        );
      }

      case 'battery_holder':
        return (
          <g>
            <line x1="-40" y1="0" x2="-10" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="-10" y1="-12" x2="-10" y2="12" stroke="#64748b" strokeWidth="3" />
            <line x1="10" y1="-20" x2="10" y2="20" stroke="#38bdf8" strokeWidth="3.5" />
            <line x1="10" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <text x="22" y="-12" fill="#38bdf8" fontSize="13" fontWeight="bold">+</text>
            <text x="-24" y="-10" fill="#94a3b8" fontSize="14" fontWeight="bold">-</text>
            <text x="0" y="28" fill="#e2e8f0" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="monospace">
              3.0V (2xAA)
            </text>
          </g>
        );

      case 'switch': {
        const isClosed = !!properties.state;
        return (
          <g
            className="cursor-pointer group"
            onClick={e => {
              e.stopPropagation();
              onToggleSwitch?.(id, e);
            }}
          >
            {/* Terminals contact dots */}
            <circle cx="-20" cy="0" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="20" cy="0" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Lever */}
            {isClosed ? (
              <line x1="-20" y1="0" x2="20" y2="0" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
            ) : (
              <line x1="-20" y1="0" x2="14" y2="-18" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            )}

            <text x="0" y="20" fill={isClosed ? '#4ade80' : '#fbbf24'} fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="monospace">
              {isClosed ? 'CLOSED (Click)' : 'OPEN (Click)'}
            </text>
          </g>
        );
      }

      case 'push_button': {
        const isPressed = !!properties.state;
        return (
          <g
            className="cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              onToggleSwitch?.(id, e);
            }}
          >
            <line x1="-35" y1="0" x2="-15" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="15" y1="0" x2="35" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="-15" cy="0" r="3.5" fill="#38bdf8" />
            <circle cx="15" cy="0" r="3.5" fill="#38bdf8" />
            <line x1="-20" y1={isPressed ? 0 : -8} x2="20" y2={isPressed ? 0 : -8} stroke={isPressed ? '#22c55e' : '#cbd5e1'} strokeWidth="3" />
            <line x1="0" y1={isPressed ? 0 : -8} x2="0" y2={isPressed ? -12 : -18} stroke="#cbd5e1" strokeWidth="2.5" />
            <rect x="-10" y={isPressed ? -16 : -22} width="20" height="5" rx="1.5" fill="#f43f5e" />
            <text x="0" y="20" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
              {isPressed ? 'PRESSED' : 'RELEASED'}
            </text>
          </g>
        );
      }

      case 'potentiometer': {
        const pos = properties.potentiometerPosition ?? 0.5;
        const rCurrent = Math.round((properties.maxResistance ?? 10000) * pos);
        return (
          <g>
            {/* Top resistor path */}
            <line x1="-40" y1="-20" x2="-25" y2="-20" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="25" y1="-20" x2="40" y2="-20" stroke="#94a3b8" strokeWidth="2.5" />
            <path
              d="M -25 -20 L -20 -28 L -10 -12 L 0 -28 L 10 -12 L 20 -28 L 25 -20"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
            {/* Wiper arrow */}
            <line x1="0" y1="25" x2="0" y2="-6" stroke="#f59e0b" strokeWidth="2.5" />
            <polygon points="0,-15 -5,-7 5,-7" fill="#f59e0b" />
            <text x="0" y="-32" fill="#cbd5e1" fontSize="10" textAnchor="middle" fontFamily="monospace">
              {rCurrent}Ω ({Math.round(pos * 100)}%)
            </text>
          </g>
        );
      }

      case 'capacitor':
        return (
          <g>
            <line x1="-40" y1="0" x2="-8" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="8" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Plate 1 */}
            <line x1="-8" y1="-18" x2="-8" y2="18" stroke="#38bdf8" strokeWidth="3" />
            {/* Plate 2 */}
            <line x1="8" y1="-18" x2="8" y2="18" stroke="#38bdf8" strokeWidth="3" />
            <text x="-16" y="-12" fill="#38bdf8" fontSize="11" fontWeight="bold">+</text>
            <text x="0" y="30" fill="#cbd5e1" fontSize="11" textAnchor="middle" fontFamily="monospace">
              {properties.capacitance ? `${(properties.capacitance * 1e6).toFixed(0)}µF` : '100µF'}
            </text>
          </g>
        );

      case 'buzzer': {
        const isBuzzing = isSimOn && (simulationData?.voltageDrop ?? 0) > 2.0;
        return (
          <g>
            <rect x="-30" y="-25" width="60" height="40" rx="6" fill="#1e293b" stroke={isBuzzing ? '#f59e0b' : '#475569'} strokeWidth="2" />
            <circle cx="0" cy="-5" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="-30" y1="15" x2="-30" y2="25" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="30" y1="15" x2="30" y2="25" stroke="#94a3b8" strokeWidth="2.5" />
            {isBuzzing && (
              <g stroke="#f59e0b" strokeWidth="2" fill="none">
                <path d="M 35 -15 Q 45 -5 35 5" />
                <path d="M 40 -20 Q 55 -5 40 10" />
              </g>
            )}
            <text x="0" y="2" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">BZ</text>
            <text x="0" y="-30" fill="#cbd5e1" fontSize="10" textAnchor="middle" fontFamily="monospace">
              {isBuzzing ? '🔊 BEEP' : 'SILENT'}
            </text>
          </g>
        );
      }

      case 'ldr': {
        const lux = properties.lightLevel ?? 50;
        return (
          <g>
            <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <line x1="-40" y1="0" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="18" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" />
            <path d="M -12 0 L -8 -6 L 0 6 L 8 -6 L 12 0" fill="none" stroke="#eab308" strokeWidth="2" />
            <text x="0" y="30" fill="#cbd5e1" fontSize="10" textAnchor="middle" fontFamily="monospace">
              {lux}% Lux
            </text>
          </g>
        );
      }

      case 'and_gate':
      case 'or_gate':
      case 'not_gate':
        return (
          <g>
            <rect x="-40" y="-25" width="80" height="50" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="0" y="4" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">
              {type === 'and_gate' ? 'AND & ' : type === 'or_gate' ? 'OR ≥1' : 'NOT 1'}
            </text>
            <text x="0" y="36" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
              {name}
            </text>
          </g>
        );

      default:
        // Generic chip representation
        return (
          <g>
            <rect x="-45" y="-30" width="90" height="60" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <circle cx="-35" cy="-20" r="3" fill="#38bdf8" />
            <text x="0" y="4" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="middle">
              {name}
            </text>
            <text x="0" y="18" fill="#64748b" fontSize="9" textAnchor="middle">
              {type}
            </text>
          </g>
        );
    }
  };

  return (
    <g
      id={`comp-${id}`}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      className="cursor-move select-none"
      onMouseDown={e => {
        e.stopPropagation();
        onComponentMouseDown?.(id, e);
      }}
      onClick={e => {
        e.stopPropagation();
        onComponentClick(id, e);
      }}
      onDoubleClick={e => {
        e.stopPropagation();
        onComponentDoubleClick(id, e);
      }}
    >
      {/* Selection bounding box indicator */}
      {isSelected && (
        <rect
          x="-50"
          y="-35"
          width="100"
          height="70"
          rx="6"
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
      )}

      {/* Component Symbol Rendering */}
      {renderSymbol()}

      {/* Terminals */}
      {terminals.map((term: Terminal) => {
        const isConnected = connectedTerminals.has(`${id}:${term.id}`);
        const isActive = activeTerminalId === `${id}:${term.id}`;

        return (
          <g
            key={term.id}
            transform={`translate(${term.x}, ${term.y})`}
            className="cursor-crosshair group/term"
            onMouseDown={e => {
              e.stopPropagation();
            }}
            onClick={e => {
              e.stopPropagation();
              onTerminalClick(id, term.id, e);
            }}
          >
            {/* Terminal click target padding */}
            <circle cx="0" cy="0" r="9" fill="transparent" />

            {/* Visual Terminal Pin */}
            <circle
              cx="0"
              cy="0"
              r={isActive ? 6 : isConnected ? 4.5 : 4}
              fill={isActive ? '#38bdf8' : isConnected ? '#0284c7' : '#0f172a'}
              stroke={isActive ? '#ffffff' : isConnected ? '#38bdf8' : '#94a3b8'}
              strokeWidth={isActive ? 2.5 : 2}
              className="transition-all duration-150 group-hover/term:scale-125 group-hover/term:stroke-cyan-300"
            />

            {/* Terminal tooltip name on hover */}
            <title>{`${term.name} (${component.name})`}</title>
          </g>
        );
      })}
    </g>
  );
};

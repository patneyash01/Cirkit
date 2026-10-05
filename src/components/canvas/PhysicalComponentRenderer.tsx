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

// 4-band EIA resistor color code converter
function getResistorColorBands(resistance: number): { b1: string; b2: string; mult: string; tol: string } {
  const COLOR_MAP: Record<number, string> = {
    0: '#171717', // Black
    1: '#854d0e', // Brown
    2: '#dc2626', // Red
    3: '#ea580c', // Orange
    4: '#eab308', // Yellow
    5: '#16a34a', // Green
    6: '#2563eb', // Blue
    7: '#7c3aed', // Violet
    8: '#6b7280', // Gray
    9: '#f8fafc', // White
  };

  const val = Math.max(1, Math.round(resistance));
  const s = val.toString();
  const d1 = parseInt(s[0]) || 2;
  const d2 = parseInt(s[1]) || 2;
  const exponent = s.length - 2;
  const multDigit = Math.max(0, Math.min(9, exponent));

  return {
    b1: COLOR_MAP[d1] || '#dc2626',
    b2: COLOR_MAP[d2] || '#dc2626',
    mult: COLOR_MAP[multDigit] || '#854d0e',
    tol: '#d97706', // Gold ±5%
  };
}

export const PhysicalComponentRenderer: React.FC<Props> = ({
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

  const renderPhysicalBody = () => {
    switch (type) {
      // ----------------------------------------------------
      // 1. AXIAL RESISTOR (Cylindrical ceramic body + color bands + metal leads)
      // ----------------------------------------------------
      case 'resistor': {
        const bands = getResistorColorBands(properties.resistance ?? 220);
        return (
          <g>
            <defs>
              <linearGradient id={`res-lead-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <linearGradient id={`res-body-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="25%" stopColor="#fde047" />
                <stop offset="70%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <filter id={`res-shadow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Left & Right Tinned Copper Axial Leads */}
            <line x1="-40" y1="0" x2="-22" y2="0" stroke={`url(#res-lead-${id})`} strokeWidth="3.2" strokeLinecap="round" />
            <line x1="22" y1="0" x2="40" y2="0" stroke={`url(#res-lead-${id})`} strokeWidth="3.2" strokeLinecap="round" />

            {/* Cast Shadow of Resistor Body */}
            <rect x="-24" y="-9" width="48" height="22" rx="10" fill="#0f172a" opacity="0.15" transform="translate(0, 3)" />

            {/* Ceramic Dogbone Body */}
            <rect
              x="-23"
              y="-11"
              width="46"
              height="22"
              rx="10"
              fill={`url(#res-body-${id})`}
              stroke="#ca8a04"
              strokeWidth="0.8"
            />

            {/* Flared End Bulbs */}
            <rect x="-23" y="-12" width="6" height="24" rx="3" fill="#eab308" />
            <rect x="17" y="-12" width="6" height="24" rx="3" fill="#eab308" />

            {/* 4 Standard Resistor Color Bands */}
            <rect x="-14" y="-11" width="3.5" height="22" fill={bands.b1} />
            <rect x="-7" y="-11" width="3.5" height="22" fill={bands.b2} />
            <rect x="0" y="-11" width="3.5" height="22" fill={bands.mult} />
            <rect x="9" y="-11" width="3.5" height="22" fill={bands.tol} />

            {/* Spec Label */}
            <text
              x="0"
              y="22"
              fill="#18181b"
              fontSize="11"
              fontWeight="800"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {properties.resistance ? `${properties.resistance}Ω` : name}
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 2. 5MM LED (Transparent/colored dome, internal lead frame anvil/post, longer anode lead)
      // ----------------------------------------------------
      case 'led': {
        const color = properties.color || 'red';
        const colorMap: Record<
          string,
          {
            body: string;
            top: string;
            glow: string;
            rim: string;
            offDome: string;
            offBody: string;
            offRim: string;
          }
        > = {
          red: {
            body: '#ef4444',
            top: '#ff4d4d',
            glow: '#f87171',
            rim: '#b91c1c',
            offDome: '#450a0a',
            offBody: '#2e0707',
            offRim: '#1a0404',
          },
          green: {
            body: '#22c55e',
            top: '#4ade80',
            glow: '#86efac',
            rim: '#15803d',
            offDome: '#052e16',
            offBody: '#031c0e',
            offRim: '#011007',
          },
          blue: {
            body: '#3b82f6',
            top: '#60a5fa',
            glow: '#93c5fd',
            rim: '#1d4ed8',
            offDome: '#0f172a',
            offBody: '#080d1a',
            offRim: '#030712',
          },
          yellow: {
            body: '#eab308',
            top: '#fde047',
            glow: '#fef08a',
            rim: '#a16207',
            offDome: '#422006',
            offBody: '#281302',
            offRim: '#180b01',
          },
          white: {
            body: '#f8fafc',
            top: '#ffffff',
            glow: '#f1f5f9',
            rim: '#94a3b8',
            offDome: '#334155',
            offBody: '#1e293b',
            offRim: '#0f172a',
          },
        };
        const cTheme = colorMap[color] || colorMap.red;
        const current_mA = (simulationData?.current ?? 0) * 1000;
        const isGlowing = Boolean(simulationData?.state === 'on' || (isSimOn && current_mA > 0.2));

        return (
          <g>
            <defs>
              {/* Vibrant radial glow bloom halo when ON */}
              <radialGradient id={`led-bloom-${id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={cTheme.top} stopOpacity="0.95" />
                <stop offset="35%" stopColor={cTheme.body} stopOpacity="0.65" />
                <stop offset="70%" stopColor={cTheme.glow} stopOpacity="0.3" />
                <stop offset="100%" stopColor={cTheme.rim} stopOpacity="0" />
              </radialGradient>

              {/* Lit vs Unlit Epoxy Dome Gradient */}
              <linearGradient id={`led-dome-${id}`} x1="0" y1="0" x2="0" y2="1">
                {isGlowing ? (
                  <>
                    <stop offset="0%" stopColor={cTheme.top} />
                    <stop offset="60%" stopColor={cTheme.body} />
                    <stop offset="100%" stopColor={cTheme.rim} />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor={cTheme.offDome} />
                    <stop offset="50%" stopColor={cTheme.offBody} />
                    <stop offset="100%" stopColor={cTheme.offRim} />
                  </>
                )}
              </linearGradient>
            </defs>

            {/* Metal Leads: Anode is Pin 1 (longer, -40), Cathode is Pin 2 (+40) */}
            <line x1="-40" y1="0" x2="-14" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="14" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />

            {/* Realistic Luminous Glow Bloom Halo when ON */}
            {isGlowing && (
              <g className="pointer-events-none">
                <circle cx="-2" cy="0" r="58" fill={`url(#led-bloom-${id})`} />
                <circle cx="-2" cy="0" r="28" fill={cTheme.top} opacity="0.65" />
                <circle cx="-2" cy="0" r="14" fill="#ffffff" opacity="0.8" />
              </g>
            )}

            {/* 5mm LED Base Flange with flat notch on Cathode (right) side */}
            <path
              d="M -16 -15 L 12 -15 L 15 -11 L 15 11 L 12 15 L -16 15 Z"
              fill={isGlowing ? cTheme.top : cTheme.offBody}
              stroke={isGlowing ? cTheme.rim : cTheme.offRim}
              strokeWidth="0.8"
              opacity={isGlowing ? 0.95 : 0.85}
            />

            {/* Epoxy Dome */}
            <circle
              cx="-2"
              cy="0"
              r="14"
              fill={`url(#led-dome-${id})`}
              stroke={isGlowing ? '#ffffff' : cTheme.offRim}
              strokeWidth={isGlowing ? 1.5 : 0.8}
            />

            {/* Internal Metal Structure: Reflective Anvil (Cathode) and Post (Anode) */}
            <path
              d="M -6 -5 L 3 -5 L 5 0 L 3 5 L -6 5 Z"
              fill={isGlowing ? '#ffffff' : '#64748b'}
              opacity={isGlowing ? 0.95 : 0.35}
            />
            {/* Tiny Semiconductor Die in Cup */}
            <rect
              x="1"
              y="-1.5"
              width="2.5"
              height="3"
              fill={isGlowing ? '#ffffff' : '#78350f'}
            />

            {/* Glossy Curved Surface Specular Reflection */}
            <path
              d="M -9 -8 A 11 11 0 0 1 3 -8"
              fill="none"
              stroke="#ffffff"
              strokeWidth={isGlowing ? 2.5 : 1.5}
              strokeLinecap="round"
              opacity={isGlowing ? 0.9 : 0.4}
            />

            {/* Burnt State Effect */}
            {isBurnt && (
              <g>
                <circle cx="-2" cy="0" r="14" fill="#0f172a" opacity="0.85" />
                <text x="0" y="5" fontSize="16" textAnchor="middle">💥</text>
              </g>
            )}

            {/* Live Status Label */}
            <text
              x="0"
              y="27"
              fill={isGlowing ? (color === 'red' ? '#dc2626' : cTheme.body) : '#64748B'}
              fontSize="9.5"
              fontWeight="800"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {isGlowing
                ? `● ON (${current_mA.toFixed(1)}mA)`
                : isBurnt
                ? 'BURNT (OVERCURRENT)'
                : '○ OFF (0.0mA)'}
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 3. CAPACITOR (Electrolytic Can + Stamped Vent + Polarity Stripe)
      // ----------------------------------------------------
      case 'capacitor': {
        const uF = ((properties.capacitance ?? 0.0001) * 1e6).toFixed(0);
        return (
          <g>
            {/* Leads extending from bottom */}
            <line x1="-40" y1="0" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="18" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />

            {/* Aluminum Electrolytic Can Body */}
            <rect x="-20" y="-20" width="40" height="40" rx="8" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1.2" />

            {/* Stamped Aluminum Top Vent Cross (Explosion safety vent score marks) */}
            <ellipse cx="0" cy="-15" rx="16" ry="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="-7" y1="-15" x2="7" y2="-15" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="0" y1="-18" x2="0" y2="-12" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />

            {/* Negative Polarity Stripe with '-' symbols */}
            <rect x="9" y="-13" width="8" height="28" fill="#f1f5f9" />
            <text x="13" y="-3" fill="#1e293b" fontSize="9" fontWeight="900" textAnchor="middle">-</text>
            <text x="13" y="10" fill="#1e293b" fontSize="9" fontWeight="900" textAnchor="middle">-</text>

            {/* Silkscreen Spec Printing */}
            <text x="-4" y="3" fill="#ffffff" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="monospace">
              {uF}µF
            </text>
            <text x="-4" y="12" fill="#93c5fd" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="monospace">
              25V 105°C
            </text>

            <text x="0" y="30" fill="#475569" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
              {name}
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 4. DIODE (DO-41 Black Cylinder + Silver Cathode Ring + 1N4007 marking)
      // ----------------------------------------------------
      case 'diode':
        return (
          <g>
            {/* Leads */}
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />

            {/* Black DO-41 Plastic Cylinder */}
            <rect x="-20" y="-9" width="40" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />

            {/* Silver Cathode Band */}
            <rect x="9" y="-9" width="6" height="18" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />

            {/* Part laser marking */}
            <text x="-4" y="3" fill="#cbd5e1" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="monospace">
              1N4007
            </text>

            <text x="0" y="22" fill="#475569" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
              {name}
            </text>
          </g>
        );

      // ----------------------------------------------------
      // 5. BATTERY (Realistic 3x AA Battery Holder with Cells)
      // ----------------------------------------------------
      case 'battery': {
        const v = properties.voltage ?? 4.98;
        return (
          <g>
            {/* 3x AA Molded Black Battery Enclosure */}
            <rect
              x="-55"
              y="-44"
              width="110"
              height="88"
              rx="6"
              fill="#18181b"
              stroke="#09090b"
              strokeWidth="2.5"
            />
            {/* Cell partition ridges */}
            <line x1="-55" y1="-15" x2="55" y2="-15" stroke="#27272a" strokeWidth="2" />
            <line x1="-55" y1="15" x2="55" y2="15" stroke="#27272a" strokeWidth="2" />

            {/* Battery 1 (Top) */}
            <g transform="translate(0, -29)">
              <rect x="-48" y="-11" width="96" height="22" rx="3" fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
              <rect x="-40" y="-11" width="76" height="22" fill="#713f12" />
              <rect x="-40" y="-11" width="16" height="22" fill="#d97706" />
              <text x="-36" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">+</text>
              <text x="3" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">AA 1.5V</text>
              <text x="40" y="4" fill="#ffffff" fontSize="11" fontWeight="bold">-</text>
            </g>

            {/* Battery 2 (Middle) */}
            <g transform="translate(0, 0)">
              <rect x="-48" y="-11" width="96" height="22" rx="3" fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
              <rect x="-36" y="-11" width="76" height="22" fill="#713f12" />
              <rect x="24" y="-11" width="16" height="22" fill="#d97706" />
              <text x="-40" y="4" fill="#ffffff" fontSize="11" fontWeight="bold">-</text>
              <text x="-3" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">AA 1.5V</text>
              <text x="36" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">+</text>
            </g>

            {/* Battery 3 (Bottom) */}
            <g transform="translate(0, 29)">
              <rect x="-48" y="-11" width="96" height="22" rx="3" fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
              <rect x="-40" y="-11" width="76" height="22" fill="#713f12" />
              <rect x="-40" y="-11" width="16" height="22" fill="#d97706" />
              <text x="-36" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">+</text>
              <text x="3" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">AA 1.5V</text>
              <text x="40" y="4" fill="#ffffff" fontSize="11" fontWeight="bold">-</text>
            </g>

            {/* Red (+) output lead curve */}
            <path d="M 55 -20 C 75 -20 80 -10 88 0" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
            {/* Black (-) output lead curve */}
            <path d="M 55 20 C 75 20 80 30 88 40" fill="none" stroke="#172033" strokeWidth="3" strokeLinecap="round" />

            <text x="0" y="54" fill="#475569" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
              3x AA 1.5V ({v.toFixed(2)}V)
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 6. BENCH POWER SUPPLY (`dc_source`)
      // ----------------------------------------------------
      case 'dc_source': {
        const v = properties.voltage ?? 5.0;
        return (
          <g>
            {/* Laboratory Bench Power Supply Enclosure */}
            <rect x="-44" y="-28" width="88" height="56" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
            {/* Digital LED Display */}
            <rect x="-36" y="-22" width="72" height="22" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <text x="0" y="-7" fill="#22c55e" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="monospace">
              {v.toFixed(2)} V
            </text>

            {/* Red Banana Post (+) & Black Banana Post (-) */}
            <circle cx="25" cy="12" r="7" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
            <circle cx="25" cy="12" r="3" fill="#fbbf24" />
            <circle cx="-25" cy="12" r="7" fill="#18181b" stroke="#09090b" strokeWidth="1.5" />
            <circle cx="-25" cy="12" r="3" fill="#fbbf24" />

            {/* Outward Leads to terminals */}
            <line x1="25" y1="12" x2="40" y2="0" stroke="#dc2626" strokeWidth="3" />
            <line x1="-25" y1="12" x2="-40" y2="0" stroke="#18181b" strokeWidth="3" />

            <text x="0" y="38" fill="#64748b" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
              BENCH SUPPLY
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 7. GROUND (GND)
      // ----------------------------------------------------
      case 'ground':
        return (
          <g>
            <line x1="0" y1="-25" x2="0" y2="-6" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
            <rect x="-18" y="-6" width="36" height="5" rx="1.5" fill="#16a34a" />
            <rect x="-12" y="2" width="24" height="4" rx="1" fill="#16a34a" />
            <rect x="-6" y="9" width="12" height="3" rx="1" fill="#16a34a" />
            <text x="0" y="24" fill="#16a34a" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily="monospace">
              GND (0V)
            </text>
          </g>
        );

      // ----------------------------------------------------
      // 8. POTENTIOMETER (Rotary knob with physical rotation)
      // ----------------------------------------------------
      case 'potentiometer': {
        const pos = properties.potentiometerPosition ?? 0.5;
        const rotDeg = -135 + pos * 270;
        const curR = Math.round((properties.maxResistance ?? 10000) * pos);
        return (
          <g>
            {/* 3 Solder lugs */}
            <line x1="-40" y1="-20" x2="-18" y2="-12" stroke="#94a3b8" strokeWidth="2.8" />
            <line x1="40" y1="-20" x2="18" y2="-12" stroke="#94a3b8" strokeWidth="2.8" />
            <line x1="0" y1="25" x2="0" y2="18" stroke="#94a3b8" strokeWidth="2.8" />

            {/* Round Potentiometer Blue Casing */}
            <circle cx="0" cy="0" r="23" fill="#0284c7" stroke="#0369a1" strokeWidth="1.8" />
            {/* Threaded Brass Bushing */}
            <circle cx="0" cy="0" r="16" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2" />

            {/* Knurled Knob with Pointer */}
            <g transform={`rotate(${rotDeg})`}>
              <circle cx="0" cy="0" r="12" fill="#1e293b" />
              <line x1="0" y1="0" x2="0" y2="-11" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            </g>

            <text x="0" y="-28" fill="#1e293b" fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="monospace">
              {curR}Ω ({Math.round(pos * 100)}%)
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 9. TOGGLE SWITCH (Mechanical toggle lever flipping left/right)
      // ----------------------------------------------------
      case 'switch': {
        const isClosed = !!properties.state;
        return (
          <g
            className="cursor-pointer"
            onMouseDown={e => {
              e.stopPropagation();
            }}
            onClick={e => {
              e.stopPropagation();
              onToggleSwitch?.(id, e);
            }}
          >
            <line x1="-40" y1="0" x2="-20" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />

            {/* Subminiature Blue Body */}
            <rect x="-20" y="-13" width="40" height="26" rx="4" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />

            {/* Chrome Toggle Bat Lever: tilts right when CLOSED, tilts left when OPEN */}
            {isClosed ? (
              <line x1="0" y1="0" x2="16" y2="-14" stroke="#f8fafc" strokeWidth="5.5" strokeLinecap="round" />
            ) : (
              <line x1="0" y1="0" x2="-16" y2="-14" stroke="#cbd5e1" strokeWidth="5.5" strokeLinecap="round" />
            )}

            <text
              x="0"
              y="25"
              fill={isClosed ? '#16a34a' : '#ea580c'}
              fontSize="9.5"
              fontWeight="800"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {isClosed ? 'CLOSED (ON)' : 'OPEN (OFF)'}
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 10. PUSH BUTTON (6x6 Tact Switch with Plunger)
      // ----------------------------------------------------
      case 'push_button': {
        const isPressed = !!properties.state;
        return (
          <g
            className="cursor-pointer"
            onMouseDown={e => {
              e.stopPropagation();
            }}
            onClick={e => {
              e.stopPropagation();
              onToggleSwitch?.(id, e);
            }}
          >
            <line x1="-35" y1="0" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="18" y1="0" x2="35" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
            {/* Tactile Button Body */}
            <rect x="-18" y="-14" width="36" height="28" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="1.2" />
            {/* Red button plunger that presses down */}
            <circle cx="0" cy="0" r={isPressed ? 6.5 : 8} fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
            <text x="0" y="24" fill="#64748b" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
              {isPressed ? 'PRESSED' : 'RELEASED'}
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 11. DC MOTOR (Steel hobby motor with animated spinning propeller)
      // ----------------------------------------------------
      case 'dc_motor': {
        const isSpinning = isSimOn && (simulationData?.current ?? 0) > 0.005;
        return (
          <g>
            <line x1="-35" y1="0" x2="-22" y2="0" stroke="#dc2626" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="22" y1="0" x2="35" y2="0" stroke="#1e293b" strokeWidth="2.8" strokeLinecap="round" />

            {/* Steel Motor Can */}
            <rect x="-24" y="-20" width="48" height="40" rx="8" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
            {/* Brass front bearing */}
            <circle cx="0" cy="0" r="7" fill="#d97706" stroke="#b45309" strokeWidth="1" />

            {/* Spinning Propeller */}
            <g className={isSpinning ? 'animate-spin' : ''} style={{ transformOrigin: '0px 0px' }}>
              <circle cx="0" cy="0" r="3.5" fill="#1e293b" />
              <ellipse cx="0" cy="-15" rx="4" ry="9" fill="#dc2626" opacity="0.9" />
              <ellipse cx="0" cy="15" rx="4" ry="9" fill="#dc2626" opacity="0.9" />
              <ellipse cx="-15" cy="0" rx="9" ry="4" fill="#dc2626" opacity="0.9" />
              <ellipse cx="15" cy="0" rx="9" ry="4" fill="#dc2626" opacity="0.9" />
            </g>

            <text x="0" y="30" fill={isSpinning ? '#16a34a' : '#64748b'} fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="monospace">
              {isSpinning ? '⚡ SPINNING' : 'STOPPED'}
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 12. BUZZER (Piezo buzzer capsule with sound waves)
      // ----------------------------------------------------
      case 'buzzer': {
        const isBuzzing = isSimOn && (simulationData?.voltageDrop ?? 0) > 2.0;
        return (
          <g>
            <line x1="-30" y1="15" x2="-30" y2="25" stroke="#94a3b8" strokeWidth="2.8" />
            <line x1="30" y1="15" x2="30" y2="25" stroke="#94a3b8" strokeWidth="2.8" />

            {/* Black Piezo Housing */}
            <circle cx="0" cy="-2" r="23" fill="#1e293b" stroke="#0f172a" strokeWidth="1.8" />
            <circle cx="0" cy="-2" r="8" fill="#0f172a" />
            <text x="-13" y="-13" fill="#ef4444" fontSize="12" fontWeight="bold">+</text>

            {/* Acoustic pressure waves */}
            {isBuzzing && (
              <g stroke="#f59e0b" strokeWidth="2" fill="none" className="animate-pulse">
                <path d="M 28 -16 A 18 18 0 0 1 28 12" />
                <path d="M 35 -22 A 26 26 0 0 1 35 18" />
              </g>
            )}

            <text x="0" y="32" fill={isBuzzing ? '#f59e0b' : '#64748b'} fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="monospace">
              {isBuzzing ? '🔊 BEEPING' : 'BUZZER'}
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 13. LDR (Photoresistor with CdS sinuous track)
      // ----------------------------------------------------
      case 'ldr': {
        const lux = properties.lightLevel ?? 50;
        return (
          <g>
            <line x1="-40" y1="0" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="2.8" />
            <line x1="18" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.8" />
            {/* Ceramic disc */}
            <circle cx="0" cy="0" r="18" fill="#fed7aa" stroke="#ca8a04" strokeWidth="1.5" />
            {/* Sinuous CdS photo-sensitive conductive track */}
            <path
              d="M -12 -5 Q -6 -10 0 -5 Q 6 0 12 -5 M -12 0 Q -6 -5 0 0 Q 6 5 12 0 M -12 5 Q -6 0 0 5 Q 6 10 12 5"
              fill="none"
              stroke="#ea580c"
              strokeWidth="2"
            />
            <text x="0" y="28" fill="#ca8a04" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
              LDR ({lux}% Lux)
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 14. DIP-14 LOGIC ICs (74LS08, 74LS32, 74LS04)
      // ----------------------------------------------------
      case 'and_gate':
      case 'or_gate':
      case 'not_gate': {
        const chipLabel = type === 'and_gate' ? '74LS08' : type === 'or_gate' ? '74LS32' : '74LS04';
        return (
          <g>
            {/* DIP-14 Plastic Package */}
            <rect x="-42" y="-18" width="84" height="36" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.8" />
            {/* Pin 1 orientation index notch */}
            <path d="M -42 -6 A 6 6 0 0 1 -42 6 Z" fill="#0f172a" />
            <circle cx="-33" cy="-10" r="1.5" fill="#64748b" />

            {/* 14 Lead-frame pins extending */}
            {[-30, -18, -6, 6, 18, 30].map(px => (
              <g key={px}>
                <rect x={px - 2} y="-24" width="4" height="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
                <rect x={px - 2} y="18" width="4" height="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
              </g>
            ))}

            <text x="0" y="2" fill="#f8fafc" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily="monospace">
              {chipLabel}
            </text>
            <text x="0" y="11" fill="#94a3b8" fontSize="6.5" textAnchor="middle" fontFamily="sans-serif">
              LOGIC IC
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 15. ARDUINO UNO R3
      // ----------------------------------------------------
      case 'arduino_uno': {
        const pin13High = simulationData?.state === 'on' || (simulationData?.current ?? 0) > 0;
        return (
          <g>
            {/* Arduino Teal-Blue PCB */}
            <rect x="-80" y="-52" width="160" height="104" rx="6" fill="#00878F" stroke="#00646B" strokeWidth="2" />
            {/* Gold PCB tracks / decorative accents */}
            <path d="M -70 -20 L -40 -20 L -30 -10 L 40 -10" fill="none" stroke="#CA8A04" strokeWidth="0.8" opacity="0.4" />
            <path d="M -70 20 L -40 20 L -30 10 L 40 10" fill="none" stroke="#CA8A04" strokeWidth="0.8" opacity="0.4" />

            {/* Corner Mounting holes */}
            <circle cx="-68" cy="-42" r="3.5" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
            <circle cx="68" cy="42" r="3.5" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
            <circle cx="68" cy="-42" r="3.5" fill="#f8fafc" stroke="#475569" strokeWidth="1" />

            {/* Metal USB-B Port */}
            <rect x="-78" y="-38" width="22" height="26" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />
            <rect x="-74" y="-32" width="14" height="14" rx="1" fill="#475569" />

            {/* DC Barrel Jack */}
            <rect x="-78" y="14" width="26" height="24" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="-65" cy="26" r="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />

            {/* 5V / 3.3V Voltage Regulators */}
            <rect x="-44" y="16" width="16" height="20" rx="1" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
            <rect x="-42" y="12" width="12" height="4" fill="#94a3b8" />

            {/* ATmega328P DIP chip */}
            <rect x="-14" y="-14" width="56" height="24" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            {/* Notch */}
            <path d="M -14 -2 A 2 2 0 0 1 -14 2" fill="#334155" />
            <text x="14" y="2" fill="#cbd5e1" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ATmega328P-PU
            </text>

            {/* 16MHz Crystal Oscillator */}
            <rect x="-38" y="-12" width="14" height="8" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
            <text x="-31" y="-6" fill="#475569" fontSize="4.5" fontWeight="bold" textAnchor="middle">16.0</text>

            {/* Built-in LEDs */}
            {/* ON power LED (Green) */}
            <circle cx="28" cy="-24" r="2.2" fill="#22c55e" className="drop-shadow-[0_0_4px_#22c55e]" />
            <text x="28" y="-28" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">ON</text>

            {/* 'L' Pin 13 LED (Amber) */}
            <circle
              cx="28"
              cy="-14"
              r="2.2"
              fill={pin13High ? '#f59e0b' : '#78350f'}
              className={pin13High ? 'drop-shadow-[0_0_6px_#f59e0b]' : ''}
            />
            <text x="28" y="-18" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">L</text>

            {/* Reset tactile button */}
            <rect x="-68" y="-12" width="10" height="10" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
            <circle cx="-63" cy="-7" r="2.5" fill="#f8fafc" />

            {/* Female Header Strips Enclosures */}
            {/* Top Digital Header */}
            <rect x="-66" y="-45" width="134" height="10" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
            {/* Bottom Power & Analog Headers */}
            <rect x="-56" y="35" width="60" height="10" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
            <rect x="9" y="35" width="52" height="10" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />

            {/* Silkscreen Labels */}
            <text x="0" y="-30" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">
              DIGITAL (PWM ~)
            </text>
            <text x="-26" y="30" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
              POWER
            </text>
            <text x="35" y="30" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
              ANALOG IN
            </text>

            {/* Board Title */}
            <text x="0" y="16" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              ARDUINO UNO
            </text>
            <text x="0" y="24" fill="#e2e8f0" fontSize="6" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              R3 • CIRKIT LAB
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 16. ESP32 NodeMCU
      // ----------------------------------------------------
      case 'esp32': {
        return (
          <g>
            {/* Matte Black PCB */}
            <rect x="-70" y="-48" width="140" height="96" rx="5" fill="#18181b" stroke="#27272a" strokeWidth="2" />

            {/* Metal RF Shield Can */}
            <rect x="-30" y="-30" width="56" height="46" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <text x="-2" y="-12" fill="#1e293b" fontSize="8" fontWeight="900" textAnchor="middle">
              ESP-WROOM-32
            </text>
            <text x="-2" y="-2" fill="#475569" fontSize="6" fontWeight="bold" textAnchor="middle">
              Wi-Fi + BLE SoC
            </text>

            {/* Gold PCB Trace Antenna */}
            <path d="M 32 -32 L 54 -32 L 54 -12 L 48 -12 L 48 -28 L 42 -28 L 42 -12 L 36 -12" fill="none" stroke="#ca8a04" strokeWidth="1.5" />

            {/* Dual Header Strips */}
            <rect x="-62" y="-41" width="124" height="10" rx="1" fill="#3f3f46" stroke="#18181b" strokeWidth="0.8" />
            <rect x="-62" y="31" width="124" height="10" rx="1" fill="#3f3f46" stroke="#18181b" strokeWidth="0.8" />

            {/* Micro USB Port */}
            <rect x="-68" y="-10" width="14" height="20" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1" />

            {/* Red Power LED & Blue GPIO2 LED */}
            <circle cx="-42" cy="-8" r="2" fill="#ef4444" className="drop-shadow-[0_0_3px_#ef4444]" />
            <circle cx="-42" cy="8" r="2" fill="#3b82f6" className="drop-shadow-[0_0_3px_#3b82f6]" />

            <text x="0" y="24" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">
              ESP32 NodeMCU
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 17. TMP36 TEMP SENSOR (TO-92 Package)
      // ----------------------------------------------------
      case 'temp_sensor': {
        const temp = properties.temperature ?? 25;
        return (
          <g>
            {/* 3 Leads */}
            <line x1="-30" y1="15" x2="-30" y2="25" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="0" y1="15" x2="0" y2="25" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="30" y1="15" x2="30" y2="25" stroke="#94a3b8" strokeWidth="2.5" />
            {/* TO-92 Body */}
            <path d="M -18 10 A 18 18 0 0 1 18 10 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
            <text x="0" y="3" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              TMP36
            </text>
            <text x="0" y="32" fill="#2563eb" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
              {temp}°C
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 18. ZENER DIODE (DO-35 Glass Package with Cathode Ring)
      // ----------------------------------------------------
      case 'zener_diode': {
        const vz = properties.zenerVoltage ?? 5.1;
        return (
          <g>
            <line x1="-40" y1="0" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="18" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
            {/* Transparent Glass Capsule Body */}
            <rect x="-18" y="-7" width="36" height="14" rx="3" fill="#fb923c" stroke="#ea580c" strokeWidth="1" opacity="0.85" />
            <rect x="-15" y="-5" width="30" height="10" rx="2" fill="#fdba74" opacity="0.6" />
            {/* Black Cathode Polarity Band */}
            <rect x="8" y="-7" width="6" height="14" fill="#0f172a" />
            <text x="0" y="19" fill="#c2410c" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="monospace">
              {vz}V ZENER
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 19. NPN & PNP TRANSISTORS (TO-92 Package)
      // ----------------------------------------------------
      case 'transistor_npn':
      case 'transistor_pnp': {
        const isNpn = type === 'transistor_npn';
        return (
          <g>
            {/* Splayed Leads for Breadboard Insertion */}
            <line x1="-35" y1="0" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="2.8" />
            <line x1="18" y1="-18" x2="30" y2="-25" stroke="#94a3b8" strokeWidth="2.8" />
            <line x1="18" y1="18" x2="30" y2="25" stroke="#94a3b8" strokeWidth="2.8" />
            {/* Molded TO-92 D-shaped casing */}
            <path d="M -16 -18 L 12 -18 A 18 18 0 0 1 12 18 L -16 18 Z" fill="#18181b" stroke="#09090b" strokeWidth="1.5" />
            <text x="-2" y="2" fill="#e2e8f0" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {isNpn ? '2N2222' : '2N3906'}
            </text>
            <text x="-2" y="12" fill="#94a3b8" fontSize="6.5" textAnchor="middle" fontFamily="monospace">
              {isNpn ? 'NPN BJT' : 'PNP BJT'}
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 20. 5V SPDT RELAY (Sugar Cube Blue Box)
      // ----------------------------------------------------
      case 'relay': {
        return (
          <g>
            {/* Sugar Cube Blue Body */}
            <rect x="-35" y="-25" width="70" height="50" rx="4" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1.5" />
            <rect x="-30" y="-20" width="60" height="40" rx="2" fill="#2563eb" />
            <text x="0" y="-6" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              SONGLE
            </text>
            <text x="0" y="6" fill="#bfdbfe" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              5V DC RELAY
            </text>
            <text x="0" y="16" fill="#93c5fd" fontSize="6.5" textAnchor="middle" fontFamily="monospace">
              10A 250VAC
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 21. 7-SEGMENT LED DISPLAY
      // ----------------------------------------------------
      case 'seven_segment': {
        const segOn = isSimOn;
        return (
          <g>
            {/* Display Body */}
            <rect x="-35" y="-45" width="70" height="90" rx="5" fill="#18181b" stroke="#27272a" strokeWidth="2" />
            {/* 7 Segment Bars */}
            <rect x="-16" y="-32" width="32" height="6" rx="2" fill={segOn ? '#ef4444' : '#450a0a'} />
            <rect x="14" y="-28" width="6" height="26" rx="2" fill={segOn ? '#ef4444' : '#450a0a'} />
            <rect x="14" y="2" width="6" height="26" rx="2" fill={segOn ? '#ef4444' : '#450a0a'} />
            <rect x="-16" y="26" width="32" height="6" rx="2" fill={segOn ? '#ef4444' : '#450a0a'} />
            <rect x="-20" y="2" width="6" height="26" rx="2" fill={segOn ? '#ef4444' : '#450a0a'} />
            <rect x="-20" y="-28" width="6" height="26" rx="2" fill={segOn ? '#ef4444' : '#450a0a'} />
            <rect x="-16" y="-3" width="32" height="6" rx="2" fill={segOn ? '#ef4444' : '#450a0a'} />
            {/* Decimal Point */}
            <circle cx="25" cy="29" r="3" fill={segOn ? '#ef4444' : '#450a0a'} />
          </g>
        );
      }

      // ----------------------------------------------------
      // 22. 16x2 LCD MODULE
      // ----------------------------------------------------
      case 'lcd_16x2': {
        return (
          <g>
            {/* Green PCB */}
            <rect x="-65" y="-35" width="130" height="70" rx="4" fill="#166534" stroke="#14532d" strokeWidth="1.5" />
            {/* Blue Liquid Crystal Screen with Backlight */}
            <rect x="-52" y="-25" width="104" height="42" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
            {/* Character text */}
            <text x="-46" y="-10" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
              CirKit Lab 2.0
            </text>
            <text x="-46" y="6" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
              V=5.0V I=18.2mA
            </text>
            {/* Metal Frame Tabs */}
            <rect x="-56" y="-28" width="112" height="4" fill="#94a3b8" />
            <rect x="-56" y="20" width="112" height="4" fill="#94a3b8" />
          </g>
        );
      }

      // ----------------------------------------------------
      // 23. HC-SR501 PIR MOTION SENSOR
      // ----------------------------------------------------
      case 'pir_sensor': {
        return (
          <g>
            {/* Blue PCB Base */}
            <rect x="-45" y="-30" width="90" height="60" rx="4" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
            {/* White Hemispherical Fresnel Lens */}
            <circle cx="0" cy="-2" r="22" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Facet lines */}
            <circle cx="0" cy="-2" r="14" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="0" cy="-2" r="7" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <text x="0" y="24" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              PIR MOTION
            </text>
          </g>
        );
      }

      // ----------------------------------------------------
      // 24. 2xAA BATTERY HOLDER (3.0V)
      // ----------------------------------------------------
      case 'battery_holder': {
        return (
          <g>
            {/* Black Molded Battery Tray */}
            <rect x="-45" y="-25" width="90" height="50" rx="5" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
            {/* Two AA Cylindrical Cells */}
            <rect x="-40" y="-20" width="76" height="18" rx="3" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
            <rect x="36" y="-17" width="5" height="12" rx="1" fill="#cbd5e1" />
            <rect x="-40" y="2" width="76" height="18" rx="3" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
            <rect x="36" y="5" width="5" height="12" rx="1" fill="#cbd5e1" />
            {/* Battery labels */}
            <text x="-4" y="-8" fill="#ffffff" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">
              AA 1.5V
            </text>
            <text x="-4" y="14" fill="#ffffff" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">
              AA 1.5V
            </text>
            {/* Red & Black wire leads exiting tray */}
            <line x1="45" y1="0" x2="52" y2="0" stroke="#dc2626" strokeWidth="2.5" />
            <line x1="-45" y1="0" x2="-52" y2="0" stroke="#172033" strokeWidth="2.5" />
          </g>
        );
      }

      // Default Physical Block
      default:
        return (
          <g>
            <rect x="-40" y="-25" width="80" height="50" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="1.8" />
            <text x="0" y="2" fill="#f8fafc" fontSize="11" fontWeight="800" textAnchor="middle">
              {name}
            </text>
            <text x="0" y="16" fill="#94a3b8" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
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
          x={type === 'arduino_uno' ? -84 : type === 'esp32' ? -74 : -48}
          y={type === 'arduino_uno' ? -56 : type === 'esp32' ? -52 : -32}
          width={type === 'arduino_uno' ? 168 : type === 'esp32' ? 148 : 96}
          height={type === 'arduino_uno' ? 112 : type === 'esp32' ? 104 : 64}
          rx="8"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeDasharray="4,4"
        />
      )}

      {/* Component Realistic Physical Body */}
      {renderPhysicalBody()}

      {/* Connection Terminal Pins with solder pads or female header sockets */}
      {terminals.map((term: Terminal) => {
        const isConnected = connectedTerminals.has(`${id}:${term.id}`);
        const isActive = activeTerminalId === `${id}:${term.id}`;
        const isBoardHeader = type === 'arduino_uno' || type === 'esp32';

        if (isBoardHeader) {
          // Compact 2.54mm Female Header Pin Socket with label
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
              {/* Hitbox */}
              <rect x="-4.5" y="-6" width="9" height="12" fill="transparent" />

              {/* Header Socket Cavity */}
              <rect
                x="-3.5"
                y="-3.5"
                width="7"
                height="7"
                rx="1"
                fill={isActive ? '#38bdf8' : isConnected ? '#e2e8f0' : '#1e293b'}
                stroke={isActive ? '#0284c7' : isConnected ? '#2563eb' : '#0f172a'}
                strokeWidth="1"
              />
              <rect x="-2" y="-2" width="4" height="4" rx="0.5" fill="#090d16" />
              <line x1="-1" y1="-1.5" x2="-1" y2="1.5" stroke="#cbd5e1" strokeWidth="0.6" opacity="0.8" />
              <line x1="1" y1="-1.5" x2="1" y2="1.5" stroke="#cbd5e1" strokeWidth="0.6" opacity="0.8" />

              {/* Pin Tiny Label */}
              <text
                x="0"
                y={term.y < 0 ? 11 : -6}
                fill={isActive ? '#38bdf8' : '#e2e8f0'}
                fontSize="5.5"
                fontWeight="800"
                textAnchor="middle"
                fontFamily="monospace"
                className="pointer-events-none select-none"
              >
                {term.name.replace(/ \(.*\)/, '')}
              </text>

              <title>{`${term.name} (${component.name}) - Click to connect wire`}</title>
            </g>
          );
        }

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
            {/* Click target padding */}
            <circle cx="0" cy="0" r="12" fill="transparent" />

            {/* Solder annular ring / eyelet */}
            <circle
              cx="0"
              cy="0"
              r="6.5"
              fill={isActive ? '#38bdf8' : isConnected ? '#e2e8f0' : '#f8fafc'}
              stroke={isActive ? '#0284c7' : isConnected ? '#2563eb' : '#64748b'}
              strokeWidth="2"
            />
            {/* Terminal center hole */}
            <circle
              cx="0"
              cy="0"
              r="2.8"
              fill={isActive ? '#0284c7' : isConnected ? '#1e293b' : '#334155'}
              className="transition-transform group-hover/term:scale-125"
            />

            <title>{`${term.name} (${component.name})`}</title>
          </g>
        );
      })}
    </g>
  );
};

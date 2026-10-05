import { CircuitComponent, Connection } from '../types/circuit';

export interface ExperimentDef {
  id: string;
  title: string;
  category: 'Fundamentals' | 'Semiconductors' | 'Transients' | 'Digital Logic';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  aim: string;
  objective: string;
  theory: string;
  formulas: { name: string; formula: string; explanation: string }[];
  procedure: string[];
  requiredComponents: string[];
  initialCircuit: {
    components: CircuitComponent[];
    connections: Connection[];
  };
  observationSchema: {
    paramA: string; // e.g. "Voltage (V)"
    paramB: string; // e.g. "Current (mA)"
    paramC?: string; // e.g. "Calculated R (Ω)"
  };
  sampleData: { paramA: number; paramB: number; paramC?: number }[];
  conclusionPrompt: string;
}

export const ENGINEERING_EXPERIMENTS: ExperimentDef[] = [
  {
    id: 'exp-ohms-law',
    title: "Verification of Ohm's Law (V = I × R)",
    category: 'Fundamentals',
    difficulty: 'Beginner',
    aim: 'To verify that the current flowing through a metallic conductor is directly proportional to the potential difference across its terminals at constant temperature.',
    objective: 'Measure voltage and current across a fixed resistor (220Ω), plot the V-I characteristic curve, and determine resistance from the slope.',
    theory: "Ohm's Law states that for a linear conductor at constant physical conditions, V = I × R. The slope of the V versus I line yields the dynamic conductance G = 1/R.",
    formulas: [
      { name: "Ohm's Law", formula: 'V = I × R', explanation: 'Potential difference equals current multiplied by resistance' },
      { name: 'Resistance from Slope', formula: 'R = ΔV / ΔI', explanation: 'Reciprocal of the slope of the V-I graph' },
    ],
    procedure: [
      '1. Connect the 9V Battery to a 220Ω resistor and Ground.',
      '2. Adjust the supply voltage from 1.0V to 10.0V in steps of 1.0V.',
      '3. Record the current flowing in the loop using the simulated multimeter / console.',
      '4. Observe the linear progression in the Observation Table and live V-I graph.',
    ],
    requiredComponents: ['DC Voltage Supply', '220Ω Resistor', 'Ground (GND)'],
    initialCircuit: {
      components: [
        {
          id: 'exp-v1',
          type: 'dc_source',
          name: 'V1',
          x: 200,
          y: 200,
          rotation: 0,
          properties: { voltage: 5.0 },
          terminals: [
            { id: 'pos', name: 'V+', x: 40, y: 0, type: 'power' },
            { id: 'neg', name: 'V-', x: -40, y: 0, type: 'ground' },
          ],
        },
        {
          id: 'exp-r1',
          type: 'resistor',
          name: 'R1',
          x: 360,
          y: 200,
          rotation: 0,
          properties: { resistance: 220 },
          terminals: [
            { id: 't1', name: 'Pin 1', x: -40, y: 0, type: 'passive' },
            { id: 't2', name: 'Pin 2', x: 40, y: 0, type: 'passive' },
          ],
        },
        {
          id: 'exp-gnd',
          type: 'ground',
          name: 'GND',
          x: 200,
          y: 320,
          rotation: 0,
          properties: {},
          terminals: [{ id: 'gnd', name: 'GND', x: 0, y: -25, type: 'ground' }],
        },
      ],
      connections: [
        { id: 'c1', fromComponentId: 'exp-v1', fromTerminalId: 'pos', toComponentId: 'exp-r1', toTerminalId: 't1', color: '#dc2626' },
        { id: 'c2', fromComponentId: 'exp-r1', fromTerminalId: 't2', toComponentId: 'exp-v1', toTerminalId: 'neg', color: '#172033' },
        { id: 'c3', fromComponentId: 'exp-v1', fromTerminalId: 'neg', toComponentId: 'exp-gnd', toTerminalId: 'gnd', color: '#172033' },
      ],
    },
    observationSchema: {
      paramA: 'Voltage V (Volts)',
      paramB: 'Current I (mA)',
      paramC: 'Calculated R = V/I (Ω)',
    },
    sampleData: [
      { paramA: 1.0, paramB: 4.55, paramC: 219.8 },
      { paramA: 2.0, paramB: 9.09, paramC: 220.0 },
      { paramA: 3.0, paramB: 13.64, paramC: 219.9 },
      { paramA: 4.0, paramB: 18.18, paramC: 220.0 },
      { paramA: 5.0, paramB: 22.73, paramC: 220.0 },
      { paramA: 6.0, paramB: 27.27, paramC: 220.0 },
      { paramA: 8.0, paramB: 36.36, paramC: 220.0 },
      { paramA: 10.0, paramB: 45.45, paramC: 220.0 },
    ],
    conclusionPrompt: "The V-I graph is a straight line passing through origin, proving Ohm's Law.",
  },
  {
    id: 'exp-voltage-divider',
    title: 'Voltage Divider Rule & Loaded Loading Effect',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    aim: 'To verify the voltage division ratio across series resistors and observe output voltage under load.',
    objective: 'Measure node voltages across R1 (1kΩ) and R2 (1kΩ) connected in series across 10V supply.',
    theory: 'In a series circuit, total voltage divides in direct proportion to resistance: V_out = V_in × [R2 / (R1 + R2)].',
    formulas: [
      { name: 'Voltage Divider', formula: 'V_out = V_in × R2 / (R1 + R2)', explanation: 'Unloaded node voltage formula' },
      { name: 'Series Resistance', formula: 'R_total = R1 + R2', explanation: 'Total equivalent impedance' },
    ],
    procedure: [
      '1. Connect R1 (1kΩ) in series with R2 (1kΩ) across a 10V DC Source.',
      '2. Measure the voltage drop across R2 with the DMM probe.',
      '3. Verify that V_out = 5.00V (exactly half of 10V).',
      '4. Add a load resistor across R2 to examine the loading effect.',
    ],
    requiredComponents: ['DC Bench Supply', 'Two 1kΩ Resistors', 'Ground (GND)'],
    initialCircuit: {
      components: [
        {
          id: 'vd-v1',
          type: 'dc_source',
          name: 'V_IN',
          x: 180,
          y: 220,
          rotation: 0,
          properties: { voltage: 10.0 },
          terminals: [
            { id: 'pos', name: 'V+', x: 40, y: 0, type: 'power' },
            { id: 'neg', name: 'V-', x: -40, y: 0, type: 'ground' },
          ],
        },
        {
          id: 'vd-r1',
          type: 'resistor',
          name: 'R1 (1k)',
          x: 320,
          y: 160,
          rotation: 0,
          properties: { resistance: 1000 },
          terminals: [
            { id: 't1', name: 'Pin 1', x: -40, y: 0, type: 'passive' },
            { id: 't2', name: 'Pin 2', x: 40, y: 0, type: 'passive' },
          ],
        },
        {
          id: 'vd-r2',
          type: 'resistor',
          name: 'R2 (1k)',
          x: 320,
          y: 280,
          rotation: 0,
          properties: { resistance: 1000 },
          terminals: [
            { id: 't1', name: 'Pin 1', x: -40, y: 0, type: 'passive' },
            { id: 't2', name: 'Pin 2', x: 40, y: 0, type: 'passive' },
          ],
        },
      ],
      connections: [
        { id: 'c1', fromComponentId: 'vd-v1', fromTerminalId: 'pos', toComponentId: 'vd-r1', toTerminalId: 't1', color: '#dc2626' },
        { id: 'c2', fromComponentId: 'vd-r1', fromTerminalId: 't2', toComponentId: 'vd-r2', toTerminalId: 't1', color: '#2563eb' },
        { id: 'c3', fromComponentId: 'vd-r2', fromTerminalId: 't2', toComponentId: 'vd-v1', toTerminalId: 'neg', color: '#172033' },
      ],
    },
    observationSchema: {
      paramA: 'Supply Voltage V_in (V)',
      paramB: 'Output Voltage V_out (V)',
      paramC: 'Theoretical Ratio R2/(R1+R2)',
    },
    sampleData: [
      { paramA: 2.0, paramB: 1.0, paramC: 0.5 },
      { paramA: 4.0, paramB: 2.0, paramC: 0.5 },
      { paramA: 6.0, paramB: 3.0, paramC: 0.5 },
      { paramA: 8.0, paramB: 4.0, paramC: 0.5 },
      { paramA: 10.0, paramB: 5.0, paramC: 0.5 },
    ],
    conclusionPrompt: 'Output voltage conforms precisely to the voltage divider ratio.',
  },
  {
    id: 'exp-rc-charging',
    title: 'RC Transient Charging & Time Constant (τ = R × C)',
    category: 'Transients',
    difficulty: 'Intermediate',
    aim: 'To study the exponential charging curve of a capacitor and determine the time constant tau.',
    objective: 'Observe V_c(t) reaching 63.2% of supply voltage at t = 1τ on the virtual oscilloscope.',
    theory: 'The voltage across a capacitor charging through a series resistor is given by V_c(t) = V_s × (1 - e^(-t / RC)). At t = τ, V_c = 0.632 × V_s.',
    formulas: [
      { name: 'RC Time Constant', formula: 'τ = R × C', explanation: 'Time in seconds to reach 63.2% charge' },
      { name: 'Transient Voltage', formula: 'V(t) = V_s × (1 - e^(-t/τ))', explanation: 'Exponential step response' },
    ],
    procedure: [
      '1. Connect a 5V source, 1kΩ resistor, and 100µF capacitor in series.',
      '2. Open the Oscilloscope instrument from the bottom console.',
      '3. Observe the green phosphor waveform of voltage rising exponentially.',
      '4. Verify that at t = 0.10s (1τ), voltage equals 3.16V (63.2% of 5V).',
    ],
    requiredComponents: ['5V DC Source', '1kΩ Resistor', '100µF Capacitor', 'Oscilloscope'],
    initialCircuit: {
      components: [
        {
          id: 'rc-v1',
          type: 'dc_source',
          name: 'V_S (5V)',
          x: 180,
          y: 220,
          rotation: 0,
          properties: { voltage: 5.0 },
          terminals: [
            { id: 'pos', name: 'V+', x: 40, y: 0, type: 'power' },
            { id: 'neg', name: 'V-', x: -40, y: 0, type: 'ground' },
          ],
        },
        {
          id: 'rc-r1',
          type: 'resistor',
          name: 'R1 (1k)',
          x: 320,
          y: 160,
          rotation: 0,
          properties: { resistance: 1000 },
          terminals: [
            { id: 't1', name: 'Pin 1', x: -40, y: 0, type: 'passive' },
            { id: 't2', name: 'Pin 2', x: 40, y: 0, type: 'passive' },
          ],
        },
        {
          id: 'rc-c1',
          type: 'capacitor',
          name: 'C1 (100uF)',
          x: 320,
          y: 280,
          rotation: 0,
          properties: { capacitance: 0.0001 },
          terminals: [
            { id: 'pos', name: 'Pos (+)', x: -40, y: 0, type: 'passive' },
            { id: 'neg', name: 'Neg (-)', x: 40, y: 0, type: 'passive' },
          ],
        },
      ],
      connections: [
        { id: 'c1', fromComponentId: 'rc-v1', fromTerminalId: 'pos', toComponentId: 'rc-r1', toTerminalId: 't1', color: '#dc2626' },
        { id: 'c2', fromComponentId: 'rc-r1', fromTerminalId: 't2', toComponentId: 'rc-c1', toTerminalId: 'pos', color: '#2563eb' },
        { id: 'c3', fromComponentId: 'rc-c1', fromTerminalId: 'neg', toComponentId: 'rc-v1', toTerminalId: 'neg', color: '#172033' },
      ],
    },
    observationSchema: {
      paramA: 'Time t (seconds)',
      paramB: 'Capacitor Voltage V_c (V)',
      paramC: '% of Max Voltage V_s',
    },
    sampleData: [
      { paramA: 0.0, paramB: 0.0, paramC: 0.0 },
      { paramA: 0.05, paramB: 1.97, paramC: 39.3 },
      { paramA: 0.1, paramB: 3.16, paramC: 63.2 },
      { paramA: 0.2, paramB: 4.32, paramC: 86.5 },
      { paramA: 0.3, paramB: 4.75, paramC: 95.0 },
      { paramA: 0.5, paramB: 4.97, paramC: 99.3 },
    ],
    conclusionPrompt: 'The capacitor charges exponentially to 5V with time constant τ = R × C = 0.10s.',
  },
  {
    id: 'exp-diode-characteristics',
    title: 'Forward & Reverse V-I Characteristics of a PN Junction Diode',
    category: 'Semiconductors',
    difficulty: 'Intermediate',
    aim: 'To plot the forward and reverse bias characteristic curve of a silicon diode (1N4007) and determine the knee/cut-in voltage.',
    objective: 'Observe negligible current below 0.6V and sharp exponential conduction above 0.7V.',
    theory: "The Shockley diode equation models current I = I_s * (e^(V / (n*V_t)) - 1). For silicon, the barrier potential is ~0.65V–0.70V.",
    formulas: [
      { name: 'Shockley Diode Equation', formula: 'I = I_s × [e^(qV / kT) - 1]', explanation: 'Exponential current relation' },
      { name: 'Static Resistance', formula: 'R_dc = V_d / I_d', explanation: 'DC resistance at operating Q-point' },
    ],
    procedure: [
      '1. Connect a variable DC source, 220Ω resistor, and 1N4007 Diode in series.',
      '2. Increase the voltage in steps of 0.2V up to 5V.',
      '3. Record diode voltage drop V_d and current I_d.',
      '4. Observe the sharp upward knee in the V-I graph at ~0.68V.',
    ],
    requiredComponents: ['Variable DC Supply', '220Ω Resistor', '1N4007 Diode'],
    initialCircuit: {
      components: [
        {
          id: 'd-v1',
          type: 'dc_source',
          name: 'V_BIAS',
          x: 180,
          y: 200,
          rotation: 0,
          properties: { voltage: 3.0 },
          terminals: [
            { id: 'pos', name: 'V+', x: 40, y: 0, type: 'power' },
            { id: 'neg', name: 'V-', x: -40, y: 0, type: 'ground' },
          ],
        },
        {
          id: 'd-r1',
          type: 'resistor',
          name: 'R_LIMIT',
          x: 320,
          y: 200,
          rotation: 0,
          properties: { resistance: 220 },
          terminals: [
            { id: 't1', name: 'Pin 1', x: -40, y: 0, type: 'passive' },
            { id: 't2', name: 'Pin 2', x: 40, y: 0, type: 'passive' },
          ],
        },
        {
          id: 'd-d1',
          type: 'diode',
          name: '1N4007',
          x: 460,
          y: 200,
          rotation: 0,
          properties: { forwardVoltage: 0.7 },
          terminals: [
            { id: 'anode', name: 'Anode (+)', x: -40, y: 0, type: 'input' },
            { id: 'cathode', name: 'Cathode (-)', x: 40, y: 0, type: 'output' },
          ],
        },
      ],
      connections: [
        { id: 'c1', fromComponentId: 'd-v1', fromTerminalId: 'pos', toComponentId: 'd-r1', toTerminalId: 't1', color: '#dc2626' },
        { id: 'c2', fromComponentId: 'd-r1', fromTerminalId: 't2', toComponentId: 'd-d1', toTerminalId: 'anode', color: '#2563eb' },
        { id: 'c3', fromComponentId: 'd-d1', fromTerminalId: 'cathode', toComponentId: 'd-v1', toTerminalId: 'neg', color: '#172033' },
      ],
    },
    observationSchema: {
      paramA: 'Diode Forward Drop V_d (V)',
      paramB: 'Forward Current I_d (mA)',
      paramC: 'Dynamic Resistance r_d (Ω)',
    },
    sampleData: [
      { paramA: 0.2, paramB: 0.0, paramC: 10000 },
      { paramA: 0.4, paramB: 0.05, paramC: 8000 },
      { paramA: 0.6, paramB: 0.4, paramC: 1500 },
      { paramA: 0.68, paramB: 5.2, paramC: 130 },
      { paramA: 0.71, paramB: 10.4, paramC: 68 },
      { paramA: 0.74, paramB: 19.5, paramC: 38 },
    ],
    conclusionPrompt: 'The silicon diode conducts negligible current below ~0.65V, then exhibits exponential conduction with a barrier knee of ~0.7V.',
  },
  {
    id: 'exp-bjt-switch',
    title: 'NPN Bipolar Junction Transistor (BJT) as a Digital Switch',
    category: 'Semiconductors',
    difficulty: 'Advanced',
    aim: 'To demonstrate the switching action of an NPN BJT (2N2222) driving an LED load.',
    objective: 'Verify cut-off state (I_b = 0, LED OFF) and saturation state (V_be >= 0.7V, V_ce ≈ 0.2V, LED ON).',
    theory: 'In cut-off, base-emitter junction is zero/reverse biased, acting as an open switch. In saturation, sufficient base current drives V_ce down to saturation voltage (~0.2V), closing the switch.',
    formulas: [
      { name: 'Collector Current', formula: 'I_c = β × I_b', explanation: 'Current gain in active region' },
      { name: 'Saturation Condition', formula: 'I_b >= I_c(sat) / β_min', explanation: 'Condition for full saturation' },
    ],
    procedure: [
      '1. Connect a 9V supply, collector resistor, LED, and 2N2222 transistor.',
      '2. Connect a 10kΩ base resistor to a control switch.',
      '3. When the base switch is open, observe LED is OFF and V_ce = 9.0V.',
      '4. Close the switch to inject base current; observe LED lights up and V_ce collapses to ~0.2V.',
    ],
    requiredComponents: ['9V DC Battery', '2N2222 NPN Transistor', 'LED', '220Ω & 10kΩ Resistors', 'Switch'],
    initialCircuit: {
      components: [
        {
          id: 'bjt-v1',
          type: 'battery',
          name: '9V Battery',
          x: 180,
          y: 220,
          rotation: 0,
          properties: { voltage: 9.0 },
          terminals: [
            { id: 'pos', name: 'Positive (+)', x: 40, y: 0, type: 'power' },
            { id: 'neg', name: 'Negative (-)', x: -40, y: 0, type: 'ground' },
          ],
        },
        {
          id: 'bjt-led',
          type: 'led',
          name: 'LED1',
          x: 320,
          y: 120,
          rotation: 0,
          properties: { forwardVoltage: 2.0, color: 'green' },
          terminals: [
            { id: 'anode', name: 'Anode (+)', x: -40, y: 0, type: 'input' },
            { id: 'cathode', name: 'Cathode (-)', x: 40, y: 0, type: 'output' },
          ],
        },
        {
          id: 'bjt-rc',
          type: 'resistor',
          name: 'Rc (330Ω)',
          x: 460,
          y: 120,
          rotation: 0,
          properties: { resistance: 330 },
          terminals: [
            { id: 't1', name: 'Pin 1', x: -40, y: 0, type: 'passive' },
            { id: 't2', name: 'Pin 2', x: 40, y: 0, type: 'passive' },
          ],
        },
        {
          id: 'bjt-q1',
          type: 'transistor_npn',
          name: '2N2222',
          x: 460,
          y: 240,
          rotation: 0,
          properties: { beta: 100 },
          terminals: [
            { id: 'collector', name: 'Collector (C)', x: 30, y: -25, type: 'input' },
            { id: 'base', name: 'Base (B)', x: -35, y: 0, type: 'input' },
            { id: 'emitter', name: 'Emitter (E)', x: 30, y: 25, type: 'output' },
          ],
        },
      ],
      connections: [
        { id: 'c1', fromComponentId: 'bjt-v1', fromTerminalId: 'pos', toComponentId: 'bjt-led', toTerminalId: 'anode', color: '#dc2626' },
        { id: 'c2', fromComponentId: 'bjt-led', fromTerminalId: 'cathode', toComponentId: 'bjt-rc', toTerminalId: 't1', color: '#16a34a' },
        { id: 'c3', fromComponentId: 'bjt-rc', fromTerminalId: 't2', toComponentId: 'bjt-q1', toTerminalId: 'collector', color: '#2563eb' },
        { id: 'c4', fromComponentId: 'bjt-q1', fromTerminalId: 'emitter', toComponentId: 'bjt-v1', toTerminalId: 'neg', color: '#172033' },
      ],
    },
    observationSchema: {
      paramA: 'Base Current I_b (µA)',
      paramB: 'Collector Current I_c (mA)',
      paramC: 'V_ce Collector Voltage (V)',
    },
    sampleData: [
      { paramA: 0, paramB: 0.0, paramC: 9.0 },
      { paramA: 50, paramB: 4.8, paramC: 7.2 },
      { paramA: 150, paramB: 14.2, paramC: 3.8 },
      { paramA: 350, paramB: 20.8, paramC: 0.22 },
      { paramA: 500, paramB: 20.9, paramC: 0.18 },
    ],
    conclusionPrompt: 'The transistor functions effectively as a solid-state switch: OFF when I_b = 0, and ON (saturated) when I_b is sufficiently large.',
  },
];

export interface Lesson {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  summary: string;
  formula: string;
  theory: string[];
  interactiveDemo: {
    description: string;
    defaultValues: Record<string, number>;
    calculate: (inputs: Record<string, number>) => { [key: string]: string | number };
    inputLabels: { key: string; label: string; min: number; max: number; step: number; unit: string }[];
  };
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const LESSONS: Lesson[] = [
  {
    id: 'ohms-law',
    title: "1. Ohm's Law (V = I × R)",
    category: 'Fundamentals',
    difficulty: 'Beginner',
    duration: '6 mins',
    summary: 'The cornerstone equation of electrical engineering relating voltage, current, and resistance.',
    formula: 'V = I × R   |   I = V / R   |   P = V × I',
    theory: [
      "Ohm's Law states that the electric current (I) flowing through a linear conductor between two points is directly proportional to the potential difference (V) across the two points and inversely proportional to the resistance (R).",
      "Voltage (V) is measured in Volts [V] — electrical potential difference pushing charge carriers.",
      "Current (I) is measured in Amperes [A] or milliamperes [mA] (1 mA = 0.001 A) — rate of charge flow.",
      "Resistance (R) is measured in Ohms [Ω] — opposition to current flow.",
      "Power (P) dissipated as heat is calculated as P = V × I = I² × R = V² / R, measured in Watts [W] or milliwatts [mW].",
    ],
    interactiveDemo: {
      description: 'Adjust Voltage and Resistance to calculate resulting Current and Power dissipation.',
      defaultValues: { voltage: 5, resistance: 220 },
      inputLabels: [
        { key: 'voltage', label: 'DC Voltage (V)', min: 1, max: 24, step: 0.5, unit: 'V' },
        { key: 'resistance', label: 'Resistance (R)', min: 10, max: 10000, step: 10, unit: 'Ω' },
      ],
      calculate: inputs => {
        const v = inputs.voltage;
        const r = Math.max(1, inputs.resistance);
        const i_amps = v / r;
        const i_ma = i_amps * 1000;
        const p_watts = v * i_amps;
        return {
          'Calculated Current': `${i_ma.toFixed(2)} mA`,
          'Power Dissipated': `${(p_watts * 1000).toFixed(1)} mW`,
          'Status': i_ma > 1000 ? 'High Current Danger!' : 'Safe Operating Region',
        };
      },
    },
    quiz: {
      question: 'If a 9V battery is connected across a 450Ω resistor, what current flows through the circuit?',
      options: ['2 mA', '20 mA', '40.5 mA', '200 mA'],
      correctIndex: 1,
      explanation: 'Using Ohm’s Law: I = V / R = 9V / 450Ω = 0.020 A = 20 mA.',
    },
  },

  {
    id: 'kirchhoffs-laws',
    title: "2. Kirchhoff's Laws (KVL & KCL)",
    category: 'Circuit Analysis',
    difficulty: 'Intermediate',
    duration: '8 mins',
    summary: "Conservation of energy (KVL) and conservation of charge (KCL) in electrical networks.",
    formula: 'Σ V_loop = 0   (KVL)   |   Σ I_in = Σ I_out   (KCL)',
    theory: [
      "Kirchhoff's Current Law (KCL): The algebraic sum of currents entering any node equals the sum of currents leaving that node. No electric charge can accumulate at a junction point.",
      "Kirchhoff's Voltage Law (KVL): The directed sum of electrical potential differences (voltages) around any closed loop is zero.",
      "KVL is used to solve series loops, while KCL is the mathematical foundation for Nodal Analysis algorithms used by modern circuit simulators.",
    ],
    interactiveDemo: {
      description: 'Observe KCL at a 3-branch junction: I_total splits into Branch 1 and Branch 2.',
      defaultValues: { iTotal: 50, r1: 100, r2: 400 },
      inputLabels: [
        { key: 'iTotal', label: 'Entering Current (I_in)', min: 5, max: 100, step: 5, unit: 'mA' },
        { key: 'r1', label: 'Branch 1 Resistor', min: 50, max: 1000, step: 50, unit: 'Ω' },
        { key: 'r2', label: 'Branch 2 Resistor', min: 50, max: 1000, step: 50, unit: 'Ω' },
      ],
      calculate: inputs => {
        const iIn = inputs.iTotal;
        const r1 = inputs.r1;
        const r2 = inputs.r2;
        const i1 = iIn * (r2 / (r1 + r2));
        const i2 = iIn * (r1 / (r1 + r2));
        return {
          'Branch 1 Current (I1)': `${i1.toFixed(2)} mA`,
          'Branch 2 Current (I2)': `${i2.toFixed(2)} mA`,
          'KCL Balance Check': `${(i1 + i2).toFixed(2)} mA = ${iIn} mA (Balanced)`,
        };
      },
    },
    quiz: {
      question: 'A node has three incoming currents: 10mA, 15mA, and 5mA. Two branches leave the node, one carrying 18mA. How much current leaves through the second branch?',
      options: ['12 mA', '30 mA', '48 mA', '8 mA'],
      correctIndex: 0,
      explanation: 'By KCL: Sum(I_in) = 10 + 15 + 5 = 30mA. Sum(I_out) = 18mA + I2 = 30mA. Therefore, I2 = 30 - 18 = 12mA.',
    },
  },

  {
    id: 'voltage-divider',
    title: '3. Voltage Divider Rule',
    category: 'Analog Circuits',
    difficulty: 'Beginner',
    duration: '6 mins',
    summary: 'Derive fractional voltages for analog sensor biasing, ADC references, and level shifting.',
    formula: 'V_out = V_in × [ R2 / (R1 + R2) ]',
    theory: [
      'A voltage divider consists of two resistors connected in series with an input voltage source.',
      'Since the same current flows through both resistors, the voltage drop across each is proportional to its resistance value.',
      'Voltage dividers are widely used to scale down 5V signals to 3.3V for microcontrollers like ESP32 or Raspberry Pi.',
      'Warning: A voltage divider output impedance depends on R1 and R2. Heavy output load currents will cause voltage sag unless buffered with an Op-Amp.',
    ],
    interactiveDemo: {
      description: 'Calculate divided output voltage across R2 for custom resistor pairs.',
      defaultValues: { vin: 5, r1: 10000, r2: 10000 },
      inputLabels: [
        { key: 'vin', label: 'Input Voltage (Vin)', min: 1, max: 24, step: 0.5, unit: 'V' },
        { key: 'r1', label: 'Top Resistor (R1)', min: 100, max: 100000, step: 500, unit: 'Ω' },
        { key: 'r2', label: 'Bottom Resistor (R2)', min: 100, max: 100000, step: 500, unit: 'Ω' },
      ],
      calculate: inputs => {
        const vin = inputs.vin;
        const r1 = inputs.r1;
        const r2 = inputs.r2;
        const vout = vin * (r2 / (r1 + r2));
        const dividerCurrent = (vin / (r1 + r2)) * 1000;
        return {
          'Divided Output (Vout)': `${vout.toFixed(3)} V`,
          'Divider Ratio': `${((r2 / (r1 + r2)) * 100).toFixed(1)} %`,
          'Quiescent Current': `${dividerCurrent.toFixed(3)} mA`,
        };
      },
    },
    quiz: {
      question: 'To convert a 5V sensor signal down to exactly 3.3V for an ESP32 using R1 = 1.7kΩ, what should R2 be?',
      options: ['1.0 kΩ', '3.3 kΩ', '5.0 kΩ', '10 kΩ'],
      correctIndex: 1,
      explanation: 'Vout = Vin * R2 / (R1 + R2) => 3.3 = 5 * R2 / (1.7k + R2) => 3.3*(1.7k + R2) = 5*R2 => 5.61k = 1.7*R2 => R2 = 3.3kΩ.',
    },
  },

  {
    id: 'led-current-limiting',
    title: '4. LEDs & Current-Limiting Resistors',
    category: 'Semiconductors',
    difficulty: 'Beginner',
    duration: '5 mins',
    summary: 'Understand LED forward voltage drop (V_fwd) and compute the exact ballast resistor to prevent burn-out.',
    formula: 'R_lim = (V_supply - V_fwd) / I_target',
    theory: [
      'LEDs are non-linear semiconductor diodes. Once forward biased beyond their threshold (~1.8V to 3.3V depending on color), their dynamic resistance plummets.',
      'Connecting an LED directly to a battery without a resistor causes massive current (>100mA), quickly burning out the semiconductor junction.',
      'Typical standard indicator LEDs operate best between 10 mA and 20 mA (0.010 - 0.020 A).',
      'Red/Yellow LEDs typically drop ~1.8V - 2.1V; Green/Blue/White LEDs typically drop ~2.8V - 3.3V.',
    ],
    interactiveDemo: {
      description: 'Compute the optimal resistor value for chosen supply voltage and LED color.',
      defaultValues: { vsupply: 5, vfwd: 2.0, target_ma: 15 },
      inputLabels: [
        { key: 'vsupply', label: 'Supply Voltage', min: 3, max: 24, step: 0.5, unit: 'V' },
        { key: 'vfwd', label: 'LED Forward Drop (Vf)', min: 1.8, max: 3.4, step: 0.1, unit: 'V' },
        { key: 'target_ma', label: 'Target Current', min: 5, max: 30, step: 1, unit: 'mA' },
      ],
      calculate: inputs => {
        const vs = inputs.vsupply;
        const vf = inputs.vfwd;
        const i_amps = inputs.target_ma / 1000;
        const r_exact = Math.max(1, (vs - vf) / i_amps);
        return {
          'Calculated Resistor': `${Math.round(r_exact)} Ω`,
          'Standard E24 Value': `${Math.round(r_exact / 10) * 10} Ω`,
          'LED Dissipation': `${(vf * inputs.target_ma).toFixed(1)} mW`,
          'Resistor Dissipation': `${((vs - vf) * inputs.target_ma).toFixed(1)} mW`,
        };
      },
    },
    quiz: {
      question: 'With a 9V battery and a Red LED (Vf = 2.0V), what resistor gives exactly 20 mA of current?',
      options: ['100 Ω', '220 Ω', '350 Ω', '470 Ω'],
      correctIndex: 2,
      explanation: 'R = (V_supply - V_fwd) / I = (9V - 2V) / 0.020A = 7V / 0.020A = 350 Ω.',
    },
  },

  {
    id: 'capacitors-rc-transients',
    title: '5. Capacitors & RC Time Constant',
    category: 'Passive Components',
    difficulty: 'Intermediate',
    duration: '8 mins',
    summary: 'Transient charging and discharging dynamics of capacitive energy storage: tau = R × C.',
    formula: 'τ = R × C   |   V_c(t) = V_s × (1 - e^(-t / τ))',
    theory: [
      'Capacitors store electrical energy in an electrostatic field between conductive plates separated by a dielectric.',
      'The time constant tau (τ = R × C) represents the time required to charge the capacitor to 63.2% of the supply voltage.',
      'After 5 time constants (5τ), the capacitor is considered fully charged (>99.3%).',
      'In DC steady-state, a capacitor behaves as an open circuit (blocking direct current).',
    ],
    interactiveDemo: {
      description: 'Compute time constant tau and charge time for R-C combinations.',
      defaultValues: { r: 10000, c_uf: 100, vs: 5 },
      inputLabels: [
        { key: 'r', label: 'Resistance (R)', min: 1000, max: 100000, step: 1000, unit: 'Ω' },
        { key: 'c_uf', label: 'Capacitance (C)', min: 10, max: 1000, step: 10, unit: 'µF' },
        { key: 'vs', label: 'Supply Voltage (Vs)', min: 1, max: 15, step: 0.5, unit: 'V' },
      ],
      calculate: inputs => {
        const tau = inputs.r * (inputs.c_uf * 1e-6);
        const vAtTau = inputs.vs * 0.632;
        const timeToFull = tau * 5;
        return {
          'Time Constant (τ = RC)': `${tau.toFixed(3)} seconds`,
          'Voltage at 1τ': `${vAtTau.toFixed(2)} V (63.2%)`,
          'Full Charge Time (5τ)': `${timeToFull.toFixed(3)} seconds`,
        };
      },
    },
    quiz: {
      question: 'What is the time constant of a 10kΩ resistor and a 470µF capacitor?',
      options: ['0.47 seconds', '4.7 seconds', '47 seconds', '4700 seconds'],
      correctIndex: 1,
      explanation: 'τ = R × C = 10,000 Ω × (470 × 10^-6 F) = 4.7 seconds.',
    },
  },

  {
    id: 'digital-logic',
    title: '6. Digital Logic Gates',
    category: 'Digital Electronics',
    difficulty: 'Beginner',
    duration: '7 mins',
    summary: 'Binary truth tables for AND, OR, NOT, NAND, NOR, and XOR gates.',
    formula: 'Y_AND = A · B   |   Y_OR = A + B   |   Y_NOT = ¬A',
    theory: [
      'Digital circuits process discrete binary signals: HIGH (Logic 1, typically +5V or +3.3V) and LOW (Logic 0, 0V).',
      'AND Gate: Output is HIGH only when ALL inputs are HIGH.',
      'OR Gate: Output is HIGH if AT LEAST ONE input is HIGH.',
      'NOT Gate (Inverter): Inverts the input signal.',
      'NAND & NOR are universal gates; any Boolean function can be implemented using only NAND or only NOR gates.',
    ],
    interactiveDemo: {
      description: 'Toggle inputs A and B to evaluate gate outputs.',
      defaultValues: { inputA: 1, inputB: 0 },
      inputLabels: [
        { key: 'inputA', label: 'Input A (0 or 1)', min: 0, max: 1, step: 1, unit: 'bit' },
        { key: 'inputB', label: 'Input B (0 or 1)', min: 0, max: 1, step: 1, unit: 'bit' },
      ],
      calculate: inputs => {
        const a = inputs.inputA === 1;
        const b = inputs.inputB === 1;
        return {
          'AND Gate (A · B)': a && b ? '1 (HIGH)' : '0 (LOW)',
          'OR Gate (A + B)': a || b ? '1 (HIGH)' : '0 (LOW)',
          'NAND Gate': !(a && b) ? '1 (HIGH)' : '0 (LOW)',
          'XOR Gate (A ⊕ B)': (a && !b) || (!a && b) ? '1 (HIGH)' : '0 (LOW)',
        };
      },
    },
    quiz: {
      question: 'For an XOR gate, what is the output if Input A = 1 and Input B = 1?',
      options: ['1 (HIGH)', '0 (LOW)', 'Undefined', 'High Impedance'],
      correctIndex: 1,
      explanation: 'Exclusive OR (XOR) outputs HIGH only when the two inputs are different. When both inputs are 1, output is 0.',
    },
  },
];

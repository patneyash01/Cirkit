import { CircuitProject, SimulationResults } from '../types/circuit';

export interface ChallengeDef {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  objective: string;
  requiredTypes: string[];
  evaluationRules: {
    minVoltage?: number;
    maxVoltage?: number;
    minCurrent_mA?: number;
    maxCurrent_mA?: number;
    requiredActiveState?: string;
  };
  rewardBadge: string;
}

export const CIRKIT_CHALLENGES: ChallengeDef[] = [
  {
    id: 'ch-1',
    title: 'Basic LED Illumination with Safe Current Limiting',
    level: 'Beginner',
    description: 'Construct a closed circuit to safely power a 5mm LED using a DC Battery and a current-limiting resistor.',
    objective: 'The LED must be illuminated with loop current between 10 mA and 28 mA without exceeding safe limits.',
    requiredTypes: ['battery', 'resistor', 'led'],
    evaluationRules: {
      minCurrent_mA: 8,
      maxCurrent_mA: 30,
      requiredActiveState: 'on',
    },
    rewardBadge: '🏅 Circuit Cadet',
  },
  {
    id: 'ch-2',
    title: '5.0V to 2.5V Precision Voltage Divider',
    level: 'Beginner',
    description: 'Using a 5V supply and two identical resistors, create a midpoint voltage reference of 2.5V ± 0.1V.',
    objective: 'Node voltage at the junction of the two series resistors must measure between 2.4V and 2.6V.',
    requiredTypes: ['dc_source', 'resistor'],
    evaluationRules: {
      minVoltage: 2.3,
      maxVoltage: 2.7,
      minCurrent_mA: 1,
    },
    rewardBadge: '📐 Divider Specialist',
  },
  {
    id: 'ch-3',
    title: 'Automatic Light-Activated Night Lamp',
    level: 'Intermediate',
    description: 'Build a circuit utilizing an LDR (photoresistor) that powers an indicator LED.',
    objective: 'Incorporate an LDR sensor, resistor, power supply, and LED with positive current flow.',
    requiredTypes: ['battery', 'ldr', 'resistor', 'led'],
    evaluationRules: {
      minCurrent_mA: 0.5,
      maxCurrent_mA: 35,
    },
    rewardBadge: '💡 Sensor Engineer',
  },
  {
    id: 'ch-4',
    title: 'DC Motor Prime Mover with Toggle Control',
    level: 'Intermediate',
    description: 'Construct a switched motor drive circuit where toggling the switch activates the spinning propeller.',
    objective: 'DC motor must reach active rotating state (voltage drop >= 2.0V).',
    requiredTypes: ['battery', 'switch', 'dc_motor'],
    evaluationRules: {
      minVoltage: 2.0,
      minCurrent_mA: 10,
    },
    rewardBadge: '⚡ Electromechanical Specialist',
  },
  {
    id: 'ch-5',
    title: 'Arduino Uno Embedded Pin Control',
    level: 'Advanced',
    description: 'Interface an external resistor and LED to an Arduino Uno board and verify digital pin energization.',
    objective: 'Connect Arduino Uno Pin 13 / 5V and GND to light up an LED.',
    requiredTypes: ['arduino_uno', 'resistor', 'led'],
    evaluationRules: {
      minCurrent_mA: 5,
    },
    rewardBadge: '🤖 Microcontroller Architect',
  },
];

export function evaluateChallengeSolution(
  challenge: ChallengeDef,
  project: CircuitProject,
  results: SimulationResults | null
): { passed: boolean; message: string } {
  if (!results || !results.isRunning) {
    return { passed: false, message: 'Simulation is currently paused or inactive. Click "Run Simulation".' };
  }

  // Check required component types
  for (const reqType of challenge.requiredTypes) {
    const hasType = project.components.some(c => c.type === reqType);
    if (!hasType) {
      return {
        passed: false,
        message: `Missing required component type: ${reqType.replace('_', ' ')}. Add one from the bin.`,
      };
    }
  }

  // Check current bounds
  const current = results.totalCurrent; // mA
  if (challenge.evaluationRules.minCurrent_mA && current < challenge.evaluationRules.minCurrent_mA) {
    return {
      passed: false,
      message: `Loop current (${current.toFixed(1)} mA) is too low. Target is >= ${challenge.evaluationRules.minCurrent_mA} mA.`,
    };
  }

  if (challenge.evaluationRules.maxCurrent_mA && current > challenge.evaluationRules.maxCurrent_mA) {
    return {
      passed: false,
      message: `Loop current (${current.toFixed(1)} mA) exceeds safe maximum limit of ${challenge.evaluationRules.maxCurrent_mA} mA.`,
    };
  }

  // Check LED active state if required
  if (challenge.evaluationRules.requiredActiveState === 'on') {
    const ledComp = project.components.find(c => c.type === 'led');
    if (ledComp) {
      const ledData = results.componentResults[ledComp.id];
      if (ledData?.state !== 'on') {
        return {
          passed: false,
          message: 'The LED is not turning ON. Check connections, switch position, and polarities.',
        };
      }
    }
  }

  return {
    passed: true,
    message: `Congratulations! Challenge criteria satisfied. You earned: ${challenge.rewardBadge}!`,
  };
}

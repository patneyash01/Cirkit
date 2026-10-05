import { CircuitProject } from '../types/circuit';

export interface BuildStep {
  stepNumber: number;
  title: string;
  category: 'prep' | 'power' | 'ics' | 'passives' | 'wires' | 'testing';
  instruction: string;
  hardwareTips: string[];
  safetyNote?: string;
}

export function generateRealWorldBuildInstructions(project: CircuitProject): BuildStep[] {
  const steps: BuildStep[] = [];
  let stepCount = 1;

  // 1. Preparation
  steps.push({
    stepNumber: stepCount++,
    title: 'Breadboard & Workbench Setup',
    category: 'prep',
    instruction: 'Place your 830-tie point solderless breadboard on a flat, clean ESD workbench with the red (+) rail at the top.',
    hardwareTips: [
      'Ensure the breadboard center trough (0.3" DIP gap) runs horizontally in front of you.',
      'Keep your component leads trimmed to ~6-8mm so they insert snugly without bending or touching adjacent pins.',
    ],
  });

  // 2. Power Supply Setup
  const powerComp = project.components.find(c => c.type === 'battery' || c.type === 'battery_holder' || c.type === 'dc_source' || c.type === 'arduino_uno');
  if (powerComp) {
    steps.push({
      stepNumber: stepCount++,
      title: 'Power Distribution Rails',
      category: 'power',
      instruction: `Prepare the power source (${powerComp.name}). Connect the positive supply wire to the RED (+) rail and the ground return to the BLUE/BLACK (-) rail.`,
      hardwareTips: [
        'Use RED jumper wires strictly for positive supply (+5V or +9V).',
        'Use BLACK jumper wires strictly for 0V Ground (GND).',
        'Keep the battery unplugged or supply powered OFF while assembling components.',
      ],
      safetyNote: 'Never connect the battery while assembling wires to prevent accidental short circuits.',
    });
  }

  // 3. Microcontrollers / ICs
  const ics = project.components.filter(c => c.type === 'arduino_uno' || c.type === 'esp32' || c.type.includes('gate') || c.type.includes('logic'));
  if (ics.length > 0) {
    for (const ic of ics) {
      steps.push({
        stepNumber: stepCount++,
        title: `Position ${ic.name}`,
        category: 'ics',
        instruction: ic.type.includes('arduino') || ic.type.includes('esp32')
          ? `Place the ${ic.name} adjacent to your breadboard or plug its header pins into rows spanning across the center divider.`
          : `Insert the DIP package ${ic.name} straddling the center trough so opposite pin rows stay electrically isolated.`,
        hardwareTips: [
          'Locate Pin 1 (marked by a circular dimple or semi-circular notch on the IC package).',
          'Press evenly with two thumbs so all metal pins enter the spring clips simultaneously without bending.',
        ],
      });
    }
  }

  // 4. Passive & Semiconductor Components
  const passives = project.components.filter(c => c.type === 'resistor' || c.type === 'potentiometer' || c.type === 'capacitor' || c.type === 'diode' || c.type === 'led' || c.type === 'ldr' || c.type === 'switch');
  if (passives.length > 0) {
    steps.push({
      stepNumber: stepCount++,
      title: 'Insert Circuit Components into Breadboard Strips',
      category: 'passives',
      instruction: `Insert the ${passives.length} circuit components into their corresponding breadboard column rows.`,
      hardwareTips: [
        'Resistors: Bend axial leads at 90-degree angles. Resistors are non-polar and can be inserted in either orientation.',
        'LEDs: The longer leg is the Anode (+) and must face towards positive voltage; the flat edge on the plastic rim is Cathode (-).',
        'Electrolytic Capacitors: Observe the printed minus (-) stripe with arrows along the side of the cylindrical can.',
        'Diodes: The silver painted band marks the Cathode (-) terminal.',
      ],
    });
  }

  // 5. Wiring Steps
  if (project.connections.length > 0) {
    const wireDetails = project.connections.map((w, idx) => {
      const fromComp = project.components.find(c => c.id === w.fromComponentId);
      const toComp = project.components.find(c => c.id === w.toComponentId);
      const fromName = fromComp ? `${fromComp.name} (${w.fromTerminalId})` : w.fromTerminalId;
      const toName = toComp ? `${toComp.name} (${w.toTerminalId})` : w.toTerminalId;
      return `Wire ${idx + 1}: Connect from ${fromName} to ${toName}`;
    });

    steps.push({
      stepNumber: stepCount++,
      title: 'Route Jumper Wires',
      category: 'wires',
      instruction: `Connect ${project.connections.length} DuPont jumper wires as shown below:`,
      hardwareTips: [
        ...wireDetails.slice(0, 8),
        wireDetails.length > 8 ? `... plus ${wireDetails.length - 8} more connections.` : 'Press wire pins firmly into breadboard holes until fully seated.',
      ],
    });
  }

  // 6. Pre-Flight Inspection
  steps.push({
    stepNumber: stepCount++,
    title: 'Pre-Flight Electrical Inspection (Multimeter Check)',
    category: 'testing',
    instruction: 'Before applying power, perform a cold continuity resistance check using your digital multimeter.',
    hardwareTips: [
      'Switch DMM to Continuity / Resistance (Ω) mode.',
      'Place red probe on (+) rail and black probe on (-) rail: Ensure resistance is NOT 0.00Ω (no short circuit).',
      'Verify all LED and electrolytic capacitor polarities one final time.',
    ],
    safetyNote: 'If resistance between power rails is near zero, find and fix the short before plugging in power!',
  });

  // 7. Power-On & Operational Testing
  steps.push({
    stepNumber: stepCount++,
    title: 'Power-On & Functional Testing',
    category: 'testing',
    instruction: 'Connect your power supply or battery clip. Observe component indicators and test operation.',
    hardwareTips: [
      'Look for LED illumination, motor rotation, or buzzer sound.',
      'Touch components briefly: If any resistor or IC feels uncomfortably hot to the touch, disconnect power immediately.',
      'Use DMM in DC Voltage mode to measure operating points and compare with your CirKit simulation readings.',
    ],
  });

  return steps;
}

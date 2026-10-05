import { CircuitComponent, Connection, CircuitProject, FaultType } from '../types/circuit';

export const EDUCATIONAL_FAULTS: FaultType[] = [
  {
    id: 'reversed_led',
    name: 'Reversed LED Polarity',
    description: 'An LED is installed backwards (anode and cathode flipped).',
    symptoms: 'Circuit has active power and closed switch, but the LED fails to illuminate.',
    hints: [
      'Check the orientation of the LED leads.',
      'Remember: Anode (+) must connect towards the positive supply, and Cathode (-) towards ground.',
      'In a physical LED, the longer lead is the Anode and the flat notch side is the Cathode.',
    ],
  },
  {
    id: 'excessive_resistor',
    name: 'Incorrect High Resistor Value',
    description: 'A 100 kΩ or 1 MΩ resistor was inserted instead of a 220 Ω current-limiting resistor.',
    symptoms: 'Current is choked down to microamps; LED is completely dark or extremely dim.',
    hints: [
      'Measure the voltage drop across the resistor with a multimeter.',
      'Check the resistor color bands or inspect its properties panel.',
      'Calculate required resistance using Ohm’s Law: R = (V_supply - V_led) / 0.020A.',
    ],
  },
  {
    id: 'broken_wire',
    name: 'Broken / Disconnected Jumper Wire',
    description: 'A jumper wire has an internal break or is disconnected from a terminal.',
    symptoms: 'Open circuit detected; loop current is 0.00 mA.',
    hints: [
      'Use the Multimeter in Continuity mode or Voltage mode.',
      'Trace node voltages from the positive battery terminal to find where potential drops to 0V.',
    ],
  },
  {
    id: 'short_circuit',
    name: 'Accidental Power Short Circuit',
    description: 'A wire inadvertently shorts the positive power rail directly to ground.',
    symptoms: 'Dangerous high current warning; battery voltage collapses; components receive no current.',
    hints: [
      'Inspect the power rails on the breadboard.',
      'Ensure no wire connects red rail (+) directly to blue rail (-).',
    ],
  },
  {
    id: 'dead_battery',
    name: 'Depleted / Dead Battery',
    description: 'The 9V battery has discharged and only supplies 0.4V.',
    symptoms: 'Circuit is correctly wired, but measured supply voltage is near zero.',
    hints: [
      'Place the Multimeter red probe on the battery (+) and black probe on (-).',
      'If the measured DC voltage is less than 2.0V, the battery needs replacement.',
    ],
  },
  {
    id: 'open_switch',
    name: 'Switch Left Open',
    description: 'A SPST toggle switch or push button is in the open position.',
    symptoms: 'Circuit loop has a gap; current cannot return to ground.',
    hints: [
      'Click the toggle switch lever or push button to close the circuit contact.',
    ],
  },
];

/**
 * Injects an educational fault into a circuit project for troubleshooting exercises.
 */
export function injectCircuitFault(
  project: CircuitProject,
  faultId: string
): { faultyProject: CircuitProject; fault: FaultType } {
  const fault = EDUCATIONAL_FAULTS.find(f => f.id === faultId) || EDUCATIONAL_FAULTS[0];
  const updatedComponents = project.components.map(c => ({ ...c, properties: { ...c.properties } }));
  let updatedConnections = project.connections.map(w => ({ ...w }));

  if (fault.id === 'reversed_led') {
    const ledIdx = updatedComponents.findIndex(c => c.type === 'led');
    if (ledIdx >= 0) {
      const led = updatedComponents[ledIdx];
      // Flip anode and cathode terminal IDs
      led.terminals = led.terminals.map(t => {
        if (t.id === 'anode') return { ...t, id: 'cathode', name: 'Cathode (-)' };
        if (t.id === 'cathode') return { ...t, id: 'anode', name: 'Anode (+)' };
        return t;
      });
    }
  } else if (fault.id === 'excessive_resistor') {
    const resIdx = updatedComponents.findIndex(c => c.type === 'resistor');
    if (resIdx >= 0) {
      updatedComponents[resIdx].properties.resistance = 100000; // 100kΩ
    }
  } else if (fault.id === 'broken_wire') {
    if (updatedConnections.length > 0) {
      // Remove one wire to simulate break
      updatedConnections.splice(Math.floor(updatedConnections.length / 2), 1);
    }
  } else if (fault.id === 'dead_battery') {
    const batIdx = updatedComponents.findIndex(c => c.type === 'battery' || c.type === 'dc_source');
    if (batIdx >= 0) {
      updatedComponents[batIdx].properties.voltage = 0.4;
    }
  } else if (fault.id === 'open_switch') {
    const swIdx = updatedComponents.findIndex(c => c.type === 'switch' || c.type === 'push_button');
    if (swIdx >= 0) {
      updatedComponents[swIdx].properties.state = false;
    }
  } else if (fault.id === 'short_circuit') {
    const bat = updatedComponents.find(c => c.type === 'battery' || c.type === 'dc_source');
    if (bat) {
      updatedConnections.push({
        id: `fault-short-${Date.now()}`,
        fromComponentId: bat.id,
        fromTerminalId: 'pos',
        toComponentId: bat.id,
        toTerminalId: 'neg',
        color: '#dc2626',
      });
    }
  }

  const faultyProject: CircuitProject = {
    ...project,
    id: `troubleshoot-${Date.now()}`,
    name: `Troubleshooting: ${fault.name}`,
    components: updatedComponents,
    connections: updatedConnections,
    updatedAt: Date.now(),
  };

  return { faultyProject, fault };
}

/**
 * Validates whether the student has resolved the fault
 */
export function verifyTroubleshootingSolution(
  project: CircuitProject,
  faultId: string
): { isResolved: boolean; feedback: string } {
  const leds = project.components.filter(c => c.type === 'led');
  const resistors = project.components.filter(c => c.type === 'resistor');
  const batteries = project.components.filter(c => c.type === 'battery' || c.type === 'dc_source');

  if (faultId === 'reversed_led') {
    const hasCorrectPolarity = leds.some(led => {
      const anode = led.terminals.find(t => t.id === 'anode');
      return anode && anode.x < 0; // Default left terminal is anode
    });
    if (hasCorrectPolarity) {
      return { isResolved: true, feedback: 'Excellent! You corrected the LED polarity and current can now flow in the forward direction.' };
    }
    return { isResolved: false, feedback: 'The LED is still reverse-biased. The anode lead (+) must face the higher voltage side.' };
  }

  if (faultId === 'excessive_resistor') {
    const hasNormalR = resistors.some(r => (r.properties.resistance ?? 0) <= 2000 && (r.properties.resistance ?? 0) >= 100);
    if (hasNormalR) {
      return { isResolved: true, feedback: 'Correct! You changed the resistor to a suitable current-limiting value (100Ω–2kΩ).' };
    }
    return { isResolved: false, feedback: 'The resistance is still too high or not within safe limits (try ~220Ω to 470Ω).' };
  }

  if (faultId === 'dead_battery') {
    const hasGoodBat = batteries.some(b => (b.properties.voltage ?? 0) >= 3.0);
    if (hasGoodBat) {
      return { isResolved: true, feedback: 'Great job! You replaced the battery with an active power source providing adequate voltage.' };
    }
    return { isResolved: false, feedback: 'The power source voltage is still insufficient to overcome component forward drops.' };
  }

  if (faultId === 'broken_wire') {
    if (project.connections.length >= 2) {
      return { isResolved: true, feedback: 'Wiring repaired! The closed loop is restored.' };
    }
    return { isResolved: false, feedback: 'Circuit still has missing connections. Complete the loop with a jumper wire.' };
  }

  if (faultId === 'open_switch') {
    const isClosed = project.components.some(c => (c.type === 'switch' || c.type === 'push_button') && c.properties.state);
    if (isClosed) {
      return { isResolved: true, feedback: 'Switch closed! Contacts are conducting current.' };
    }
    return { isResolved: false, feedback: 'The switch is still open.' };
  }

  return { isResolved: true, feedback: 'Circuit inspected and working.' };
}

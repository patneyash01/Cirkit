import { CircuitComponent, Connection, DiagnosticIssue } from '../types/circuit';
import { findNearestBreadboardHole } from './breadboardEngine';

export function validateCircuit(
  components: CircuitComponent[],
  connections: Connection[]
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  if (components.length === 0) {
    return [
      {
        id: 'empty-canvas',
        type: 'info',
        title: 'Empty Canvas',
        message: 'Your circuit workbench is empty. Drag components from the left component bin or click "Smart Build".',
        suggestedFix: 'Place a DC Battery, Resistor, LED, and Ground, or load a starter template.',
        severityScore: 1,
      },
    ];
  }

  // 1. Check for Power Source
  const powerSources = components.filter(
    c => c.type === 'battery' || c.type === 'battery_holder' || c.type === 'dc_source' || c.type === 'ac_source' || c.type === 'arduino_uno' || c.type === 'esp32'
  );
  if (powerSources.length === 0) {
    issues.push({
      id: 'missing-power',
      type: 'warning',
      title: 'No Power Source Detected',
      message: 'The circuit lacks an electromotive force (EMF) power supply (Battery, DC Source, or Arduino).',
      suggestedFix: 'Add a 9V Battery or 5V Power Supply from the Power bin.',
      severityScore: 6,
    });
  }

  // 2. Check for Ground Reference (GND)
  const groundComponents = components.filter(
    c => c.type === 'ground' || c.type === 'arduino_uno' || c.type === 'esp32'
  );
  if (groundComponents.length === 0) {
    issues.push({
      id: 'missing-ground',
      type: 'info',
      title: 'Missing Ground Reference (GND)',
      message: 'No explicit GND symbol found. Negative terminal will be referenced as 0.00V.',
      suggestedFix: 'Add a Ground (GND) symbol from Power to establish a definite 0.00V reference plane.',
      severityScore: 2,
    });
  }

  // Build connection graph of terminals
  const connectedTerminals = new Set<string>();
  const terminalConnections = new Map<string, string[]>();

  for (const conn of connections) {
    const k1 = `${conn.fromComponentId}:${conn.fromTerminalId}`;
    const k2 = `${conn.toComponentId}:${conn.toTerminalId}`;
    connectedTerminals.add(k1);
    connectedTerminals.add(k2);

    if (!terminalConnections.has(k1)) terminalConnections.set(k1, []);
    if (!terminalConnections.has(k2)) terminalConnections.set(k2, []);
    terminalConnections.get(k1)!.push(k2);
    terminalConnections.get(k2)!.push(k1);
  }

  // 3. Check for Unconnected Terminals
  for (const comp of components) {
    if (comp.type === 'ground') continue;
    const unconnected = comp.terminals.filter(t => !connectedTerminals.has(`${comp.id}:${t.id}`));
    if (unconnected.length > 0 && unconnected.length === comp.terminals.length) {
      issues.push({
        id: `unconnected-${comp.id}`,
        type: 'info',
        title: `Unconnected Component: ${comp.name}`,
        message: `${comp.name} (${comp.type.replace('_', ' ')}) has no jumper wire connections.`,
        suggestedFix: `Connect terminals of ${comp.name} into the circuit loop or onto breadboard tie-points.`,
        componentIds: [comp.id],
        severityScore: 3,
      });
    }
  }

  // 4. Check for Direct Short Circuit across Power Source
  for (const src of powerSources) {
    const posKey = `${src.id}:pos`;
    const negKey = `${src.id}:neg`;
    const posNeighbors = terminalConnections.get(posKey) || [];

    if (posNeighbors.includes(negKey)) {
      issues.push({
        id: `short-circuit-${src.id}`,
        type: 'critical',
        title: 'Dangerous Direct Short Circuit!',
        message: `The positive and negative terminals of ${src.name} are directly bridged with zero resistance.`,
        suggestedFix: 'Remove the shorting jumper wire immediately to prevent infinite current and virtual thermal destruction.',
        componentIds: [src.id],
        severityScore: 10,
      });
    }
  }

  // 5. Check for LED connected directly to power without current-limiting resistor
  const leds = components.filter(c => c.type === 'led');
  for (const led of leds) {
    const anodeKey = `${led.id}:anode`;
    const cathodeKey = `${led.id}:cathode`;

    for (const src of powerSources) {
      const posKey = `${src.id}:pos`;
      const negKey = `${src.id}:neg`;

      const anodeConnToPos = terminalConnections.get(anodeKey)?.includes(posKey);
      const cathodeConnToNeg = terminalConnections.get(cathodeKey)?.includes(negKey);

      if (anodeConnToPos && cathodeConnToNeg) {
        issues.push({
          id: `led-no-resistor-${led.id}`,
          type: 'error',
          title: `LED "${led.name}" Missing Current-Limiting Resistor`,
          message: `Your LED "${led.name}" is wired directly across ${src.name} with no series resistance to limit current.`,
          suggestedFix: 'Insert a 220Ω–1kΩ resistor in series with the LED to limit current to safe ~15-20 mA.',
          componentIds: [led.id, src.id],
          severityScore: 8,
        });
      }

      // Check reverse polarity (anode connected to GND and cathode to VCC)
      const anodeConnToNeg = terminalConnections.get(anodeKey)?.includes(negKey);
      const cathodeConnToPos = terminalConnections.get(cathodeKey)?.includes(posKey);
      if (anodeConnToNeg && cathodeConnToPos) {
        issues.push({
          id: `led-reverse-${led.id}`,
          type: 'warning',
          title: `LED "${led.name}" Polarity Reversed`,
          message: `The anode (+) of ${led.name} is connected to negative ground and cathode (-) to positive. LEDs only conduct in forward bias.`,
          suggestedFix: 'Reverse the LED terminals or rotate the LED 180° so anode connects towards positive voltage.',
          componentIds: [led.id],
          severityScore: 5,
        });
      }
    }
  }

  // 6. Check for Breadboard Self-Short (both terminals of resistor or capacitor in same breadboard strip)
  for (const comp of components) {
    if (comp.terminals.length === 2 && (comp.type === 'resistor' || comp.type === 'capacitor' || comp.type === 'diode' || comp.type === 'switch')) {
      const rad = (comp.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const t1 = comp.terminals[0];
      const t2 = comp.terminals[1];

      const x1 = comp.x + (t1.x * cos - t1.y * sin);
      const y1 = comp.y + (t1.x * sin + t1.y * cos);
      const x2 = comp.x + (t2.x * cos - t2.y * sin);
      const y2 = comp.y + (t2.x * sin + t2.y * cos);

      const h1 = findNearestBreadboardHole(x1, y1, 14);
      const h2 = findNearestBreadboardHole(x2, y2, 14);

      if (h1 && h2 && h1.groupId === h2.groupId) {
        issues.push({
          id: `bb-self-short-${comp.id}`,
          type: 'warning',
          title: `Breadboard Placement Short: ${comp.name}`,
          message: `Both leads of ${comp.name} are plugged into the same breadboard tie-strip (${h1.groupId}). This shorts out the component.`,
          suggestedFix: `Rotate or span ${comp.name} across different column numbers or across the center DIP trough.`,
          componentIds: [comp.id],
          severityScore: 7,
        });
      }
    }
  }

  // 7. Check for Open Switch
  const openSwitches = components.filter(c => (c.type === 'switch' || c.type === 'push_button') && !c.properties.state);
  if (openSwitches.length > 0 && connections.length >= 2) {
    issues.push({
      id: 'switch-open',
      type: 'info',
      title: 'Switch in Open State',
      message: `Switch "${openSwitches[0].name}" is currently OPEN, preventing closed-loop current.`,
      suggestedFix: 'Click the switch lever on the workbench or toggle its state in the properties panel to CLOSE it.',
      componentIds: openSwitches.map(s => s.id),
      severityScore: 2,
    });
  }

  return issues;
}

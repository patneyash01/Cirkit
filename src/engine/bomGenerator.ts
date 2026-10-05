import { CircuitProject, BOMItem } from '../types/circuit';

export function generateBOM(project: CircuitProject): { items: BOMItem[]; totalEstCost: number; totalParts: number } {
  const itemMap = new Map<string, BOMItem>();

  // Count components
  for (const comp of project.components) {
    let key: string = comp.type;
    let valStr = '';
    let spec = '';
    let pkg = 'Through-Hole';
    let cost = 0.20;

    switch (comp.type) {
      case 'resistor': {
        const r = comp.properties.resistance ?? 220;
        valStr = r >= 1000 ? `${r / 1000}kΩ` : `${r}Ω`;
        key = `resistor-${valStr}`;
        spec = `${comp.properties.powerRating ?? 0.25}W Metal Film ±5%`;
        pkg = 'Axial DO-35';
        cost = 0.05;
        break;
      }
      case 'led': {
        const col = comp.properties.color || 'Red';
        valStr = `${col.toUpperCase()} 5mm`;
        key = `led-${col}`;
        spec = 'Vf ~2.0V, If = 20mA max';
        pkg = 'Radial T-1 3/4 (5mm)';
        cost = 0.15;
        break;
      }
      case 'capacitor': {
        const c = comp.properties.capacitance ?? 0.0001;
        valStr = `${Math.round(c * 1e6)}µF`;
        key = `cap-${valStr}`;
        spec = '25V Electrolytic Can';
        pkg = 'Radial Can 5x11mm';
        cost = 0.25;
        break;
      }
      case 'diode':
        valStr = '1N4007';
        spec = '1000V 1A Silicon Rectifier';
        pkg = 'DO-41 Axial';
        cost = 0.10;
        break;
      case 'zener_diode':
        valStr = '5.1V Zener';
        spec = '500mW 5.1V 1N4733A';
        pkg = 'DO-35 Glass';
        cost = 0.20;
        break;
      case 'transistor_npn':
        valStr = '2N2222 NPN';
        spec = '40V 800mA General Purpose BJT';
        pkg = 'TO-92 Plastic';
        cost = 0.30;
        break;
      case 'transistor_pnp':
        valStr = '2N3906 PNP';
        spec = '40V 200mA Small Signal BJT';
        pkg = 'TO-92 Plastic';
        cost = 0.30;
        break;
      case 'potentiometer':
        valStr = `${(comp.properties.maxResistance ?? 10000) / 1000}kΩ`;
        spec = 'Single-turn Breadboard Trim Pot';
        pkg = '3-Pin Through-Hole';
        cost = 0.75;
        break;
      case 'switch':
        valStr = 'SPST Miniature';
        spec = 'Subminiature Toggle 3A 125VAC';
        pkg = 'Panel/Breadboard Mount';
        cost = 0.90;
        break;
      case 'push_button':
        valStr = '6x6mm Tact';
        spec = 'Momentary NO SPST Tactile Switch';
        pkg = '4-Pin DIP';
        cost = 0.20;
        break;
      case 'battery':
        valStr = `${comp.properties.voltage ?? 9}V Battery`;
        spec = 'Alkaline 9V 6LR61 + Snap Clip';
        pkg = 'Standard 9V Snap';
        cost = 2.50;
        break;
      case 'battery_holder':
        valStr = '2xAA Holder (3V)';
        spec = 'Dual AA Battery Case with Leads';
        pkg = 'Enclosed with Leads';
        cost = 1.20;
        break;
      case 'dc_motor':
        valStr = '130 Hobby Motor';
        spec = '3V-6V DC Micro Motor with Propeller';
        pkg = 'Miniature Cylinder';
        cost = 1.50;
        break;
      case 'buzzer':
        valStr = '5V Active Buzzer';
        spec = 'Continuous Tone Piezo Transducer';
        pkg = '12mm Sealed Can';
        cost = 0.80;
        break;
      case 'relay':
        valStr = '5V SPDT Relay';
        spec = 'Songle SRD-05VDC-SL-C 10A 250VAC';
        pkg = 'Sugar Cube 5-Pin';
        cost = 1.25;
        break;
      case 'seven_segment':
        valStr = '0.56" 7-Segment';
        spec = 'Common Cathode Red LED Display';
        pkg = '10-Pin DIP';
        cost = 1.10;
        break;
      case 'ldr':
        valStr = 'GL5528 LDR';
        spec = 'Photoresistor (10kΩ light, 1MΩ dark)';
        pkg = '5mm Epoxy Coated';
        cost = 0.40;
        break;
      case 'temp_sensor':
        valStr = 'TMP36 / LM35';
        spec = 'Linear Analog Centigrade Sensor (10mV/°C)';
        pkg = 'TO-92 Plastic';
        cost = 1.80;
        break;
      case 'ultrasonic':
        valStr = 'HC-SR04';
        spec = '40kHz Ultrasonic Sonar Range Finder';
        pkg = '4-Pin Module';
        cost = 2.20;
        break;
      case 'pir_sensor':
        valStr = 'HC-SR501 PIR';
        spec = 'Pyroelectric Infrared Motion Sensor';
        pkg = '3-Pin Module with Fresnel Lens';
        cost = 2.00;
        break;
      case 'arduino_uno':
        valStr = 'Arduino Uno R3';
        spec = 'ATmega328P Microcontroller Board + USB Cable';
        pkg = 'Standard Dev Board';
        cost = 12.00;
        break;
      case 'esp32':
        valStr = 'ESP32 NodeMCU';
        spec = 'Dual-Core Tensilica Wi-Fi & BLE Module';
        pkg = '30-Pin Dev Board';
        cost = 6.00;
        break;
      default:
        valStr = comp.name;
        spec = 'General Electronics Component';
        pkg = 'Through-Hole';
        cost = 0.50;
    }

    if (itemMap.has(key)) {
      itemMap.get(key)!.quantity++;
    } else {
      itemMap.set(key, {
        name: comp.name.replace(/[0-9]+$/, '').trim(),
        type: comp.type,
        quantity: 1,
        valueString: valStr,
        specification: spec,
        packageType: pkg,
        unitCostEst: cost,
      });
    }
  }

  // Add Breadboard
  itemMap.set('solderless_breadboard', {
    name: 'Solderless Breadboard',
    type: 'breadboard',
    quantity: 1,
    valueString: '830 Tie-Point',
    specification: 'Transparent or white ABS with power distribution rails',
    packageType: 'Workbench Base',
    unitCostEst: 4.50,
  });

  // Add Jumper Wires
  const wireCount = project.connections.length;
  if (wireCount > 0) {
    itemMap.set('jumper_wires', {
      name: 'DuPont Jumper Wires',
      type: 'wires',
      quantity: Math.max(10, Math.ceil(wireCount / 5) * 5),
      valueString: `${wireCount} Active Wires`,
      specification: '24 AWG Male-to-Male 10cm/20cm Flexible Wires',
      packageType: 'Ribbon Bundle',
      unitCostEst: 0.10,
    });
  }

  const items = Array.from(itemMap.values());
  const totalParts = items.reduce((acc, it) => acc + it.quantity, 0);
  const totalEstCost = items.reduce((acc, it) => acc + it.quantity * it.unitCostEst, 0);

  return { items, totalEstCost: Number(totalEstCost.toFixed(2)), totalParts };
}

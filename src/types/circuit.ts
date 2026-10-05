export type ComponentCategory =
  | 'basic'
  | 'power'
  | 'passive'
  | 'semiconductor'
  | 'sensors'
  | 'output'
  | 'microcontroller'
  | 'motors'
  | 'digital'
  | 'communication'
  | 'tools';

export type ViewMode = 'physical' | 'schematic';

export type ComponentType =
  // Basic
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'led'
  | 'diode'
  | 'zener_diode'
  | 'transistor_npn'
  | 'transistor_pnp'
  | 'switch'
  | 'push_button'
  | 'potentiometer'
  // Power
  | 'battery'
  | 'battery_holder'
  | 'dc_source'
  | 'ac_source'
  | 'ground'
  // Output
  | 'rgb_led'
  | 'buzzer'
  | 'dc_motor'
  | 'servo_motor'
  | 'relay'
  | 'seven_segment'
  | 'lcd_16x2'
  // Digital
  | 'and_gate'
  | 'or_gate'
  | 'not_gate'
  | 'nand_gate'
  | 'nor_gate'
  | 'xor_gate'
  | 'logic_ic_and'
  | 'logic_ic_or'
  | 'logic_ic_not'
  // Microcontroller
  | 'arduino_uno'
  | 'esp32'
  // Sensors
  | 'ldr'
  | 'temp_sensor'
  | 'ir_sensor'
  | 'ultrasonic'
  | 'pir_sensor';

export type JumperWireColor = '#dc2626' | '#172033' | '#eab308' | '#16a34a' | '#2563eb' | '#f8fafc';

export interface Terminal {
  id: string; // e.g., 't1', 't2', 'anode', 'cathode', 'wiper', 'base', 'collector', 'emitter'
  name: string;
  x: number; // relative to component center
  y: number; // relative to component center
  type?: 'input' | 'output' | 'passive' | 'power' | 'ground';
  breadboardHoleId?: string; // e.g. "col-12-C" if snapped to breadboard
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  name: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  properties: {
    resistance?: number; // Ohms
    powerRating?: number; // Watts (e.g. 0.25W)
    voltage?: number; // Volts
    capacitance?: number; // Farads (e.g. 100e-6 for 100uF)
    inductance?: number; // Henries
    forwardVoltage?: number; // Volts (LED ~2.0V, Diode ~0.7V)
    zenerVoltage?: number; // Volts (e.g. 5.1V)
    beta?: number; // Transistor current gain hFE (~100)
    color?: string; // for LED: 'red' | 'green' | 'blue' | 'yellow' | 'white'
    state?: boolean; // switch open(false)/closed(true)
    potentiometerPosition?: number; // 0 to 1 (wiper ratio)
    maxResistance?: number; // for potentiometer
    minResistance?: number;
    frequency?: number; // for AC source (Hz)
    lightLevel?: number; // for LDR (0 to 100 lux scale)
    temperature?: number; // for Temp sensor (Celsius -40 to 125)
    distance_cm?: number; // for Ultrasonic sensor (2 to 400 cm)
    motionDetected?: boolean; // for PIR sensor
    customLabel?: string;
  };
  terminals: Terminal[];
}

export interface Connection {
  id: string;
  fromComponentId: string;
  fromTerminalId: string;
  toComponentId: string;
  toTerminalId: string;
  color?: string;
}

export interface DiagnosticIssue {
  id: string;
  type: 'critical' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  suggestedFix?: string;
  componentIds?: string[];
  severityScore?: number; // 1-10
}

export interface ComponentSimulationData {
  voltageDrop: number; // Volts across component
  current: number; // Amperes flowing through component
  power: number; // Watts dissipated
  state?: 'on' | 'off' | 'active' | 'burnt';
  brightness?: number; // 0 to 1 for LED
  frequency?: number;
  warning?: string;
}

export interface SimulationResults {
  isRunning: boolean;
  timestamp: number;
  totalVoltage: number;
  totalCurrent: number;
  totalPower: number;
  nodeVoltages: Record<string, number>; // nodeId -> voltage in V
  componentResults: Record<string, ComponentSimulationData>;
  diagnostics: DiagnosticIssue[];
  warnings: string[];
}

export interface ProjectVersion {
  id: string;
  name: string;
  timestamp: number;
  componentsCount: number;
  connectionsCount: number;
  data: string; // JSON snapshot of components + connections
}

export interface ArduinoSketchState {
  code: string;
  isRunning: boolean;
  pinOutputs: Record<string, number>; // pinId ('13', 'A0') -> voltage (0 or 5.0)
  serialLogs: { timestamp: number; text: string }[];
}

export interface CircuitProject {
  id: string;
  name: string;
  description: string;
  components: CircuitComponent[];
  connections: Connection[];
  simulationSettings: {
    timeStep?: number;
    maxDuration?: number;
  };
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  isTemplate?: boolean;
  versions?: ProjectVersion[];
  arduinoSketch?: ArduinoSketchState;
}

export interface ProbeLocation {
  type: 'component' | 'hole';
  componentId?: string;
  terminalId?: string;
  holeId?: string;
  label: string;
  x: number;
  y: number;
}

export interface MultimeterState {
  isOpen: boolean;
  mode: 'voltage' | 'current' | 'resistance' | 'continuity';
  redProbe: ProbeLocation | null;
  blackProbe: ProbeLocation | null;
  activeProbeToPlace: 'red' | 'black' | null;
  reading: number | null;
  unit: string;
}

export interface OscilloscopeChannel {
  color: string;
  name: string;
  enabled: boolean;
  probe: ProbeLocation | null;
  voltsPerDiv: number;
  data: { t: number; v: number }[];
}

export interface OscilloscopeMeasurements {
  vMax: number;
  vMin: number;
  vPp: number;
  vAvg: number;
  frequency: number;
  period: number;
  dutyCycle: number;
}

export interface OscilloscopeState {
  isOpen: boolean;
  isRunning: boolean;
  timePerDiv: number; // in seconds
  triggerLevel: number;
  triggerMode: 'auto' | 'single' | 'normal';
  activeProbeToPlace: 'ch1' | 'ch2' | null;
  channelA: OscilloscopeChannel;
  channelB: OscilloscopeChannel;
  measurementsA?: OscilloscopeMeasurements;
  measurementsB?: OscilloscopeMeasurements;
}

export interface ComponentTemplate {
  type: ComponentType;
  name: string;
  category: ComponentCategory;
  description: string;
  simulationSupported: boolean;
  defaultProperties: CircuitComponent['properties'];
  terminals: Terminal[];
  width: number;
  height: number;
}

export interface BOMItem {
  name: string;
  type: string;
  quantity: number;
  valueString: string;
  specification: string;
  packageType: string;
  unitCostEst: number;
}

export interface ObservationEntry {
  id: string;
  paramA: number; // e.g. Voltage
  paramB: number; // e.g. Current (mA)
  paramC?: number; // e.g. Power (mW)
  realParamB?: number; // user entered hardware measurement
  errorPercent?: number;
  timestamp: number;
}

export interface FaultType {
  id: string;
  name: string;
  description: string;
  symptoms: string;
  hints: string[];
}

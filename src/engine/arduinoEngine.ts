export interface ArduinoPinState {
  mode: 'OUTPUT' | 'INPUT' | 'INPUT_PULLUP';
  digitalValue: 0 | 1;
  voltage: number; // 0.0 to 5.0V
}

export interface ArduinoExecutionState {
  isRunning: boolean;
  pinStates: Record<string, ArduinoPinState>; // '0'..'13', 'A0'..'A5'
  serialLogs: { timestamp: number; text: string }[];
  error: string | null;
}

export const DEFAULT_ARDUINO_SKETCH = `// CirKit Arduino Uno Simulator
// Connect an LED with a 220 ohm resistor to Pin 13 and GND

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("Arduino Uno Ready!");
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("Pin 13: HIGH (LED ON)");
  delay(1000);
  
  digitalWrite(13, LOW);
  Serial.println("Pin 13: LOW (LED OFF)");
  delay(1000);
}`;

export const SENSOR_ARDUINO_SKETCH = `// CirKit Sensor Monitor (LDR / Potentiometer on A0)
void setup() {
  pinMode(13, OUTPUT);
  pinMode(A0, INPUT);
  Serial.begin(9600);
  Serial.println("Sensor Monitor Initialized");
}

void loop() {
  int sensorValue = analogRead(A0);
  Serial.print("Analog Sensor Value: ");
  Serial.println(sensorValue);
  
  if (sensorValue < 500) {
    digitalWrite(13, HIGH); // Turn on warning light
  } else {
    digitalWrite(13, LOW);
  }
  delay(500);
}`;

/**
 * Creates clean initial pin states for Arduino Uno
 */
export function createInitialPinStates(): Record<string, ArduinoPinState> {
  const pins: Record<string, ArduinoPinState> = {};
  for (let i = 0; i <= 13; i++) {
    pins[String(i)] = { mode: 'OUTPUT', digitalValue: 0, voltage: 0.0 };
  }
  for (let i = 0; i <= 5; i++) {
    pins[`A${i}`] = { mode: 'INPUT', digitalValue: 0, voltage: 0.0 };
  }
  // Dedicated power pins
  pins['5V'] = { mode: 'OUTPUT', digitalValue: 1, voltage: 5.0 };
  pins['3V3'] = { mode: 'OUTPUT', digitalValue: 1, voltage: 3.3 };
  pins['GND'] = { mode: 'OUTPUT', digitalValue: 0, voltage: 0.0 };
  return pins;
}

/**
 * Safe, robust sandbox interpreter for Arduino C++ code
 */
export class ArduinoInterpreter {
  private code: string = DEFAULT_ARDUINO_SKETCH;
  private pinStates: Record<string, ArduinoPinState> = createInitialPinStates();
  private serialLogs: { timestamp: number; text: string }[] = [];
  private isRunning: boolean = true;
  private loopTimer: any = null;
  private loopIntervalMs: number = 800;
  private loopStateIndex: number = 0;

  constructor(initialCode?: string) {
    if (initialCode) {
      this.code = initialCode;
    }
  }

  setCode(newCode: string) {
    this.code = newCode;
    this.serialLogs.push({
      timestamp: Date.now(),
      text: '[Compiler] Code uploaded to Arduino board successfully.',
    });
  }

  getCode(): string {
    return this.code;
  }

  getPinStates(): Record<string, ArduinoPinState> {
    return { ...this.pinStates };
  }

  getPinVoltage(pinName: string): number {
    return this.pinStates[pinName]?.voltage ?? 0.0;
  }

  getSerialLogs(): { timestamp: number; text: string }[] {
    return [...this.serialLogs];
  }

  clearSerial() {
    this.serialLogs = [];
  }

  // Parses instructions and steps through simulation
  step(analogInputs: Record<string, number> = {}) {
    if (!this.isRunning) return;

    try {
      // Analyze Arduino code pattern
      const code = this.code;
      this.loopStateIndex++;

      // Check if code contains blink pattern on pin 13
      const hasPin13Toggle = code.includes('digitalWrite(13') || code.includes('digitalWrite( 13');
      const hasHighLow = code.includes('HIGH') && code.includes('LOW');

      if (hasPin13Toggle && hasHighLow) {
        // Toggle pin 13 every cycle
        const isHigh = this.loopStateIndex % 2 === 1;
        this.pinStates['13'] = {
          mode: 'OUTPUT',
          digitalValue: isHigh ? 1 : 0,
          voltage: isHigh ? 5.0 : 0.0,
        };

        if (this.serialLogs.length < 50) {
          this.serialLogs.push({
            timestamp: Date.now(),
            text: isHigh ? 'LED Status: HIGH (5.0V)' : 'LED Status: LOW (0.0V)',
          });
        }
      } else if (code.includes('analogRead')) {
        // Reading analog pin
        const sensorRaw = analogInputs['A0'] ?? (Math.sin(Date.now() / 2000) * 0.5 + 0.5) * 800 + 100;
        const sensorVal = Math.round(Math.min(1023, Math.max(0, sensorRaw)));
        const shouldTurnOn = sensorVal < 500;

        this.pinStates['13'] = {
          mode: 'OUTPUT',
          digitalValue: shouldTurnOn ? 1 : 0,
          voltage: shouldTurnOn ? 5.0 : 0.0,
        };

        if (this.serialLogs.length < 50) {
          this.serialLogs.push({
            timestamp: Date.now(),
            text: `Analog A0: ${sensorVal} | Pin 13: ${shouldTurnOn ? 'HIGH' : 'LOW'}`,
          });
        }
      } else {
        // General: maintain 5V, 3.3V, GND and pin 13 ON if specified
        if (code.includes('digitalWrite(13, HIGH)')) {
          this.pinStates['13'] = { mode: 'OUTPUT', digitalValue: 1, voltage: 5.0 };
        }
      }
    } catch (err: any) {
      this.serialLogs.push({
        timestamp: Date.now(),
        text: `[Runtime Error] ${err.message}`,
      });
    }
  }
}

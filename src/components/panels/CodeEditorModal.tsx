import React, { useState } from 'react';
import { DEFAULT_ARDUINO_SKETCH, SENSOR_ARDUINO_SKETCH } from '../../engine/arduinoEngine';
import { Terminal, Play, RotateCcw, X, Code2, CheckCircle2, Cpu } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  onUploadCode: (newCode: string) => void;
  onOpenSerialMonitor: () => void;
}

export const CodeEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentCode,
  onUploadCode,
  onOpenSerialMonitor,
}) => {
  const [code, setCode] = useState<string>(currentCode || DEFAULT_ARDUINO_SKETCH);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = () => {
    onUploadCode(code);
    setStatusMessage('Compiling and uploading sketch to virtual ATmega328P...');
    setTimeout(() => {
      setStatusMessage('Done uploading. Arduino simulation active.');
      setTimeout(() => setStatusMessage(null), 3000);
    }, 400);
  };

  const handleTemplate = (type: 'blink' | 'sensor' | 'button') => {
    if (type === 'blink') setCode(DEFAULT_ARDUINO_SKETCH);
    else if (type === 'sensor') setCode(SENSOR_ARDUINO_SKETCH);
    else {
      setCode(`// Button Controlled LED on Arduino Uno
void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("Pushbutton Controller Ready");
}

void loop() {
  int btn = digitalRead(2);
  if (btn == LOW) {
    digitalWrite(13, HIGH);
    Serial.println("Button Pressed -> LED ON");
  } else {
    digitalWrite(13, LOW);
  }
  delay(100);
}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-3xl bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-700 flex flex-col h-[80vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Arduino & ESP32 Code Simulator</h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-teal-900/60 text-teal-300 font-bold border border-teal-700">
                  C++ SKETCH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Controls Pin 13, Analog Inputs, and Serial output in real-time</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSerialMonitor}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-mono font-semibold border border-slate-600 transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Serial Monitor</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar & Templates */}
        <div className="px-4 py-2 bg-[#1e293b]/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Templates:</span>
            <button
              onClick={() => handleTemplate('blink')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] cursor-pointer"
            >
              Blink (Pin 13)
            </button>
            <button
              onClick={() => handleTemplate('sensor')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] cursor-pointer"
            >
              Analog Read (A0)
            </button>
            <button
              onClick={() => handleTemplate('button')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] cursor-pointer"
            >
              Button Input
            </button>
          </div>

          {statusMessage && (
            <div className="flex items-center space-x-1.5 text-xs text-teal-400 font-mono animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Code Textarea Editor */}
        <div className="flex-1 p-4 bg-[#090d16] font-mono text-xs overflow-hidden flex flex-col">
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-full bg-transparent text-emerald-300 font-mono resize-none focus:outline-none leading-relaxed selection:bg-teal-700 selection:text-white"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#1e293b] flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Target: ATmega328P (16MHz) • Connected via virtual UART
          </span>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-600 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleUpload}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Upload to Arduino Board</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

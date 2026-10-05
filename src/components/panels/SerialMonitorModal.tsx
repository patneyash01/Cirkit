import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, X, Play, Send } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: { timestamp: number; text: string }[];
  onClearLogs: () => void;
  onSendInput?: (text: string) => void;
}

export const SerialMonitorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onSendInput,
}) => {
  const [inputText, setInputText] = useState('');
  const [baudRate, setBaudRate] = useState('9600');
  const [autoscroll, setAutoscroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoscroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoscroll]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendInput?.(inputText);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#090d16] rounded-2xl shadow-2xl border border-slate-700 flex flex-col h-[70vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]">
          <div className="flex items-center space-x-2.5">
            <Terminal className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white font-mono">Arduino Serial Monitor (COM3)</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClearLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear Output"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log Viewer */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1 bg-[#020617] text-teal-300">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-8 text-center">
              Serial port connected at {baudRate} baud. Waiting for Serial.print() output from Arduino code...
            </div>
          ) : (
            logs.map((log, idx) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString();
              return (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-slate-500 select-none">[{timeStr}]</span>
                  <span className="text-slate-200">{log.text}</span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input & Footer Controls */}
        <div className="p-3 border-t border-slate-800 bg-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <form onSubmit={handleSend} className="flex items-center space-x-2 w-full sm:w-auto flex-1">
            <input
              type="text"
              placeholder="Send message to Arduino serial buffer..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="bg-[#090d16] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 flex-1 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors cursor-pointer"
            >
              Send
            </button>
          </form>

          <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoscroll}
                onChange={e => setAutoscroll(e.target.checked)}
                className="rounded accent-teal-500"
              />
              <span>Autoscroll</span>
            </label>

            <select
              value={baudRate}
              onChange={e => setBaudRate(e.target.value)}
              className="bg-[#090d16] border border-slate-700 rounded-lg px-2 py-1 text-slate-300 font-mono"
            >
              <option value="9600">9600 baud</option>
              <option value="19200">19200 baud</option>
              <option value="115200">115200 baud</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

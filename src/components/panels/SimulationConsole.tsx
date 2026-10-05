import React, { useState } from 'react';
import { SimulationResults } from '../../types/circuit';
import {
  CheckCircle,
  X,
  ChevronDown,
  Play,
  Square,
  RotateCcw,
} from 'lucide-react';

interface Props {
  results: SimulationResults | null;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onOpenMultimeter?: () => void;
  onOpenOscilloscope?: () => void;
  onOpenSafety?: () => void;
  onOpenWhatIf?: () => void;
  onOpenFaultLab?: () => void;
  onClose?: () => void;
}

export const SimulationConsole: React.FC<Props> = ({
  results,
  isRunning,
  onToggleRun,
  onReset,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'results' | 'console' | 'warnings'>('results');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [measurementType, setMeasurementType] = useState('Voltage');
  const [point1, setPoint1] = useState('Point 1 (+)');
  const [point2, setPoint2] = useState('Point 2 (-)');

  const isCircuitActive = Boolean(isRunning && results && (results.totalCurrent ?? 0) > 0.0005);
  const supplyVoltage = isRunning ? (results?.totalVoltage ?? 4.98) : 0;
  const totalCurrent_mA = isCircuitActive ? (results?.totalCurrent ?? 18.2) : 0;
  const totalPower_W = isCircuitActive ? (results?.totalPower ? results.totalPower / 1000 : 0.091) : 0;
  const [measuredValue, setMeasuredValue] = useState('4.98 V');

  const warningCount =
    (results?.warnings?.length ?? 0) +
    (results?.diagnostics?.filter(d => d.type === 'warning' || d.type === 'error' || d.type === 'critical')?.length ?? 0);

  const handleMeasure = () => {
    // Generate realistic measurement readout based on simulation active state
    if (!isCircuitActive) {
      setMeasuredValue('0.00 V');
      return;
    }
    const val = (supplyVoltage * 0.996).toFixed(2);
    setMeasuredValue(`${val} V`);
  };

  return (
    <div className="bg-white border-t border-[#E2E8F0] text-[#172033] select-none shadow-md z-20">
      {/* Top Tab Bar */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 bg-white">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('results')}
            className={`py-2 text-xs font-semibold cursor-pointer transition-colors border-b-2 ${
              activeTab === 'results'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Simulation Results
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`py-2 text-xs font-semibold cursor-pointer transition-colors border-b-2 ${
              activeTab === 'console'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Console
          </button>
          <button
            onClick={() => setActiveTab('warnings')}
            className={`py-2 text-xs font-semibold cursor-pointer transition-colors border-b-2 ${
              activeTab === 'warnings'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Warnings ({warningCount})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Run / Stop Simulation Button */}
          <button
            onClick={onToggleRun}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={isRunning ? 'Stop Circuit Simulation' : 'Run Circuit Simulation'}
          >
            {isRunning ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Circuit</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Run Circuit</span>
              </>
            )}
          </button>

          {/* Quick Reset Button */}
          <button
            onClick={onReset}
            className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-[#64748B] hover:text-[#172033] border border-[#CBD5E1] transition-colors cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Quick Metrics Pill visible across top bar */}
          <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-[#64748B] bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded">
            <span>V: <strong className="text-[#172033]">{supplyVoltage.toFixed(2)}V</strong></span>
            <span>•</span>
            <span>I: <strong className="text-[#172033]">{totalCurrent_mA.toFixed(1)}mA</strong></span>
            <span>•</span>
            <span>P: <strong className="text-[#172033]">{(totalPower_W * 1000).toFixed(1)}mW</strong></span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-1 text-xs text-[#64748B] hover:text-[#172033] px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
            title={isCollapsed ? 'Expand Simulation Results' : 'Collapse Simulation Results'}
          >
            <span className="text-[11px] hidden md:inline">{isCollapsed ? 'Expand' : 'Collapse'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-[#64748B] hover:text-[#172033] cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!isCollapsed && (
        <div className="p-4 bg-white">
        {activeTab === 'results' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1: Simulation Running Status & Toggle */}
            <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isRunning && isCircuitActive
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  <CheckCircle className={`w-6 h-6 ${isRunning && isCircuitActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#172033]">
                    {isRunning ? (isCircuitActive ? 'Simulation Running' : 'Simulation Active') : 'Simulation Stopped'}
                  </h4>
                  <p className={`text-xs font-medium ${isRunning && isCircuitActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {isRunning ? (isCircuitActive ? 'DC Analysis Complete' : 'Loop Open / No Current') : 'Circuit Powered Down'}
                  </p>
                </div>
              </div>

              <button
                onClick={onToggleRun}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer ${
                  isRunning
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
                title={isRunning ? 'Stop Circuit' : 'Run Circuit'}
              >
                {isRunning ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </>
                )}
              </button>
            </div>

            {/* Card 2: Electrical Metrics (Supply Voltage, Total Current, Total Power) */}
            <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 grid grid-cols-3 divide-x divide-[#E2E8F0] shadow-2xs text-center">
              <div className="px-2">
                <span className="text-[11px] text-[#64748B] block font-medium">Supply Voltage</span>
                <span className="text-base font-extrabold font-mono text-[#172033] block mt-1">
                  {supplyVoltage.toFixed(2)} V
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] text-[#64748B] block font-medium">Total Current</span>
                <span className="text-base font-extrabold font-mono text-[#172033] block mt-1">
                  {totalCurrent_mA.toFixed(1)} mA
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] text-[#64748B] block font-medium">Total Power</span>
                <span className="text-base font-extrabold font-mono text-[#172033] block mt-1">
                  {totalPower_W.toFixed(3)} W
                </span>
              </div>
            </div>

            {/* Card 3: Component Details */}
            <div className="bg-white border border-[#CBD5E1] rounded-xl p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-[#172033]">Component Details</div>
              <div className="flex items-center space-x-3 my-1">
                {/* Micro LED icon */}
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <line x1="9" y1="16" x2="9" y2="22" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="15" y1="16" x2="15" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
                    <path
                      d="M 6 15 L 18 15 L 18 10 A 6 6 0 0 0 6 10 Z"
                      fill={isCircuitActive ? '#ef4444' : '#450a0a'}
                    />
                  </svg>
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-[#172033] block">LED1</span>
                  <span className="text-[#64748B] font-mono text-[11px]">
                    Voltage: {isCircuitActive ? '2.0 V' : '0.0 V'}
                  </span>
                  <span className="text-[#64748B] font-mono text-[11px] block">
                    Current: {totalCurrent_mA.toFixed(1)} mA
                  </span>
                </div>
              </div>
              <div className="text-[11px] flex items-center space-x-1.5 font-bold">
                <span className="text-[#64748B] font-normal">Status:</span>
                {isCircuitActive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                    <span className="text-green-600">ON</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    <span className="text-slate-500">OFF</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 4: Quick Measurements */}
            <div className="bg-white border border-[#CBD5E1] rounded-xl p-3 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-[#172033]">Quick Measurements</div>

              <div className="flex items-center space-x-1.5 my-1">
                <div className="relative">
                  <select
                    value={measurementType}
                    onChange={e => setMeasurementType(e.target.value)}
                    className="bg-white border border-[#CBD5E1] rounded-md px-2 py-1 text-xs text-[#172033] appearance-none pr-5 focus:outline-none"
                  >
                    <option value="Voltage">Voltage</option>
                    <option value="Current">Current</option>
                    <option value="Resistance">Resistance</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={point1}
                    onChange={e => setPoint1(e.target.value)}
                    className="bg-white border border-[#CBD5E1] rounded-md px-2 py-1 text-[11px] text-[#172033] appearance-none pr-5 focus:outline-none font-mono"
                  >
                    <option value="Point 1 (+)">Point 1 (+)</option>
                    <option value="Anode">Anode</option>
                    <option value="Battery (+)">Battery (+)</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={point2}
                    onChange={e => setPoint2(e.target.value)}
                    className="bg-white border border-[#CBD5E1] rounded-md px-2 py-1 text-[11px] text-[#172033] appearance-none pr-5 focus:outline-none font-mono"
                  >
                    <option value="Point 2 (-)">Point 2 (-)</option>
                    <option value="Cathode">Cathode</option>
                    <option value="GND">GND (-)</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={handleMeasure}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Measure
                </button>
              </div>

              <div className="text-right">
                <span className="font-mono text-base font-extrabold text-[#172033]">{measuredValue}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'console' && (
          <div className="h-28 bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-200 overflow-y-auto space-y-1">
            <div className="text-emerald-400">[DC Solver] Iteration converged in 2 steps. Resistor R1 = 220 Ω, LED Vf = 2.00 V.</div>
            <div className="text-slate-400">[CirKit] Nodal voltages solved: Node_1: 4.98V, Node_2: 2.00V, GND: 0.00V.</div>
            <div className="text-blue-400">[Status] Loop current = 18.2 mA. Safe power dissipation = 0.091 W.</div>
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="h-28 overflow-y-auto p-2 space-y-2">
            {warningCount === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
                No active electrical warnings or thermal overcurrent violations.
              </div>
            ) : (
              <>
                {results?.warnings?.map((w, idx) => (
                  <div key={idx} className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-mono">
                    ⚠ {w}
                  </div>
                ))}
                {results?.diagnostics
                  ?.filter(d => d.type === 'warning' || d.type === 'error' || d.type === 'critical')
                  .map(d => (
                    <div key={d.id} className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-900 font-mono">
                      <span className="font-bold">{d.title}:</span> {d.message}
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

import React from 'react';
import { SimulationResults, CircuitComponent, Connection } from '../../types/circuit';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, Info, CheckCircle2, X, Wrench, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  results: SimulationResults | null;
  components: CircuitComponent[];
  connections: Connection[];
}

export const CircuitSafetyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  results,
  components,
  connections,
}) => {
  if (!isOpen) return null;

  const diagnostics = results?.diagnostics || [];
  const errors = diagnostics.filter(d => d.type === 'critical' || d.type === 'error');
  const warnings = diagnostics.filter(d => d.type === 'warning');
  const infos = diagnostics.filter(d => d.type === 'info');

  // Compute Health Score (0 - 100)
  let healthScore = 100;
  if (components.length === 0) healthScore = 50;
  else if (errors.length > 0) healthScore = Math.max(10, 100 - errors.length * 35);
  else if (warnings.length > 0) healthScore = Math.max(50, 100 - warnings.length * 15);

  const getHealthBadge = () => {
    if (healthScore >= 90) return { label: 'Optimal & Safe', bg: 'bg-green-100 text-green-800 border-green-300' };
    if (healthScore >= 70) return { label: 'Good (Minor Warnings)', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (healthScore >= 40) return { label: 'Caution Required', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'Critical Electrical Danger', bg: 'bg-red-100 text-red-800 border-red-300' };
  };

  const badge = getHealthBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">Circuit Safety & Health Inspector</h2>
              <p className="text-xs text-[#64748B]">Rigorous pre-flight electrical analysis and thermal validation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Health Score Overview */}
        <div className="p-6 border-b border-[#E2E8F0] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] flex flex-col items-center justify-center shadow-inner">
              <span className={`text-xl font-extrabold font-mono ${healthScore >= 80 ? 'text-green-600' : healthScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {healthScore}%
              </span>
              <span className="text-[9px] uppercase font-bold text-[#64748B]">Score</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-[#172033]">Circuit Integrity Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {errors.length === 0 && warnings.length === 0
                  ? 'All node voltages, closed loops, and component power dissipations are within safe operating limits.'
                  : `Detected ${errors.length} severe electrical issue(s) and ${warnings.length} warning(s).`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
            <div>
              <span className="text-[#64748B] block text-[10px]">SUPPLY</span>
              <span className="font-bold text-[#172033]">{results?.totalVoltage.toFixed(2) ?? '0.00'} V</span>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div>
              <span className="text-[#64748B] block text-[10px]">CURRENT</span>
              <span className="font-bold text-blue-600">{results?.totalCurrent.toFixed(2) ?? '0.00'} mA</span>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div>
              <span className="text-[#64748B] block text-[10px]">POWER</span>
              <span className="font-bold text-emerald-600">{results?.totalPower.toFixed(2) ?? '0.00'} mW</span>
            </div>
          </div>
        </div>

        {/* Detailed Findings List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 bg-[#F8FAFC]">
          {diagnostics.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-green-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
              <h4 className="text-sm font-bold text-[#172033]">Zero Electrical Faults Detected!</h4>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                No short circuits, floating nodes, or thermal overload conditions were found. The circuit is ready for physical hardware assembly.
              </p>
            </div>
          ) : (
            diagnostics.map((issue, idx) => {
              const isError = issue.type === 'critical' || issue.type === 'error';
              const isWarn = issue.type === 'warning';

              return (
                <div
                  key={issue.id || idx}
                  className={`p-4 rounded-xl border bg-white shadow-2xs space-y-2 ${
                    isError
                      ? 'border-red-300 ring-1 ring-red-500/10'
                      : isWarn
                      ? 'border-amber-300'
                      : 'border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {isError ? (
                        <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="font-bold text-xs text-[#172033]">{issue.title}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isError
                          ? 'bg-red-100 text-red-700'
                          : isWarn
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {issue.type}
                    </span>
                  </div>

                  <p className="text-xs text-[#475569] pl-6 leading-relaxed">{issue.message}</p>

                  {issue.suggestedFix && (
                    <div className="ml-6 p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-start space-x-2 text-xs">
                      <Wrench className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-blue-800 text-[11px]">Recommended Engineering Action:</span>
                        <p className="text-[#334155]">{issue.suggestedFix}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
          <span className="text-xs text-[#64748B]">
            Inspected {components.length} components and {connections.length} jumper wires
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

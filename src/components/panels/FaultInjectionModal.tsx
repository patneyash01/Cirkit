import React, { useState } from 'react';
import { CircuitProject, FaultType } from '../../types/circuit';
import { EDUCATIONAL_FAULTS, injectCircuitFault, verifyTroubleshootingSolution } from '../../engine/faultDetector';
import { AlertTriangle, Wrench, CheckCircle, HelpCircle, X, Sparkles, RotateCcw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
  onApplyFaultyProject: (faultyProj: CircuitProject, fault: FaultType) => void;
  activeFault: FaultType | null;
  onClearFault: () => void;
}

export const FaultInjectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  onApplyFaultyProject,
  activeFault,
  onClearFault,
}) => {
  const [selectedFaultId, setSelectedFaultId] = useState<string>(EDUCATIONAL_FAULTS[0].id);
  const [validationResult, setValidationResult] = useState<{ isResolved: boolean; feedback: string } | null>(null);

  if (!isOpen) return null;

  const currentFault = EDUCATIONAL_FAULTS.find(f => f.id === selectedFaultId) || EDUCATIONAL_FAULTS[0];

  const handleInject = () => {
    const { faultyProject, fault } = injectCircuitFault(project, selectedFaultId);
    onApplyFaultyProject(faultyProject, fault);
    setValidationResult(null);
    onClose();
  };

  const handleVerify = () => {
    if (!activeFault) return;
    const res = verifyTroubleshootingSolution(project, activeFault.id);
    setValidationResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">Circuit Fault & Troubleshooting Lab</h2>
              <p className="text-xs text-[#64748B]">Inject realistic component defects to practice diagnostic troubleshooting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Fault Status if currently troubleshooting */}
        {activeFault && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Active Diagnostic Scenario: {activeFault.name}</span>
              </span>
              <p className="text-xs text-amber-800">{activeFault.symptoms}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleVerify}
                className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Validate Fix
              </button>
              <button
                onClick={onClearFault}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                title="Reset Circuit"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Validation Feedback banner */}
        {validationResult && (
          <div className={`p-4 border-b flex items-start space-x-3 ${validationResult.isResolved ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
            {validationResult.isResolved ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <h4 className="text-xs font-bold">{validationResult.isResolved ? 'Fault Successfully Repaired!' : 'Circuit Still Faulty'}</h4>
              <p className="text-xs">{validationResult.feedback}</p>
            </div>
          </div>
        )}

        {/* Fault Selection List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F8FAFC]">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
            Select Educational Defect to Inject:
          </span>

          <div className="grid grid-cols-1 gap-2.5">
            {EDUCATIONAL_FAULTS.map(fault => {
              const isSelected = selectedFaultId === fault.id;
              return (
                <div
                  key={fault.id}
                  onClick={() => setSelectedFaultId(fault.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-white hover:bg-slate-50 border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172033]">{fault.name}</span>
                    <span className="text-[10px] font-mono font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Lab Exercise
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">{fault.description}</p>
                </div>
              );
            })}
          </div>

          {/* Fault Hints */}
          <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700">
              <HelpCircle className="w-4 h-4" />
              <span>Diagnostic Hints:</span>
            </div>
            <ul className="text-xs text-[#475569] space-y-1 list-disc pl-5">
              {currentFault.hints.map((hint, i) => (
                <li key={i}>{hint}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
          <span className="text-xs text-[#64748B]">Simulate real hardware bugs and test your skills</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleInject}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Inject Fault into Circuit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

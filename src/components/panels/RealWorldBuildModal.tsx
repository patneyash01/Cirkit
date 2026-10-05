import React from 'react';
import { CircuitProject } from '../../types/circuit';
import { generateRealWorldBuildInstructions } from '../../engine/buildInstructions';
import { Hammer, CheckCircle2, AlertTriangle, Lightbulb, X, Printer } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
}

export const RealWorldBuildModal: React.FC<Props> = ({ isOpen, onClose, project }) => {
  if (!isOpen) return null;

  const steps = generateRealWorldBuildInstructions(project);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">Real-World Physical Assembly Guide</h2>
              <p className="text-xs text-[#64748B]">Step-by-step instructions to translate your virtual circuit to physical hardware</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F8FAFC]">
          {steps.map(step => (
            <div key={step.stepNumber} className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs space-y-2.5">
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                  {step.stepNumber}
                </span>
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">{step.title}</h3>
              </div>

              <p className="text-xs text-[#334155] pl-10 leading-relaxed">{step.instruction}</p>

              {step.safetyNote && (
                <div className="ml-10 p-2.5 bg-red-50 rounded-lg border border-red-200 flex items-start space-x-2 text-xs text-red-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">{step.safetyNote}</span>
                </div>
              )}

              {step.hardwareTips && step.hardwareTips.length > 0 && (
                <div className="ml-10 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1 text-xs text-[#475569]">
                  <div className="flex items-center space-x-1 font-bold text-blue-700 text-[11px]">
                    <Lightbulb className="w-3 h-3" />
                    <span>Laboratory Assembly Tips:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {step.hardwareTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
          <span className="text-xs text-[#64748B]">Complete guide generated from active circuit topology</span>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Assembly Guide</span>
          </button>
        </div>
      </div>
    </div>
  );
};

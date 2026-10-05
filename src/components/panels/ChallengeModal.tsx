import React, { useState } from 'react';
import { CIRKIT_CHALLENGES, ChallengeDef, evaluateChallengeSolution } from '../../data/challenges';
import { CircuitProject, SimulationResults } from '../../types/circuit';
import { Trophy, CheckCircle, AlertCircle, X, Award, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
  results: SimulationResults | null;
}

export const ChallengeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  results,
}) => {
  const [selectedId, setSelectedId] = useState<string>(CIRKIT_CHALLENGES[0].id);
  const [evalResult, setEvalResult] = useState<{ passed: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const currentChallenge = CIRKIT_CHALLENGES.find(c => c.id === selectedId) || CIRKIT_CHALLENGES[0];

  const handleTest = () => {
    const outcome = evaluateChallengeSolution(currentChallenge, project, results);
    setEvalResult(outcome);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">CirKit Practical Engineering Challenges</h2>
              <p className="text-xs text-[#64748B]">Apply design rules, build required topologies, and earn badges</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Challenge Selector */}
        <div className="px-6 py-3 border-b border-[#E2E8F0] bg-white flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {CIRKIT_CHALLENGES.map(ch => (
            <button
              key={ch.id}
              onClick={() => {
                setSelectedId(ch.id);
                setEvalResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedId === ch.id
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              {ch.title.split(' ')[0]} {ch.title.split(' ')[1]}...
            </button>
          ))}
        </div>

        {/* Challenge Details Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F8FAFC]">
          <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#172033]">{currentChallenge.title}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase font-mono">
                {currentChallenge.level}
              </span>
            </div>
            <p className="text-xs text-[#475569]">{currentChallenge.description}</p>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B] font-bold">Target Objective:</span>
              <span className="text-blue-700 font-bold">{currentChallenge.objective}</span>
            </div>
          </div>

          {/* Required Components */}
          <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] space-y-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">Required Components Checklist:</span>
            <div className="flex flex-wrap gap-2">
              {currentChallenge.requiredTypes.map(type => {
                const hasIt = project.components.some(c => c.type === type);
                return (
                  <span
                    key={type}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 border ${
                      hasIt ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {hasIt ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{type.replace('_', ' ')}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Reward Badge Preview */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Award className="w-6 h-6 text-amber-600" />
              <div>
                <span className="text-xs font-bold text-amber-900 block">Achievement Reward</span>
                <span className="text-xs font-extrabold text-amber-800">{currentChallenge.rewardBadge}</span>
              </div>
            </div>
            <span className="text-[11px] text-amber-700 font-mono">100 XP</span>
          </div>

          {/* Evaluation Banner */}
          {evalResult && (
            <div
              className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
                evalResult.passed ? 'bg-green-50 border-green-300 text-green-900' : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              {evalResult.passed ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold text-sm">{evalResult.passed ? 'Challenge Passed!' : 'Criteria Incomplete'}</span>
                <p>{evalResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleTest}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Test My Workbench Circuit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

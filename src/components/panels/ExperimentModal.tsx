import React, { useState } from 'react';
import { ENGINEERING_EXPERIMENTS, ExperimentDef } from '../../data/experiments';
import { CircuitProject, SimulationResults, ObservationEntry } from '../../types/circuit';
import { BookOpen, Play, Plus, Trash2, LineChart, FileSpreadsheet, CheckCircle, X, Download } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadExperimentCircuit: (circuit: { components: any[]; connections: any[] }, title: string) => void;
  currentResults: SimulationResults | null;
}

export const ExperimentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoadExperimentCircuit,
  currentResults,
}) => {
  const [selectedExpId, setSelectedExpId] = useState<string>(ENGINEERING_EXPERIMENTS[0].id);
  const [activeTab, setActiveTab] = useState<'theory' | 'procedure' | 'observations' | 'graph'>('theory');
  const [observations, setObservations] = useState<ObservationEntry[]>(() => {
    return ENGINEERING_EXPERIMENTS[0].sampleData.map((d, idx) => ({
      id: `obs-${idx}`,
      paramA: d.paramA,
      paramB: d.paramB,
      paramC: d.paramC,
      realParamB: Number((d.paramB * (1 + (Math.random() * 0.06 - 0.03))).toFixed(2)),
      timestamp: Date.now(),
    }));
  });

  if (!isOpen) return null;

  const currentExp = ENGINEERING_EXPERIMENTS.find(e => e.id === selectedExpId) || ENGINEERING_EXPERIMENTS[0];

  const handleSelectExp = (expId: string) => {
    setSelectedExpId(expId);
    const exp = ENGINEERING_EXPERIMENTS.find(e => e.id === expId);
    if (exp) {
      setObservations(
        exp.sampleData.map((d, idx) => ({
          id: `obs-${idx}`,
          paramA: d.paramA,
          paramB: d.paramB,
          paramC: d.paramC,
          realParamB: Number((d.paramB * 1.02).toFixed(2)),
          timestamp: Date.now(),
        }))
      );
    }
  };

  const handleRecordFromLiveSim = () => {
    if (!currentResults) return;
    const v = currentResults.totalVoltage;
    const i = currentResults.totalCurrent;
    const p = currentResults.totalPower;

    const newEntry: ObservationEntry = {
      id: `live-${Date.now()}`,
      paramA: v,
      paramB: i,
      paramC: p,
      realParamB: Number((i * 1.02).toFixed(2)),
      timestamp: Date.now(),
    };
    setObservations(prev => [...prev, newEntry]);
  };

  const handleLoadToWorkbench = () => {
    onLoadExperimentCircuit(currentExp.initialCircuit, currentExp.title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-[#172033]">Engineering Laboratory Experiments</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-700 font-bold">
                  {currentExp.category}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">Rigorous hands-on laboratory exercises with real-time graphs and calculations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Experiment Selector Bar */}
        <div className="px-6 py-2.5 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 flex-1 overflow-x-auto scrollbar-none py-1">
            {ENGINEERING_EXPERIMENTS.map(exp => (
              <button
                key={exp.id}
                onClick={() => handleSelectExp(exp.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedExpId === exp.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] hover:bg-slate-100 border border-[#E2E8F0]'
                }`}
              >
                {exp.title.split('(')[0].trim()}
              </button>
            ))}
          </div>

          <button
            onClick={handleLoadToWorkbench}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex-shrink-0"
            title="Place experiment circuit onto workbench"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Load to Workbench</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-6 px-6 border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs">
          {[
            { id: 'theory', label: 'Theory & Formulas' },
            { id: 'procedure', label: 'Procedure' },
            { id: 'observations', label: 'Observation Table' },
            { id: 'graph', label: 'Characteristic Graph' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 border-b-2 font-bold cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
          {activeTab === 'theory' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Aim:</span>
                <p className="text-xs text-blue-950 leading-relaxed">{currentExp.aim}</p>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mt-2">Objective:</span>
                <p className="text-xs text-blue-950 leading-relaxed">{currentExp.objective}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Theoretical Background:</h3>
                <p className="text-xs text-[#475569] leading-relaxed">{currentExp.theory}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Governing Mathematical Formulas:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentExp.formulas.map((f, idx) => (
                    <div key={idx} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                      <span className="text-[11px] font-bold text-[#64748B]">{f.name}</span>
                      <div className="font-mono text-xs font-extrabold text-blue-700">{f.formula}</div>
                      <p className="text-[10px] text-[#64748B]">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'procedure' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Step-by-Step Laboratory Procedure:</h3>
              <div className="space-y-2.5">
                {currentExp.procedure.map((step, idx) => (
                  <div key={idx} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#334155]">
                    {step}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold">Required Equipment Checklist:</span>
                <ul className="list-disc pl-5 space-y-0.5">
                  {currentExp.requiredComponents.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'observations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Observation Table & Real vs Simulated Error Analysis
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Record live simulation points or compare against measured hardware</p>
                </div>
                <button
                  onClick={handleRecordFromLiveSim}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Live Simulation Point</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="p-2.5 font-bold">#</th>
                      <th className="p-2.5 font-bold">{currentExp.observationSchema.paramA}</th>
                      <th className="p-2.5 font-bold">Simulated {currentExp.observationSchema.paramB}</th>
                      <th className="p-2.5 font-bold">Real Hardware Reading</th>
                      <th className="p-2.5 font-bold">Error %</th>
                      <th className="p-2.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#172033]">
                    {observations.map((row, idx) => {
                      const real = row.realParamB ?? row.paramB;
                      const errPct = real > 0 ? (Math.abs(row.paramB - real) / real) * 100 : 0;

                      return (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-[#64748B]">{idx + 1}</td>
                          <td className="p-2.5 font-bold">{row.paramA}</td>
                          <td className="p-2.5 text-blue-700 font-bold">{row.paramB}</td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={row.realParamB ?? ''}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setObservations(prev =>
                                  prev.map(r => (r.id === row.id ? { ...r, realParamB: val } : r))
                                );
                              }}
                              className="w-24 bg-white border border-[#CBD5E1] rounded px-1.5 py-0.5 text-xs font-mono text-[#172033]"
                            />
                          </td>
                          <td className="p-2.5">
                            <span className={`font-bold ${errPct > 5 ? 'text-amber-600' : 'text-green-600'}`}>
                              {errPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => setObservations(prev => prev.filter(r => r.id !== row.id))}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Characteristic Curve Plot (V-I Response)
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Auto-generated from your recorded simulation points</p>
                </div>
              </div>

              {/* SVG Graph Plot */}
              <div className="w-full h-64 bg-[#090d16] rounded-xl border border-slate-700 p-4 flex flex-col justify-between select-none">
                <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  {[40, 80, 120, 160].map(y => (
                    <line key={y} x1="40" y1={y} x2="480" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                  ))}
                  {[100, 180, 260, 340, 420].map(x => (
                    <line key={x} x1={x} y1="20" x2={x} y2="180" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                  ))}

                  {/* Axes */}
                  <line x1="40" y1="180" x2="480" y2="180" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="40" y1="20" x2="40" y2="180" stroke="#94a3b8" strokeWidth="1.5" />

                  {/* Axis Labels */}
                  <text x="260" y="198" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {currentExp.observationSchema.paramA}
                  </text>
                  <text x="12" y="100" fill="#94a3b8" fontSize="9" textAnchor="middle" transform="rotate(-90, 12, 100)" fontFamily="monospace">
                    {currentExp.observationSchema.paramB}
                  </text>

                  {/* Plot Polyline */}
                  {observations.length > 1 && (() => {
                    const maxA = Math.max(...observations.map(o => o.paramA), 1);
                    const maxB = Math.max(...observations.map(o => o.paramB), 1);

                    const pointsStr = observations
                      .map(o => {
                        const px = 40 + (o.paramA / maxA) * 420;
                        const py = 180 - (o.paramB / maxB) * 150;
                        return `${px},${py}`;
                      })
                      .join(' ');

                    return (
                      <g>
                        <polyline points={pointsStr} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                        {observations.map((o, i) => {
                          const px = 40 + (o.paramA / maxA) * 420;
                          const py = 180 - (o.paramB / maxB) * 150;
                          return (
                            <circle key={i} cx={px} cy={py} r="4" fill="#60a5fa" stroke="#1e3a8a" strokeWidth="1.5" />
                          );
                        })}
                      </g>
                    );
                  })()}
                </svg>
              </div>

              <div className="p-3.5 bg-green-50 rounded-xl border border-green-200 text-xs text-green-900">
                <span className="font-bold">Laboratory Conclusion:</span> {currentExp.conclusionPrompt}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
          <span className="text-xs text-[#64748B]">CirKit Virtual Engineering Laboratory Module</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { CircuitProject, SimulationResults, CircuitComponent } from '../../types/circuit';
import { runCircuitSimulation } from '../../engine/simulationEngine';
import { SlidersHorizontal, ArrowRight, Zap, Check, X, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
  currentResults: SimulationResults | null;
  onApplyChanges?: (updatedProject: CircuitProject) => void;
}

export const WhatIfModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  currentResults,
  onApplyChanges,
}) => {
  const [selectedCompId, setSelectedCompId] = useState<string>(() => {
    return project.components.find(c => c.type === 'resistor' || c.type === 'battery' || c.type === 'dc_source')?.id || '';
  });
  const [testValue, setTestValue] = useState<number>(1000);

  // Sync initial test value when selected component changes
  React.useEffect(() => {
    const comp = project.components.find(c => c.id === selectedCompId);
    if (comp) {
      if (comp.type === 'resistor') {
        setTestValue(comp.properties.resistance ?? 220);
      } else if (comp.type === 'battery' || comp.type === 'dc_source') {
        setTestValue(comp.properties.voltage ?? 5.0);
      }
    }
  }, [selectedCompId, project.components]);

  const selectedComp = project.components.find(c => c.id === selectedCompId);

  // Calculate "AFTER" simulation
  const hypotheticalResults = useMemo(() => {
    if (!selectedComp) return null;

    const modifiedComponents = project.components.map(c => {
      if (c.id === selectedCompId) {
        if (c.type === 'resistor') {
          return { ...c, properties: { ...c.properties, resistance: testValue } };
        } else if (c.type === 'battery' || c.type === 'dc_source') {
          return { ...c, properties: { ...c.properties, voltage: testValue } };
        }
      }
      return c;
    });

    return runCircuitSimulation(modifiedComponents, project.connections, true);
  }, [project, selectedCompId, testValue, selectedComp]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!selectedComp || !onApplyChanges) return;

    const updatedComponents = project.components.map(c => {
      if (c.id === selectedCompId) {
        if (c.type === 'resistor') {
          return { ...c, properties: { ...c.properties, resistance: testValue } };
        } else if (c.type === 'battery' || c.type === 'dc_source') {
          return { ...c, properties: { ...c.properties, voltage: testValue } };
        }
      }
      return c;
    });

    onApplyChanges({ ...project, components: updatedComponents, updatedAt: Date.now() });
    onClose();
  };

  const beforeCurrent = currentResults?.totalCurrent ?? 0;
  const afterCurrent = hypotheticalResults?.totalCurrent ?? 0;
  const currentDiff = afterCurrent - beforeCurrent;
  const currentPctChange = beforeCurrent > 0 ? ((currentDiff / beforeCurrent) * 100).toFixed(1) : '0';

  const beforePower = currentResults?.totalPower ?? 0;
  const afterPower = hypotheticalResults?.totalPower ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-2xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">"What If?" Parametric Analysis</h2>
              <p className="text-xs text-[#64748B]">Simulate parameter changes and instantly compare electrical outcomes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-[#E2E8F0] bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Target Component</label>
            <select
              value={selectedCompId}
              onChange={e => setSelectedCompId(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-blue-600"
            >
              {project.components.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-[#64748B] uppercase tracking-wider">
              <span>Hypothetical Parameter</span>
              <span className="text-blue-600 font-mono font-extrabold">
                {testValue} {selectedComp?.type === 'resistor' ? 'Ω' : 'V'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={selectedComp?.type === 'resistor' ? 10 : 1}
                max={selectedComp?.type === 'resistor' ? 10000 : 24}
                step={selectedComp?.type === 'resistor' ? 10 : 0.5}
                value={testValue}
                onChange={e => setTestValue(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <input
                type="number"
                value={testValue}
                onChange={e => setTestValue(Number(e.target.value))}
                className="w-20 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2 py-1 text-xs font-mono font-bold text-[#172033]"
              />
            </div>
          </div>
        </div>

        {/* Before vs After Comparison Table */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F8FAFC]">
          <div className="grid grid-cols-2 gap-4">
            {/* BEFORE Card */}
            <div className="p-4 bg-white rounded-xl border border-[#CBD5E1] shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">BEFORE (Current Circuit)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Baseline</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#64748B]">
                  <span>Component Value:</span>
                  <span className="font-bold text-[#172033]">
                    {selectedComp?.type === 'resistor'
                      ? `${selectedComp.properties.resistance ?? 220} Ω`
                      : `${selectedComp?.properties.voltage ?? 5} V`}
                  </span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Supply Voltage:</span>
                  <span className="font-bold text-[#172033]">{currentResults?.totalVoltage.toFixed(2) ?? '0.00'} V</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Loop Current:</span>
                  <span className="font-bold text-[#172033]">{beforeCurrent.toFixed(2)} mA</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Total Power:</span>
                  <span className="font-bold text-[#172033]">{beforePower.toFixed(2)} mW</span>
                </div>
              </div>
            </div>

            {/* AFTER Card */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-300 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">AFTER ("What If?")</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">Projected</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-blue-900">
                  <span>Component Value:</span>
                  <span className="font-extrabold text-blue-700">
                    {testValue} {selectedComp?.type === 'resistor' ? 'Ω' : 'V'}
                  </span>
                </div>
                <div className="flex justify-between text-blue-900">
                  <span>Supply Voltage:</span>
                  <span className="font-bold text-[#172033]">{hypotheticalResults?.totalVoltage.toFixed(2) ?? '0.00'} V</span>
                </div>
                <div className="flex justify-between text-blue-900">
                  <span>Loop Current:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-blue-700">{afterCurrent.toFixed(2)} mA</span>
                    {currentDiff > 0 ? (
                      <span className="text-[10px] text-green-700 font-bold flex items-center">
                        <TrendingUp className="w-3 h-3" /> +{currentPctChange}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-bold flex items-center">
                        <TrendingDown className="w-3 h-3" /> {currentPctChange}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-blue-900">
                  <span>Total Power:</span>
                  <span className="font-bold text-[#172033]">{afterPower.toFixed(2)} mW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Explanation Box */}
          <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] space-y-1.5 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-blue-700">
              <HelpCircle className="w-4 h-4" />
              <span>Engineering Physics Insight:</span>
            </div>
            <p className="text-[#475569] leading-relaxed">
              {selectedComp?.type === 'resistor'
                ? `According to Ohm's Law (I = V / R), ${
                    testValue > (selectedComp.properties.resistance ?? 220)
                      ? 'increasing resistance inversely reduces total circuit current, diminishing component heat dissipation and reducing LED brightness.'
                      : 'decreasing resistance increases current flow exponentially, potentially risking thermal overload if current exceeds 30 mA.'
                  }`
                : `Varying supply voltage linearly scales loop current (V = I × R) and quadratically increases dissipated power (P = V² / R).`}
            </p>
          </div>
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
            onClick={handleApply}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply This Change to Workbench</span>
          </button>
        </div>
      </div>
    </div>
  );
};

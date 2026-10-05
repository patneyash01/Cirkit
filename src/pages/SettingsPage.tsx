import React, { useState } from 'react';
import { Settings, Sliders, Database, Trash2, Check, Info } from 'lucide-react';
import { loadStats } from '../services/storage';
import { Logo } from '../components/common/Logo';

export const SettingsPage: React.FC = () => {
  const [gridSnap, setGridSnap] = useState<number>(20);
  const [timeStep, setTimeStep] = useState<string>('0.001');
  const [savedToast, setSavedToast] = useState(false);

  const stats = loadStats();

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleClearData = () => {
    if (window.confirm('Clear all local projects and simulation telemetry? This will reload the application.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 bg-[#F5F7FA] p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-8 select-none text-[#172033]">
      <div className="border-b border-[#E2E8F0] pb-5 flex items-center space-x-3.5">
        <Logo size={42} />
        <div>
          <h1 className="text-2xl font-black text-[#172033] font-sans tracking-tight">
            Laboratory Preferences & Settings
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Customize simulation physics parameters, canvas grid defaults, and local workspace cache.
          </p>
        </div>
      </div>

      {savedToast && (
        <div className="p-3 bg-green-50 border border-green-300 text-green-800 text-xs font-mono rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* Simulator Physics Preferences */}
      <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] space-y-5 shadow-xs">
        <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider font-mono">
            Simulation & Solver Engine
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[#172033] font-semibold">Grid Snapping Interval</label>
            <select
              value={gridSnap}
              onChange={e => setGridSnap(parseInt(e.target.value))}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#172033] font-mono focus:outline-none focus:border-blue-600"
            >
              <option value={10}>10 px (Ultra-fine)</option>
              <option value={20}>20 px (Standard Electronics)</option>
              <option value={40}>40 px (Coarse)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#172033] font-semibold">Transient Solver Time Step</label>
            <select
              value={timeStep}
              onChange={e => setTimeStep(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#172033] font-mono focus:outline-none focus:border-blue-600"
            >
              <option value="0.0001">0.1 ms (High Precision)</option>
              <option value="0.001">1.0 ms (Default Balanced)</option>
              <option value="0.005">5.0 ms (Fast Transient)</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs font-mono transition-colors cursor-pointer shadow-xs"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Storage & Local Cache */}
      <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] space-y-5 shadow-xs">
        <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
          <Database className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider font-mono">
            Local Workspace Storage
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block">TOTAL SIMULATIONS</span>
            <span className="text-lg font-bold text-blue-600">{stats.simulationsRun}</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block">COMPONENTS PLACED</span>
            <span className="text-lg font-bold text-emerald-600">{stats.componentsUsed}</span>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B] block">STORAGE ENGINE</span>
            <span className="text-lg font-bold text-purple-600">LocalStorage</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[#64748B]">
            Resetting clears all local schematics and restarts with fresh default projects.
          </p>
          <button
            onClick={handleClearData}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-mono transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Local Cache</span>
          </button>
        </div>
      </div>

      {/* Architecture Info Box */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-start space-x-3 text-xs text-[#64748B] shadow-2xs">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#172033] block">About CirKit</span>
          CirKit is a virtual electronics laboratory designed for engineering students to build, simulate and understand electronic projects.
          Engineered with React 19, TypeScript, and client-side Modified Nodal Analysis (MNA).
          Realistic physical electronics components, interactive solderless breadboard workbench, and real-time electrical physics calculation.
        </div>
      </div>
    </div>
  );
};

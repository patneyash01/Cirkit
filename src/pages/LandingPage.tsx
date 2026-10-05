import React, { useState } from 'react';
import { NavPage } from '../components/layout/Navbar';
import {
  Play,
  Layers,
  Zap,
  Activity,
  ShieldCheck,
  Cpu,
  BookOpen,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Sparkles,
  Gauge,
  Lightbulb,
} from 'lucide-react';

import { Logo } from '../components/common/Logo';

interface Props {
  onNavigate: (page: NavPage) => void;
}

export const LandingPage: React.FC<Props> = ({ onNavigate }) => {
  const [demoSwitchClosed, setDemoSwitchClosed] = useState(true);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] flex flex-col select-none">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 md:px-8 border-b border-[#E2E8F0] bg-white">
        {/* Subtle engineering grid background */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          {/* Left Text */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Academic Virtual Electronics Laboratory</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#172033] font-sans leading-tight">
                Build. Simulate.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Learn.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-[#64748B] font-normal max-w-xl leading-relaxed">
                A virtual electronics laboratory where engineering students can build, simulate and understand electronic projects.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => onNavigate('simulator')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Building with CirKit</span>
              </button>

              <button
                onClick={() => onNavigate('templates')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#172033] border border-[#E2E8F0] font-semibold text-sm flex items-center justify-center space-x-2 transition-all hover:border-blue-300 shadow-xs cursor-pointer"
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Explore Templates</span>
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E2E8F0] font-mono text-xs">
              <div>
                <span className="text-[#64748B] block text-[11px]">CALCULATION</span>
                <span className="font-bold text-blue-600 text-sm">Ohm's & KVL/KCL</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">INSTRUMENTS</span>
                <span className="font-bold text-emerald-600 text-sm">DMM & DSO Scope</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">HARDWARE RISK</span>
                <span className="font-bold text-indigo-600 text-sm">0% Burnout Risk</span>
              </div>
            </div>
          </div>

          {/* Right: Live Interactive Workbench Demonstration Card */}
          <div className="flex-1 w-full max-w-lg">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs font-mono text-[#64748B] ml-2">physical_workbench_demo.ckt</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-bold">
                  PHYSICAL MODE
                </span>
              </div>

              {/* Interactive Schematic Box */}
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] relative shadow-2xs">
                <div className="text-[11px] font-mono text-[#64748B] mb-4 flex justify-between">
                  <span>PHYSICAL JUMPER LOOP</span>
                  <span>Click switch to toggle</span>
                </div>

                <div className="flex items-center justify-between py-4">
                  {/* Battery 9V block */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-14 rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-mono shadow-xs">
                      <span className="text-xs font-bold text-blue-400">5.0V</span>
                      <span className="text-[8px] text-slate-300">DC</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] mt-1 font-bold">Battery</span>
                  </div>

                  {/* Red wire */}
                  <div className={`h-1.5 flex-1 rounded-full transition-all ${demoSwitchClosed ? 'bg-red-500 shadow-sm' : 'bg-slate-300'}`} />

                  {/* Switch */}
                  <div
                    onClick={() => setDemoSwitchClosed(!demoSwitchClosed)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono text-xs font-bold transition-all shadow-xs ${
                      demoSwitchClosed
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-amber-50 border-amber-300 text-amber-700'
                    }`}>
                      {demoSwitchClosed ? 'ON' : 'OFF'}
                    </div>
                    <span className="text-[10px] font-mono text-blue-600 mt-1 group-hover:underline font-bold">
                      Switch (Click)
                    </span>
                  </div>

                  {/* Wire line 2 */}
                  <div className={`h-1.5 flex-1 rounded-full transition-all ${demoSwitchClosed ? 'bg-blue-500 shadow-sm' : 'bg-slate-300'}`} />

                  {/* Resistor */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center space-x-0.5 shadow-2xs">
                      <span className="w-1.5 h-full bg-red-600 block" />
                      <span className="w-1.5 h-full bg-red-600 block" />
                      <span className="w-1.5 h-full bg-amber-800 block" />
                      <span className="w-1 h-full bg-amber-500 block" />
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] mt-1 font-bold">220Ω</span>
                  </div>

                  {/* Wire line 3 */}
                  <div className={`h-1.5 flex-1 rounded-full transition-all ${demoSwitchClosed ? 'bg-green-500 shadow-sm' : 'bg-slate-300'}`} />

                  {/* LED */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                      demoSwitchClosed
                        ? 'bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/50'
                        : 'bg-slate-100 border-slate-300 text-slate-400'
                    }`}>
                      <Lightbulb className={`w-6 h-6 ${demoSwitchClosed ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] mt-1 font-bold">
                      {demoSwitchClosed ? 'GLOWING' : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* Physics Readout Bar */}
                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[#64748B]">Current: </span>
                    <span className={`font-bold ${demoSwitchClosed ? 'text-emerald-600' : 'text-[#64748B]'}`}>
                      {demoSwitchClosed ? '13.64 mA' : '0.00 mA'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Power: </span>
                    <span className={`font-bold ${demoSwitchClosed ? 'text-amber-600' : 'text-[#64748B]'}`}>
                      {demoSwitchClosed ? '68.20 mW' : '0.00 mW'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instant action */}
              <button
                onClick={() => onNavigate('simulator')}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-blue-600 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Launch Virtual Workbench Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid Section */}
      <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto w-full space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight font-sans">
            Engineered for Modern Electronics Education
          </h2>
          <p className="text-[#64748B] text-sm">
            Everything engineering students and faculty need to explore circuits without broken components or workbench clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-blue-300 transition-all space-y-3 shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">
              Realistic Physical Components
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Axial resistors with standard color bands, transparent epoxy LED domes, electrolytic cans, subminiature switches, and jumper wires.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-blue-300 transition-all space-y-3 shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">
              Real-Time Simulation Engine
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              True Modified Nodal Analysis (MNA) calculating exact voltages, branch currents, and power dissipation using fundamental Ohm’s and Kirchhoff's laws.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-blue-300 transition-all space-y-3 shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">
              Breadboard Mode
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Toggleable solderless breadboard view with power distribution rails and labeled columns/rows to build hands-on circuit prototypes.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-blue-300 transition-all space-y-3 shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">
              Circuit Error Detection
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Proactive diagnostic inspector flags direct battery shorts, missing ground planes, open switches, and unballasted LEDs with recommended engineering fixes.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-blue-300 transition-all space-y-3 shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Gauge className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">
              Multimeter & Oscilloscope
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Virtual lab bench instruments including auto-ranging digital multimeter with dual probe test leads and dual-timebase digital storage oscilloscope.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-blue-300 transition-all space-y-3 shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">
              Automated Lab Reports
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Auto-generate structured IEEE laboratory reports with bill of materials, circuit netlists, verified equations, and conclusion ready for submission.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E2E8F0] py-8 px-4 text-center text-xs font-mono text-[#64748B] bg-white flex flex-col items-center justify-center space-y-2">
        <Logo size={36} />
        <p>CirKit — Virtual Electronics Laboratory • Built for Engineering Students</p>
      </footer>
    </div>
  );
};

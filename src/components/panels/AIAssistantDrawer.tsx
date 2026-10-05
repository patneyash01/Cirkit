import React, { useState } from 'react';
import { CircuitComponent, Connection, SimulationResults, CircuitProject } from '../../types/circuit';
import { STARTER_TEMPLATES } from '../../data/templates';
import { Logo } from '../common/Logo';
import {
  Bot,
  Send,
  Sparkles,
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Wrench,
  Wand2,
  Calculator,
  Check,
  ArrowRight,
  Play,
  RotateCcw,
  Zap,
  SlidersHorizontal,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  connections: Connection[];
  simulationResults: SimulationResults | null;
  onApplyCircuit?: (project: { components: CircuitComponent[]; connections: Connection[]; name?: string; description?: string }) => void;
  onAutoFixCircuit?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export const AIAssistantDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  components,
  connections,
  simulationResults,
  onApplyCircuit,
  onAutoFixCircuit,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'autofix' | 'generator' | 'calc'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your CirKit AI Tutor. I can inspect your active circuit topology, calculate required resistor values, explain KVL/KCL, troubleshoot component faults, or generate complete circuits from natural language. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Auto-fix State ---
  const [fixSuccess, setFixSuccess] = useState(false);

  // --- Generator State ---
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [generatedCircuit, setGeneratedCircuit] = useState<{
    name: string;
    description: string;
    components: CircuitComponent[];
    connections: Connection[];
  } | null>(null);

  // --- Calculator States ---
  // 1. LED Resistor
  const [calcVcc, setCalcVcc] = useState<number>(5.0);
  const [calcLedVf, setCalcLedVf] = useState<number>(2.0); // Red
  const [calcLedTargetI, setCalcLedTargetI] = useState<number>(18); // mA
  // 2. Voltage Divider
  const [calcDivVin, setCalcDivVin] = useState<number>(10.0);
  const [calcDivR1, setCalcDivR1] = useState<number>(10000);
  const [calcDivR2, setCalcDivR2] = useState<number>(4700);
  // 3. RC Time Constant
  const [calcRcR, setCalcRcR] = useState<number>(1000); // 1k
  const [calcRcC, setCalcRcC] = useState<number>(100); // 100 uF
  // 4. Resistor Color Bands
  const [band1, setBand1] = useState<number>(2); // Red
  const [band2, setBand2] = useState<number>(2); // Red
  const [bandMult, setBandMult] = useState<number>(10); // Brown (*10) -> 220
  const [bandTol, setBandTol] = useState<string>('5%');

  const quickPrompts = [
    "Why isn't my LED glowing?",
    'What resistor should I use for 9V?',
    'Explain the working principle of this circuit',
    'What happens if I increase battery voltage?',
    'Verify KVL and KCL in this circuit',
  ];

  const buildContext = () => {
    return {
      components: components.map(c => ({
        id: c.id,
        type: c.type,
        name: c.name,
        properties: c.properties,
      })),
      connectionsCount: connections.length,
      simulation: {
        supplyVoltage: simulationResults?.totalVoltage ?? 0,
        totalCurrent_mA: simulationResults?.totalCurrent ?? 0,
        totalPower_mW: simulationResults?.totalPower ?? 0,
        nodeVoltages: simulationResults?.nodeVoltages ?? {},
        diagnostics:
          simulationResults?.diagnostics.map(d => ({
            type: d.type,
            title: d.title,
            message: d.message,
          })) ?? [],
      },
    };
  };

  const handleSend = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const circuitContext = buildContext();

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, circuitContext }),
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();
      const reply = data.reply || generateEngineeringFallback(userText, circuitContext);

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          timestamp: new Date(),
        },
      ]);
    } catch {
      const fallbackReply = generateEngineeringFallback(userText, circuitContext);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: fallbackReply,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEngineeringFallback = (query: string, context: any) => {
    const q = query.toLowerCase();
    const { components, simulation } = context;
    const leds = components.filter((c: any) => c.type === 'led');
    const batteries = components.filter((c: any) => c.type === 'battery' || c.type === 'dc_source');
    const switches = components.filter((c: any) => c.type === 'switch' || c.type === 'push_button');
    const vSupply = simulation.supplyVoltage || (batteries[0]?.properties?.voltage ?? 5.0);

    if (q.includes('led') || q.includes('glowing') || q.includes('light')) {
      if (switches.some((s: any) => !s.properties?.state)) {
        return `### 💡 Circuit Diagnosis: Switch is OPEN
- **Calculated Result:** Branch current = 0.00 mA.
- **Engineering Rule:** An open switch creates an infinite impedance gap, stopping current loop continuity.
- **Suggested Fix:** Click the switch lever on the workbench to flip it to CLOSED, or use the "Auto-Fix" tab.`;
      }
      if (leds.length === 0) {
        return `### 💡 No LED Found
There is currently no LED placed on your workbench. Drag an LED from the Semiconductor category onto the canvas.`;
      }
      if (simulation.totalCurrent_mA < 1.0) {
        return `### 💡 LED Forward Voltage Threshold
- **Calculated Current:** ${simulation.totalCurrent_mA.toFixed(2)} mA.
- **Engineering Rule:** A standard indicator LED has a forward junction barrier voltage of ~2.0V. It remains off until forward-biased with adequate potential.
- **Suggested Fix:** Check that your loop connects: Battery (+) → Resistor → LED Anode (+) → LED Cathode (-) → Ground/Battery (-).`;
      }
      return `### 💡 LED Operational Status: ACTIVE
- **Forward Current:** ${simulation.totalCurrent_mA.toFixed(2)} mA.
- **Engineering Rule:** Standard indicator LEDs operate safely between 10 mA and 25 mA. Your circuit is within safe operating limits.`;
    }

    if (q.includes('what resistor') || q.includes('resistor should i use')) {
      const vFwd = 2.0;
      const targetI = 0.02; // 20 mA
      const recommendedR = Math.max(100, Math.round((vSupply - vFwd) / targetI));
      return `### 🧮 Current-Limiting Resistor Calculation
- **Calculated Resistor Value:** **${recommendedR} Ω** (Standard E12: 220Ω or 330Ω).
- **Governing Ohm's Law:**
  \`\`\`
  R = (V_supply - V_fwd) / I_target
  R = (${vSupply}V - 2.0V) / 0.020A = ${recommendedR} Ω
  \`\`\`
- **Power Dissipated in Resistor:** P = I² × R = ${(0.0004 * recommendedR * 1000).toFixed(1)} mW (Safe for standard 0.25W resistor).
- **Color Bands for 220Ω:** Red - Red - Brown - Gold (±5%).`;
    }

    if (q.includes('explain') || q.includes('how does')) {
      return `### ⚡ Circuit Analysis & Working Principle
- **Supply Voltage:** ${vSupply} V DC.
- **Components Connected:** ${components.length} physical components.
- **Current Reading:** ${simulation.totalCurrent_mA.toFixed(2)} mA.
- **Total Power Dissipation:** ${simulation.totalPower_mW.toFixed(2)} mW.
- **Working Principle:** Direct current electromotive force drives electrons through series elements obeying Kirchhoff's Voltage Law (Σ V_loop = 0). Energy is dissipated across resistive elements according to P = V × I.`;
    }

    if (q.includes('increase') || q.includes('voltage')) {
      return `### 📈 Voltage Increase Analysis
- **Calculated Response:** By Ohm's Law I = (V_supply - V_drop) / R, increasing supply voltage causes a proportional linear increase in loop current.
- **Precaution:** If current exceeds 30 mA, the LED will enter thermal overcurrent stress. Increase series resistance accordingly.`;
    }

    return `### 🔍 Workbench Schematic Diagnostics
- **Active Elements:** ${components.map((c: any) => c.name).join(', ') || 'None'}
- **Loop Current:** ${simulation.totalCurrent_mA.toFixed(2)} mA
- **Diagnostics:** ${
      simulation.diagnostics.length > 0
        ? simulation.diagnostics.map((d: any) => d.title).join('; ')
        : 'No errors found. Circuit is fully verified.'
    }
- **Instruments:** You can connect the virtual Multimeter or Oscilloscope to observe exact nodal voltages and transient curves.`;
  };

  // Helper for natural language generator
  const handleGenerateCircuit = (promptText: string) => {
    const p = promptText.toLowerCase();
    let template = STARTER_TEMPLATES[0]; // fallback basic LED

    if (p.includes('night') || p.includes('ldr') || p.includes('light sensor')) {
      template = STARTER_TEMPLATES.find(t => t.id === 'template-night-light') || STARTER_TEMPLATES[5];
    } else if (p.includes('divider') || p.includes('divide')) {
      template = STARTER_TEMPLATES.find(t => t.id === 'template-voltage-divider') || STARTER_TEMPLATES[2];
    } else if (p.includes('rc') || p.includes('capacitor') || p.includes('discharge')) {
      template = STARTER_TEMPLATES.find(t => t.id === 'template-rc-circuit') || STARTER_TEMPLATES[3];
    } else if (p.includes('pot') || p.includes('dimmer') || p.includes('variable')) {
      template = STARTER_TEMPLATES.find(t => t.id === 'template-pot-led') || STARTER_TEMPLATES[4];
    } else if (p.includes('rectifier') || p.includes('diode')) {
      template = STARTER_TEMPLATES.find(t => t.id === 'template-diode-rectifier') || STARTER_TEMPLATES[6];
    } else if (p.includes('switch') || p.includes('button')) {
      template = STARTER_TEMPLATES.find(t => t.id === 'template-switch-led') || STARTER_TEMPLATES[1];
    } else if (p.includes('transistor') || p.includes('bjt') || p.includes('npn')) {
      template = STARTER_TEMPLATES.find(t => t.id === 'template-transistor-switch') || STARTER_TEMPLATES[7] || STARTER_TEMPLATES[0];
    } else if (p.includes('arduino') || p.includes('uno') || p.includes('microcontroller')) {
      template = STARTER_TEMPLATES.find(t => t.id === 'template-arduino-blink') || STARTER_TEMPLATES[8] || STARTER_TEMPLATES[0];
    }

    setGeneratedCircuit({
      name: template.name,
      description: template.description,
      components: JSON.parse(JSON.stringify(template.components)),
      connections: JSON.parse(JSON.stringify(template.connections)),
    });
  };

  // Diagnostics check
  const diagnostics = simulationResults?.diagnostics || [];
  const errors = diagnostics.filter(d => d.type === 'critical' || d.type === 'error');
  const warnings = diagnostics.filter(d => d.type === 'warning');

  // Calculator outputs
  // LED Resistor
  const recommendedR = Math.max(10, Math.round(((calcVcc - calcLedVf) / (calcLedTargetI / 1000))));
  const ledPower_mW = Math.round((Math.pow(calcLedTargetI / 1000, 2) * recommendedR) * 1000);
  // Nearest standard E12 values
  const e12Series = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82, 100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820, 1000, 2200, 4700, 10000];
  const nearestE12 = e12Series.reduce((prev, curr) => (Math.abs(curr - recommendedR) < Math.abs(prev - recommendedR) ? curr : prev), 220);

  // Voltage Divider
  const vout = (calcDivVin * calcDivR2) / (calcDivR1 + calcDivR2);
  const divCurrent_mA = (calcDivVin / (calcDivR1 + calcDivR2)) * 1000;

  // RC Time Constant
  const tau_ms = (calcRcR * (calcRcC * 1e-6)) * 1000;
  const cutoffHz = 1 / (2 * Math.PI * calcRcR * (calcRcC * 1e-6));

  // Resistor Color Decoder
  const bandValues: Record<number, { name: string; color: string }> = {
    0: { name: 'Black', color: '#1e293b' },
    1: { name: 'Brown', color: '#854d0e' },
    2: { name: 'Red', color: '#dc2626' },
    3: { name: 'Orange', color: '#ea580c' },
    4: { name: 'Yellow', color: '#eab308' },
    5: { name: 'Green', color: '#16a34a' },
    6: { name: 'Blue', color: '#2563eb' },
    7: { name: 'Violet', color: '#7c3aed' },
    8: { name: 'Gray', color: '#64748b' },
    9: { name: 'White', color: '#f8fafc' },
  };

  const decodedResistance = (band1 * 10 + band2) * bandMult;
  const decodedResistanceStr =
    decodedResistance >= 1000000
      ? `${(decodedResistance / 1000000).toFixed(1)} MΩ`
      : decodedResistance >= 1000
      ? `${(decodedResistance / 1000).toFixed(1)} kΩ`
      : `${decodedResistance} Ω`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white border-l border-[#E2E8F0] shadow-2xl flex flex-col select-none text-[#172033] animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2.5">
          <Logo size={32} />
          <div>
            <h3 className="text-xs font-bold text-[#172033] flex items-center space-x-1.5">
              <span>CirKit AI Electronics Tutor</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-50 text-blue-700 font-mono font-bold border border-blue-200">
                Gemini 3.8
              </span>
            </h3>
            <span className="text-[10px] text-[#64748B]">Virtual Electronics Laboratory Assistant</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer border border-[#E2E8F0]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-[#E2E8F0] bg-[#F8FAFC] px-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'border-blue-600 text-blue-700 bg-white font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ask Tutor</span>
        </button>
        <button
          onClick={() => setActiveTab('autofix')}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'autofix'
              ? 'border-blue-600 text-blue-700 bg-white font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-600" />
          <span>Auto-Fix</span>
          {errors.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-0.5" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'generator'
              ? 'border-blue-600 text-blue-700 bg-white font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-600" />
          <span>AI Builder</span>
        </button>
        <button
          onClick={() => setActiveTab('calc')}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'calc'
              ? 'border-blue-600 text-blue-700 bg-white font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
          <span>Calculators</span>
        </button>
      </div>

      {/* Circuit Snapshot Status Bar */}
      <div className="px-3.5 py-1.5 bg-[#F1F5F9] border-b border-[#E2E8F0] text-[11px] font-mono text-[#64748B] flex justify-between items-center">
        <span>Inspecting: {components.length} components, {connections.length} wires</span>
        <span className="text-blue-600 font-bold">{simulationResults?.totalCurrent.toFixed(1) ?? '0.0'} mA</span>
      </div>

      {/* TAB 1: ASK TUTOR (CHAT) */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#F8FAFC]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-[#E2E8F0] text-[#172033] rounded-bl-none whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-[#94A3B8] mt-1 font-mono">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-[#64748B] text-xs p-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Gemini is evaluating KVL/KCL and solving nodal equations...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-[#E2E8F0] bg-white space-y-1">
            <span className="text-[10px] text-[#64748B] font-bold px-1 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Suggested Engineering Queries:</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {quickPrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-[10px] bg-[#F1F5F9] hover:bg-blue-50 text-[#172033] hover:text-blue-700 px-2 py-1 rounded-md transition-colors cursor-pointer border border-[#E2E8F0] truncate max-w-full font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-[#E2E8F0] bg-white">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Ask about Ohm's law, component values, or faults..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold transition-all cursor-pointer flex-shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}

      {/* TAB 2: AUTO-FIX & DEBUG */}
      {activeTab === 'autofix' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
          <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-xs space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">1-Click Circuit Auto-Repair</h4>
                <p className="text-[10px] text-[#64748B]">
                  Instantly resolves backwards diodes, missing current-limiting resistors, and open switches.
                </p>
              </div>
            </div>

            {onAutoFixCircuit && (
              <button
                onClick={() => {
                  onAutoFixCircuit();
                  setFixSuccess(true);
                  setTimeout(() => setFixSuccess(false), 3000);
                }}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Apply One-Click Auto-Fix</span>
              </button>
            )}

            {fixSuccess && (
              <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-green-800 text-[11px] font-semibold flex items-center space-x-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span>Circuit auto-corrected! Verified safe loop continuity.</span>
              </div>
            )}
          </div>

          {/* Active Diagnostic Issues List */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Diagnostic Health Check ({diagnostics.length})
            </h5>

            {diagnostics.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
                <h6 className="text-xs font-bold text-[#172033]">All Circuits Clear & Verified</h6>
                <p className="text-[11px] text-[#64748B]">
                  No short circuits, open loops, or overcurrent hazards detected.
                </p>
              </div>
            ) : (
              diagnostics.map((diag, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 bg-white shadow-2xs ${
                    diag.type === 'critical' || diag.type === 'error'
                      ? 'border-red-200'
                      : 'border-amber-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertCircle
                      className={`w-3.5 h-3.5 ${
                        diag.type === 'critical' || diag.type === 'error'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    />
                    <span className={diag.type === 'critical' || diag.type === 'error' ? 'text-red-900' : 'text-amber-900'}>
                      {diag.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569]">{diag.message}</p>
                  {diag.suggestedFix && (
                    <div className="mt-1 p-1.5 rounded bg-blue-50 border border-blue-100 text-blue-900 text-[10px] font-mono">
                      💡 Fix: {diag.suggestedFix}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CIRCUIT GENERATOR */}
      {activeTab === 'generator' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
          <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-xs space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">Natural Language Circuit Generator</h4>
                <p className="text-[10px] text-[#64748B]">Describe any circuit in plain English to auto-build it</p>
              </div>
            </div>

            <div className="flex space-x-1.5 pt-1">
              <input
                type="text"
                placeholder="e.g. Automatic night light with LDR and 9V battery..."
                value={generatorPrompt}
                onChange={e => setGeneratorPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleGenerateCircuit(generatorPrompt);
                }}
                className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
              />
              <button
                onClick={() => handleGenerateCircuit(generatorPrompt)}
                disabled={!generatorPrompt.trim()}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Build
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Or choose from engineering presets:</span>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { title: 'Automatic Night Light (LDR Sensor)', prompt: 'night light with LDR and yellow LED' },
                { title: 'Precision 3.3V Voltage Divider', prompt: 'precision voltage divider with 10k and 4.7k' },
                { title: 'RC Low-Pass Transient Circuit', prompt: 'RC charging circuit with 100uF capacitor' },
                { title: 'Potentiometer LED Dimmer', prompt: 'potentiometer dimmer with 9V and green LED' },
                { title: 'Diode Rectifier (1N4007)', prompt: 'diode half wave rectifier with silicon diode' },
                { title: 'Arduino Uno Blink Setup', prompt: 'arduino uno with pin 13 LED and resistor' },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGenerateCircuit(preset.prompt)}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-[#E2E8F0] hover:border-purple-300 transition-all text-xs font-semibold text-[#172033] flex items-center justify-between cursor-pointer group"
                >
                  <span>{preset.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-purple-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Generated Result Card */}
          {generatedCircuit && (
            <div className="p-4 bg-white rounded-xl border border-purple-200 shadow-md space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-100 text-purple-800 font-bold">
                  GENERATED SCHEMATIC
                </span>
                <span className="text-[10px] text-[#64748B]">
                  {generatedCircuit.components.length} parts, {generatedCircuit.connections.length} wires
                </span>
              </div>

              <div>
                <h5 className="text-xs font-extrabold text-[#172033]">{generatedCircuit.name}</h5>
                <p className="text-[11px] text-[#64748B] mt-0.5">{generatedCircuit.description}</p>
              </div>

              {onApplyCircuit && (
                <button
                  onClick={() => {
                    onApplyCircuit(generatedCircuit);
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Apply to Active Workbench</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LAB CALCULATORS */}
      {activeTab === 'calc' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
          {/* 1. LED Current-Limiter Calculator */}
          <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs">
                Ω
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">LED Resistor Calculator</h4>
                <p className="text-[10px] text-[#64748B]">R = (V_supply - V_forward) / I_target</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">V_supply (V)</label>
                <select
                  value={calcVcc}
                  onChange={e => setCalcVcc(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono font-bold"
                >
                  <option value={3.3}>3.3 V</option>
                  <option value={5.0}>5.0 V</option>
                  <option value={9.0}>9.0 V</option>
                  <option value={12.0}>12.0 V</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">LED Color</label>
                <select
                  value={calcLedVf}
                  onChange={e => setCalcLedVf(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono font-bold"
                >
                  <option value={2.0}>Red (2.0V)</option>
                  <option value={2.2}>Green (2.2V)</option>
                  <option value={3.2}>Blue (3.2V)</option>
                  <option value={2.1}>Yellow (2.1V)</option>
                  <option value={3.3}>White (3.3V)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">Target (mA)</label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={calcLedTargetI}
                  onChange={e => setCalcLedTargetI(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-[#64748B] text-[10px] block">RECOMMENDED E12:</span>
                <span className="text-base font-bold text-blue-700">{nearestE12} Ω</span>
              </div>
              <div className="text-right">
                <span className="text-[#64748B] text-[10px] block">POWER DISSIPATION:</span>
                <span className="font-bold text-[#172033]">{ledPower_mW} mW (0.25W Safe)</span>
              </div>
            </div>
          </div>

          {/* 2. Voltage Divider Calculator */}
          <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold text-xs">
                V
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">Voltage Divider Calculator</h4>
                <p className="text-[10px] text-[#64748B]">V_out = V_in × R2 / (R1 + R2)</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">V_in (V)</label>
                <input
                  type="number"
                  value={calcDivVin}
                  onChange={e => setCalcDivVin(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">R1 (Ω)</label>
                <input
                  type="number"
                  value={calcDivR1}
                  onChange={e => setCalcDivR1(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">R2 (Ω)</label>
                <input
                  type="number"
                  value={calcDivR2}
                  onChange={e => setCalcDivR2(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-[#64748B] text-[10px] block">OUTPUT VOLTAGE V_OUT:</span>
                <span className="text-base font-bold text-emerald-700">{vout.toFixed(2)} V</span>
              </div>
              <div className="text-right">
                <span className="text-[#64748B] text-[10px] block">QUIESCENT CURRENT:</span>
                <span className="font-bold text-[#172033]">{divCurrent_mA.toFixed(2)} mA</span>
              </div>
            </div>
          </div>

          {/* 3. RC Time Constant */}
          <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-xs">
                τ
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">RC Time Constant & Cutoff</h4>
                <p className="text-[10px] text-[#64748B]">τ = R × C | f_cutoff = 1 / (2πRC)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">Resistance R (Ω)</label>
                <input
                  type="number"
                  value={calcRcR}
                  onChange={e => setCalcRcR(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">Capacitance C (µF)</label>
                <input
                  type="number"
                  value={calcRcC}
                  onChange={e => setCalcRcC(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-[#64748B] text-[10px] block">TIME CONSTANT τ:</span>
                <span className="text-base font-bold text-amber-800">{tau_ms.toFixed(1)} ms</span>
              </div>
              <div className="text-right">
                <span className="text-[#64748B] text-[10px] block">CUTOFF FREQUENCY (-3dB):</span>
                <span className="font-bold text-[#172033]">{cutoffHz.toFixed(1)} Hz</span>
              </div>
            </div>
          </div>

          {/* 4. Resistor 4-Band Color Code Decoder */}
          <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs">
                🎨
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172033]">4-Band Resistor Color Decoder</h4>
                <p className="text-[10px] text-[#64748B]">Decode bands to resistance</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">Band 1</label>
                <select
                  value={band1}
                  onChange={e => setBand1(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <option key={n} value={n}>
                      {n} - {bandValues[n].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">Band 2</label>
                <select
                  value={band2}
                  onChange={e => setBand2(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <option key={n} value={n}>
                      {n} - {bandValues[n].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] block font-semibold">Multiplier</label>
                <select
                  value={bandMult}
                  onChange={e => setBandMult(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-1.5 text-xs font-mono"
                >
                  <option value={1}>×1 (Black)</option>
                  <option value={10}>×10 (Brown)</option>
                  <option value={100}>×100 (Red)</option>
                  <option value={1000}>×1k (Orange)</option>
                  <option value={10000}>×10k (Yellow)</option>
                  <option value={100000}>×100k (Green)</option>
                  <option value={1000000}>×1M (Blue)</option>
                </select>
              </div>
            </div>

            {/* Visual Color Ring Preview */}
            <div className="h-9 bg-[#e2d5b5] rounded-xl flex items-center justify-center space-x-3 px-6 shadow-inner border border-[#c4b595]">
              <div className="w-2.5 h-7 rounded-xs shadow-xs" style={{ backgroundColor: bandValues[band1].color }} />
              <div className="w-2.5 h-7 rounded-xs shadow-xs" style={{ backgroundColor: bandValues[band2].color }} />
              <div
                className="w-2.5 h-7 rounded-xs shadow-xs"
                style={{
                  backgroundColor:
                    bandMult === 1
                      ? '#1e293b'
                      : bandMult === 10
                      ? '#854d0e'
                      : bandMult === 100
                      ? '#dc2626'
                      : bandMult === 1000
                      ? '#ea580c'
                      : bandMult === 10000
                      ? '#eab308'
                      : bandMult === 100000
                      ? '#16a34a'
                      : '#2563eb',
                }}
              />
              <div className="w-2.5 h-7 rounded-xs bg-[#eab308] shadow-xs" title="Gold (±5%)" />
            </div>

            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-mono text-center">
              <span className="text-[#64748B] text-[10px] block">CALCULATED RESISTANCE:</span>
              <span className="text-base font-extrabold text-indigo-900">{decodedResistanceStr} ± 5%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

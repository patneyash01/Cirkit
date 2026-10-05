import React, { useState } from 'react';
import { STARTER_TEMPLATES } from '../../data/templates';
import { Sparkles, X, Lightbulb, Shield, Sliders, Sun, Gauge, ArrowRight, Search, CheckCircle2 } from 'lucide-react';
import { CircuitProject } from '../../types/circuit';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectCircuit: (project: CircuitProject) => void;
}

export const BeginnerWizardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectCircuit,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [suggestedKit, setSuggestedKit] = useState<{
    title: string;
    componentsList: string[];
    templateId: string;
  } | null>(null);

  if (!isOpen) return null;

  const quickStarters = [
    {
      templateId: 'template-night-light',
      title: 'Automatic Night Light',
      desc: 'Ambient light sensor circuit automatically lighting an LED in dark conditions.',
      components: ['LDR Photoresistor', '330Ω Resistor', 'Yellow LED', '5V Battery', 'Ground'],
      difficulty: 'Intermediate',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
    },
    {
      templateId: 'template-led-basic',
      title: 'Simple LED Circuit',
      desc: '5V DC battery driving a red LED safely with a 220Ω current-limiting resistor.',
      components: ['5V DC Battery', '220Ω Resistor', 'Red LED', 'Ground'],
      difficulty: 'Beginner',
      icon: <Lightbulb className="w-5 h-5 text-blue-600" />,
    },
    {
      templateId: 'template-switch-led',
      title: 'Switch Controlled LED',
      desc: 'Subminiature toggle switch controlling circuit current flow to an indicator LED.',
      components: ['5V DC Battery', 'Toggle Switch', '330Ω Resistor', 'Blue LED', 'Ground'],
      difficulty: 'Beginner',
      icon: <Sliders className="w-5 h-5 text-green-600" />,
    },
    {
      templateId: 'template-simple-alarm',
      title: 'Security Intruder Alarm',
      desc: 'Tripwire switch triggering a high-decibel audible Piezo buzzer.',
      components: ['9V Battery', 'Tripwire Switch', 'Piezo Buzzer', 'Ground'],
      difficulty: 'Beginner',
      icon: <Shield className="w-5 h-5 text-red-600" />,
    },
    {
      templateId: 'template-voltage-divider',
      title: 'Voltage Divider Reference',
      desc: 'Two series resistors scaling 10V down to precise 3.3V microcontroller reference.',
      components: ['10V DC Source', '10kΩ Resistor', '4.7kΩ Resistor', 'Ground'],
      difficulty: 'Beginner',
      icon: <Gauge className="w-5 h-5 text-purple-600" />,
    },
    {
      templateId: 'template-rc-circuit',
      title: 'RC Charging & Transient',
      desc: '100µF capacitor transient charging curve displayable on the oscilloscope.',
      components: ['5V Battery', 'Switch', '1kΩ Resistor', '100µF Capacitor', 'Ground'],
      difficulty: 'Intermediate',
      icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
    },
  ];

  // Smart prompt parser (Section 11)
  const handleParsePrompt = (text: string) => {
    setPromptInput(text);
    const q = text.toLowerCase();

    if (q.includes('night') || q.includes('ldr') || q.includes('light sensor') || q.includes('dark')) {
      setSuggestedKit({
        title: 'Automatic Night Light Circuit',
        componentsList: ['LDR Photoresistor', '330Ω Resistor', 'Yellow LED', '5V DC Battery', 'Ground'],
        templateId: 'template-night-light',
      });
    } else if (q.includes('alarm') || q.includes('buzzer') || q.includes('security') || q.includes('sound')) {
      setSuggestedKit({
        title: 'Security Intruder Alarm Circuit',
        componentsList: ['9V DC Battery', 'SPST Switch', 'Piezo Buzzer', 'Ground'],
        templateId: 'template-simple-alarm',
      });
    } else if (q.includes('divider') || q.includes('voltage') || q.includes('reference') || q.includes('step down')) {
      setSuggestedKit({
        title: 'Precision Voltage Divider Circuit',
        componentsList: ['10V DC Battery', '10kΩ Resistor', '4.7kΩ Resistor', 'Ground'],
        templateId: 'template-voltage-divider',
      });
    } else if (q.includes('switch') || q.includes('toggle')) {
      setSuggestedKit({
        title: 'Switch-Controlled LED Circuit',
        componentsList: ['5V DC Battery', 'Toggle Switch', '330Ω Resistor', 'Blue LED', 'Ground'],
        templateId: 'template-switch-led',
      });
    } else if (q.includes('rc') || q.includes('capacitor') || q.includes('charging') || q.includes('filter')) {
      setSuggestedKit({
        title: 'RC Transient Charging Circuit',
        componentsList: ['5V DC Battery', 'Toggle Switch', '1kΩ Resistor', '100µF Capacitor', 'Ground'],
        templateId: 'template-rc-circuit',
      });
    } else {
      setSuggestedKit({
        title: 'Standard Series LED Circuit',
        componentsList: ['5V DC Battery', '220Ω Resistor', 'Red LED', 'Ground'],
        templateId: 'template-led-basic',
      });
    }
  };

  const handleDeployTemplate = (templateId: string) => {
    const template = STARTER_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      onSelectCircuit({
        ...template,
        id: `project-${Date.now()}`,
        name: template.name.replace(/^[0-9]+\.\s*/, ''),
        isTemplate: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-[#E2E8F0] select-none text-[#172033] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#172033] text-base">
                Smart Build: Circuit Synthesis Assistant
              </h3>
              <p className="text-xs text-[#64748B]">
                Type the circuit you want to create or pick an academic laboratory preset.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer border border-[#E2E8F0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Natural Language Prompt Input (Section 11) */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-bold text-[#172033] block">
            What circuit would you like to construct?
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder='e.g. "Build an automatic night light" or "LED with switch"...'
                value={promptInput}
                onChange={e => handleParsePrompt(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              onClick={() => handleParsePrompt(promptInput || 'Build an automatic night light')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* Dynamic Suggested Kit Card */}
        {suggestedKit && (
          <div className="mt-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Suggested Bill of Materials: {suggestedKit.title}</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Ready to Assemble
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {suggestedKit.componentsList.map(item => (
                <span
                  key={item}
                  className="px-2.5 py-1 bg-white rounded-lg text-xs font-mono font-medium text-[#172033] border border-blue-100 shadow-2xs"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => handleDeployTemplate(suggestedKit.templateId)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <span>Place Components & Connect Wires</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Academic Presets Grid */}
        <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            Or Choose from Standard Laboratory Starters:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[42vh] overflow-y-auto p-1">
            {quickStarters.map(opt => (
              <div
                key={opt.templateId}
                onClick={() => handleDeployTemplate(opt.templateId)}
                className="p-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between space-y-2 shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shadow-2xs">
                      {opt.icon}
                    </div>
                    <span className="text-[9px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200/60 text-[#64748B]">
                      {opt.difficulty}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#172033] group-hover:text-blue-700 transition-colors">
                      {opt.title}
                    </h4>
                    <p className="text-[11px] text-[#64748B] leading-snug mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-[11px] font-bold text-blue-600 group-hover:translate-x-1 transition-transform pt-1">
                  <span>Load on Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

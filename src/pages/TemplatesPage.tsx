import React, { useState } from 'react';
import { CircuitProject } from '../types/circuit';
import { STARTER_TEMPLATES } from '../data/templates';
import { Layers, CheckCircle2, ArrowRight, Filter } from 'lucide-react';
import { Logo } from '../components/common/Logo';

interface Props {
  onOpenTemplate: (project: CircuitProject) => void;
}

export const TemplatesPage: React.FC<Props> = ({ onOpenTemplate }) => {
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allTags = ['all', 'Beginner', 'Analog', 'LED', 'Sensors', 'Oscilloscope', 'Digital Logic'];

  const filteredTemplates = STARTER_TEMPLATES.filter(t => {
    if (selectedTag === 'all') return true;
    return t.tags?.includes(selectedTag);
  });

  return (
    <div className="flex-1 bg-[#F5F7FA] p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 select-none text-[#172033]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="flex items-center space-x-3.5">
          <Logo size={40} />
          <div>
            <h1 className="text-2xl font-black text-[#172033] font-sans tracking-tight">
              CirKit Templates
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Explore CirKit project templates. Pre-wired, physics-validated academic circuit templates ready to run in physical or schematic mode.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <Filter className="w-3.5 h-3.5 text-[#64748B] mr-1 flex-shrink-0" />
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                  : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              {tag === 'all' ? 'All Templates' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            onClick={() => onOpenTemplate(template)}
            className="p-5 rounded-3xl bg-white hover:bg-blue-50/20 border border-[#E2E8F0] hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="space-y-3">
              {/* Category tags */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {template.tags?.map(t => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <span className="text-[11px] font-mono text-blue-600 font-bold">
                  {template.components.length} Components
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#172033] group-hover:text-blue-700 transition-colors">
                  {template.name}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed mt-1.5">
                  {template.description}
                </p>
              </div>

              {/* Schematic mini BOM preview */}
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-[#64748B] space-y-1">
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">
                  Component Netlist:
                </div>
                <div className="truncate text-[#172033]">
                  {template.components.map(c => c.name).join(' • ')}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
              <span className="text-green-700 flex items-center space-x-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>Pre-Wired & Verified</span>
              </span>

              <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 group-hover:bg-blue-700 text-white font-bold transition-all shadow-xs">
                <span>Load Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

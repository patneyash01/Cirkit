import React, { useState, useMemo } from 'react';
import { ComponentCategory, ComponentTemplate } from '../../types/circuit';
import { COMPONENT_CATALOG } from '../../data/components';
import {
  Search,
  X,
  Layers,
  Zap,
  BatteryCharging,
  Activity,
  Cpu,
  Radio,
  Volume2,
  Sliders,
  RotateCw,
  Binary,
  Wrench,
} from 'lucide-react';

interface Props {
  onAddComponent: (type: string) => void;
  onSelectPlacementType?: (type: string) => void;
  activePlacementType?: string | null;
  onOpenBeginnerWizard?: () => void;
  onClose?: () => void;
}

// Realistic illustrated micro-thumbnail for component bin cards
const RealisticComponentThumbnail: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'resistor':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          {/* Wire leads */}
          <line x1="8" y1="40" x2="22" y2="26" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="42" y1="14" x2="56" y2="6" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          {/* Tan axial ceramic body */}
          <g transform="translate(32, 20) rotate(-40)">
            <rect x="-16" y="-7" width="32" height="14" rx="6" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
            {/* Color bands: Red, Red, Brown, Gold */}
            <rect x="-9" y="-7" width="2.5" height="14" fill="#dc2626" />
            <rect x="-4" y="-7" width="2.5" height="14" fill="#dc2626" />
            <rect x="2" y="-7" width="2.5" height="14" fill="#854d0e" />
            <rect x="8" y="-7" width="2" height="14" fill="#d97706" />
          </g>
        </svg>
      );

    case 'capacitor':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          {/* Wire leads */}
          <line x1="28" y1="36" x2="28" y2="44" stroke="#94a3b8" strokeWidth="2" />
          <line x1="36" y1="36" x2="36" y2="42" stroke="#94a3b8" strokeWidth="2" />
          {/* Dark blue cylindrical aluminum can */}
          <rect x="22" y="8" width="20" height="28" rx="4" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1" />
          {/* Negative stripe */}
          <rect x="35" y="8" width="5" height="28" fill="#e2e8f0" />
          <text x="37.5" y="24" fill="#1e293b" fontSize="7" fontWeight="bold" textAnchor="middle">-</text>
        </svg>
      );

    case 'led':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          {/* Metal leads */}
          <line x1="28" y1="28" x2="28" y2="44" stroke="#94a3b8" strokeWidth="2" />
          <line x1="36" y1="28" x2="36" y2="40" stroke="#94a3b8" strokeWidth="2" />
          {/* 5mm Red LED epoxy dome */}
          <path d="M 23 28 L 41 28 L 41 18 A 9 9 0 0 0 23 18 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.2" />
          <ellipse cx="32" cy="14" rx="5" ry="3" fill="#fca5a5" opacity="0.6" />
        </svg>
      );

    case 'diode':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          <line x1="8" y1="36" x2="22" y2="24" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="42" y1="14" x2="56" y2="6" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <g transform="translate(32, 20) rotate(-40)">
            <rect x="-14" y="-6" width="28" height="12" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <rect x="5" y="-6" width="5" height="12" rx="0.5" fill="#e2e8f0" />
          </g>
        </svg>
      );

    case 'switch':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          {/* Metal toggle body */}
          <rect x="20" y="16" width="24" height="22" rx="3" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
          {/* Toggle lever */}
          <circle cx="32" cy="24" r="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          <line x1="32" y1="24" x2="42" y2="8" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'potentiometer':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          {/* Blue body */}
          <rect x="18" y="16" width="28" height="22" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
          {/* Brass rotary knob */}
          <circle cx="32" cy="24" r="10" fill="#d97706" stroke="#b45309" strokeWidth="1.2" />
          <circle cx="32" cy="24" r="4" fill="#78350f" />
          <line x1="32" y1="24" x2="32" y2="16" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'battery':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          {/* 3x AA Battery pack */}
          <rect x="14" y="8" width="36" height="32" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="18" y="11" width="28" height="7" rx="1.5" fill="#d97706" />
          <rect x="18" y="20" width="28" height="7" rx="1.5" fill="#d97706" />
          <rect x="18" y="29" width="28" height="7" rx="1.5" fill="#d97706" />
          <text x="32" y="16" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">AA 1.5V</text>
          <text x="32" y="25" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">AA 1.5V</text>
          <text x="32" y="34" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">AA 1.5V</text>
        </svg>
      );

    case 'breadboard':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          <rect x="8" y="10" width="48" height="28" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="12" y1="14" x2="52" y2="14" stroke="#ef4444" strokeWidth="1" />
          <line x1="12" y1="34" x2="52" y2="34" stroke="#3b82f6" strokeWidth="1" />
          <rect x="12" y="22" width="40" height="2" fill="#cbd5e1" />
          <circle cx="20" cy="18" r="1" fill="#94a3b8" />
          <circle cx="28" cy="18" r="1" fill="#94a3b8" />
          <circle cx="36" cy="18" r="1" fill="#94a3b8" />
          <circle cx="44" cy="18" r="1" fill="#94a3b8" />
          <circle cx="20" cy="28" r="1" fill="#94a3b8" />
          <circle cx="28" cy="28" r="1" fill="#94a3b8" />
          <circle cx="36" cy="28" r="1" fill="#94a3b8" />
          <circle cx="44" cy="28" r="1" fill="#94a3b8" />
        </svg>
      );

    case 'arduino_uno':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          <rect x="10" y="8" width="44" height="32" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
          <rect x="12" y="10" width="8" height="8" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
          <rect x="25" y="18" width="16" height="8" rx="1" fill="#0f172a" />
          <rect x="14" y="34" width="36" height="3" fill="#1e293b" />
          <text x="32" y="15" fill="#f8fafc" fontSize="5" fontWeight="extrabold" textAnchor="middle">UNO</text>
        </svg>
      );

    case 'esp32':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          <rect x="14" y="8" width="36" height="32" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <rect x="18" y="12" width="28" height="16" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
          <text x="32" y="22" fill="#1e293b" fontSize="5" fontWeight="bold" textAnchor="middle">ESP32</text>
          <line x1="16" y1="36" x2="48" y2="36" stroke="#eab308" strokeWidth="2" strokeDasharray="2 2" />
        </svg>
      );

    case 'dc_motor':
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          <rect x="14" y="14" width="32" height="20" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
          <rect x="46" y="21" width="8" height="6" rx="1" fill="#d97706" />
          <circle cx="30" cy="24" r="5" fill="#94a3b8" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 64 48" className="w-12 h-10 drop-shadow-xs">
          <rect x="14" y="12" width="36" height="24" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="32" y="26" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle">IC</text>
        </svg>
      );
  }
};

export const ComponentLibrary: React.FC<Props> = ({
  onAddComponent,
  onSelectPlacementType,
  activePlacementType,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All', icon: <Layers className="w-4 h-4" /> },
    { id: 'basic', label: 'Basic', icon: <Zap className="w-4 h-4" /> },
    { id: 'power', label: 'Power', icon: <BatteryCharging className="w-4 h-4" /> },
    { id: 'passive', label: 'Passive', icon: <Activity className="w-4 h-4" /> },
    { id: 'semiconductor', label: 'Semiconductor', icon: <Cpu className="w-4 h-4" /> },
    { id: 'sensors', label: 'Sensors', icon: <Radio className="w-4 h-4" /> },
    { id: 'output', label: 'Output', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'microcontroller', label: 'Microcontroller', icon: <Cpu className="w-4 h-4" /> },
    { id: 'motors', label: 'Motors', icon: <RotateCw className="w-4 h-4" /> },
    { id: 'digital', label: 'Digital Logic', icon: <Binary className="w-4 h-4" /> },
    { id: 'tools', label: 'Tools', icon: <Wrench className="w-4 h-4" /> },
  ];

  // Primary component list shown in screenshot
  const primaryDisplayList: { type: string; name: string; category: string }[] = [
    { type: 'resistor', name: 'Resistor', category: 'passive' },
    { type: 'capacitor', name: 'Capacitor', category: 'passive' },
    { type: 'led', name: 'LED', category: 'semiconductor' },
    { type: 'diode', name: 'Diode', category: 'semiconductor' },
    { type: 'switch', name: 'Switch', category: 'basic' },
    { type: 'potentiometer', name: 'Potentiometer', category: 'passive' },
    { type: 'battery', name: 'Battery (AA)', category: 'power' },
    { type: 'arduino_uno', name: 'Arduino Uno', category: 'microcontroller' },
    { type: 'esp32', name: 'ESP32', category: 'microcontroller' },
    { type: 'dc_motor', name: 'DC Motor', category: 'motors' },
  ];

  const filteredComponents = useMemo(() => {
    return primaryDisplayList.filter(c => {
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchesQuery =
        searchQuery.trim() === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/cirkit-component', type);
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0] select-none text-[#172033] shadow-xs">
      {/* Header */}
      <div className="p-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
        <h3 className="font-extrabold text-[#172033] text-sm">Components</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#E2E8F0]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Main Dual-Column: Category Vertical Nav + 2-Column Component Cards */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left vertical category sidebar */}
        <div className="w-24 sm:w-28 flex-shrink-0 border-r border-[#E2E8F0] bg-white overflow-y-auto p-1.5 space-y-1">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center space-x-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right 2-column component card grid */}
        <div className="flex-1 overflow-y-auto p-3 bg-white">
          <div className="grid grid-cols-2 gap-2.5">
            {filteredComponents.map(item => {
              const isPlacing = activePlacementType === item.type;

              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={e => handleDragStart(e, item.type)}
                  onClick={() => onSelectPlacementType?.(item.type)}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer border ${
                    isPlacing
                      ? 'bg-blue-50 border-2 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-[#E2E8F0] hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                  title={`Click or drag to place ${item.name}`}
                >
                  <div className="w-12 h-10 flex items-center justify-center">
                    <RealisticComponentThumbnail type={item.type} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#172033] mt-2 text-center truncate w-full">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

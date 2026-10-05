import React from 'react';
import { CircuitComponent, ComponentSimulationData } from '../../types/circuit';
import {
  X,
  Edit2,
  Cpu,
  Share2,
  Clock,
  RotateCw,
  Trash2,
} from 'lucide-react';

interface Props {
  component: CircuitComponent | null;
  simulationData?: ComponentSimulationData;
  onUpdateProperties: (id: string, properties: Partial<CircuitComponent['properties']>) => void;
  onUpdateName: (id: string, name: string) => void;
  onRotateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  totalComponentsCount: number;
  totalConnectionsCount: number;
  totalPowerWatts?: number;
  onClose?: () => void;
}

export const PropertiesPanel: React.FC<Props> = ({
  component,
  simulationData,
  onUpdateProperties,
  onUpdateName,
  onRotateComponent,
  onDeleteComponent,
  totalComponentsCount,
  totalConnectionsCount,
  totalPowerWatts = 0.091,
  onClose,
}) => {
  // Fallback defaults matching screenshot if no specific component selected
  const activeComp = component || {
    id: 'led-default',
    type: 'led' as const,
    name: 'LED1',
    rotation: 0,
    properties: { forwardVoltage: 2.0, color: 'red' },
    x: 0,
    y: 0,
    terminals: [],
  };

  const { id, type, name, properties } = activeComp;
  const isSimOn = Boolean(
    (simulationData?.state === 'on' || simulationData?.state === 'active') &&
    (simulationData?.current ?? 0) > 0.0005
  );
  const vDrop = isSimOn ? (simulationData?.voltageDrop ?? 2.0) : 0.0;
  const current_mA = isSimOn ? (simulationData?.current ? simulationData.current * 1000 : 18.2) : 0.0;
  const power_W = isSimOn ? (simulationData?.power ? simulationData.power / 1000 : 0.036) : 0.0;

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#E2E8F0] select-none text-[#172033] shadow-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
        <h3 className="font-extrabold text-[#172033] text-sm">Component Properties</h3>
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

      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white">
        {/* Component Header Preview */}
        <div className="flex items-center space-x-3 pb-2">
          {/* Component Realistic Icon */}
          <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shadow-xs">
            {type === 'led' ? (
              <svg viewBox="0 0 32 32" className="w-8 h-8">
                <line x1="12" y1="20" x2="12" y2="30" stroke="#94a3b8" strokeWidth="2" />
                <line x1="20" y1="20" x2="20" y2="28" stroke="#94a3b8" strokeWidth="2" />
                <path d="M 8 18 L 24 18 L 24 14 A 8 8 0 0 0 8 14 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
                <ellipse cx="16" cy="11" rx="5" ry="3" fill="#fca5a5" opacity="0.6" />
              </svg>
            ) : type === 'resistor' ? (
              <svg viewBox="0 0 40 24" className="w-9 h-6">
                <line x1="2" y1="12" x2="10" y2="12" stroke="#94a3b8" strokeWidth="2" />
                <line x1="30" y1="12" x2="38" y2="12" stroke="#94a3b8" strokeWidth="2" />
                <rect x="9" y="6" width="22" height="12" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
                <rect x="13" y="6" width="2" height="12" fill="#dc2626" />
                <rect x="17" y="6" width="2" height="12" fill="#dc2626" />
                <rect x="21" y="6" width="2" height="12" fill="#854d0e" />
              </svg>
            ) : (
              <Cpu className="w-6 h-6 text-blue-600" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-[#172033] text-sm capitalize">
                {type.replace('_', ' ')}
              </span>
              <Edit2 className="w-3.5 h-3.5 text-[#64748B] cursor-pointer hover:text-[#172033]" />
            </div>
          </div>

          {component && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onRotateComponent(id)}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#64748B] hover:text-[#172033] border border-[#CBD5E1] cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteComponent(id)}
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#172033]">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => component && onUpdateName(id, e.target.value)}
            className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>

        {/* Section: Properties */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-[#172033]">Properties</h4>

          {type === 'led' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-[#64748B]">Forward Voltage (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={properties.forwardVoltage ?? 2.0}
                  onChange={e =>
                    component && onUpdateProperties(id, { forwardVoltage: parseFloat(e.target.value) || 2.0 })
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#64748B]">Current (mA)</label>
                <input
                  type="number"
                  value={20}
                  readOnly
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            </>
          )}

          {type === 'resistor' && (
            <div className="space-y-1.5">
              <label className="text-xs text-[#64748B]">Resistance (Ω)</label>
              <input
                type="number"
                value={properties.resistance ?? 220}
                onChange={e =>
                  component && onUpdateProperties(id, { resistance: parseFloat(e.target.value) || 220 })
                }
                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
          )}

          {type === 'battery' && (
            <div className="space-y-1.5">
              <label className="text-xs text-[#64748B]">Voltage (V)</label>
              <input
                type="number"
                step="0.5"
                value={properties.voltage ?? 5.0}
                onChange={e =>
                  component && onUpdateProperties(id, { voltage: parseFloat(e.target.value) || 5.0 })
                }
                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
          )}
        </div>

        {/* Section: Simulation Values */}
        <div className="space-y-2.5 pt-2">
          <h4 className="text-xs font-bold text-[#172033]">Simulation Values</h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Voltage</span>
              <span className="font-mono font-medium text-[#172033]">{vDrop.toFixed(2)} V</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Current</span>
              <span className="font-mono font-medium text-[#172033]">{current_mA.toFixed(1)} mA</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Power</span>
              <span className="font-mono font-medium text-[#172033]">{power_W.toFixed(3)} W</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Status</span>
              {isSimOn ? (
                <span className="font-bold flex items-center space-x-1.5 text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>ON</span>
                </span>
              ) : (
                <span className="font-bold flex items-center space-x-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>OFF</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section: Circuit Overview */}
        <div className="space-y-2.5 pt-3 border-t border-[#E2E8F0]">
          <h4 className="text-xs font-bold text-[#172033]">Circuit Overview</h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#64748B]">
                <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span>Components</span>
              </div>
              <span className="font-mono font-semibold text-[#172033]">{totalComponentsCount || 5}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#64748B]">
                <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <span>Connections</span>
              </div>
              <span className="font-mono font-semibold text-[#172033]">{totalConnectionsCount || 4}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#64748B]">
                <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span>Total Power</span>
              </div>
              <span className="font-mono font-semibold text-[#172033]">{totalPowerWatts.toFixed(3)} W</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

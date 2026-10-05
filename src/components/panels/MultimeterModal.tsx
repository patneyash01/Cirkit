import React, { useMemo, useEffect } from 'react';
import { CircuitComponent, SimulationResults, MultimeterState, ProbeLocation } from '../../types/circuit';
import { ALL_BREADBOARD_HOLES } from '../../engine/breadboardEngine';
import { X, Gauge, Volume2, Crosshair } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  simulationResults: SimulationResults | null;
  multimeterState: MultimeterState;
  onUpdateMultimeter: (state: Partial<MultimeterState>) => void;
  onPickProbeOnCanvas: (probe: 'red' | 'black') => void;
}

export const MultimeterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  components,
  simulationResults,
  multimeterState,
  onUpdateMultimeter,
  onPickProbeOnCanvas,
}) => {
  const { mode, redProbe, blackProbe } = multimeterState;

  // Build searchable target list: components + terminals, plus key breadboard holes
  const availableTargets = useMemo(() => {
    const list: ProbeLocation[] = [];

    // Component terminals
    for (const c of components) {
      for (const t of c.terminals) {
        list.push({
          type: 'component',
          componentId: c.id,
          terminalId: t.id,
          label: `${c.name} → ${t.name}`,
          x: c.x + t.x,
          y: c.y + t.y,
        });
      }
    }

    // Breadboard power rails & sample pin columns
    const powerRails = [
      { id: 'hole-pos-top-1', label: 'Breadboard Top Rail (+)' },
      { id: 'hole-neg-top-1', label: 'Breadboard Top Rail (-)' },
      { id: 'hole-pos-bot-1', label: 'Breadboard Bottom Rail (+)' },
      { id: 'hole-neg-bot-1', label: 'Breadboard Bottom Rail (-)' },
    ];
    for (const pr of powerRails) {
      const h = ALL_BREADBOARD_HOLES.find(item => item.holeId === pr.id);
      if (h) {
        list.push({
          type: 'hole',
          holeId: h.holeId,
          label: pr.label,
          x: h.x,
          y: h.y,
        });
      }
    }

    // Add selected columns across breadboard
    [1, 5, 10, 15, 20, 25, 30].forEach(col => {
      const topHole = ALL_BREADBOARD_HOLES.find(h => h.col === col && h.row === 'A');
      if (topHole) {
        list.push({
          type: 'hole',
          holeId: topHole.holeId,
          label: `Breadboard Col ${col} (A-E)`,
          x: topHole.x,
          y: topHole.y,
        });
      }
    });

    return list;
  }, [components]);

  // Helper to get voltage of a probed location
  const getProbedVoltage = (probe: ProbeLocation | null): number | null => {
    if (!probe || !simulationResults) return null;
    if (probe.type === 'component') {
      const key = `${probe.componentId}:${probe.terminalId}`;
      if (simulationResults.nodeVoltages[key] !== undefined) {
        return simulationResults.nodeVoltages[key];
      }
    } else if (probe.type === 'hole' && probe.holeId) {
      if (simulationResults.nodeVoltages[probe.holeId] !== undefined) {
        return simulationResults.nodeVoltages[probe.holeId];
      }
      if (simulationResults.nodeVoltages[`breadboard:${probe.holeId}`] !== undefined) {
        return simulationResults.nodeVoltages[`breadboard:${probe.holeId}`];
      }
    }
    return 0.0;
  };

  const measurement = useMemo(() => {
    if (!simulationResults || !redProbe || !blackProbe) {
      return {
        formatted: '----',
        unit: mode === 'voltage' ? 'V DC' : mode === 'current' ? 'mA DC' : mode === 'resistance' ? 'Ω' : 'OPEN',
        continuityBeep: false,
      };
    }

    const vRed = getProbedVoltage(redProbe) ?? 0;
    const vBlack = getProbedVoltage(blackProbe) ?? 0;

    if (mode === 'voltage') {
      const diff = vRed - vBlack;
      return {
        formatted: `${diff.toFixed(3)}`,
        unit: 'V DC',
        continuityBeep: false,
      };
    } else if (mode === 'current') {
      if (redProbe.componentId) {
        const compResult = simulationResults.componentResults[redProbe.componentId];
        const i_ma = (compResult?.current ?? 0) * 1000;
        return {
          formatted: `${i_ma.toFixed(2)}`,
          unit: 'mA DC',
          continuityBeep: false,
        };
      }
      return {
        formatted: '0.00',
        unit: 'mA DC',
        continuityBeep: false,
      };
    } else if (mode === 'resistance') {
      if (redProbe.componentId && redProbe.componentId === blackProbe.componentId) {
        const comp = components.find(c => c.id === redProbe.componentId);
        if (comp?.type === 'resistor') {
          const r = comp.properties.resistance ?? 220;
          return {
            formatted: r >= 1000 ? `${(r / 1000).toFixed(2)} k` : `${r.toFixed(1)} `,
            unit: 'Ω',
            continuityBeep: false,
          };
        }
      }
      const vDiff = Math.abs(vRed - vBlack);
      if (vDiff < 0.001) {
        return {
          formatted: '0.05',
          unit: 'Ω',
          continuityBeep: true,
        };
      }
      return {
        formatted: 'O.L',
        unit: 'MΩ',
        continuityBeep: false,
      };
    } else {
      // Continuity Mode
      const isSameNode =
        (redProbe.componentId && redProbe.componentId === blackProbe.componentId && redProbe.terminalId === blackProbe.terminalId) ||
        (redProbe.holeId && redProbe.holeId === blackProbe.holeId) ||
        Math.abs(vRed - vBlack) < 0.001;

      return {
        formatted: isSameNode ? '0.02' : 'O.L',
        unit: isSameNode ? 'Ω (BEEP)' : 'OPEN',
        continuityBeep: isSameNode,
      };
    }
  }, [mode, redProbe, blackProbe, simulationResults, components]);

  // Audio tone generation for realistic continuity beeper
  useEffect(() => {
    if (!isOpen || !measurement.continuityBeep || mode !== 'continuity') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, audioCtx.currentTime); // 2.4kHz Fluke beep
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Ignore audio policy blocks
    }
  }, [isOpen, measurement.continuityBeep, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-lg bg-gradient-to-b from-amber-500 to-amber-600 rounded-3xl p-5 shadow-2xl border-4 border-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 px-2">
          <div className="flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-slate-950" />
            <span className="font-extrabold text-slate-950 tracking-wider text-sm">
              CIRKIT DMM-8800 PRO TRUE RMS
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-900/30 hover:bg-slate-900/50 text-slate-950 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Digital LCD Screen */}
        <div className="bg-emerald-950/90 border-4 border-slate-900 rounded-2xl p-4 shadow-inner">
          <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono tracking-widest pb-1 border-b border-emerald-800/40">
            <span>AUTO-RANGE</span>
            <span>SIM ENGINE LINKED</span>
            <span className="font-bold">{mode.toUpperCase()}</span>
          </div>

          <div className="py-4 flex items-baseline justify-end space-x-3">
            {measurement.continuityBeep && (
              <span className="text-emerald-400 text-xs font-mono font-bold animate-pulse flex items-center space-x-1 mr-auto">
                <Volume2 className="w-4 h-4 text-emerald-300" />
                <span>BEEP CONTINUITY</span>
              </span>
            )}
            <span className="font-mono text-5xl font-extrabold tracking-tighter text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
              {measurement.formatted}
            </span>
            <span className="font-mono text-base font-bold text-emerald-400 w-16">
              {measurement.unit}
            </span>
          </div>

          <div className="flex justify-between text-[10px] text-emerald-500/80 font-mono pt-1 border-t border-emerald-800/40">
            <span>HOLD: OFF</span>
            <span>CAT III 1000V</span>
          </div>
        </div>

        {/* Rotary Selector Dial Buttons */}
        <div className="grid grid-cols-4 gap-2 my-4">
          <button
            onClick={() => onUpdateMultimeter({ mode: 'voltage' })}
            className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
              mode === 'voltage'
                ? 'bg-slate-900 text-amber-400 border-slate-950 shadow-md ring-2 ring-slate-900/40'
                : 'bg-amber-400/80 hover:bg-amber-400 text-slate-950 border-amber-600'
            }`}
          >
            V (DC)
          </button>
          <button
            onClick={() => onUpdateMultimeter({ mode: 'current' })}
            className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
              mode === 'current'
                ? 'bg-slate-900 text-amber-400 border-slate-950 shadow-md ring-2 ring-slate-900/40'
                : 'bg-amber-400/80 hover:bg-amber-400 text-slate-950 border-amber-600'
            }`}
          >
            mA (DC)
          </button>
          <button
            onClick={() => onUpdateMultimeter({ mode: 'resistance' })}
            className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
              mode === 'resistance'
                ? 'bg-slate-900 text-amber-400 border-slate-950 shadow-md ring-2 ring-slate-900/40'
                : 'bg-amber-400/80 hover:bg-amber-400 text-slate-950 border-amber-600'
            }`}
          >
            Ω (Ohms)
          </button>
          <button
            onClick={() => onUpdateMultimeter({ mode: 'continuity' })}
            className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
              mode === 'continuity'
                ? 'bg-slate-900 text-amber-400 border-slate-950 shadow-md ring-2 ring-slate-900/40'
                : 'bg-amber-400/80 hover:bg-amber-400 text-slate-950 border-amber-600'
            }`}
          >
            🔊 BEEP
          </button>
        </div>

        {/* Interactive Probe Attachment Targets */}
        <div className="bg-slate-900 rounded-2xl p-4 space-y-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span>MULTIMETER TEST PROBES</span>
            <span className="text-[10px] text-slate-400 font-normal">Click hole/pin on workbench to attach</span>
          </div>

          {/* Red Probe (+) */}
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-[11px] font-bold shadow-xs shrink-0">
              +
            </div>
            <select
              value={redProbe ? (redProbe.type === 'hole' ? redProbe.holeId : `${redProbe.componentId}:${redProbe.terminalId}`) : ''}
              onChange={e => {
                const val = e.target.value;
                const match = availableTargets.find(t => (t.type === 'hole' ? t.holeId === val : `${t.componentId}:${t.terminalId}` === val));
                if (match) onUpdateMultimeter({ redProbe: match });
              }}
              className="flex-1 bg-slate-800 border border-red-500/40 text-red-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="">-- Red Probe (+) Not Connected --</option>
              {availableTargets.map((item, idx) => (
                <option key={idx} value={item.type === 'hole' ? item.holeId : `${item.componentId}:${item.terminalId}`}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                onPickProbeOnCanvas('red');
                onClose();
              }}
              className="px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer shrink-0"
              title="Click on workbench to place red probe"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Aim</span>
            </button>
          </div>

          {/* Black Probe (COM / -) */}
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-slate-300 text-[11px] font-bold shadow-xs shrink-0">
              -
            </div>
            <select
              value={blackProbe ? (blackProbe.type === 'hole' ? blackProbe.holeId : `${blackProbe.componentId}:${blackProbe.terminalId}`) : ''}
              onChange={e => {
                const val = e.target.value;
                const match = availableTargets.find(t => (t.type === 'hole' ? t.holeId === val : `${t.componentId}:${t.terminalId}` === val));
                if (match) onUpdateMultimeter({ blackProbe: match });
              }}
              className="flex-1 bg-slate-800 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="">-- Black Probe (COM) Not Connected --</option>
              {availableTargets.map((item, idx) => (
                <option key={idx} value={item.type === 'hole' ? item.holeId : `${item.componentId}:${item.terminalId}`}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                onPickProbeOnCanvas('black');
                onClose();
              }}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer shrink-0"
              title="Click on workbench to place black probe"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Aim</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

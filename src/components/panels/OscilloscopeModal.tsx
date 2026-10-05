import React, { useEffect, useRef, useMemo } from 'react';
import {
  CircuitComponent,
  SimulationResults,
  OscilloscopeState,
  ProbeLocation,
} from '../../types/circuit';
import { ALL_BREADBOARD_HOLES } from '../../engine/breadboardEngine';
import { calculateOscilloscopeMeasurements, SamplePoint } from '../../engine/oscilloscopeEngine';
import { X, Play, Pause, RotateCcw, Activity, Crosshair } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  simulationResults: SimulationResults | null;
  oscilloscopeState: OscilloscopeState;
  onUpdateOscilloscope: (state: Partial<OscilloscopeState>) => void;
  onPickProbeOnCanvas: (channel: 'ch1' | 'ch2') => void;
  voltageHistory: Map<string, SamplePoint[]>;
}

export const OscilloscopeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  components,
  simulationResults,
  oscilloscopeState,
  onUpdateOscilloscope,
  onPickProbeOnCanvas,
  voltageHistory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    isRunning,
    timePerDiv,
    triggerLevel,
    triggerMode,
    channelA,
    channelB,
  } = oscilloscopeState;

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

    // Breadboard power rails & key columns
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

  // Helper to extract key for voltageHistory lookup
  const getProbeKey = (probe: ProbeLocation | null): string | null => {
    if (!probe) return null;
    if (probe.type === 'component') {
      return `${probe.componentId}:${probe.terminalId}`;
    }
    if (probe.type === 'hole' && probe.holeId) {
      return probe.holeId;
    }
    return null;
  };

  const keyA = getProbeKey(channelA.probe);
  const keyB = getProbeKey(channelB.probe);

  const samplesA = useMemo(() => {
    if (!keyA) return [];
    return voltageHistory.get(keyA) || voltageHistory.get(`breadboard:${keyA}`) || [];
  }, [voltageHistory, keyA]);

  const samplesB = useMemo(() => {
    if (!keyB) return [];
    return voltageHistory.get(keyB) || voltageHistory.get(`breadboard:${keyB}`) || [];
  }, [voltageHistory, keyB]);

  // Real-time automatic measurements
  const measurementsA = useMemo(() => calculateOscilloscopeMeasurements(samplesA), [samplesA]);
  const measurementsB = useMemo(() => calculateOscilloscopeMeasurements(samplesB), [samplesB]);

  const currentVoltageA = samplesA.length > 0 ? samplesA[samplesA.length - 1].v : null;
  const currentVoltageB = samplesB.length > 0 ? samplesB[samplesB.length - 1].v : null;

  // Waveform Canvas Rendering Loop
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Phosphor Grid (10 horizontal divisions, 8 vertical divisions)
    const numDivX = 10;
    const numDivY = 8;
    const divWidth = w / numDivX;
    const divHeight = h / numDivY;

    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i <= numDivX; i++) {
      ctx.moveTo(i * divWidth, 0);
      ctx.lineTo(i * divWidth, h);
    }
    for (let j = 0; j <= numDivY; j++) {
      ctx.moveTo(0, j * divHeight);
      ctx.lineTo(w, j * divHeight);
    }
    ctx.stroke();

    // Center Crosshairs with tick marks
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Ground reference baseline at 75% height (y = 6th division)
    const groundY = h * 0.75;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Ground marker indicator (GND ⏚)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText('⏚ GND', 6, groundY - 4);

    // Trigger level dashed line
    if (triggerLevel > 0) {
      const trigY = groundY - (triggerLevel / channelA.voltsPerDiv) * divHeight;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, trigY);
      ctx.lineTo(w, trigY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`T: ${triggerLevel.toFixed(1)}V`, w - 54, trigY - 3);
    }

    // Function to render a channel waveform
    const renderWave = (samples: SamplePoint[], color: string, voltsDiv: number) => {
      if (samples.length < 2) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const timeWindow = numDivX * timePerDiv;
      const latestT = samples[samples.length - 1].t;
      const startT = Math.max(0, latestT - timeWindow);

      let started = false;
      for (const p of samples) {
        if (p.t < startT) continue;
        const normX = ((p.t - startT) / timeWindow) * w;
        const normY = groundY - (p.v / voltsDiv) * divHeight;

        if (!started) {
          ctx.moveTo(normX, normY);
          started = true;
        } else {
          ctx.lineTo(normX, normY);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Render CH1 if enabled and has probe
    if (channelA.enabled && channelA.probe && samplesA.length > 0) {
      renderWave(samplesA, channelA.color, channelA.voltsPerDiv);
    }

    // Render CH2 if enabled and has probe
    if (channelB.enabled && channelB.probe && samplesB.length > 0) {
      renderWave(samplesB, channelB.color, channelB.voltsPerDiv);
    }

    // If neither channel has a probe connected, display "No Connection" hint
    if (!channelA.probe && !channelB.probe) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No Probes Connected to Circuit Nodes', w / 2, h / 2 - 10);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Select a breadboard hole or pin below to view live waveform', w / 2, h / 2 + 12);
      ctx.textAlign = 'start';
    }
  }, [
    isOpen,
    samplesA,
    samplesB,
    channelA.enabled,
    channelA.probe,
    channelA.voltsPerDiv,
    channelA.color,
    channelB.enabled,
    channelB.probe,
    channelB.voltsPerDiv,
    channelB.color,
    timePerDiv,
    triggerLevel,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-3xl bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-700 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-slate-100 text-sm tracking-wide">
              CIRKIT DSO-4000 BENCHTOP DIGITAL STORAGE OSCILLOSCOPE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Oscilloscope Screen */}
        <div className="mt-4 relative rounded-2xl overflow-hidden border-4 border-slate-950 shadow-inner bg-slate-950">
          <canvas
            ref={canvasRef}
            width={720}
            height={340}
            className="w-full h-auto block"
          />

          {/* Live Top Readouts: CH1, CH2, Timebase */}
          <div className="absolute top-2.5 left-3 flex items-center space-x-4 font-mono text-[11px]">
            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-0.5 rounded border border-amber-500/40 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="font-bold">CH1:</span>
              <span>
                {channelA.probe
                  ? `${channelA.probe.label} (${(currentVoltageA ?? 0).toFixed(2)}V)`
                  : 'Not Connected'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-0.5 rounded border border-sky-500/40 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
              <span className="font-bold">CH2:</span>
              <span>
                {channelB.probe
                  ? `${channelB.probe.label} (${(currentVoltageB ?? 0).toFixed(2)}V)`
                  : 'Not Connected'}
              </span>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="absolute bottom-2.5 right-3 font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            {isRunning ? (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>RUNNING</span>
              </span>
            ) : (
              <span className="text-amber-400 font-bold">❚❚ STOPPED</span>
            )}
          </div>
        </div>

        {/* Real Automatic Measurements Bar */}
        <div className="mt-3 bg-slate-950 rounded-xl p-2.5 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs font-mono">
          <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Vmax</span>
            <span className="font-bold text-amber-400">
              {channelA.probe ? `${measurementsA.vMax}V` : '----'}
            </span>
          </div>
          <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Vmin</span>
            <span className="font-bold text-amber-400">
              {channelA.probe ? `${measurementsA.vMin}V` : '----'}
            </span>
          </div>
          <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Vpp</span>
            <span className="font-bold text-amber-400">
              {channelA.probe ? `${measurementsA.vPp}V` : '----'}
            </span>
          </div>
          <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Vavg</span>
            <span className="font-bold text-amber-400">
              {channelA.probe ? `${measurementsA.vAvg}V` : '----'}
            </span>
          </div>
          <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Freq</span>
            <span className="font-bold text-emerald-400">
              {channelA.probe && measurementsA.frequency > 0 ? `${measurementsA.frequency}Hz` : '----'}
            </span>
          </div>
          <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Period</span>
            <span className="font-bold text-emerald-400">
              {channelA.probe && measurementsA.period > 0 ? `${(measurementsA.period * 1000).toFixed(1)}ms` : '----'}
            </span>
          </div>
          <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Duty</span>
            <span className="font-bold text-sky-400">
              {channelA.probe ? `${measurementsA.dutyCycle}%` : '----'}
            </span>
          </div>
        </div>

        {/* Front Panel Controls */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
          {/* Timebase (Time/Div) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Horizontal Time / Div
            </label>
            <select
              value={timePerDiv}
              onChange={e => onUpdateOscilloscope({ timePerDiv: parseFloat(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value={0.001}>1 ms / div</option>
              <option value={0.002}>2 ms / div</option>
              <option value={0.005}>5 ms / div</option>
              <option value={0.01}>10 ms / div</option>
              <option value={0.02}>20 ms / div</option>
              <option value={0.05}>50 ms / div</option>
              <option value={0.1}>100 ms / div</option>
              <option value={0.2}>200 ms / div</option>
            </select>
          </div>

          {/* CH1 Volts/Div */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              CH1 Vertical Scale (Volts/Div)
            </label>
            <select
              value={channelA.voltsPerDiv}
              onChange={e =>
                onUpdateOscilloscope({
                  channelA: { ...channelA, voltsPerDiv: parseFloat(e.target.value) },
                })
              }
              className="w-full bg-slate-900 border border-amber-500/40 rounded-lg p-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value={0.5}>0.5 V / div</option>
              <option value={1.0}>1.0 V / div</option>
              <option value={2.0}>2.0 V / div</option>
              <option value={5.0}>5.0 V / div</option>
            </select>
          </div>

          {/* CH2 Volts/Div */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
              CH2 Vertical Scale (Volts/Div)
            </label>
            <select
              value={channelB.voltsPerDiv}
              onChange={e =>
                onUpdateOscilloscope({
                  channelB: { ...channelB, voltsPerDiv: parseFloat(e.target.value) },
                })
              }
              className="w-full bg-slate-900 border border-sky-500/40 rounded-lg p-1.5 text-xs text-sky-300 focus:outline-none focus:border-sky-400 font-mono"
            >
              <option value={0.5}>0.5 V / div</option>
              <option value={1.0}>1.0 V / div</option>
              <option value={2.0}>2.0 V / div</option>
              <option value={5.0}>5.0 V / div</option>
            </select>
          </div>
        </div>

        {/* Interactive Probe Attachment Targets */}
        <div className="mt-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>OSCILLOSCOPE PROBES</span>
            <span className="text-[10px] text-slate-500 font-normal">
              Click &quot;Aim&quot; to pick any breadboard hole, component pin, or Arduino pin directly on the bench
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* CH1 Probe */}
            <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-amber-500/30">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 font-mono shrink-0">
                CH1
              </span>
              <select
                value={channelA.probe ? (channelA.probe.type === 'hole' ? channelA.probe.holeId : `${channelA.probe.componentId}:${channelA.probe.terminalId}`) : ''}
                onChange={e => {
                  const val = e.target.value;
                  const match = availableTargets.find(t => (t.type === 'hole' ? t.holeId === val : `${t.componentId}:${t.terminalId}` === val));
                  onUpdateOscilloscope({
                    channelA: { ...channelA, probe: match || null },
                  });
                }}
                className="flex-1 bg-slate-800 border border-amber-500/40 text-amber-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="">-- CH1 Probe Not Connected --</option>
                {availableTargets.map((item, idx) => (
                  <option key={idx} value={item.type === 'hole' ? item.holeId : `${item.componentId}:${item.terminalId}`}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  onPickProbeOnCanvas('ch1');
                  onClose();
                }}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer shrink-0"
                title="Click on workbench to attach CH1 probe"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Aim</span>
              </button>
            </div>

            {/* CH2 Probe */}
            <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-sky-500/30">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500 text-slate-950 font-mono shrink-0">
                CH2
              </span>
              <select
                value={channelB.probe ? (channelB.probe.type === 'hole' ? channelB.probe.holeId : `${channelB.probe.componentId}:${channelB.probe.terminalId}`) : ''}
                onChange={e => {
                  const val = e.target.value;
                  const match = availableTargets.find(t => (t.type === 'hole' ? t.holeId === val : `${t.componentId}:${t.terminalId}` === val));
                  onUpdateOscilloscope({
                    channelB: { ...channelB, probe: match || null },
                  });
                }}
                className="flex-1 bg-slate-800 border border-sky-500/40 text-sky-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="">-- CH2 Probe Not Connected --</option>
                {availableTargets.map((item, idx) => (
                  <option key={idx} value={item.type === 'hole' ? item.holeId : `${item.componentId}:${item.terminalId}`}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  onPickProbeOnCanvas('ch2');
                  onClose();
                }}
                className="px-2 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer shrink-0"
                title="Click on workbench to attach CH2 probe"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Aim</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons: Run/Stop, Auto, Clear, Trigger */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUpdateOscilloscope({ isRunning: !isRunning })}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Stop / Freeze' : 'Run / Live'}</span>
            </button>

            <button
              onClick={() =>
                onUpdateOscilloscope({
                  triggerMode: triggerMode === 'auto' ? 'single' : 'auto',
                })
              }
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Mode: {triggerMode.toUpperCase()}
            </button>

            <button
              onClick={() => {
                voltageHistory.clear();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span>Trig Level:</span>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={triggerLevel}
              onChange={e => onUpdateOscilloscope({ triggerLevel: parseFloat(e.target.value) })}
              className="w-24 accent-amber-500"
            />
            <span className="w-8 text-amber-400 font-bold">{triggerLevel.toFixed(1)}V</span>
          </div>
        </div>
      </div>
    </div>
  );
};

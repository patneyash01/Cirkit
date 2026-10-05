import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CircuitComponent, Connection, SimulationResults, ViewMode, MultimeterState, OscilloscopeState, ProbeLocation } from '../../types/circuit';
import {
  BreadboardHoleInfo,
  BREADBOARD_HOLES_BY_ID,
  findNearestBreadboardHole,
  BREADBOARD_ORIGIN_X,
  BREADBOARD_ORIGIN_Y,
  BREADBOARD_COLS,
} from '../../engine/breadboardEngine';
import { SamplePoint } from '../../engine/oscilloscopeEngine';
import { ComponentRenderer } from './ComponentRenderer';
import { PhysicalComponentRenderer } from './PhysicalComponentRenderer';
import { BreadboardCanvasOverlay } from './BreadboardCanvasOverlay';

interface Props {
  components: CircuitComponent[];
  connections: Connection[];
  simulationResults: SimulationResults | null;
  selectedComponentId: string | null;
  selectedConnectionId: string | null;
  viewMode: ViewMode;
  showBreadboard: boolean;
  placementType?: string | null;
  onExitPlacementMode?: () => void;
  onSelectComponent: (id: string | null) => void;
  onSelectConnection: (id: string | null) => void;
  onUpdateComponentPosition: (id: string, x: number, y: number) => void;
  onDeleteComponent?: (id: string) => void;
  onAddConnection: (fromComp: string, fromTerm: string, toComp: string, toTerm: string) => void;
  onDeleteConnection: (id: string) => void;
  onToggleSwitch: (componentId: string) => void;
  onDropNewComponent: (type: string, x: number, y: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onUpdateWireColor?: (wireId: string, color: string) => void;
  canvasRef?: React.RefObject<SVGSVGElement | null>;
  onOpenMultimeter?: () => void;
  onOpenOscilloscope?: () => void;
  multimeterState?: MultimeterState;
  oscilloscopeState?: OscilloscopeState;
  onUpdateMultimeter?: (state: Partial<MultimeterState>) => void;
  onUpdateOscilloscope?: (state: Partial<OscilloscopeState>) => void;
  activeProbeToPlace?: 'dmm_red' | 'dmm_black' | 'scope_ch1' | 'scope_ch2' | null;
  onPlaceProbe?: (probeType: 'dmm_red' | 'dmm_black' | 'scope_ch1' | 'scope_ch2', location: ProbeLocation) => void;
  onCancelProbePlace?: () => void;
  voltageHistory?: Map<string, SamplePoint[]>;
}

// Automatic realistic wire color logic based on connected terminals
function getWireColor(conn: Connection, components: CircuitComponent[]): string {
  if (conn.color) return conn.color;

  // If connected to ground
  if (
    conn.fromTerminalId === 'gnd' ||
    conn.toTerminalId === 'gnd' ||
    conn.fromTerminalId === 'neg' ||
    conn.toTerminalId === 'neg'
  ) {
    return '#172033'; // Black / Dark Navy GND jumper wire
  }

  // If connected to positive power
  if (
    conn.fromTerminalId === 'pos' ||
    conn.toTerminalId === 'pos' ||
    conn.fromTerminalId === '5v' ||
    conn.toTerminalId === '5v' ||
    conn.fromTerminalId === 'vcc' ||
    conn.toTerminalId === 'vcc'
  ) {
    return '#dc2626'; // Red VCC jumper wire
  }

  // Signal / Loop wire color based on component index
  const colors = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0284c7'];
  const hash = (conn.fromComponentId.length + conn.toComponentId.length) % colors.length;
  return colors[hash];
}

export const CircuitCanvas: React.FC<Props> = ({
  components,
  connections,
  simulationResults,
  selectedComponentId,
  selectedConnectionId,
  viewMode,
  showBreadboard,
  placementType,
  onExitPlacementMode,
  onSelectComponent,
  onSelectConnection,
  onUpdateComponentPosition,
  onDeleteComponent,
  onAddConnection,
  onDeleteConnection,
  onToggleSwitch,
  onDropNewComponent,
  zoom,
  onUpdateWireColor,
  canvasRef,
  onOpenMultimeter,
  onOpenOscilloscope,
  multimeterState,
  oscilloscopeState,
  onUpdateMultimeter,
  onUpdateOscilloscope,
  activeProbeToPlace,
  onPlaceProbe,
  onCancelProbePlace,
  voltageHistory,
}) => {
  const localSvgRef = useRef<SVGSVGElement | null>(null);
  const activeSvgRef = canvasRef || localSvgRef;

  // Pan offsets
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Panning state when dragging on empty canvas
  const [panState, setPanState] = useState<{
    startClientX: number;
    startClientY: number;
    originPanX: number;
    originPanY: number;
    isMoved: boolean;
  } | null>(null);

  // Component dragging state (starts strictly on component mousedown, stops strictly on mouseup)
  const [dragState, setDragState] = useState<{
    componentId: string;
    startClientX: number;
    startClientY: number;
    originCompX: number;
    originCompY: number;
    isMoved: boolean;
  } | null>(null);

  // Wiring state: click terminal A -> click terminal B
  const [pendingWireStart, setPendingWireStart] = useState<{
    componentId: string;
    terminalId: string;
    x: number;
    y: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredHoleId, setHoveredHoleId] = useState<string | null>(null);

  // Helper to snap to 20px grid
  const snapToGrid = (val: number, step = 20) => Math.round(val / step) * step;

  // Convert client mouse coordinates to Canvas coordinates taking zoom and pan into account
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!activeSvgRef.current) return { x: 0, y: 0 };
      const rect = activeSvgRef.current.getBoundingClientRect();
      const rawX = clientX - rect.left - panOffset.x;
      const rawY = clientY - rect.top - panOffset.y;
      return {
        x: rawX / zoom,
        y: rawY / zoom,
      };
    },
    [activeSvgRef, panOffset, zoom]
  );

  // Compute absolute terminal coordinate on canvas
  const getTerminalAbsolutePos = useCallback(
    (componentId: string, terminalId: string): { x: number; y: number } | null => {
      if (componentId === 'breadboard') {
        const hole = BREADBOARD_HOLES_BY_ID.get(terminalId);
        if (hole) return { x: hole.x, y: hole.y };
        return null;
      }
      const comp = components.find(c => c.id === componentId);
      if (!comp) return null;
      const term = comp.terminals.find(t => t.id === terminalId);
      if (!term) return null;

      // Handle rotation (0, 90, 180, 270)
      const rad = (comp.rotation * Math.PI) / 180;
      const rotX = term.x * Math.cos(rad) - term.y * Math.sin(rad);
      const rotY = term.x * Math.sin(rad) + term.y * Math.cos(rad);

      return {
        x: comp.x + rotX,
        y: comp.y + rotY,
      };
    },
    [components]
  );

  // Collect set of all connected terminals
  const connectedTerminals = new Set<string>();
  for (const c of connections) {
    connectedTerminals.add(`${c.fromComponentId}:${c.fromTerminalId}`);
    connectedTerminals.add(`${c.toComponentId}:${c.toTerminalId}`);
  }

  // Handle Drag & Drop from left library
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type =
      e.dataTransfer.getData('application/cirkit-component') ||
      e.dataTransfer.getData('text/plain');
    if (!type) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const snappedX = snapToGrid(coords.x);
    const snappedY = snapToGrid(coords.y);
    onDropNewComponent(type, snappedX, snappedY);
    onExitPlacementMode?.();
  };

  // Component Mouse Down: selects immediately and primes drag
  const handleComponentMouseDown = (compId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // If we were in placement mode, exit it
    if (placementType) {
      onExitPlacementMode?.();
    }

    // Cancel any pending wire connection
    setPendingWireStart(null);

    // Select this component, deselect any wire
    onSelectComponent(compId);
    onSelectConnection(null);

    if (e.button === 0) {
      const comp = components.find(c => c.id === compId);
      if (comp) {
        setDragState({
          componentId: compId,
          startClientX: e.clientX,
          startClientY: e.clientY,
          originCompX: comp.x,
          originCompY: comp.y,
          isMoved: false,
        });
      }
    }
  };

  // Component Click: ensure propagation is stopped so canvas background doesn't deselect
  const handleComponentClick = (compId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (placementType) {
      onExitPlacementMode?.();
    }
    onSelectComponent(compId);
    onSelectConnection(null);
  };

  // Canvas Mouse Down: starts pan tracking or prepares single-click deselect
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setPanState({
        startClientX: e.clientX,
        startClientY: e.clientY,
        originPanX: panOffset.x,
        originPanY: panOffset.y,
        isMoved: false,
      });
    }
  };

  // Canvas Mouse Move: moves active component or pans canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // If pulling a pending wire or placing an instrument probe, snap to nearest breadboard hole
    if (pendingWireStart || activeProbeToPlace) {
      const nearHole = findNearestBreadboardHole(coords.x, coords.y, 14);
      if (nearHole) {
        setMousePos({ x: nearHole.x, y: nearHole.y });
        setHoveredHoleId(nearHole.holeId);
      } else {
        setMousePos(coords);
        setHoveredHoleId(null);
      }
    } else {
      setMousePos(coords);
    }

    if (dragState) {
      const dx = e.clientX - dragState.startClientX;
      const dy = e.clientY - dragState.startClientY;
      if (Math.hypot(dx, dy) > 3) {
        dragState.isMoved = true;
        const newX = snapToGrid(dragState.originCompX + dx / zoom);
        const newY = snapToGrid(dragState.originCompY + dy / zoom);
        onUpdateComponentPosition(dragState.componentId, newX, newY);
      }
    } else if (panState) {
      const dx = e.clientX - panState.startClientX;
      const dy = e.clientY - panState.startClientY;
      if (Math.hypot(dx, dy) > 3) {
        panState.isMoved = true;
        setPanOffset({
          x: panState.originPanX + dx,
          y: panState.originPanY + dy,
        });
      }
    }
  };

  // Canvas Mouse Up / Click: releases drag or deselects/places
  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    // If we were dragging a component, release it cleanly
    if (dragState) {
      setDragState(null);
      return;
    }

    // In Placement Mode -> Place EXACTLY ONE component and IMMEDIATELY exit placement mode
    if (placementType) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const snappedX = snapToGrid(coords.x);
      const snappedY = snapToGrid(coords.y);
      onDropNewComponent(placementType, snappedX, snappedY);
      onExitPlacementMode?.();
      setPanState(null);
      return;
    }

    if (panState) {
      const didMove = panState.isMoved;
      setPanState(null);

      // If user clicked without dragging -> DESELECT EVERYTHING
      if (!didMove) {
        onSelectComponent(null);
        onSelectConnection(null);
        setPendingWireStart(null);
        if (activeProbeToPlace) {
          onCancelProbePlace?.();
        }
      }
    }
  };

  // Global window mouseup safety listener to guarantee drag never gets stuck
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDragState(null);
      setPanState(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Breadboard Hole Click: wire or probe attachment
  const handleBreadboardHoleClick = (hole: BreadboardHoleInfo, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeProbeToPlace) {
      onPlaceProbe?.(activeProbeToPlace, {
        type: 'hole',
        holeId: hole.holeId,
        label: `Hole ${hole.row}-${hole.col}`,
        x: hole.x,
        y: hole.y,
      });
      return;
    }

    if (pendingWireStart) {
      if (pendingWireStart.componentId === 'breadboard' && pendingWireStart.terminalId === hole.holeId) {
        setPendingWireStart(null);
        return;
      }
      onAddConnection(pendingWireStart.componentId, pendingWireStart.terminalId, 'breadboard', hole.holeId);
      setPendingWireStart(null);
    } else {
      setPendingWireStart({
        componentId: 'breadboard',
        terminalId: hole.holeId,
        x: hole.x,
        y: hole.y,
      });
    }
  };

  // Terminal Click: starts or completes a wire, or attaches a probe
  const handleTerminalClick = (compId: string, termId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Cancel placement mode if clicking terminal
    if (placementType) {
      onExitPlacementMode?.();
    }

    if (activeProbeToPlace) {
      const pos = getTerminalAbsolutePos(compId, termId);
      const comp = components.find(c => c.id === compId);
      const term = comp?.terminals.find(t => t.id === termId);
      if (pos && comp && term) {
        onPlaceProbe?.(activeProbeToPlace, {
          type: 'component',
          componentId: compId,
          terminalId: termId,
          label: `${comp.name} → ${term.name}`,
          x: pos.x,
          y: pos.y,
        });
      }
      return;
    }

    if (!pendingWireStart) {
      const pos = getTerminalAbsolutePos(compId, termId);
      if (pos) {
        setPendingWireStart({
          componentId: compId,
          terminalId: termId,
          x: pos.x,
          y: pos.y,
        });
      }
    } else {
      if (pendingWireStart.componentId === compId && pendingWireStart.terminalId === termId) {
        setPendingWireStart(null);
        return;
      }

      onAddConnection(
        pendingWireStart.componentId,
        pendingWireStart.terminalId,
        compId,
        termId
      );
      setPendingWireStart(null);
    }
  };

  // Keyboard shortcut listener for deletion and ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'Escape') {
        onSelectComponent(null);
        onSelectConnection(null);
        setPendingWireStart(null);
        onExitPlacementMode?.();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          onDeleteComponent?.(selectedComponentId);
          onSelectComponent(null);
        } else if (selectedConnectionId) {
          onDeleteConnection(selectedConnectionId);
          onSelectConnection(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, selectedConnectionId, onDeleteComponent, onDeleteConnection, onSelectComponent, onSelectConnection, onExitPlacementMode]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${
        placementType ? 'cursor-crosshair' : 'cursor-default'
      }`}
      style={{
        backgroundColor: viewMode === 'physical' ? '#e2e8f0' : '#F5F7FA',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Placement Mode Active Indicator Banner */}
      {placementType && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2.5 text-xs font-mono bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg border border-blue-400 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="font-bold">
            Placing: <span className="uppercase text-amber-300">{placementType.replace('_', ' ')}</span>
          </span>
          <span>•</span>
          <span>Click canvas once to place</span>
          <span>•</span>
          <button
            onClick={() => onExitPlacementMode?.()}
            className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] cursor-pointer"
          >
            Cancel (ESC)
          </button>
        </div>
      )}

      {/* Floating Wire Properties / Color Palette Bar when wire is selected */}
      {selectedConnectionId && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 text-xs font-mono bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg border border-[#CBD5E1] animate-in fade-in">
          <span className="font-bold text-[#172033] text-[11px]">Wire Color:</span>
          {[
            { id: '#dc2626', name: 'Red (+VCC)' },
            { id: '#172033', name: 'Black (GND)' },
            { id: '#eab308', name: 'Yellow' },
            { id: '#16a34a', name: 'Green' },
            { id: '#2563eb', name: 'Blue' },
            { id: '#f8fafc', name: 'White' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => onUpdateWireColor?.(selectedConnectionId, c.id)}
              className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs hover:scale-125 transition-transform cursor-pointer"
              style={{ backgroundColor: c.id }}
              title={c.name}
            />
          ))}
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button
            onClick={() => onDeleteConnection(selectedConnectionId)}
            className="text-red-600 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 text-[11px] cursor-pointer"
            title="Delete Wire"
          >
            Delete
          </button>
        </div>
      )}

      {/* Compact Lab Mode Indicator */}
      <div className="absolute top-2 left-2 z-10 flex items-center space-x-2 text-[10px] font-mono bg-white/85 backdrop-blur-xs px-2 py-0.5 rounded border border-[#CBD5E1] shadow-2xs text-[#64748B] pointer-events-none">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        <span className="font-extrabold text-[#172033] tracking-wider">
          {viewMode === 'physical' ? 'PHYSICAL LAB' : 'SCHEMATIC CAD'}
        </span>
        <span>•</span>
        <span>{Math.round(zoom * 100)}%</span>
        {pendingWireStart && (
          <span className="text-blue-600 font-bold animate-pulse">
            • Wire mode (ESC)
          </span>
        )}
      </div>

      <svg
        ref={activeSvgRef}
        id="circuit-main-svg"
        className="w-full h-full"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <defs>
          {/* Warm Laboratory Wooden Desk Surface */}
          <radialGradient id="lab-workbench-wood" cx="48%" cy="38%" r="72%">
            <stop offset="0%" stopColor="#dfaf7b" />
            <stop offset="35%" stopColor="#d19c67" />
            <stop offset="70%" stopColor="#bc8852" />
            <stop offset="100%" stopColor="#9a6936" />
          </radialGradient>
          <pattern id="wood-grain-pattern" width="400" height="24" patternUnits="userSpaceOnUse">
            <line x1="0" y1="6" x2="400" y2="6" stroke="#78350f" strokeWidth="0.6" opacity="0.08" />
            <line x1="0" y1="18" x2="400" y2="18" stroke="#78350f" strokeWidth="0.8" opacity="0.06" />
          </pattern>

          {/* Subtle light engineering grid pattern */}
          <pattern id="light-grid-pattern" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#94A3B8" opacity="0.4" />
          </pattern>
          <pattern id="light-major-grid-pattern" width={100 * zoom} height={100 * zoom} patternUnits="userSpaceOnUse">
            <rect width={100 * zoom} height={100 * zoom} fill="none" stroke="#CBD5E1" strokeWidth="1" opacity="0.6" />
          </pattern>

          {/* Studio Spotlight over Workbench in Physical Mode */}
          <radialGradient id="wood-lighting" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#78350f" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#451a03" stopOpacity="0.45" />
          </radialGradient>

          {/* Jumper wire drop shadow filter */}
          <filter id="wire-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* Workbench Surface Background: Wood in physical, light schematic in CAD */}
        <rect
          id="circuit-bg"
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={viewMode === 'physical' ? 'url(#lab-workbench-wood)' : '#F8FAFC'}
        />

        {/* Fine Wood Grain Overlay & Lighting in Physical Mode */}
        {viewMode === 'physical' && (
          <>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#wood-grain-pattern)" className="pointer-events-none" />
            <rect x="0" y="0" width="100%" height="100%" fill="url(#wood-lighting)" className="pointer-events-none" />
          </>
        )}

        {/* Grid Overlay only in Schematic Mode */}
        {viewMode === 'schematic' && (
          <>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#light-grid-pattern)" className="pointer-events-none" />
            <rect x="0" y="0" width="100%" height="100%" fill="url(#light-major-grid-pattern)" className="pointer-events-none" />
          </>
        )}

        {/* Transformed Workspace Group */}
        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
          {/* Solderless Breadboard in Center */}
          {showBreadboard && (
            <BreadboardCanvasOverlay
              x={BREADBOARD_ORIGIN_X}
              y={BREADBOARD_ORIGIN_Y}
              cols={BREADBOARD_COLS}
              onHoleClick={handleBreadboardHoleClick}
              hoveredHoleId={hoveredHoleId}
            />
          )}

          {/* Physical Mode Instruments on Workbench (Right of Breadboard) */}
          {viewMode === 'physical' && (() => {
            // Multimeter calculation
            const dmmVRed = multimeterState?.redProbe
              ? (multimeterState.redProbe.type === 'hole' && multimeterState.redProbe.holeId
                  ? simulationResults?.nodeVoltages[multimeterState.redProbe.holeId] ??
                    simulationResults?.nodeVoltages[`breadboard:${multimeterState.redProbe.holeId}`] ??
                    0
                  : simulationResults?.nodeVoltages[`${multimeterState.redProbe.componentId}:${multimeterState.redProbe.terminalId}`] ?? 0)
              : null;

            const dmmVBlack = multimeterState?.blackProbe
              ? (multimeterState.blackProbe.type === 'hole' && multimeterState.blackProbe.holeId
                  ? simulationResults?.nodeVoltages[multimeterState.blackProbe.holeId] ??
                    simulationResults?.nodeVoltages[`breadboard:${multimeterState.blackProbe.holeId}`] ??
                    0
                  : simulationResults?.nodeVoltages[`${multimeterState.blackProbe.componentId}:${multimeterState.blackProbe.terminalId}`] ?? 0)
              : null;

            const dmmReadingStr =
              dmmVRed !== null && dmmVBlack !== null
                ? (dmmVRed - dmmVBlack).toFixed(2)
                : '----';

            // Oscilloscope waveforms
            const ch1Probe = oscilloscopeState?.channelA.probe;
            const ch2Probe = oscilloscopeState?.channelB.probe;

            const key1 = ch1Probe ? (ch1Probe.type === 'hole' ? ch1Probe.holeId : `${ch1Probe.componentId}:${ch1Probe.terminalId}`) : null;
            const key2 = ch2Probe ? (ch2Probe.type === 'hole' ? ch2Probe.holeId : `${ch2Probe.componentId}:${ch2Probe.terminalId}`) : null;

            const samples1 = key1 ? voltageHistory?.get(key1) || voltageHistory?.get(`breadboard:${key1}`) || [] : [];
            const samples2 = key2 ? voltageHistory?.get(key2) || voltageHistory?.get(`breadboard:${key2}`) || [] : [];

            // Mini trace path generator for oscilloscope screen
            const generateMiniTrace = (samples: SamplePoint[], color: string, vDiv: number) => {
              if (samples.length < 2) return null;
              const w = 152;
              const h = 90;
              const groundY = h * 0.75;
              const latestT = samples[samples.length - 1].t;
              const timeWindow = 10 * (oscilloscopeState?.timePerDiv ?? 0.01);
              const startT = Math.max(0, latestT - timeWindow);

              let d = '';
              for (let i = 0; i < samples.length; i++) {
                const p = samples[i];
                if (p.t < startT) continue;
                const px = ((p.t - startT) / timeWindow) * w + 16;
                const py = groundY - (p.v / vDiv) * (h / 8) + 26;
                d += (d === '' ? `M ${px} ${py}` : ` L ${px} ${py}`);
              }
              return <path d={d} fill="none" stroke={color} strokeWidth="1.8" className="drop-shadow-[0_0_4px_currentColor]" />;
            };

            return (
              <g className="select-none">
                {/* 1. DIGITAL MULTIMETER (Positioned on Right Side of Breadboard) */}
                <g
                  transform="translate(980, 110)"
                  className="cursor-pointer group"
                  onClick={() => onOpenMultimeter?.()}
                >
                  <title>Digital Multimeter (Click to open inspector or set probes)</title>
                  {/* Cast Shadow */}
                  <rect x="-42" y="-12" width="84" height="152" rx="14" fill="#0f172a" opacity="0.25" transform="translate(4, 8)" />

                  {/* Yellow Protective Rubber Boot */}
                  <rect x="-40" y="-10" width="80" height="148" rx="14" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
                  {/* Dark Grey Meter Inner Body */}
                  <rect x="-34" y="-4" width="68" height="136" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />

                  {/* Brand Logo & Model */}
                  <text x="0" y="8" fill="#facc15" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    CIRKIT DMM
                  </text>

                  {/* LCD Digital Display Screen */}
                  <rect x="-28" y="14" width="56" height="34" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                  <text x="18" y="38" fill="#0f172a" fontSize="16" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                    {dmmReadingStr}
                  </text>
                  <text x="24" y="30" fill="#0f172a" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                    V
                  </text>
                  <text x="24" y="38" fill="#0f172a" fontSize="6" fontWeight="bold" fontFamily="sans-serif">
                    DC
                  </text>

                  {/* Rotary Switch Dial */}
                  <g transform="translate(0, 78)">
                    <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                    <circle cx="0" cy="0" r="15" fill="#334155" />
                    <line x1="0" y1="0" x2="-8" y2="-12" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
                  </g>

                  {/* Input Jack Sockets */}
                  <g transform="translate(0, 114)">
                    <circle cx="-14" cy="0" r="4.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
                    <circle cx="-14" cy="0" r="2" fill="#0f172a" />
                    <circle cx="0" cy="0" r="4.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <circle cx="0" cy="0" r="2" fill="#475569" />
                    <circle cx="14" cy="0" r="4.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
                    <circle cx="14" cy="0" r="2" fill="#0f172a" />
                  </g>
                </g>

                {/* Multimeter Probes & Test Leads */}
                {(() => {
                  const redDest = multimeterState?.redProbe ? { x: multimeterState.redProbe.x, y: multimeterState.redProbe.y } : { x: 960, y: 260 };
                  const blackDest = multimeterState?.blackProbe ? { x: multimeterState.blackProbe.x, y: multimeterState.blackProbe.y } : { x: 990, y: 260 };

                  const redJack = { x: 980 - 14, y: 110 + 114 };
                  const blackJack = { x: 980, y: 110 + 114 };

                  const rMidX = (redJack.x + redDest.x) / 2 - 20;
                  const rMidY = (redJack.y + redDest.y) / 2 + 35;
                  const bMidX = (blackJack.x + blackDest.x) / 2 + 20;
                  const bMidY = (blackJack.y + blackDest.y) / 2 + 40;

                  return (
                    <g className="pointer-events-none">
                      {/* Red Test Lead Cable */}
                      <path
                        d={`M ${redJack.x} ${redJack.y} Q ${rMidX} ${rMidY} ${redDest.x} ${redDest.y}`}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        className="drop-shadow-sm"
                      />
                      {/* Red Probe Hand Wand & Needle */}
                      <rect
                        x={redDest.x - 3.5}
                        y={redDest.y - 28}
                        width="7"
                        height="26"
                        rx="2"
                        fill="#dc2626"
                        stroke="#991b1b"
                        strokeWidth="0.8"
                        transform={`rotate(-20 ${redDest.x} ${redDest.y})`}
                      />
                      <circle cx={redDest.x} cy={redDest.y} r="3" fill="#cbd5e1" stroke="#dc2626" strokeWidth="1.2" />

                      {/* Black Test Lead Cable */}
                      <path
                        d={`M ${blackJack.x} ${blackJack.y} Q ${bMidX} ${bMidY} ${blackDest.x} ${blackDest.y}`}
                        fill="none"
                        stroke="#172033"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        className="drop-shadow-sm"
                      />
                      {/* Black Probe Hand Wand & Needle */}
                      <rect
                        x={blackDest.x - 3.5}
                        y={blackDest.y - 28}
                        width="7"
                        height="26"
                        rx="2"
                        fill="#172033"
                        stroke="#0f172a"
                        strokeWidth="0.8"
                        transform={`rotate(20 ${blackDest.x} ${blackDest.y})`}
                      />
                      <circle cx={blackDest.x} cy={blackDest.y} r="3" fill="#cbd5e1" stroke="#172033" strokeWidth="1.2" />
                    </g>
                  );
                })()}

                {/* 2. BENCHTOP DIGITAL OSCILLOSCOPE (Positioned beside Breadboard) */}
                <g
                  transform="translate(980, 320)"
                  className="cursor-pointer group"
                  onClick={() => onOpenOscilloscope?.()}
                >
                  <title>Digital Oscilloscope (Click to open scope controls)</title>
                  {/* Cast Shadow */}
                  <rect x="-14" y="-10" width="288" height="154" rx="14" fill="#0f172a" opacity="0.28" transform="translate(6, 10)" />

                  {/* Chassis Enclosure */}
                  <rect x="-10" y="-8" width="280" height="148" rx="10" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
                  <text x="14" y="10" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                    CIRKIT DSO-4000 Oscilloscope
                  </text>

                  {/* CRT / LCD Display Screen */}
                  <rect x="8" y="18" width="168" height="110" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  {/* Phosphor Grid Lines on Screen */}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line
                      key={`ogrid-v-${i}`}
                      x1={8 + i * 21}
                      y1="18"
                      x2={8 + i * 21}
                      y2="128"
                      stroke="#1e3a8a"
                      strokeWidth="0.5"
                      strokeOpacity="0.4"
                    />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line
                      key={`ogrid-h-${i}`}
                      x1="8"
                      y1={18 + i * 22}
                      x2="176"
                      y2={18 + i * 22}
                      stroke="#1e3a8a"
                      strokeWidth="0.5"
                      strokeOpacity="0.4"
                    />
                  ))}

                  {/* Ground reference baseline */}
                  <line x1="8" y1="100" x2="176" y2="100" stroke="#334155" strokeWidth="0.8" strokeDasharray="3,3" />

                  {/* Real Live Waveform Traces on Oscilloscope Screen */}
                  {ch1Probe && generateMiniTrace(samples1, '#f59e0b', oscilloscopeState?.channelA.voltsPerDiv ?? 1.0)}
                  {ch2Probe && generateMiniTrace(samples2, '#38bdf8', oscilloscopeState?.channelB.voltsPerDiv ?? 1.0)}

                  {!ch1Probe && !ch2Probe && (
                    <line x1="12" y1="100" x2="172" y2="100" stroke="#22c55e" strokeWidth="1.8" className="drop-shadow-[0_0_4px_#22c55e]" />
                  )}

                  {/* Front Control Panel (Right Side of Oscilloscope) */}
                  <g transform="translate(196, 20)">
                    {/* Channel Badges */}
                    <rect x="0" y="0" width="24" height="12" rx="2" fill="#ca8a04" />
                    <text x="12" y="9" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">CH1</text>
                    <rect x="0" y="24" width="24" height="12" rx="2" fill="#0284c7" />
                    <text x="12" y="33" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">CH2</text>

                    {/* Time/Div readout */}
                    <text x="44" y="5" fill="#cbd5e1" fontSize="7" fontWeight="bold">Time/Div</text>
                    <rect x="40" y="8" width="34" height="16" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                    <text x="57" y="20" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      {((oscilloscopeState?.timePerDiv ?? 0.01) * 1000).toFixed(0)}ms
                    </text>

                    {/* Volts/Div readout */}
                    <text x="44" y="35" fill="#cbd5e1" fontSize="7" fontWeight="bold">Volts/Div</text>
                    <rect x="40" y="38" width="34" height="16" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                    <text x="57" y="50" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      {(oscilloscopeState?.channelA.voltsPerDiv ?? 1.0).toFixed(0)}V
                    </text>

                    {/* Dual Rotary Control Knobs */}
                    <circle cx="12" cy="58" r="8" fill="#475569" stroke="#64748b" strokeWidth="1" />
                    <circle cx="12" cy="58" r="3" fill="#1e293b" />
                    <circle cx="12" cy="80" r="8" fill="#475569" stroke="#64748b" strokeWidth="1" />
                    <circle cx="12" cy="80" r="3" fill="#1e293b" />

                    {/* Run / Stop Button */}
                    <rect
                      x="40"
                      y="68"
                      width="34"
                      height="18"
                      rx="4"
                      fill={oscilloscopeState?.isRunning ? '#16a34a' : '#d97706'}
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                    <text x="57" y="80" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {oscilloscopeState?.isRunning ? 'Run' : 'Stop'}
                    </text>
                  </g>
                </g>

                {/* Oscilloscope Probes Coaxial Cables to Probed Points */}
                {(() => {
                  const ch1Dest = ch1Probe ? { x: ch1Probe.x, y: ch1Probe.y } : null;
                  const ch2Dest = ch2Probe ? { x: ch2Probe.x, y: ch2Probe.y } : null;

                  const bnc1 = { x: 980 + 24, y: 320 + 130 };
                  const bnc2 = { x: 980 + 52, y: 320 + 130 };

                  return (
                    <g className="pointer-events-none">
                      {ch1Dest && (
                        <>
                          <path
                            d={`M ${bnc1.x} ${bnc1.y} Q ${(bnc1.x + ch1Dest.x) / 2 - 15} ${(bnc1.y + ch1Dest.y) / 2 + 50} ${ch1Dest.x} ${ch1Dest.y}`}
                            fill="none"
                            stroke="#ca8a04"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            className="drop-shadow-sm"
                          />
                          <circle cx={ch1Dest.x} cy={ch1Dest.y} r="3.5" fill="#facc15" stroke="#78350f" strokeWidth="1" />
                        </>
                      )}
                      {ch2Dest && (
                        <>
                          <path
                            d={`M ${bnc2.x} ${bnc2.y} Q ${(bnc2.x + ch2Dest.x) / 2 + 15} ${(bnc2.y + ch2Dest.y) / 2 + 60} ${ch2Dest.x} ${ch2Dest.y}`}
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            className="drop-shadow-sm"
                          />
                          <circle cx={ch2Dest.x} cy={ch2Dest.y} r="3.5" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
                        </>
                      )}
                    </g>
                  );
                })()}
              </g>
            );
          })()}

          {/* Ghost Preview Following Cursor in Placement Mode */}
          {placementType && (
            <g
              transform={`translate(${snapToGrid(mousePos.x)}, ${snapToGrid(mousePos.y)})`}
              className="pointer-events-none opacity-70"
            >
              <circle cx="0" cy="0" r="22" fill="#2563eb" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" strokeDasharray="4,4" />
              <rect x="-45" y="-34" width="90" height="20" rx="4" fill="#1e293b" opacity="0.9" />
              <text x="0" y="-20" fill="#ffffff" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                Click to place
              </text>
            </g>
          )}

          {/* 1. JUMPER WIRES / CONNECTIONS */}
          {connections.map(conn => {
            const p1 = getTerminalAbsolutePos(conn.fromComponentId, conn.fromTerminalId);
            const p2 = getTerminalAbsolutePos(conn.toComponentId, conn.toTerminalId);
            if (!p1 || !p2) return null;

            const isSelected = selectedConnectionId === conn.id;
            const isSimActive = simulationResults?.isRunning && (simulationResults?.totalCurrent ?? 0) > 0.01;
            const baseColor = getWireColor(conn, components);

            // In physical mode: realistic flexible jumper wire curve with natural sag
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const sag = viewMode === 'physical' ? Math.min(55, Math.max(15, dist * 0.22)) : 0;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 + sag;
            const pathD = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;

            return (
              <g
                key={conn.id}
                className="cursor-pointer group"
                onClick={e => {
                  e.stopPropagation();
                  onSelectConnection(conn.id);
                  onSelectComponent(null);
                }}
              >
                {/* Thick invisible click target */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="16" />

                {/* Selection outline */}
                {isSelected && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="9"
                    strokeOpacity="0.4"
                    strokeLinecap="round"
                  />
                )}

                {/* Realistic Jumper Wire in Physical Mode */}
                {viewMode === 'physical' ? (
                  <>
                    {/* Shadow under wire onto breadboard */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="4"
                      strokeOpacity="0.2"
                      transform="translate(0, 4)"
                    />

                    {/* Main Colored PVC Insulated Jumper Wire */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isSelected ? '#2563eb' : baseColor}
                      strokeWidth="4.2"
                      strokeLinecap="round"
                      className="transition-colors group-hover:brightness-115"
                    />

                    {/* Wire Gloss Highlight along top edge */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      strokeOpacity="0.45"
                      strokeLinecap="round"
                    />

                    {/* Molded DuPont Connector Housings at ends */}
                    <g transform={`translate(${p1.x}, ${p1.y})`}>
                      <circle cx="0" cy="0" r="5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                      <circle cx="0" cy="0" r="2" fill="#cbd5e1" />
                    </g>
                    <g transform={`translate(${p2.x}, ${p2.y})`}>
                      <circle cx="0" cy="0" r="5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                      <circle cx="0" cy="0" r="2" fill="#cbd5e1" />
                    </g>
                  </>
                ) : (
                  // Schematic Mode Wire
                  <>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isSelected ? '#2563eb' : isSimActive ? '#0284c7' : '#475569'}
                      strokeWidth={isSelected ? 3 : 2.5}
                      strokeLinecap="round"
                    />
                    <circle cx={p1.x} cy={p1.y} r="3" fill="#2563eb" />
                    <circle cx={p2.x} cy={p2.y} r="3" fill="#2563eb" />
                  </>
                )}

                {/* Animated electron current pulse effect during simulation */}
                {isSimActive && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeDasharray="5,10"
                    className="opacity-90 animate-dash pointer-events-none"
                  />
                )}
              </g>
            );
          })}

          {/* 2. PENDING WIRE IN PROGRESS */}
          {pendingWireStart && (
            <g className="pointer-events-none">
              <path
                d={`M ${pendingWireStart.x} ${pendingWireStart.y} L ${mousePos.x} ${mousePos.y}`}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
              <circle cx={pendingWireStart.x} cy={pendingWireStart.y} r="5" fill="#2563eb" />
              <circle cx={mousePos.x} cy={mousePos.y} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {/* 3. COMPONENTS (PHYSICAL or SCHEMATIC) */}
          {components.map(comp =>
            viewMode === 'physical' ? (
              <PhysicalComponentRenderer
                key={comp.id}
                component={comp}
                isSelected={selectedComponentId === comp.id}
                simulationData={simulationResults?.componentResults?.[comp.id]}
                connectedTerminals={connectedTerminals}
                activeTerminalId={
                  pendingWireStart?.componentId === comp.id
                    ? `${comp.id}:${pendingWireStart.terminalId}`
                    : null
                }
                onTerminalClick={handleTerminalClick}
                onComponentMouseDown={handleComponentMouseDown}
                onComponentClick={handleComponentClick}
                onComponentDoubleClick={handleComponentClick}
                onToggleSwitch={onToggleSwitch}
              />
            ) : (
              <ComponentRenderer
                key={comp.id}
                component={comp}
                isSelected={selectedComponentId === comp.id}
                simulationData={simulationResults?.componentResults?.[comp.id]}
                connectedTerminals={connectedTerminals}
                activeTerminalId={
                  pendingWireStart?.componentId === comp.id
                    ? `${comp.id}:${pendingWireStart.terminalId}`
                    : null
                }
                onTerminalClick={handleTerminalClick}
                onComponentMouseDown={handleComponentMouseDown}
                onComponentClick={handleComponentClick}
                onComponentDoubleClick={handleComponentClick}
                onToggleSwitch={onToggleSwitch}
              />
            )
          )}
        </g>
      </svg>
    </div>
  );
};

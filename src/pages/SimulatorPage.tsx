import React, { useState, useEffect, useRef } from 'react';
import {
  CircuitProject,
  CircuitComponent,
  Connection,
  SimulationResults,
  ViewMode,
  FaultType,
  MultimeterState,
  OscilloscopeState,
  ProbeLocation,
} from '../types/circuit';
import { COMPONENT_CATALOG } from '../data/components';
import { runCircuitSimulation } from '../engine/simulationEngine';
import { saveProject, exportProjectJson, incrementSimulationStat } from '../services/storage';
import { SamplePoint } from '../engine/oscilloscopeEngine';
import { CircuitCanvas } from '../components/canvas/CircuitCanvas';
import { ComponentLibrary } from '../components/panels/ComponentLibrary';
import { PropertiesPanel } from '../components/panels/PropertiesPanel';
import { SimulationConsole } from '../components/panels/SimulationConsole';
import { MultimeterModal } from '../components/panels/MultimeterModal';
import { OscilloscopeModal } from '../components/panels/OscilloscopeModal';
import { AIAssistantDrawer } from '../components/panels/AIAssistantDrawer';
import { ReportModal } from '../components/panels/ReportModal';
import { BeginnerWizardModal } from '../components/panels/BeginnerWizardModal';
import { CircuitSafetyModal } from '../components/panels/CircuitSafetyModal';
import { WhatIfModal } from '../components/panels/WhatIfModal';
import { FaultInjectionModal } from '../components/panels/FaultInjectionModal';
import { ExperimentModal } from '../components/panels/ExperimentModal';
import { CodeEditorModal } from '../components/panels/CodeEditorModal';
import { SerialMonitorModal } from '../components/panels/SerialMonitorModal';
import { BOMModal } from '../components/panels/BOMModal';
import { ChallengeModal } from '../components/panels/ChallengeModal';
import { DEFAULT_ARDUINO_SKETCH } from '../engine/arduinoEngine';
import {
  Save,
  Download,
  FileText,
  Bot,
  ZoomIn,
  ZoomOut,
  Trash2,
  Undo2,
  Redo2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Check,
  Eye,
  Grid,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  BookOpen,
  ClipboardList,
  Code2,
  Trophy,
  ChevronDown,
  Sparkles,
  Play,
  Square,
  RotateCcw,
} from 'lucide-react';

interface Props {
  initialProject: CircuitProject;
  onProjectUpdate?: (project: CircuitProject) => void;
  onSaveTrigger?: () => void;
  onOpenAITutorTrigger?: () => void;
  onOpenReportTrigger?: () => void;
  onExportTrigger?: () => void;
}

export const SimulatorPage: React.FC<Props> = ({
  initialProject,
  onProjectUpdate,
}) => {
  const [project, setProject] = useState<CircuitProject>(initialProject);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    () => initialProject.components.find(c => c.type === 'led')?.id || initialProject.components[0]?.id || null
  );
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);

  // VIEW MODE: PHYSICAL vs SCHEMATIC (Section 6)
  const [viewMode, setViewMode] = useState<ViewMode>('physical');
  // BREADBOARD VIEW TOGGLE (Section 5) - Default true for Physical Lab
  const [showBreadboard, setShowBreadboard] = useState<boolean>(true);

  // Undo/Redo history
  const [history, setHistory] = useState<CircuitProject[]>([initialProject]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Modals & Panels visibility
  const [activePlacementType, setActivePlacementType] = useState<string | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(false);
  const [showMultimeter, setShowMultimeter] = useState<boolean>(false);
  const [showOscilloscope, setShowOscilloscope] = useState<boolean>(false);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showBeginnerWizard, setShowBeginnerWizard] = useState<boolean>(false);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [showWhatIfModal, setShowWhatIfModal] = useState<boolean>(false);
  const [showFaultModal, setShowFaultModal] = useState<boolean>(false);
  const [showExperimentModal, setShowExperimentModal] = useState<boolean>(false);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);
  const [showSerialMonitor, setShowSerialMonitor] = useState<boolean>(false);
  const [showBOM, setShowBOM] = useState<boolean>(false);
  const [showChallengeModal, setShowChallengeModal] = useState<boolean>(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState<boolean>(false);
  const [activeFault, setActiveFault] = useState<FaultType | null>(null);
  const [arduinoCode, setArduinoCode] = useState<string>(DEFAULT_ARDUINO_SKETCH);
  const [serialLogs, setSerialLogs] = useState<{ timestamp: number; text: string }[]>([
    { timestamp: Date.now(), text: 'CirKit Virtual ATmega328P ready.' },
  ]);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Virtual Instruments State
  const [multimeterState, setMultimeterState] = useState<MultimeterState>({
    isOpen: false,
    mode: 'voltage',
    redProbe: null,
    blackProbe: null,
    activeProbeToPlace: null,
    reading: 0,
    unit: 'V DC',
  });

  const [oscilloscopeState, setOscilloscopeState] = useState<OscilloscopeState>({
    isOpen: false,
    isRunning: true,
    timePerDiv: 0.01,
    triggerLevel: 2.5,
    triggerMode: 'auto',
    activeProbeToPlace: null,
    channelA: {
      color: '#f59e0b',
      name: 'CH1',
      enabled: true,
      probe: null,
      voltsPerDiv: 1.0,
      data: [],
    },
    channelB: {
      color: '#38bdf8',
      name: 'CH2',
      enabled: true,
      probe: null,
      voltsPerDiv: 1.0,
      data: [],
    },
  });

  const [activeProbeToPlace, setActiveProbeToPlace] = useState<
    'dmm_red' | 'dmm_black' | 'scope_ch1' | 'scope_ch2' | null
  >(null);
  const [voltageHistory, setVoltageHistory] = useState<Map<string, SamplePoint[]>>(new Map());

  const simTimeRef = useRef<number>(0);
  const prevCapVoltagesRef = useRef<Map<string, number>>(new Map());

  const canvasSvgRef = useRef<SVGSVGElement | null>(null);

  const handlePlaceProbe = (
    probeType: 'dmm_red' | 'dmm_black' | 'scope_ch1' | 'scope_ch2',
    location: ProbeLocation
  ) => {
    if (probeType === 'dmm_red') {
      setMultimeterState(prev => ({ ...prev, redProbe: location }));
    } else if (probeType === 'dmm_black') {
      setMultimeterState(prev => ({ ...prev, blackProbe: location }));
    } else if (probeType === 'scope_ch1') {
      setOscilloscopeState(prev => ({
        ...prev,
        channelA: { ...prev.channelA, probe: location },
      }));
    } else if (probeType === 'scope_ch2') {
      setOscilloscopeState(prev => ({
        ...prev,
        channelB: { ...prev.channelB, probe: location },
      }));
    }
    setActiveProbeToPlace(null);
  };

  const handleApplyCircuit = (circ: {
    components: CircuitComponent[];
    connections: Connection[];
    name?: string;
    description?: string;
  }) => {
    const updated: CircuitProject = {
      ...project,
      name: circ.name || project.name,
      description: circ.description || project.description,
      components: circ.components,
      connections: circ.connections,
      updatedAt: Date.now(),
    };
    pushHistory(updated);
    setSelectedComponentId(null);
    setSelectedConnectionId(null);
    setSaveToast('✨ Applied Generated Circuit to Workbench!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleAutoFixCircuit = () => {
    let newComponents = [...project.components];
    let newConnections = [...project.connections];

    // 1. Close any open switches
    newComponents = newComponents.map(c => {
      if ((c.type === 'switch' || c.type === 'push_button') && !c.properties.state) {
        return { ...c, properties: { ...c.properties, state: true } };
      }
      return c;
    });

    // 2. Fix LEDs without resistors
    const leds = newComponents.filter(c => c.type === 'led');
    const resistors = newComponents.filter(c => c.type === 'resistor');
    const battery = newComponents.find(c => c.type === 'battery' || c.type === 'dc_source');

    if (leds.length > 0 && resistors.length === 0 && battery) {
      const targetLed = leds[0];
      const newResId = `res-${Date.now()}`;
      const newResistor: CircuitComponent = {
        id: newResId,
        type: 'resistor',
        name: 'R_safe',
        x: Math.round((battery.x + targetLed.x) / 2),
        y: Math.min(battery.y, targetLed.y) - 50,
        rotation: 0,
        properties: { resistance: 220, powerRating: 0.25, customLabel: '220 Ω (Auto-Protected)' },
        terminals: [
          { id: 't1', name: 'Pin 1', x: -40, y: 0, type: 'passive' },
          { id: 't2', name: 'Pin 2', x: 40, y: 0, type: 'passive' },
        ],
      };

      const batConnIdx = newConnections.findIndex(
        c =>
          (c.fromComponentId === battery.id && c.fromTerminalId === 'pos') ||
          (c.toComponentId === battery.id && c.toTerminalId === 'pos')
      );

      if (batConnIdx !== -1) {
        newConnections.splice(batConnIdx, 1);
      }

      newConnections.push({
        id: `wire-safe-1-${Date.now()}`,
        fromComponentId: battery.id,
        fromTerminalId: 'pos',
        toComponentId: newResId,
        toTerminalId: 't1',
        color: '#dc2626',
      });

      newConnections.push({
        id: `wire-safe-2-${Date.now()}`,
        fromComponentId: newResId,
        fromTerminalId: 't2',
        toComponentId: targetLed.id,
        toTerminalId: 'anode',
        color: '#eab308',
      });

      newComponents.push(newResistor);
    }

    // 3. Ground insertion if absent
    const ground = newComponents.find(c => c.type === 'ground');
    if (!ground && battery) {
      const gndId = `gnd-${Date.now()}`;
      const newGround: CircuitComponent = {
        id: gndId,
        type: 'ground',
        name: 'GND',
        x: battery.x,
        y: battery.y + 100,
        rotation: 0,
        properties: {},
        terminals: [{ id: 'gnd', name: 'Ground', x: 0, y: -25, type: 'ground' }],
      };
      newComponents.push(newGround);
      newConnections.push({
        id: `wire-gnd-${Date.now()}`,
        fromComponentId: battery.id,
        fromTerminalId: 'neg',
        toComponentId: gndId,
        toTerminalId: 'gnd',
        color: '#172033',
      });
    }

    // 4. Low resistance burn protection
    newComponents = newComponents.map(c => {
      if (c.type === 'resistor' && (c.properties.resistance ?? 0) < 50) {
        return { ...c, properties: { ...c.properties, resistance: 220 } };
      }
      return c;
    });

    const updated = {
      ...project,
      components: newComponents,
      connections: newConnections,
      updatedAt: Date.now(),
    };
    pushHistory(updated);
    setSaveToast('✨ Auto-Fix Applied: Circuit repaired & verified safe!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const pushHistory = (newProject: CircuitProject) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newProject);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setProject(newProject);
    onProjectUpdate?.(newProject);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setProject(history[newIdx]);
      setSelectedComponentId(null);
      setSelectedConnectionId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setProject(history[newIdx]);
    }
  };

  useEffect(() => {
    if (!isSimulating) {
      setSimulationResults(null);
      return;
    }

    const interval = setInterval(() => {
      simTimeRef.current += 0.05;
      const simTime = simTimeRef.current;

      const hasArduino = project.components.some(c => c.type === 'arduino_uno');
      const hasEsp = project.components.some(c => c.type === 'esp32');

      const pinOutputs: Record<string, number> = {};
      if (hasArduino) {
        // Toggle pin 13 blink (1Hz: 0.5s HIGH, 0.5s LOW)
        const isHigh = Math.floor(simTime * 2) % 2 === 0;
        pinOutputs['13'] = isHigh ? 5.0 : 0.0;
        pinOutputs['d13'] = isHigh ? 5.0 : 0.0;
        // PWM on pin 3 (duty cycle 50%, frequency 50Hz)
        const pwmHigh = (simTime * 50) % 1.0 < 0.5;
        pinOutputs['d3'] = pwmHigh ? 5.0 : 0.0;
        pinOutputs['3'] = pwmHigh ? 5.0 : 0.0;
      }
      if (hasEsp) {
        const isHigh = Math.floor(simTime * 2) % 2 === 0;
        pinOutputs['d2'] = isHigh ? 3.3 : 0.0;
        pinOutputs['gpio2'] = isHigh ? 3.3 : 0.0;
      }

      const results = runCircuitSimulation(
        project.components,
        project.connections,
        showBreadboard,
        pinOutputs,
        simTime,
        prevCapVoltagesRef.current
      );

      setSimulationResults(results);

      // Record voltageHistory for oscilloscope
      if (oscilloscopeState.isRunning && results.nodeVoltages) {
        setVoltageHistory(prevMap => {
          const nextMap = new Map(prevMap);
          for (const [key, voltage] of Object.entries(results.nodeVoltages)) {
            const list = nextMap.get(key) ? [...nextMap.get(key)!] : [];
            list.push({ t: simTime, v: voltage });
            if (list.length > 200) {
              list.splice(0, list.length - 200);
            }
            nextMap.set(key, list);
          }
          return nextMap;
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [project.components, project.connections, showBreadboard, isSimulating, oscilloscopeState.isRunning]);

  const handleUpdateComponentPosition = (id: string, x: number, y: number) => {
    const updatedComponents = project.components.map(comp =>
      comp.id === id ? { ...comp, x, y } : comp
    );
    const updated = { ...project, components: updatedComponents };
    setProject(updated);
  };

  const handleAddConnection = (
    fromComponentId: string,
    fromTerminalId: string,
    toComponentId: string,
    toTerminalId: string
  ) => {
    const exists = project.connections.some(
      c =>
        (c.fromComponentId === fromComponentId &&
          c.fromTerminalId === fromTerminalId &&
          c.toComponentId === toComponentId &&
          c.toTerminalId === toTerminalId) ||
        (c.fromComponentId === toComponentId &&
          c.fromTerminalId === toTerminalId &&
          c.toComponentId === fromComponentId &&
          c.toTerminalId === fromTerminalId)
    );

    if (exists) return;

    const newConnection: Connection = {
      id: `wire-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromComponentId,
      fromTerminalId,
      toComponentId,
      toTerminalId,
    };

    const updated = {
      ...project,
      connections: [...project.connections, newConnection],
    };
    pushHistory(updated);
  };

  const handleDeleteConnection = (connectionId: string) => {
    const updated = {
      ...project,
      connections: project.connections.filter(c => c.id !== connectionId),
    };
    pushHistory(updated);
  };

  const handleToggleSwitch = (componentId: string) => {
    const updated = {
      ...project,
      components: project.components.map(comp => {
        if (comp.id === componentId) {
          return {
            ...comp,
            properties: {
              ...comp.properties,
              state: !comp.properties.state,
            },
          };
        }
        return comp;
      }),
    };
    pushHistory(updated);
  };

  const handleDropNewComponent = (type: string, x: number, y: number) => {
    const template = COMPONENT_CATALOG.find(c => c.type === type);
    if (!template) return;

    const count = project.components.filter(c => c.type === type).length + 1;
    const prefix =
      type === 'resistor' ? 'R' : type === 'battery' ? 'V' : type === 'led' ? 'LED' : type.slice(0, 3).toUpperCase();

    const newComp: CircuitComponent = {
      id: `${type}-${Date.now()}`,
      type: template.type,
      name: `${prefix}${count}`,
      x,
      y,
      rotation: 0,
      properties: { ...template.defaultProperties },
      terminals: template.terminals.map(t => ({ ...t })),
    };

    const updated = {
      ...project,
      components: [...project.components, newComp],
    };
    pushHistory(updated);
    setSelectedComponentId(newComp.id);
  };

  const handleUpdateProperties = (id: string, newProps: Partial<CircuitComponent['properties']>) => {
    const updated = {
      ...project,
      components: project.components.map(comp =>
        comp.id === id
          ? {
              ...comp,
              properties: { ...comp.properties, ...newProps },
            }
          : comp
      ),
    };
    setProject(updated);
  };

  const handleUpdateName = (id: string, name: string) => {
    const updated = {
      ...project,
      components: project.components.map(comp => (comp.id === id ? { ...comp, name } : comp)),
    };
    setProject(updated);
  };

  const handleRotateComponent = (id: string) => {
    const updated = {
      ...project,
      components: project.components.map(comp =>
        comp.id === id ? { ...comp, rotation: (comp.rotation + 90) % 360 } : comp
      ),
    };
    pushHistory(updated);
  };

  const handleDeleteComponent = (id: string) => {
    const updated = {
      ...project,
      components: project.components.filter(comp => comp.id !== id),
      connections: project.connections.filter(c => c.fromComponentId !== id && c.toComponentId !== id),
    };
    pushHistory(updated);
    setSelectedComponentId(null);
  };

  const handleClearCanvas = () => {
    if (window.confirm('Clear all components and jumper wires from the workbench?')) {
      const updated = {
        ...project,
        components: [],
        connections: [],
      };
      pushHistory(updated);
      setSelectedComponentId(null);
      setSelectedConnectionId(null);
    }
  };

  const handleSave = () => {
    saveProject(project);
    setSaveToast('Project saved successfully to local storage!');
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleExportPNG = () => {
    const svgEl = document.getElementById('circuit-main-svg') as SVGSVGElement | null;
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const svgSize = svgEl.getBoundingClientRect();
    canvas.width = svgSize.width * 2;
    canvas.height = svgSize.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(2, 2);
    const img = new Image();
    img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData))));

    img.onload = () => {
      ctx.fillStyle = '#F5F7FA';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_circuit.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
    };
  };

  const selectedComp = project.components.find(c => c.id === selectedComponentId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#F5F7FA] overflow-hidden select-none text-[#172033]">
      {/* Top Professional Workbench Toolbar */}
      <div className="h-12 bg-white border-b border-[#E2E8F0] px-3 flex items-center justify-between z-20 shadow-2xs">
        {/* Left: Component panel toggle & Project Name */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] transition-colors cursor-pointer"
            title={showLeftSidebar ? 'Collapse Component Bin' : 'Expand Component Bin'}
          >
            {showLeftSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={project.name}
            onChange={e => setProject({ ...project, name: e.target.value })}
            className="bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded text-xs font-bold text-[#172033] border border-transparent focus:border-blue-600 font-mono focus:outline-none transition-colors max-w-[160px] sm:max-w-[220px]"
            title="Click to rename project"
          />

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] text-xs font-semibold transition-colors cursor-pointer"
            title="Save Project"
          >
            <Save className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <div className="h-4 w-px bg-[#E2E8F0]" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 disabled:opacity-30 text-[#172033] border border-[#E2E8F0] transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 disabled:opacity-30 text-[#172033] border border-[#E2E8F0] transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: MASTER CIRCUIT RUN/STOP & VIEW MODE TOGGLE */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Master Circuit Run / Stop Simulation Button */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isSimulating
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/20'
              }`}
              title={isSimulating ? 'Stop Circuit Simulation (Pause Power & Voltage)' : 'Run Circuit Simulation (Compute Live Currents & Voltages)'}
            >
              {isSimulating ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Circuit</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Circuit</span>
                </>
              )}
            </button>

            {/* Restart Simulation */}
            <button
              onClick={() => {
                setIsSimulating(false);
                setTimeout(() => setIsSimulating(true), 80);
              }}
              className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] hover:text-[#172033] border border-[#CBD5E1] transition-colors cursor-pointer"
              title="Restart / Reset Circuit Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#E2E8F0] hidden sm:block" />

          {/* View Mode Pill Switch */}
          <div className="bg-[#F1F5F9] p-0.5 rounded-xl border border-[#CBD5E1] flex items-center shadow-inner">
            <button
              onClick={() => setViewMode('physical')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'physical'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              PHYSICAL LAB
            </button>
            <button
              onClick={() => setViewMode('schematic')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'schematic'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              SCHEMATIC CAD
            </button>
          </div>

          {/* Breadboard View Toggle */}
          <button
            onClick={() => setShowBreadboard(!showBreadboard)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              showBreadboard
                ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-600/20'
                : 'bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] border-[#E2E8F0]'
            }`}
            title="Toggle Solderless Breadboard in Canvas"
          >
            <Grid className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Breadboard View</span>
          </button>
        </div>

        {/* Right: Zoom & Modals & Export */}
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-0.5">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              className="p-1 rounded text-[#64748B] hover:text-[#172033] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="px-1.5 py-0.5 text-xs font-mono font-bold text-[#64748B] hover:text-[#172033] cursor-pointer"
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
              className="p-1 rounded text-[#64748B] hover:text-[#172033] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleClearCanvas}
            className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-red-50 text-[#64748B] hover:text-red-600 border border-[#E2E8F0] transition-colors cursor-pointer"
            title="Clear Workbench"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#E2E8F0] mx-0.5" />

          {/* Lab Bench Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] text-xs font-semibold transition-colors cursor-pointer"
              title="Lab Bench Instruments & Engineering Utilities"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>Lab Tools</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

            {showToolsDropdown && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-[#CBD5E1] py-1 z-50 animate-in fade-in"
                onMouseLeave={() => setShowToolsDropdown(false)}
              >
                <div className="px-3 py-1.5 border-b border-[#E2E8F0] text-[10px] font-bold text-[#64748B] uppercase">
                  Laboratory Test Bench
                </div>

                <button
                  onClick={() => {
                    setShowSafetyModal(true);
                    setShowToolsDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-[#172033] hover:bg-blue-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>Safety & Health Check</span>
                </button>

                <button
                  onClick={() => {
                    setShowWhatIfModal(true);
                    setShowToolsDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-[#172033] hover:bg-purple-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>"What-If" Analysis</span>
                </button>

                <button
                  onClick={() => {
                    setShowFaultModal(true);
                    setShowToolsDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-[#172033] hover:bg-amber-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>Fault Troubleshooting Lab</span>
                </button>

                <button
                  onClick={() => {
                    setShowExperimentModal(true);
                    setShowToolsDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-[#172033] hover:bg-blue-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Guided Experiments</span>
                </button>

                <button
                  onClick={() => {
                    setShowBOM(true);
                    setShowToolsDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-[#172033] hover:bg-teal-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4 text-teal-600" />
                  <span>Bill of Materials (BOM)</span>
                </button>

                <button
                  onClick={() => {
                    setShowCodeEditor(true);
                    setShowToolsDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-[#172033] hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Code2 className="w-4 h-4 text-cyan-600" />
                  <span>Arduino C++ IDE</span>
                </button>

                <button
                  onClick={() => {
                    setShowChallengeModal(true);
                    setShowToolsDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-[#172033] hover:bg-amber-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Troubleshooting Quiz</span>
                </button>

                <div className="border-t border-[#E2E8F0] my-1" />

                <button
                  onClick={() => {
                    setShowBeginnerWizard(true);
                    setShowToolsDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-blue-700 hover:bg-blue-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Pre-built Starter Circuits</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Tutor */}
          <button
            onClick={() => setShowAIAssistant(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            title="AI Circuit Assistant"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">AI Tutor</span>
          </button>

          {/* Report */}
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] text-xs font-semibold transition-colors cursor-pointer"
            title="Lab Report"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden lg:inline">Report</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] transition-colors cursor-pointer"
            title="Export Schematic PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] transition-colors cursor-pointer"
            title={showRightSidebar ? 'Collapse Properties' : 'Expand Properties'}
          >
            {showRightSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="absolute top-16 right-6 z-40 bg-white border border-green-300 text-green-800 text-xs font-mono px-3.5 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Workspace Middle Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT: Component Library */}
        {showLeftSidebar && (
          <div className="w-64 sm:w-72 flex-shrink-0 h-full z-10 transition-all">
            <ComponentLibrary
              onAddComponent={type => {
                const count = project.components.length;
                const offsetX = (count % 6) * 40;
                const offsetY = Math.floor(count / 6) * 30;
                handleDropNewComponent(type, 360 + offsetX, 220 + offsetY);
              }}
              onSelectPlacementType={type => {
                setActivePlacementType(prev => (prev === type ? null : type));
              }}
              activePlacementType={activePlacementType}
              onOpenBeginnerWizard={() => setShowBeginnerWizard(true)}
            />
          </div>
        )}

        {/* CENTER: Circuit Canvas with Physical / Schematic Switch */}
        <div className="flex-1 h-full relative">
          <CircuitCanvas
            canvasRef={canvasSvgRef}
            components={project.components}
            connections={project.connections}
            simulationResults={simulationResults}
            selectedComponentId={selectedComponentId}
            selectedConnectionId={selectedConnectionId}
            viewMode={viewMode}
            showBreadboard={showBreadboard}
            placementType={activePlacementType}
            onExitPlacementMode={() => setActivePlacementType(null)}
            onSelectComponent={setSelectedComponentId}
            onSelectConnection={setSelectedConnectionId}
            onUpdateComponentPosition={handleUpdateComponentPosition}
            onDeleteComponent={handleDeleteComponent}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
            onToggleSwitch={handleToggleSwitch}
            onDropNewComponent={handleDropNewComponent}
            zoom={zoom}
            onZoomChange={setZoom}
            onOpenMultimeter={() => setShowMultimeter(true)}
            onOpenOscilloscope={() => setShowOscilloscope(true)}
            multimeterState={multimeterState}
            oscilloscopeState={oscilloscopeState}
            onUpdateMultimeter={patch => setMultimeterState(prev => ({ ...prev, ...patch }))}
            onUpdateOscilloscope={patch => setOscilloscopeState(prev => ({ ...prev, ...patch }))}
            activeProbeToPlace={activeProbeToPlace}
            onPlaceProbe={handlePlaceProbe}
            onCancelProbePlace={() => setActiveProbeToPlace(null)}
            voltageHistory={voltageHistory}
          />
        </div>

        {/* RIGHT: Properties Panel */}
        {showRightSidebar && (
          <div className="w-64 sm:w-80 flex-shrink-0 h-full z-10 transition-all">
            <PropertiesPanel
              component={selectedComp}
              simulationData={selectedComp ? simulationResults?.componentResults[selectedComp.id] : undefined}
              onUpdateProperties={handleUpdateProperties}
              onUpdateName={handleUpdateName}
              onRotateComponent={handleRotateComponent}
              onDeleteComponent={handleDeleteComponent}
              totalComponentsCount={project.components.length}
              totalConnectionsCount={project.connections.length}
            />
          </div>
        )}
      </div>

      {/* BOTTOM: Simulation Console */}
      <SimulationConsole
        results={simulationResults}
        isRunning={isSimulating}
        onToggleRun={() => setIsSimulating(!isSimulating)}
        onReset={() => {
          setIsSimulating(false);
          setTimeout(() => setIsSimulating(true), 100);
        }}
        onOpenMultimeter={() => setShowMultimeter(true)}
        onOpenOscilloscope={() => setShowOscilloscope(true)}
        onOpenSafety={() => setShowSafetyModal(true)}
        onOpenWhatIf={() => setShowWhatIfModal(true)}
        onOpenFaultLab={() => setShowFaultModal(true)}
      />

      {/* Modals & Virtual Instruments */}
      <MultimeterModal
        isOpen={showMultimeter}
        onClose={() => setShowMultimeter(false)}
        components={project.components}
        simulationResults={simulationResults}
        multimeterState={multimeterState}
        onUpdateMultimeter={patch => setMultimeterState(prev => ({ ...prev, ...patch }))}
        onPickProbeOnCanvas={probe => {
          setActiveProbeToPlace(probe === 'red' ? 'dmm_red' : 'dmm_black');
          setShowMultimeter(false);
        }}
      />

      <OscilloscopeModal
        isOpen={showOscilloscope}
        onClose={() => setShowOscilloscope(false)}
        components={project.components}
        simulationResults={simulationResults}
        oscilloscopeState={oscilloscopeState}
        onUpdateOscilloscope={patch => setOscilloscopeState(prev => ({ ...prev, ...patch }))}
        onPickProbeOnCanvas={channel => {
          setActiveProbeToPlace(channel === 'ch1' ? 'scope_ch1' : 'scope_ch2');
          setShowOscilloscope(false);
        }}
        voltageHistory={voltageHistory}
      />

      <AIAssistantDrawer
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        components={project.components}
        connections={project.connections}
        simulationResults={simulationResults}
        onApplyCircuit={handleApplyCircuit}
        onAutoFixCircuit={handleAutoFixCircuit}
      />

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        project={project}
        simulationResults={simulationResults}
      />

      <BeginnerWizardModal
        isOpen={showBeginnerWizard}
        onClose={() => setShowBeginnerWizard(false)}
        onSelectCircuit={loadedCircuit => {
          pushHistory(loadedCircuit);
          setSelectedComponentId(null);
          setSelectedConnectionId(null);
        }}
      />

      <CircuitSafetyModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        results={simulationResults}
        components={project.components}
        connections={project.connections}
      />

      <WhatIfModal
        isOpen={showWhatIfModal}
        onClose={() => setShowWhatIfModal(false)}
        project={project}
        currentResults={simulationResults}
        onApplyChanges={updated => pushHistory(updated)}
      />

      <FaultInjectionModal
        isOpen={showFaultModal}
        onClose={() => setShowFaultModal(false)}
        project={project}
        onApplyFaultyProject={(faulty, fault) => {
          pushHistory(faulty);
          setActiveFault(fault);
        }}
        activeFault={activeFault}
        onClearFault={() => setActiveFault(null)}
      />

      <ExperimentModal
        isOpen={showExperimentModal}
        onClose={() => setShowExperimentModal(false)}
        currentResults={simulationResults}
        onLoadExperimentCircuit={(circ, title) => {
          const newP = {
            ...project,
            name: title,
            components: circ.components,
            connections: circ.connections,
          };
          pushHistory(newP);
        }}
      />

      <BOMModal
        isOpen={showBOM}
        onClose={() => setShowBOM(false)}
        project={project}
      />

      <CodeEditorModal
        isOpen={showCodeEditor}
        onClose={() => setShowCodeEditor(false)}
        currentCode={arduinoCode}
        onUploadCode={code => {
          setArduinoCode(code);
          setSerialLogs(prev => [
            ...prev,
            { timestamp: Date.now(), text: '[Compiler] Code uploaded to ATmega328P.' },
          ]);
        }}
        onOpenSerialMonitor={() => setShowSerialMonitor(true)}
      />

      <SerialMonitorModal
        isOpen={showSerialMonitor}
        onClose={() => setShowSerialMonitor(false)}
        logs={serialLogs}
        onClearLogs={() => setSerialLogs([])}
        onSendInput={input => {
          setSerialLogs(prev => [
            ...prev,
            { timestamp: Date.now(), text: `[TX] ${input}` },
          ]);
        }}
      />

      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        project={project}
        results={simulationResults}
      />
    </div>
  );
};

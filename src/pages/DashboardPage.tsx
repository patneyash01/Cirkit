import React, { useRef } from 'react';
import { CircuitProject } from '../types/circuit';
import { loadStats, AppStats, deleteProject, duplicateProject, saveProject } from '../services/storage';
import { NavPage } from '../components/layout/Navbar';
import { STARTER_TEMPLATES } from '../data/templates';
import { Logo } from '../components/common/Logo';
import {
  Play,
  Plus,
  Layers,
  Upload,
  Clock,
  Cpu,
  Activity,
  Zap,
  Trash2,
  Copy,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface Props {
  projects: CircuitProject[];
  onOpenProject: (project: CircuitProject) => void;
  onNavigate: (page: NavPage) => void;
  onRefreshProjects: () => void;
}

export const DashboardPage: React.FC<Props> = ({
  projects,
  onOpenProject,
  onNavigate,
  onRefreshProjects,
}) => {
  const stats: AppStats = loadStats();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mostRecentProject = projects.length > 0 ? projects[0] : null;

  const handleCreateNew = () => {
    const newProj: CircuitProject = {
      id: `project-${Date.now()}`,
      name: `Untitled Circuit ${projects.length + 1}`,
      description: 'Custom engineering circuit schematic.',
      components: [],
      connections: [],
      simulationSettings: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveProject(newProj);
    onRefreshProjects();
    onOpenProject(newProj);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateProject(id);
    onRefreshProjects();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this circuit project?')) {
      deleteProject(id);
      onRefreshProjects();
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.components && Array.isArray(parsed.components)) {
          const imported: CircuitProject = {
            ...parsed,
            id: `project-${Date.now()}`,
            name: `${parsed.name || 'Imported Circuit'} (Imported)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          saveProject(imported);
          onRefreshProjects();
          onOpenProject(imported);
        } else {
          alert('Invalid circuit project JSON format.');
        }
      } catch {
        alert('Failed to parse circuit JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 bg-[#F5F7FA] p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 select-none text-[#172033]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />

      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div className="flex items-center space-x-3.5">
          <Logo size={46} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172033] font-sans tracking-tight">
              CirKit Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Virtual Electronics Laboratory
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleCreateNew}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Circuit</span>
          </button>

          <button
            onClick={() => onNavigate('templates')}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#172033] border border-[#E2E8F0] font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Browse Templates</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#172033] border border-[#E2E8F0] font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            title="Import circuit project from JSON"
          >
            <Upload className="w-4 h-4 text-[#64748B]" />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>

      {/* Statistics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider block">
              Total Projects
            </span>
            <span className="text-2xl font-black text-[#172033] font-mono">{projects.length}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider block">
              Simulations Run
            </span>
            <span className="text-2xl font-black text-[#172033] font-mono">{stats.simulationsRun}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider block">
              Components Placed
            </span>
            <span className="text-2xl font-black text-[#172033] font-mono">{stats.componentsUsed}</span>
          </div>
        </div>
      </div>

      {/* Continue Building Card */}
      {mostRecentProject && (
        <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-blue-600 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>CONTINUE BUILDING</span>
            </div>
            <h3 className="text-xl font-bold text-[#172033] font-sans">
              {mostRecentProject.name}
            </h3>
            <p className="text-xs text-[#64748B] max-w-xl">
              {mostRecentProject.description || 'Circuit schematic currently in workbench.'}
            </p>
            <div className="flex items-center space-x-4 text-xs font-mono text-[#64748B] pt-1">
              <span>{mostRecentProject.components.length} components</span>
              <span>•</span>
              <span>{mostRecentProject.connections.length} wires</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(mostRecentProject.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => onOpenProject(mostRecentProject)}
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer flex-shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Open in Simulator</span>
          </button>
        </div>
      )}

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#172033] flex items-center space-x-2">
            <span>Recent Projects</span>
            <span className="text-xs font-mono text-[#64748B]">({projects.length})</span>
          </h2>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-mono text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map(proj => (
            <div
              key={proj.id}
              onClick={() => onOpenProject(proj)}
              className="p-4 rounded-2xl bg-white hover:bg-blue-50/20 border border-[#E2E8F0] hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    {proj.components.length} Components
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={e => handleDuplicate(proj.id, e)}
                      className="p-1 rounded hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => handleDelete(proj.id, e)}
                      className="p-1 rounded hover:bg-red-50 text-[#64748B] hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#172033] group-hover:text-blue-700 transition-colors truncate">
                    {proj.name}
                  </h4>
                  <p className="text-[11px] text-[#64748B] line-clamp-2 mt-1">
                    {proj.description || 'Circuit schematic ready for testing.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
                <span className="flex items-center space-x-1 text-green-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  <span>Verified OK</span>
                </span>
                <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Starter Templates */}
      <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-[#172033]">
              Recommended Engineering Starters
            </h2>
          </div>
          <button
            onClick={() => onNavigate('templates')}
            className="text-xs font-mono text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 cursor-pointer"
          >
            <span>All Templates (9)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STARTER_TEMPLATES.slice(0, 3).map(tpl => (
            <div
              key={tpl.id}
              onClick={() => onOpenProject(tpl)}
              className="p-4 rounded-2xl bg-white hover:bg-blue-50/20 border border-[#E2E8F0] hover:border-blue-300 transition-all cursor-pointer group space-y-2 shadow-xs"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#172033] group-hover:text-blue-700">
                <span>{tpl.name}</span>
              </div>
              <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                {tpl.description}
              </p>
              <span className="inline-block text-[11px] font-mono text-blue-600 font-bold">
                Load Template →
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { CircuitProject } from '../types/circuit';
import { deleteProject, duplicateProject, saveProject, exportProjectJson } from '../services/storage';
import { Logo } from '../components/common/Logo';
import {
  FolderGit2,
  Plus,
  Search,
  Upload,
  Download,
  Copy,
  Trash2,
  Play,
  Calendar,
  Edit2,
  Check,
} from 'lucide-react';

interface Props {
  projects: CircuitProject[];
  onOpenProject: (project: CircuitProject) => void;
  onRefreshProjects: () => void;
}

export const ProjectsPage: React.FC<Props> = ({
  projects,
  onOpenProject,
  onRefreshProjects,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredProjects = projects.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    const newProj: CircuitProject = {
      id: `project-${Date.now()}`,
      name: `New Circuit Project ${projects.length + 1}`,
      description: 'Custom electronic circuit designed with CirKit.',
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
    if (window.confirm('Are you sure you want to permanently delete this project?')) {
      deleteProject(id);
      onRefreshProjects();
    }
  };

  const handleStartRename = (proj: CircuitProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(proj.id);
    setEditName(proj.name);
  };

  const handleSaveRename = (id: string) => {
    if (!editName.trim()) return;
    const proj = projects.find(p => p.id === id);
    if (proj) {
      saveProject({ ...proj, name: editName });
      onRefreshProjects();
    }
    setEditingId(null);
  };

  const handleExport = (proj: CircuitProject, e: React.MouseEvent) => {
    e.stopPropagation();
    exportProjectJson(proj);
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
          alert('Invalid circuit project JSON.');
        }
      } catch {
        alert('Failed to parse circuit JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 bg-[#F5F7FA] p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 select-none text-[#172033]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="flex items-center space-x-3.5">
          <Logo size={40} />
          <div>
            <h1 className="text-2xl font-black text-[#172033] font-sans tracking-tight">
              My CirKit Projects
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage your schematics, export project files, and reopen experiments in CirKit Lab.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleCreateNew}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New CirKit Project</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#172033] border border-[#E2E8F0] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#64748B]" />
            <span>Import JSON</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter projects by title..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-2 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 shadow-2xs"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
          <FolderGit2 className="w-12 h-12 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#172033]">No Projects Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No projects matched your search. Click "New Project" to start building your first circuit!
          </p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Circuit</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(proj => (
            <div
              key={proj.id}
              onClick={() => onOpenProject(proj)}
              className="p-5 rounded-2xl bg-white hover:bg-blue-50/20 border border-[#E2E8F0] hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-3">
                {/* Top Badge & Actions */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    {proj.components.length} Components • {proj.connections.length} Wires
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={e => handleStartRename(proj, e)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => handleExport(proj, e)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-blue-600 transition-colors"
                      title="Export Project JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => handleDuplicate(proj.id, e)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => handleDelete(proj.id, e)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title or Rename Input */}
                {editingId === proj.id ? (
                  <div
                    className="flex items-center space-x-1.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 bg-white border border-blue-600 rounded-lg px-2 py-1 text-xs text-[#172033] font-mono focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(proj.id)}
                      className="p-1 rounded bg-blue-600 text-white font-bold"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-bold text-[#172033] group-hover:text-blue-700 transition-colors truncate">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
                      {proj.description || 'Circuit schematic ready for simulation.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Meta */}
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                </span>

                <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                  <span>Open in CirKit Lab</span>
                  <Play className="w-3 h-3 fill-current" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

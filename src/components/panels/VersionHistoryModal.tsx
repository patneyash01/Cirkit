import React, { useState } from 'react';
import { CircuitProject, ProjectVersion } from '../../types/circuit';
import { History, Plus, RotateCcw, Copy, X, Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
  onSaveVersion: (versionName: string) => void;
  onRestoreVersion: (version: ProjectVersion) => void;
}

export const VersionHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  onSaveVersion,
  onRestoreVersion,
}) => {
  const [versionName, setVersionName] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  if (!isOpen) return null;

  const versions = project.versions || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionName.trim()) return;
    onSaveVersion(versionName.trim());
    setVersionName('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">Project Version History</h2>
              <p className="text-xs text-[#64748B]">Create milestone snapshots and restore previous circuit configurations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Snapshot Input */}
        <form onSubmit={handleCreate} className="p-4 border-b border-[#E2E8F0] bg-white flex items-center space-x-2">
          <input
            type="text"
            placeholder="Version name (e.g. 'v2 Added Current Limiting Resistor')..."
            value={versionName}
            onChange={e => setVersionName(e.target.value)}
            className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Snapshot</span>
          </button>
        </form>

        {justSaved && (
          <div className="p-2 bg-green-50 text-green-800 text-xs font-mono text-center flex items-center justify-center space-x-1 border-b border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>Snapshot saved successfully to project history.</span>
          </div>
        )}

        {/* Versions List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-[#F8FAFC]">
          {versions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#CBD5E1] space-y-2">
              <History className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-xs font-bold text-[#172033]">No Version Snapshots Saved Yet</h4>
              <p className="text-[11px] text-[#64748B]">
                Type a label above and click "Save Snapshot" to bookmark your current workbench design.
              </p>
            </div>
          ) : (
            versions.map((ver, idx) => (
              <div
                key={ver.id}
                className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] flex items-center justify-between shadow-2xs hover:border-blue-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-[#172033]">{ver.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      v{versions.length - idx}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] text-[#64748B] font-mono">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(ver.timestamp).toLocaleString()}</span>
                    </span>
                    <span>•</span>
                    <span>{ver.componentsCount} components</span>
                    <span>•</span>
                    <span>{ver.connectionsCount} wires</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRestoreVersion(ver);
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
                  title="Revert workbench to this snapshot"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
          <span className="text-xs text-[#64748B]">All snapshots safely stored in local project database</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

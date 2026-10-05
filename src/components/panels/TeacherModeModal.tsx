import React, { useState } from 'react';
import { CircuitProject } from '../../types/circuit';
import { GraduationCap, FileCheck, CheckCircle2, UserCheck, X, Download, Share2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
}

export const TeacherModeModal: React.FC<Props> = ({ isOpen, onClose, project }) => {
  const [assignmentTitle, setAssignmentTitle] = useState('EE101 Lab Practical: DC Circuits & Ohm’s Law');
  const [targetStudent, setTargetStudent] = useState('Class Section A (Fall 2026)');
  const [maxMarks, setMaxMarks] = useState(100);
  const [instructions, setInstructions] = useState(
    'Assemble a series-parallel circuit on the virtual breadboard. Verify KVL around the outer loop and submit simulated observations.'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">Teacher & Instructor Assignment Studio</h2>
              <p className="text-xs text-[#64748B]">Create coursework templates, evaluate student circuits, and set grading rubrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assignment Form */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Assignment Title</label>
            <input
              type="text"
              value={assignmentTitle}
              onChange={e => setAssignmentTitle(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Target Course / Section</label>
              <input
                type="text"
                value={targetStudent}
                onChange={e => setTargetStudent(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Maximum Marks / Grade</label>
              <input
                type="number"
                value={maxMarks}
                onChange={e => setMaxMarks(Number(e.target.value))}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Laboratory Instructions & Rubric</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs font-medium text-[#172033] focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Active Circuit Snapshot */}
          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#172033]">Attached Baseline Circuit:</span>
              <span className="font-mono text-indigo-700 font-bold">{project.name}</span>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono text-[#64748B]">
              <span>Components: {project.components.length}</span>
              <span>•</span>
              <span>Wires: {project.connections.length}</span>
              <span>•</span>
              <span>Breadboard Mode: ON</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              alert('Assignment rubric packaged and ready for distribution to students.');
              onClose();
            }}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Publish Assignment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

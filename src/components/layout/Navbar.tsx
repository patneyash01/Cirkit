import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Cpu,
  Layers,
  BookOpen,
  ChevronDown,
  Save,
  Bot,
  FileText,
  Upload,
} from 'lucide-react';
import { Logo } from '../common/Logo';

export type NavPage = 'landing' | 'dashboard' | 'simulator' | 'projects' | 'templates' | 'learn' | 'settings';

interface Props {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  activeProjectName?: string;
  isSimulating?: boolean;
  onSave?: () => void;
  onOpenAITutor?: () => void;
  onOpenReport?: () => void;
  onExport?: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentPage,
  onNavigate,
  activeProjectName = 'LED_Blink_Circuit',
  isSimulating,
  onSave,
  onOpenAITutor,
  onOpenReport,
  onExport,
}) => {
  const navItems: { id: NavPage; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'projects', label: 'My Projects', icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'simulator', label: 'Simulator', icon: <Cpu className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <Layers className="w-4 h-4" /> },
    { id: 'learn', label: 'Learn', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="h-14 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between select-none z-30 sticky top-0 shadow-xs">
      {/* Left: CirKit Logo & Branding */}
      <div
        className="flex items-center space-x-3 cursor-pointer group"
        onClick={() => onNavigate('landing')}
        title="CirKit Home"
      >
        <Logo size={42} />
        <div className="flex flex-col justify-center">
          <span className="font-extrabold text-lg tracking-tight text-[#172033] font-sans leading-tight">
            CirKit
          </span>
          <span className="text-[10px] text-[#64748B] font-medium hidden sm:inline -mt-0.5">
            Virtual Electronics Laboratory
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <nav className="hidden md:flex items-center space-x-1">
        {navItems.map(item => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'text-blue-600 bg-blue-50/80 border-b-2 border-blue-600 rounded-b-none'
                  : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC]'
              }`}
            >
              <span className={isActive ? 'text-blue-600' : 'text-[#64748B]'}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'simulator' && isSimulating && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse ml-1" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Header Actions */}
      <div className="flex items-center space-x-2">
        {/* Project Selector Dropdown */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#172033] cursor-pointer hover:border-slate-400 shadow-2xs">
          <span>Project:</span>
          <span className="font-bold text-[#172033] truncate max-w-[140px]">
            {activeProjectName || 'LED_Blink_Circuit'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
        </div>

        {/* Save Button */}
        <button
          onClick={onSave}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title="Save Circuit"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        {/* AI Tutor Button */}
        <button
          onClick={onOpenAITutor}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#172033] border border-[#CBD5E1] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          title="AI Tutor"
        >
          <Bot className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>

        {/* Lab Report Button */}
        <button
          onClick={onOpenReport}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#172033] border border-[#CBD5E1] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          title="Lab Report"
        >
          <FileText className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="hidden sm:inline">Lab Report</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#172033] border border-[#CBD5E1] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          title="Export"
        >
          <Upload className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* User Avatar Circle */}
        <div
          className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer shadow-2xs ml-1"
          title="User Account"
        >
          Y
        </div>
      </div>
    </header>
  );
};

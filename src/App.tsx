import React, { useState, useEffect } from 'react';
import { CircuitProject } from './types/circuit';
import { loadProjects, saveProject } from './services/storage';
import { Navbar, NavPage } from './components/layout/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { LearnPage } from './pages/LearnPage';
import { SettingsPage } from './pages/SettingsPage';
import { Logo } from './components/common/Logo';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('simulator');
  const [projects, setProjects] = useState<CircuitProject[]>([]);
  const [activeProject, setActiveProject] = useState<CircuitProject | null>(null);

  // Initialize and load projects from local storage
  const refreshProjects = () => {
    const list = loadProjects();
    setProjects(list);
    if (!activeProject && list.length > 0) {
      setActiveProject(list[0]);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const handleOpenProject = (project: CircuitProject) => {
    setActiveProject(project);
    setCurrentPage('simulator');
  };

  const handleOpenTemplate = (template: CircuitProject) => {
    const newProj: CircuitProject = {
      ...template,
      id: `project-${Date.now()}`,
      name: template.name.replace(/^[0-9]+\.\s*/, ''),
      isTemplate: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveProject(newProj);
    refreshProjects();
    handleOpenProject(newProj);
  };

  const handleProjectUpdate = (updated: CircuitProject) => {
    setActiveProject(updated);
    refreshProjects();
  };

  if (projects.length === 0 && !activeProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center space-y-4">
        <Logo size={64} />
        <div className="flex flex-col items-center">
          <span className="text-xl font-extrabold text-white font-sans tracking-wide">CirKit</span>
          <span className="text-xs text-blue-400 font-mono mt-1">Virtual Electronics Laboratory</span>
        </div>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mt-2" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] flex flex-col font-sans">
      {/* Top Universal Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        activeProjectName={activeProject?.name}
        isSimulating={currentPage === 'simulator'}
      />

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col">
        {currentPage === 'landing' && (
          <LandingPage onNavigate={setCurrentPage} />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            projects={projects}
            onOpenProject={handleOpenProject}
            onNavigate={setCurrentPage}
            onRefreshProjects={refreshProjects}
          />
        )}

        {currentPage === 'simulator' && activeProject && (
          <SimulatorPage
            key={activeProject.id}
            initialProject={activeProject}
            onProjectUpdate={handleProjectUpdate}
          />
        )}

        {currentPage === 'projects' && (
          <ProjectsPage
            projects={projects}
            onOpenProject={handleOpenProject}
            onRefreshProjects={refreshProjects}
          />
        )}

        {currentPage === 'templates' && (
          <TemplatesPage onOpenTemplate={handleOpenTemplate} />
        )}

        {currentPage === 'learn' && (
          <LearnPage />
        )}

        {currentPage === 'settings' && (
          <SettingsPage />
        )}
      </main>
    </div>
  );
}

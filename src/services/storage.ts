import { CircuitProject } from '../types/circuit';
import { STARTER_TEMPLATES } from '../data/templates';

const PROJECTS_STORAGE_KEY = 'cirkit_user_projects_v5';
const STATS_STORAGE_KEY = 'cirkit_user_stats_v5';
const LEGACY_PROJECTS_KEY = 'circuitforge_user_projects_v4';
const LEGACY_STATS_KEY = 'circuitforge_user_stats_v4';

export interface AppStats {
  simulationsRun: number;
  componentsUsed: number;
  lastSimulatedAt: number | null;
}

export function loadProjects(): CircuitProject[] {
  try {
    let raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_PROJECTS_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(PROJECTS_STORAGE_KEY, legacy);
      }
    }
    if (!raw) {
      // Seed with starter templates as initial user projects
      const seeded = STARTER_TEMPLATES.map(t => ({
        ...t,
        id: `project-${t.id.replace('template-', '')}`,
        isTemplate: false,
      }));
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return [];
  }
}

export function saveProject(project: CircuitProject): void {
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === project.id);
  const updatedProject = {
    ...project,
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    projects[index] = updatedProject;
  } else {
    projects.unshift(updatedProject);
  }

  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export function deleteProject(projectId: string): void {
  const projects = loadProjects().filter(p => p.id !== projectId);
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export function duplicateProject(projectId: string): CircuitProject | null {
  const projects = loadProjects();
  const original = projects.find(p => p.id === projectId);
  if (!original) return null;

  const clone: CircuitProject = {
    ...original,
    id: `project-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `${original.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  saveProject(clone);
  return clone;
}

export function exportProjectJson(project: CircuitProject): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_cirkit.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function loadStats(): AppStats {
  try {
    let raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_STATS_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(STATS_STORAGE_KEY, legacy);
      }
    }
    if (!raw) {
      const defaultStats: AppStats = {
        simulationsRun: 12,
        componentsUsed: 48,
        lastSimulatedAt: Date.now(),
      };
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(defaultStats));
      return defaultStats;
    }
    return JSON.parse(raw);
  } catch {
    return { simulationsRun: 0, componentsUsed: 0, lastSimulatedAt: null };
  }
}

export function incrementSimulationStat(componentCount: number): void {
  const stats = loadStats();
  stats.simulationsRun += 1;
  stats.componentsUsed += componentCount;
  stats.lastSimulatedAt = Date.now();
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
}

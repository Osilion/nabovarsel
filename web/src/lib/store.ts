'use client';

import { create } from 'zustand';
import type { Project, Neighbor, ProjectSummary } from './types';
import {
  MOCK_PROJECTS,
  MOCK_NEIGHBORS,
  getMockProjectSummaries,
} from './mock-data';
import { isSupabaseConfigured } from './supabase/config';

interface NabovarselStore {
  // State
  projects: Project[];
  neighbors: Neighbor[];
  currentProjectId: string | null;
  loading: boolean;

  // Computed
  currentProject: () => Project | undefined;
  currentNeighbors: () => Neighbor[];
  projectSummaries: () => ProjectSummary[];

  // Actions
  setProjects: (projects: Project[]) => void;
  setNeighbors: (neighbors: Neighbor[]) => void;
  setCurrentProjectId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addNeighbor: (neighbor: Neighbor) => void;
  updateNeighbor: (id: string, updates: Partial<Neighbor>) => void;
  removeNeighbor: (id: string) => void;
  hydrate: () => void;
}

export const useStore = create<NabovarselStore>((set, get) => ({
  projects: [],
  neighbors: [],
  currentProjectId: null,
  loading: false,

  currentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId);
  },

  currentNeighbors: () => {
    const { neighbors, currentProjectId } = get();
    return neighbors.filter((n) => n.project_id === currentProjectId);
  },

  projectSummaries: () => {
    const { projects, neighbors } = get();
    return projects.map((p) => {
      const pn = neighbors.filter((n) => n.project_id === p.id);
      return {
        ...p,
        neighbor_count: pn.length,
        sent_count: pn.filter((n) =>
          ['sent', 'delivered', 'read', 'responded', 'protested', 'no_response'].includes(n.notification_status)
        ).length,
        responded_count: pn.filter((n) =>
          ['responded', 'protested', 'no_response'].includes(n.notification_status)
        ).length,
        protested_count: pn.filter((n) => n.notification_status === 'protested').length,
      };
    });
  },

  setProjects: (projects) => set({ projects }),
  setNeighbors: (neighbors) => set({ neighbors }),
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setLoading: (loading) => set({ loading }),

  addProject: (project) =>
    set((s) => ({ projects: [...s.projects, project] })),

  updateProject: (id, updates) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      neighbors: s.neighbors.filter((n) => n.project_id !== id),
    })),

  addNeighbor: (neighbor) =>
    set((s) => ({ neighbors: [...s.neighbors, neighbor] })),

  updateNeighbor: (id, updates) =>
    set((s) => ({
      neighbors: s.neighbors.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  removeNeighbor: (id) =>
    set((s) => ({
      neighbors: s.neighbors.filter((n) => n.id !== id),
    })),

  hydrate: () => {
    if (!isSupabaseConfigured()) {
      set({
        projects: MOCK_PROJECTS,
        neighbors: MOCK_NEIGHBORS,
      });
    }
    // When Supabase is configured, hydration happens from server
  },
}));

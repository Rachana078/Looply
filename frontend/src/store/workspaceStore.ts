import { create } from 'zustand';
import type { WorkspaceSummary } from '../types/workspace';

interface WorkspaceState {
  workspaces: WorkspaceSummary[];
  setWorkspaces: (workspaces: WorkspaceSummary[]) => void;
  addWorkspace: (workspace: WorkspaceSummary) => void;
  removeWorkspace: (slug: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [...state.workspaces, workspace] })),
  removeWorkspace: (slug) =>
    set((state) => ({ workspaces: state.workspaces.filter(w => w.slug !== slug) })),
}));

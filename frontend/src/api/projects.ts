import api from './axios';
import type { Project } from '../types/workspace';

export const projectsApi = {
  create: (slug: string, data: { name: string; key: string; description?: string }) =>
    api.post<Project>(`/workspaces/${slug}/projects`, data).then(r => r.data),

  list: (slug: string) =>
    api.get<Project[]>(`/workspaces/${slug}/projects`).then(r => r.data),

  get: (slug: string, key: string) =>
    api.get<Project>(`/workspaces/${slug}/projects/${key}`).then(r => r.data),

  update: (slug: string, key: string, data: { name?: string; description?: string }) =>
    api.patch<Project>(`/workspaces/${slug}/projects/${key}`, data).then(r => r.data),

  delete: (slug: string, key: string) =>
    api.delete(`/workspaces/${slug}/projects/${key}`),
};

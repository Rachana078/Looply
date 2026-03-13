import api from './axios';
import type { Workspace, WorkspaceSummary, WorkspaceMember } from '../types/workspace';

export const workspacesApi = {
  create: (data: { name: string; slug: string }) =>
    api.post<Workspace>('/workspaces', data).then(r => r.data),

  list: () =>
    api.get<WorkspaceSummary[]>('/workspaces').then(r => r.data),

  get: (slug: string) =>
    api.get<Workspace>(`/workspaces/${slug}`).then(r => r.data),

  update: (slug: string, data: { name: string }) =>
    api.patch<Workspace>(`/workspaces/${slug}`, data).then(r => r.data),

  delete: (slug: string) =>
    api.delete(`/workspaces/${slug}`),

  getMembers: (slug: string) =>
    api.get<WorkspaceMember[]>(`/workspaces/${slug}/members`).then(r => r.data),

  addMember: (slug: string, data: { email: string; role: string }) =>
    api.post<WorkspaceMember>(`/workspaces/${slug}/members`, data).then(r => r.data),

  updateMemberRole: (slug: string, userId: string, role: string) =>
    api.patch<WorkspaceMember>(`/workspaces/${slug}/members/${userId}`, { role }).then(r => r.data),

  removeMember: (slug: string, userId: string) =>
    api.delete(`/workspaces/${slug}/members/${userId}`),
};

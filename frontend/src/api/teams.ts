import api from './axios';
import type { ProjectTeam } from '../types/ticket';

const base = (slug: string, key: string) =>
  `/workspaces/${slug}/projects/${key}/teams`;

export const teamsApi = {
  list: (slug: string, key: string) =>
    api.get<ProjectTeam[]>(base(slug, key)).then(r => r.data),

  create: (slug: string, key: string, data: { name: string; color: string }) =>
    api.post<ProjectTeam>(base(slug, key), data).then(r => r.data),

  delete: (slug: string, key: string, teamId: string) =>
    api.delete(`${base(slug, key)}/${teamId}`),
};

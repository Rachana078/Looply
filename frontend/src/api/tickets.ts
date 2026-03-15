import api from './axios';
import type {
  Ticket, TicketSummary, CreateTicketPayload,
  UpdateTicketPayload, TicketStatus, TicketType, ReorderEntry, Comment, TicketHistoryEntry,
} from '../types/ticket';

const base = (slug: string, key: string) =>
  `/workspaces/${slug}/projects/${key}/tickets`;

export const ticketsApi = {
  create: (slug: string, key: string, data: CreateTicketPayload) =>
    api.post<Ticket>(base(slug, key), data).then(r => r.data),

  list: (slug: string, key: string, params?: {
    status?: TicketStatus;
    type?: TicketType;
    assigneeId?: string;
  }) =>
    api.get<TicketSummary[]>(base(slug, key), { params }).then(r => r.data),

  get: (slug: string, key: string, ticketId: string) =>
    api.get<Ticket>(`${base(slug, key)}/${ticketId}`).then(r => r.data),

  update: (slug: string, key: string, ticketId: string, data: UpdateTicketPayload) =>
    api.patch<Ticket>(`${base(slug, key)}/${ticketId}`, data).then(r => r.data),

  delete: (slug: string, key: string, ticketId: string) =>
    api.delete(`${base(slug, key)}/${ticketId}`),

  updateStatus: (slug: string, key: string, ticketId: string, status: TicketStatus) =>
    api.patch<Ticket>(`${base(slug, key)}/${ticketId}/status`, { status }).then(r => r.data),

  reorder: (slug: string, key: string, entries: ReorderEntry[]) =>
    api.patch(`${base(slug, key)}/reorder`, { entries }),

  comments: {
    list: (slug: string, key: string, ticketId: string) =>
      api.get<Comment[]>(`${base(slug, key)}/${ticketId}/comments`).then(r => r.data),
    create: (slug: string, key: string, ticketId: string, body: string, mentions?: string[]) =>
      api.post<Comment>(`${base(slug, key)}/${ticketId}/comments`, { body, mentions }).then(r => r.data),
    delete: (slug: string, key: string, ticketId: string, commentId: string) =>
      api.delete(`${base(slug, key)}/${ticketId}/comments/${commentId}`),
  },

  history: (slug: string, key: string, ticketId: string) =>
    api.get<TicketHistoryEntry[]>(`${base(slug, key)}/${ticketId}/history`).then(r => r.data),
};

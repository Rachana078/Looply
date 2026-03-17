import { create } from 'zustand';
import type { TicketSummary, Ticket } from '../types/ticket';

interface TicketState {
  tickets: TicketSummary[];
  selectedTicket: Ticket | null;
  setTickets: (tickets: TicketSummary[]) => void;
  addTicket: (ticket: TicketSummary) => void;
  updateTicketInList: (updated: Ticket) => void;
  updateTicketSummary: (partial: Pick<TicketSummary, 'id'> & Partial<TicketSummary>) => void;
  removeTicket: (id: string) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  selectedTicket: null,
  setTickets: (tickets) => set({ tickets }),
  addTicket: (ticket) => set((s) => (
    s.tickets.some(t => t.id === ticket.id)
      ? s
      : { tickets: [...s.tickets, ticket] }
  )),
  updateTicketInList: (updated) =>
    set((s) => ({
      tickets: s.tickets.map(t => t.id === updated.id ? { ...t, ...updated } : t),
      selectedTicket: s.selectedTicket?.id === updated.id ? updated : s.selectedTicket,
    })),
  updateTicketSummary: (partial) =>
    set((s) => ({
      tickets: s.tickets.map(t => t.id === partial.id ? { ...t, ...partial } : t),
    })),
  removeTicket: (id) =>
    set((s) => ({
      tickets: s.tickets.filter(t => t.id !== id),
      selectedTicket: s.selectedTicket?.id === id ? null : s.selectedTicket,
    })),
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
}));

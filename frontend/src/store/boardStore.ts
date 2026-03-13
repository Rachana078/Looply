import { create } from 'zustand';

interface BoardState {
  activeTicketId: string | null;
  setActiveTicketId: (id: string | null) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  activeTicketId: null,
  setActiveTicketId: (id) => set({ activeTicketId: id }),
}));

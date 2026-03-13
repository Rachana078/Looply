import { DragOverlay } from '@dnd-kit/core';
import { useTicketStore } from '../../store/ticketStore';
import { useBoardStore } from '../../store/boardStore';
import KanbanCard from './KanbanCard';

export default function KanbanDragOverlay() {
  const activeTicketId = useBoardStore(s => s.activeTicketId);
  const tickets = useTicketStore(s => s.tickets);
  const active = tickets.find(t => t.id === activeTicketId) ?? null;

  return (
    <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
      {active ? (
        <KanbanCard ticket={active} onClick={() => {}} overlay />
      ) : null}
    </DragOverlay>
  );
}

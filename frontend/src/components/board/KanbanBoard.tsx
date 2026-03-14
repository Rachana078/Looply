import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useTicketStore } from '../../store/ticketStore';
import { useBoardStore } from '../../store/boardStore';
import { ticketsApi } from '../../api/tickets';
import type { TicketStatus, ProjectTeam } from '../../types/ticket';
import { teamBadgeClasses, teamDotClass } from '../../utils/teamColors';
import KanbanColumn from './KanbanColumn';
import KanbanDragOverlay from './KanbanDragOverlay';

const STATUS_ORDER: TicketStatus[] = ['BACKLOG', 'TODO', 'OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

interface Props {
  slug: string;
  projectKey: string;
  teams: ProjectTeam[];
  onTicketClick: (id: string) => void;
}

export default function KanbanBoard({ slug, projectKey, teams, onTicketClick }: Props) {
  const { tickets, setTickets, updateTicketSummary } = useTicketStore();
  const [dragOriginalStatus, setDragOriginalStatus] = useState<TicketStatus | null>(null);
  const { setActiveTicketId } = useBoardStore();
  const [filterTeamId, setFilterTeamId] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const visibleTickets = useMemo(() =>
    filterTeamId ? tickets.filter(t => t.teamId === filterTeamId) : tickets,
    [tickets, filterTeamId]
  );

  const columns = useMemo(() =>
    STATUS_ORDER.map(status => ({
      status,
      tickets: visibleTickets.filter(t => t.status === status),
    })),
    [visibleTickets]
  );

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setActiveTicketId(id);
    const ticket = tickets.find(t => t.id === id);
    setDragOriginalStatus(ticket?.status ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTicket = tickets.find(t => t.id === activeId);
    if (!activeTicket) return;

    // Determine destination status: over could be a column (status string) or a card (ticket id)
    const destStatus = (STATUS_ORDER.includes(overId as TicketStatus)
      ? overId
      : tickets.find(t => t.id === overId)?.status
    ) as TicketStatus | undefined;

    if (!destStatus || destStatus === activeTicket.status) return;

    // Optimistically move to new column
    updateTicketSummary({ id: activeId, status: destStatus });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTicketId(null);
    const originalStatus = dragOriginalStatus;
    setDragOriginalStatus(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTicket = tickets.find(t => t.id === activeId);
    if (!activeTicket) return;

    const destStatus = (STATUS_ORDER.includes(overId as TicketStatus)
      ? overId
      : tickets.find(t => t.id === overId)?.status
    ) as TicketStatus | undefined;

    if (!destStatus) return;

    // Reorder within same column or finalize cross-column move
    const colTickets = tickets.filter(t => t.status === destStatus);
    const overIndex = colTickets.findIndex(t => t.id === overId);
    const activeIndex = colTickets.findIndex(t => t.id === activeId);

    let reordered = colTickets;
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      reordered = arrayMove(colTickets, activeIndex, overIndex);
    }

    // Reconstruct in correct order: all other statuses keep their order, destStatus uses reordered
    const updatedTickets = tickets
      .filter(t => t.status !== destStatus)
      .concat(reordered.map(t => ({ ...t, status: destStatus })));

    setTickets(updatedTickets);

    // Persist: use original status (before optimistic update) to decide if API call needed
    const reorderEntries = reordered.map((t, i) => ({ id: t.id, position: i }));
    const snapshotTickets = tickets;

    (async () => {
      try {
        if (originalStatus !== destStatus) {
          await ticketsApi.updateStatus(slug, projectKey, activeId, destStatus);
        }
        await ticketsApi.reorder(slug, projectKey, reorderEntries);
      } catch {
        setTickets(snapshotTickets);
      }
    })();
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">No tickets yet</p>
        <p className="text-sm mt-1">Create one to start tracking work</p>
      </div>
    );
  }

  const activeTeam = teams.find(t => t.id === filterTeamId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      {/* Team filter */}
      {teams.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Team:</span>
          <button
            onClick={() => setFilterTeamId('')}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${!filterTeamId ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setFilterTeamId(filterTeamId === team.id ? '' : team.id)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 transition-colors ${filterTeamId === team.id ? teamBadgeClasses(team.color) + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${teamDotClass(team.color)}`} />
              {team.name}
            </button>
          ))}
          {activeTeam && (
            <span className="text-xs text-gray-400 ml-1">
              — showing {visibleTickets.length} ticket{visibleTickets.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ status, tickets: colTickets }) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={colTickets}
            slug={slug}
            projectKey={projectKey}
            onTicketClick={onTicketClick}
          />
        ))}
      </div>
      <KanbanDragOverlay />
    </DndContext>
  );
}

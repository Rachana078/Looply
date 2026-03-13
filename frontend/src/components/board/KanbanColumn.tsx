import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { TicketSummary, TicketStatus } from '../../types/ticket';
import KanbanCard from './KanbanCard';

const STATUS_LABELS: Record<TicketStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  BACKLOG: 'bg-gray-100 text-gray-600',
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
};

interface Props {
  status: TicketStatus;
  tickets: TicketSummary[];
  slug: string;
  projectKey: string;
  onTicketClick: (id: string) => void;
}

export default function KanbanColumn({ status, tickets, slug, projectKey, onTicketClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-60 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-gray-400 font-mono">{tickets.length}</span>
      </div>

      <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 min-h-[120px] p-2 rounded-xl transition-colors ${isOver ? 'bg-blue-50' : 'bg-gray-100'}`}
        >
          {tickets.map(ticket => (
            <KanbanCard key={ticket.id} ticket={ticket} slug={slug} projectKey={projectKey} onClick={onTicketClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { TicketSummary, TicketStatus } from '../../types/ticket';
import KanbanCard from './KanbanCard';

const STATUS_LABELS: Record<TicketStatus, string> = {
  BACKLOG:     'Backlog',
  TODO:        'To Do',
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW:   'In Review',
  DONE:        'Done',
};

// Colored top border on the column header
const STATUS_BORDER: Record<TicketStatus, string> = {
  BACKLOG:     'border-t-gray-300',
  TODO:        'border-t-sky-400',
  OPEN:        'border-t-orange-400',
  IN_PROGRESS: 'border-t-blue-500',
  IN_REVIEW:   'border-t-violet-500',
  DONE:        'border-t-emerald-500',
};

// Dot next to label
const STATUS_DOT: Record<TicketStatus, string> = {
  BACKLOG:     'bg-gray-400',
  TODO:        'bg-sky-400',
  OPEN:        'bg-orange-400',
  IN_PROGRESS: 'bg-brand',
  IN_REVIEW:   'bg-violet-500',
  DONE:        'bg-emerald-500',
};

// Count badge
const STATUS_COUNT: Record<TicketStatus, string> = {
  BACKLOG:     'bg-gray-100 text-gray-500',
  TODO:        'bg-sky-100 text-sky-700',
  OPEN:        'bg-orange-100 text-orange-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW:   'bg-violet-100 text-violet-700',
  DONE:        'bg-emerald-100 text-emerald-700',
};

// Drop zone tint when dragging over
const STATUS_OVER: Record<TicketStatus, string> = {
  BACKLOG:     'bg-gray-100 ring-1 ring-gray-300',
  TODO:        'bg-sky-50 ring-1 ring-sky-200',
  OPEN:        'bg-orange-50 ring-1 ring-orange-200',
  IN_PROGRESS: 'bg-brand/5 ring-1 ring-brand/20',
  IN_REVIEW:   'bg-violet-50 ring-1 ring-violet-200',
  DONE:        'bg-emerald-50 ring-1 ring-emerald-200',
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
    <div className="flex flex-col w-[280px] flex-shrink-0">
      {/* Header card with colored top border */}
      <div className={`bg-white rounded-xl border border-gray-200 border-t-[3px] ${STATUS_BORDER[status]} px-3 py-2.5 mb-2 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
          <span className="text-xs font-semibold text-gray-700">{STATUS_LABELS[status]}</span>
        </div>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${STATUS_COUNT[status]}`}>
          {tickets.length}
        </span>
      </div>

      <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 min-h-[160px] p-2 rounded-xl transition-all duration-150 ${
            isOver ? STATUS_OVER[status] : 'bg-gray-50/70'
          }`}
        >
          {tickets.map(ticket => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              slug={slug}
              projectKey={projectKey}
              onClick={onTicketClick}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TicketSummary, TicketType, TicketPriority } from '../../types/ticket';
import { teamBadgeClasses } from '../../utils/teamColors';

const TYPE_STYLES: Record<TicketType, string> = {
  STORY: 'bg-green-100 text-green-700',
  BUG: 'bg-red-100 text-red-700',
  TASK: 'bg-blue-100 text-blue-700',
  EPIC: 'bg-purple-100 text-purple-700',
};

const PRIORITY_DOT: Record<TicketPriority, string> = {
  LOW: 'bg-gray-300',
  MEDIUM: 'bg-yellow-400',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-600',
};

interface Props {
  ticket: TicketSummary;
  slug?: string;
  projectKey?: string;
  onClick: (id: string) => void;
  overlay?: boolean;
}

export default function KanbanCard({ ticket, onClick, overlay = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={overlay ? undefined : style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick(ticket.id);
      }}
      className={`bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all select-none ${overlay ? 'shadow-lg rotate-1' : ''}`}
    >
      {ticket.teamName && (
        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-1.5 ${teamBadgeClasses(ticket.teamColor ?? 'blue')}`}>
          {ticket.teamName}
        </span>
      )}
      <p className="text-sm text-gray-900 font-medium leading-snug mb-2">{ticket.title}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TYPE_STYLES[ticket.type]}`}>
            {ticket.type}
          </span>
          <span className={`inline-block w-2 h-2 rounded-full ${PRIORITY_DOT[ticket.priority]}`} title={ticket.priority} />
        </div>
        <div className="flex items-center gap-1.5">
          {ticket.storyPoints != null && (
            <span className="text-xs text-gray-400 font-mono">{ticket.storyPoints}</span>
          )}
          {ticket.assigneeUsername && (
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center uppercase">
              {ticket.assigneeUsername[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

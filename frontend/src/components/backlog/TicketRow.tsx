import type { TicketSummary, TicketType, TicketPriority } from '../../types/ticket';
import { teamBadgeClasses } from '../../utils/teamColors';

const TYPE_STYLES: Record<TicketType, { label: string; color: string }> = {
  STORY: { label: 'S', color: 'bg-blue-100 text-blue-700' },
  BUG:   { label: 'B', color: 'bg-red-100 text-red-700' },
  TASK:  { label: 'T', color: 'bg-gray-100 text-gray-600' },
  EPIC:  { label: 'E', color: 'bg-purple-100 text-purple-700' },
};

const PRIORITY_DOT: Record<TicketPriority, string> = {
  LOW:      'bg-gray-300',
  MEDIUM:   'bg-yellow-400',
  HIGH:     'bg-orange-500',
  CRITICAL: 'bg-red-600',
};

interface Props {
  ticket: TicketSummary;
  slug: string;
  projectKey: string;
  onClick: () => void;
}

export default function TicketRow({ ticket, onClick }: Props) {
  const type = TYPE_STYLES[ticket.type];
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors group"
    >
      <span className={`shrink-0 w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${type.color}`}>
        {type.label}
      </span>
      <span className="flex-1 text-sm text-gray-800 truncate group-hover:text-blue-600">
        {ticket.title}
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {ticket.teamName && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${teamBadgeClasses(ticket.teamColor ?? 'blue')}`}>
            {ticket.teamName}
          </span>
        )}
        {ticket.storyPoints != null && (
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {ticket.storyPoints}
          </span>
        )}
        {ticket.assigneeUsername && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {ticket.assigneeUsername.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[ticket.priority]}`} title={ticket.priority} />
      </span>
    </button>
  );
}

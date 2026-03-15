import type { TicketSummary, TicketType, TicketPriority } from '../../types/ticket';
import { teamBadgeClasses } from '../../utils/teamColors';

const TYPE_STYLES: Record<TicketType, { label: string; cls: string }> = {
  STORY: { label: 'S', cls: 'bg-sky-50 text-sky-600 border border-sky-200' },
  BUG:   { label: 'B', cls: 'bg-red-50 text-red-600 border border-red-200' },
  TASK:  { label: 'T', cls: 'bg-slate-50 text-slate-500 border border-slate-200' },
  EPIC:  { label: 'E', cls: 'bg-purple-50 text-purple-600 border border-purple-200' },
};

const PRIORITY_DOT: Record<TicketPriority, string> = {
  LOW:      'bg-gray-300',
  MEDIUM:   'bg-amber-400',
  HIGH:     'bg-orange-400',
  CRITICAL: 'bg-red-500',
};

const AVATAR_COLORS = [
  'bg-brand', 'bg-purple-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand/5 text-left transition-colors group"
    >
      {/* Type badge */}
      <span className={`shrink-0 w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${type.cls}`}>
        {type.label}
      </span>

      {/* Title */}
      <span className="flex-1 text-sm text-gray-800 truncate group-hover:text-brand transition-colors">
        {ticket.title}
      </span>

      {/* Right side metadata */}
      <span className="flex items-center gap-2 shrink-0">
        {ticket.teamName && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${teamBadgeClasses(ticket.teamColor ?? 'blue')}`}>
            {ticket.teamName}
          </span>
        )}
        {ticket.storyPoints != null && (
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
            {ticket.storyPoints}
          </span>
        )}
        {ticket.assigneeUsername && (
          <span
            className={`w-5 h-5 rounded-full ${avatarColor(ticket.assigneeUsername)} text-white text-[9px] font-bold flex items-center justify-center uppercase`}
            title={ticket.assigneeUsername}
          >
            {ticket.assigneeUsername.slice(0, 2)}
          </span>
        )}
        <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[ticket.priority]}`} title={ticket.priority} />
      </span>
    </button>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TicketSummary, TicketType, TicketPriority } from '../../types/ticket';
import { teamBadgeClasses } from '../../utils/teamColors';

const TYPE_STYLES: Record<TicketType, { label: string; cls: string }> = {
  STORY: { label: 'Story', cls: 'bg-sky-50 text-sky-600 border border-sky-200' },
  BUG:   { label: 'Bug',   cls: 'bg-red-50 text-red-600 border border-red-200' },
  TASK:  { label: 'Task',  cls: 'bg-slate-50 text-slate-500 border border-slate-200' },
  EPIC:  { label: 'Epic',  cls: 'bg-purple-50 text-purple-600 border border-purple-200' },
};

// Left border strip color by priority
const PRIORITY_BORDER: Record<TicketPriority, string> = {
  LOW:      'border-l-gray-200',
  MEDIUM:   'border-l-amber-400',
  HIGH:     'border-l-orange-400',
  CRITICAL: 'border-l-red-500',
};

// Dot color by priority
const PRIORITY_DOT: Record<TicketPriority, string> = {
  LOW:      'bg-gray-300',
  MEDIUM:   'bg-amber-400',
  HIGH:     'bg-orange-400',
  CRITICAL: 'bg-red-500',
};

const AVATAR_COLORS = [
  'bg-brand', 'bg-purple-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-rose-500',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
    opacity: isDragging ? 0.25 : 1,
  };

  const type = TYPE_STYLES[ticket.type];

  return (
    <div
      ref={setNodeRef}
      style={overlay ? undefined : style}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(ticket.id); }}
      className={`
        bg-white rounded-xl border border-gray-200 border-l-[3px] ${PRIORITY_BORDER[ticket.priority]}
        p-3 cursor-pointer select-none
        hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300
        transition-all duration-150
        ${overlay ? 'shadow-2xl rotate-2 scale-[1.03] border-gray-300' : ''}
      `}
    >
      {/* Team badge */}
      {ticket.teamName && (
        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-2 ${teamBadgeClasses(ticket.teamColor ?? 'blue')}`}>
          {ticket.teamName}
        </span>
      )}

      {/* Title */}
      <p className="text-sm text-gray-900 font-medium leading-snug mb-3">{ticket.title}</p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${type.cls}`}>
            {type.label}
          </span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[ticket.priority]}`}
            title={ticket.priority}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {ticket.storyPoints != null && (
            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded-md">
              {ticket.storyPoints}
            </span>
          )}
          {ticket.assigneeUsername && (
            <span
              className={`w-5 h-5 rounded-full ${avatarColor(ticket.assigneeUsername)} text-white text-[9px] font-bold flex items-center justify-center uppercase shrink-0`}
              title={ticket.assigneeUsername}
            >
              {ticket.assigneeUsername.slice(0, 2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { TicketSummary, TicketStatus } from '../../types/ticket';
import TicketRow from './TicketRow';

const STATUS_LABELS: Record<TicketStatus, string> = {
  BACKLOG:     'Backlog',
  TODO:        'To Do',
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW:   'In Review',
  DONE:        'Done',
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  BACKLOG:     'text-gray-500 bg-gray-100',
  TODO:        'text-sky-600 bg-sky-50 border border-sky-200',
  OPEN:        'text-orange-700 bg-orange-50 border border-orange-200',
  IN_PROGRESS: 'text-brand-dark bg-brand/10 border border-brand/20',
  IN_REVIEW:   'text-violet-700 bg-violet-50 border border-violet-200',
  DONE:        'text-emerald-700 bg-emerald-50 border border-emerald-200',
};

// Left border color strip
const STATUS_ACCENT: Record<TicketStatus, string> = {
  BACKLOG:     'border-l-gray-300',
  TODO:        'border-l-sky-400',
  OPEN:        'border-l-orange-400',
  IN_PROGRESS: 'border-l-blue-500',
  IN_REVIEW:   'border-l-violet-500',
  DONE:        'border-l-emerald-500',
};

interface Props {
  status: TicketStatus;
  tickets: TicketSummary[];
  slug: string;
  projectKey: string;
  onTicketClick: (ticketId: string) => void;
}

export default function BacklogGroup({ status, tickets, slug, projectKey, onTicketClick }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`border border-gray-200 border-l-[3px] ${STATUS_ACCENT[status]} rounded-xl overflow-hidden mb-3 shadow-sm`}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50/80 transition-colors"
      >
        <span className={`text-gray-400 text-[10px] transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}>
          ▶
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-gray-400 font-mono">{tickets.length}</span>
      </button>

      {!collapsed && tickets.length > 0 && (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {tickets.map(ticket => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              slug={slug}
              projectKey={projectKey}
              onClick={() => onTicketClick(ticket.id)}
            />
          ))}
        </div>
      )}

      {!collapsed && tickets.length === 0 && (
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100 italic">
          No tickets in this stage
        </div>
      )}
    </div>
  );
}

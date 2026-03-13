import { useState } from 'react';
import type { TicketSummary, TicketStatus } from '../../types/ticket';
import TicketRow from './TicketRow';

const STATUS_LABELS: Record<TicketStatus, string> = {
  BACKLOG:     'Backlog',
  TODO:        'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW:   'In Review',
  DONE:        'Done',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  BACKLOG:     'text-gray-500 bg-gray-100',
  TODO:        'text-blue-600 bg-blue-50',
  IN_PROGRESS: 'text-yellow-700 bg-yellow-50',
  IN_REVIEW:   'text-purple-700 bg-purple-50',
  DONE:        'text-green-700 bg-green-50',
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
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-400 text-xs">{collapsed ? '▶' : '▼'}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-gray-400">{tickets.length}</span>
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
        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
          No tickets
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { useTicketStore } from '../../store/ticketStore';
import BacklogGroup from './BacklogGroup';
import type { TicketStatus } from '../../types/ticket';

const STATUS_ORDER: TicketStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

interface Props {
  slug: string;
  projectKey: string;
  onTicketClick: (ticketId: string) => void;
}

export default function BacklogView({ slug, projectKey, onTicketClick }: Props) {
  const tickets = useTicketStore(s => s.tickets);

  const grouped = useMemo(() =>
    STATUS_ORDER.map(status => ({
      status,
      tickets: tickets.filter(t => t.status === status),
    })),
    [tickets]
  );

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">No tickets yet</p>
        <p className="text-sm mt-1">Create one to start tracking work</p>
      </div>
    );
  }

  return (
    <div>
      {grouped.map(({ status, tickets: groupTickets }) => (
        <BacklogGroup
          key={status}
          status={status}
          tickets={groupTickets}
          slug={slug}
          projectKey={projectKey}
          onTicketClick={onTicketClick}
        />
      ))}
    </div>
  );
}

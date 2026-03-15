import { useMemo, useState } from 'react';
import { useTicketStore } from '../../store/ticketStore';
import BacklogGroup from './BacklogGroup';
import type { TicketStatus, ProjectTeam } from '../../types/ticket';
import type { WorkspaceMember } from '../../types/workspace';

const STATUS_ORDER: TicketStatus[] = ['BACKLOG', 'TODO', 'OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

interface Props {
  slug: string;
  projectKey: string;
  members?: WorkspaceMember[];
  teams?: ProjectTeam[];
  onTicketClick: (ticketId: string) => void;
}

export default function BacklogView({ slug, projectKey, members = [], teams = [], onTicketClick }: Props) {
  const tickets = useTicketStore(s => s.tickets);

  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTeam, setFilterTeam] = useState('');

  const filtered = useMemo(() => tickets.filter(t => {
    if (filterType && t.type !== filterType) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee) {
      if (filterAssignee === '__unassigned__') { if (t.assigneeId) return false; }
      else if (t.assigneeId !== filterAssignee) return false;
    }
    if (filterTeam) {
      if (filterTeam === '__none__') { if (t.teamId) return false; }
      else if (t.teamId !== filterTeam) return false;
    }
    return true;
  }), [tickets, filterType, filterPriority, filterAssignee, filterTeam]);

  const grouped = useMemo(() =>
    STATUS_ORDER.map(status => ({
      status,
      tickets: filtered.filter(t => t.status === status),
    })),
    [filtered]
  );

  const hasFilters = filterType || filterPriority || filterAssignee || filterTeam;
  const sel = 'text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer';

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-1">Filter</span>

        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={sel}>
          <option value="">All types</option>
          <option value="STORY">Story</option>
          <option value="BUG">Bug</option>
          <option value="TASK">Task</option>
          <option value="EPIC">Epic</option>
        </select>

        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={sel}>
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        {members.length > 0 && (
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className={sel}>
            <option value="">All assignees</option>
            <option value="__unassigned__">Unassigned</option>
            {members.map(m => (
              <option key={m.userId} value={m.userId}>{m.username}</option>
            ))}
          </select>
        )}

        {teams.length > 0 && (
          <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className={sel}>
            <option value="">All teams</option>
            <option value="__none__">No team</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => { setFilterType(''); setFilterPriority(''); setFilterAssignee(''); setFilterTeam(''); }}
            className="text-xs text-brand hover:text-brand-dark px-2 py-1 rounded hover:bg-brand/10"
          >
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No tickets yet</p>
          <p className="text-sm mt-1">Create one to start tracking work</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No tickets match the current filters</p>
        </div>
      ) : (
        grouped.map(({ status, tickets: groupTickets }) => (
          <BacklogGroup
            key={status}
            status={status}
            tickets={groupTickets}
            slug={slug}
            projectKey={projectKey}
            onTicketClick={onTicketClick}
          />
        ))
      )}
    </div>
  );
}

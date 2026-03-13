import { useEffect, useState } from 'react';
import { ticketsApi } from '../../api/tickets';
import { useTicketStore } from '../../store/ticketStore';
import type { Ticket, TicketStatus, TicketType, TicketPriority } from '../../types/ticket';
import type { WorkspaceMember } from '../../types/workspace';

const STATUS_LABELS: Record<TicketStatus, string> = {
  BACKLOG: 'Backlog', TODO: 'To Do', IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review', DONE: 'Done',
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  BACKLOG:     'bg-gray-100 text-gray-600 hover:ring-2 hover:ring-blue-400',
  TODO:        'bg-blue-50 text-blue-700 hover:ring-2 hover:ring-blue-400',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700 hover:ring-2 hover:ring-blue-400',
  IN_REVIEW:   'bg-purple-50 text-purple-700 hover:ring-2 hover:ring-blue-400',
  DONE:        'bg-green-50 text-green-700 hover:ring-2 hover:ring-blue-400',
};
const TYPE_LABELS: Record<TicketType, string> = {
  STORY: 'Story', BUG: 'Bug', TASK: 'Task', EPIC: 'Epic',
};
const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical',
};

interface Props {
  slug: string;
  projectKey: string;
  ticketId: string;
  members: WorkspaceMember[];
  callerRole: string;
  onClose: () => void;
}

export default function TicketSidePanel({ slug, projectKey, ticketId, members, callerRole, onClose }: Props) {
  const { selectedTicket, setSelectedTicket, updateTicketInList, removeTicket } = useTicketStore();
  const [loading, setLoading] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (selectedTicket?.id === ticketId) return;
    setLoading(true);
    ticketsApi.get(slug, projectKey, ticketId)
      .then(setSelectedTicket)
      .catch(() => onClose())
      .finally(() => setLoading(false));
  }, [ticketId]);

  const ticket = selectedTicket?.id === ticketId ? selectedTicket : null;

  async function saveField(field: string, value: string) {
    if (!ticket) return;
    try {
      let updated: Ticket;
      if (field === 'status') {
        updated = await ticketsApi.updateStatus(slug, projectKey, ticket.id, value as TicketStatus);
      } else {
        updated = await ticketsApi.update(slug, projectKey, ticket.id, { [field]: value || undefined });
      }
      updateTicketInList(updated);
      setSelectedTicket(updated);
    } catch {
      // silently revert
    }
    setEditField(null);
  }

  async function handleDelete() {
    if (!ticket) return;
    if (!confirm('Delete this ticket?')) return;
    try {
      await ticketsApi.delete(slug, projectKey, ticket.id);
      removeTicket(ticket.id);
      onClose();
    } catch { /* ignore */ }
  }

  function startEdit(field: string, currentValue: string) {
    setEditField(field);
    setEditValue(currentValue);
  }

  if (loading || !ticket) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl flex items-center justify-center z-40">
        <span className="text-gray-400 text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 xl:w-[480px] bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-40">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">{ticket.projectKey}</span>
          <select
            value={ticket.status}
            onChange={e => saveField('status', e.target.value)}
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${STATUS_BADGE[ticket.status]}`}
          >
            {(Object.keys(STATUS_LABELS) as TicketStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {(callerRole === 'OWNER' || callerRole === 'ADMIN') && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              Delete
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light">×</button>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Title */}
        {editField === 'title' ? (
          <input
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => saveField('title', editValue)}
            onKeyDown={e => e.key === 'Enter' && saveField('title', editValue)}
            className="w-full text-lg font-bold text-gray-900 border-b border-blue-400 outline-none pb-1"
          />
        ) : (
          <h2
            className="text-lg font-bold text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => startEdit('title', ticket.title)}
          >
            {ticket.title}
          </h2>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Type */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Type</p>
            {editField === 'type' ? (
              <select
                autoFocus value={editValue}
                onChange={e => { setEditValue(e.target.value); saveField('type', e.target.value); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
              >
                {(Object.keys(TYPE_LABELS) as TicketType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            ) : (
              <span className="cursor-pointer hover:text-blue-600 font-medium"
                onClick={() => startEdit('type', ticket.type)}>
                {TYPE_LABELS[ticket.type]}
              </span>
            )}
          </div>

          {/* Priority */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Priority</p>
            {editField === 'priority' ? (
              <select
                autoFocus value={editValue}
                onChange={e => { setEditValue(e.target.value); saveField('priority', e.target.value); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
              >
                {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map(p => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            ) : (
              <span className="cursor-pointer hover:text-blue-600 font-medium"
                onClick={() => startEdit('priority', ticket.priority)}>
                {PRIORITY_LABELS[ticket.priority]}
              </span>
            )}
          </div>

          {/* Story points */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Story points</p>
            {editField === 'storyPoints' ? (
              <input
                autoFocus type="number" min="0" max="99"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => saveField('storyPoints', editValue)}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
              />
            ) : (
              <span className="cursor-pointer hover:text-blue-600 font-medium"
                onClick={() => startEdit('storyPoints', ticket.storyPoints?.toString() ?? '')}>
                {ticket.storyPoints ?? '—'}
              </span>
            )}
          </div>

          {/* Assignee */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Assignee</p>
            {editField === 'assigneeId' ? (
              <select
                autoFocus value={editValue}
                onChange={e => { setEditValue(e.target.value); saveField('assigneeId', e.target.value); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.username}</option>
                ))}
              </select>
            ) : (
              <span className="cursor-pointer hover:text-blue-600 font-medium"
                onClick={() => startEdit('assigneeId', ticket.assigneeId ?? '')}>
                {ticket.assigneeUsername ?? 'Unassigned'}
              </span>
            )}
          </div>

          {/* Reporter */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Reporter</p>
            <span className="font-medium text-gray-700">{ticket.reporterUsername}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Description</p>
          {editField === 'description' ? (
            <textarea
              autoFocus rows={4}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => saveField('description', editValue)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p
              className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 min-h-[2rem]"
              onClick={() => startEdit('description', ticket.description ?? '')}
            >
              {ticket.description || <span className="text-gray-300">Add description…</span>}
            </p>
          )}
        </div>

        <p className="text-xs text-gray-300">
          Created {new Date(ticket.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

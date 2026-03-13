import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import { teamsApi } from '../api/teams';
import { workspacesApi } from '../api/workspaces';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import type { Ticket, TicketStatus, TicketType, TicketPriority, Comment, ProjectTeam } from '../types/ticket';
import type { WorkspaceMember } from '../types/workspace';
import { teamBadgeClasses, teamDotClass } from '../utils/teamColors';

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
const PRIORITY_DOT: Record<TicketPriority, string> = {
  LOW: 'bg-gray-300', MEDIUM: 'bg-yellow-400', HIGH: 'bg-orange-500', CRITICAL: 'bg-red-600',
};

type DescStatus = 'idle' | 'pending' | 'saving' | 'saved';

export default function TicketDetailPage() {
  const { slug, key, ticketId } = useParams<{ slug: string; key: string; ticketId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const { updateTicketInList } = useTicketStore();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [callerRole, setCallerRole] = useState('MEMBER');
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Title inline edit
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Description debounce
  const [descValue, setDescValue] = useState('');
  const [descStatus, setDescStatus] = useState<DescStatus>('idle');
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticketRef = useRef<Ticket | null>(null);
  ticketRef.current = ticket;

  useEffect(() => {
    if (!slug || !key || !ticketId) return;
    Promise.all([
      ticketsApi.get(slug, key, ticketId),
      workspacesApi.get(slug),
      teamsApi.list(slug, key),
    ]).then(([t, ws, tms]) => {
      setTicket(t);
      setDescValue(t.description ?? '');
      setMembers(ws.members);
      setTeams(tms);
      const me = ws.members.find(m => m.userId === user?.id);
      setCallerRole(me?.role ?? 'MEMBER');
      ticketsApi.comments.list(slug, key, ticketId)
        .then(setComments)
        .catch(() => {});
    }).finally(() => setLoading(false));
  }, [slug, key, ticketId]);

  // Debounced description save
  const saveDescription = useCallback(async (value: string) => {
    const t = ticketRef.current;
    if (!t || !slug || !key) return;
    setDescStatus('saving');
    try {
      const updated = await ticketsApi.update(slug, key, t.id, { description: value || undefined });
      setTicket(updated);
      updateTicketInList(updated);
      setDescStatus('saved');
      setTimeout(() => setDescStatus('idle'), 2000);
    } catch {
      setDescStatus('idle');
    }
  }, [slug, key, updateTicketInList]);

  function handleDescChange(value: string) {
    setDescValue(value);
    setDescStatus('pending');
    if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
    descDebounceRef.current = setTimeout(() => saveDescription(value), 1000);
  }

  // Cleanup debounce on unmount
  useEffect(() => () => {
    if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
  }, []);

  async function saveField(field: string, value: string) {
    const t = ticketRef.current;
    if (!t || !slug || !key) return;
    try {
      let updated: Ticket;
      if (field === 'status') {
        updated = await ticketsApi.updateStatus(slug, key, t.id, value as TicketStatus);
      } else {
        updated = await ticketsApi.update(slug, key, t.id, { [field]: value || undefined });
      }
      setTicket(updated);
      updateTicketInList(updated);
    } catch { /* silently revert */ }
    setEditField(null);
  }

  async function handleDelete() {
    if (!ticket || !slug || !key) return;
    if (!confirm('Delete this ticket?')) return;
    await ticketsApi.delete(slug, key, ticket.id);
    navigate(`/workspaces/${slug}/projects/${key}`);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || !key || !ticketId || !commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const c = await ticketsApi.comments.create(slug, key, ticketId, commentBody.trim());
      setComments(prev => [...prev, c]);
      setCommentBody('');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!slug || !key || !ticketId) return;
    await ticketsApi.comments.delete(slug, key, ticketId, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>;
  if (!ticket) return <div className="flex items-center justify-center h-screen text-gray-400">Ticket not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/workspaces" className="hover:text-gray-700">Workspaces</Link>
          <span className="text-gray-300">/</span>
          <Link to={`/workspaces/${slug}`} className="hover:text-gray-700">{slug}</Link>
          <span className="text-gray-300">/</span>
          <Link to={`/workspaces/${slug}/projects/${key}`} className="hover:text-gray-700">{key}</Link>
          <span className="text-gray-300">/</span>
          <span className="font-mono text-gray-400">{ticket.projectKey}</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={ticket.status}
            onChange={e => saveField('status', e.target.value)}
            className={`text-xs font-semibold px-3 py-1 rounded-full border border-blue-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${STATUS_BADGE[ticket.status]}`}
          >
            {(Object.keys(STATUS_LABELS) as TicketStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {(callerRole === 'OWNER' || callerRole === 'ADMIN') && (
            <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700 font-medium">
              Delete
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: title + description + comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          {editField === 'title' ? (
            <input
              autoFocus
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => saveField('title', editValue)}
              onKeyDown={e => e.key === 'Enter' && saveField('title', editValue)}
              className="w-full text-2xl font-bold text-gray-900 border-b-2 border-blue-400 outline-none bg-transparent pb-1"
            />
          ) : (
            <h1
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => { setEditField('title'); setEditValue(ticket.title); }}
            >
              {ticket.title}
            </h1>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Description</p>
              {descStatus === 'pending' && (
                <span className="text-xs text-gray-400">Saving…</span>
              )}
              {descStatus === 'saving' && (
                <span className="text-xs text-gray-400">Saving…</span>
              )}
              {descStatus === 'saved' && (
                <span className="text-xs text-green-500">Saved ✓</span>
              )}
            </div>
            <textarea
              rows={6}
              value={descValue}
              onChange={e => handleDescChange(e.target.value)}
              placeholder="Add a description…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            />
          </div>

          {/* Comments */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Comments ({comments.length})
            </p>
            <div className="space-y-3 mb-4">
              {comments.map(c => (
                <div key={c.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center uppercase">
                        {c.authorUsername[0]}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{c.authorUsername}</span>
                      <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    {(c.authorId === user?.id || callerRole === 'OWNER' || callerRole === 'ADMIN') && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 italic">No comments yet.</p>
              )}
            </div>
            <form onSubmit={handleAddComment} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Write a comment…"
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentBody.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                {submittingComment ? 'Saving…' : 'Add comment'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: metadata */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 text-sm">

            {/* Type */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Type</p>
              <select
                value={ticket.type}
                onChange={e => saveField('type', e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {(Object.keys(TYPE_LABELS) as TicketType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Priority</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
                <select
                  value={ticket.priority}
                  onChange={e => saveField('priority', e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map(p => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Assignee</p>
              <select
                value={ticket.assigneeId ?? ''}
                onChange={e => saveField('assigneeId', e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.username}</option>
                ))}
              </select>
            </div>

            {/* Story points */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Story points</p>
              <input
                type="number"
                min="0"
                max="99"
                defaultValue={ticket.storyPoints ?? ''}
                key={ticket.storyPoints ?? 'sp'}
                onBlur={e => saveField('storyPoints', e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Team */}
            {teams.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Team</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => saveField('teamId', '')}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${!ticket.teamId ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    None
                  </button>
                  {teams.map(t => (
                    <button
                      key={t.id}
                      onClick={() => saveField('teamId', t.id)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 transition-all ${ticket.teamId === t.id ? teamBadgeClasses(t.color) + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${teamDotClass(t.color)}`} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reporter */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Reporter</p>
              <span className="font-medium text-gray-700">{ticket.reporterUsername}</span>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-1 text-xs text-gray-400">
              <p>Created {new Date(ticket.createdAt).toLocaleDateString()}</p>
              <p>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

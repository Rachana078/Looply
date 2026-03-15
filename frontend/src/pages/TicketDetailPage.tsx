import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { ticketsApi } from '../api/tickets';
import { teamsApi } from '../api/teams';
import { workspacesApi } from '../api/workspaces';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import { useCommentUpdates } from '../hooks/useCommentUpdates';
import type { Ticket, TicketStatus, TicketType, TicketPriority, Comment, ProjectTeam, TicketHistoryEntry } from '../types/ticket';
import type { WorkspaceMember } from '../types/workspace';
import { teamBadgeClasses, teamDotClass } from '../utils/teamColors';

const STATUS_LABELS: Record<TicketStatus, string> = {
  BACKLOG: 'Backlog', TODO: 'To Do', OPEN: 'Open', IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review', DONE: 'Done',
};
const STATUS_COLORS: Record<TicketStatus, string> = {
  BACKLOG:     'bg-gray-100 text-gray-600 border-gray-200',
  TODO:        'bg-brand/10 text-brand-dark border-blue-200',
  OPEN:        'bg-orange-50 text-orange-700 border-orange-200',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  IN_REVIEW:   'bg-purple-50 text-purple-700 border-purple-200',
  DONE:        'bg-green-50 text-green-700 border-green-200',
};
const TYPE_LABELS: Record<TicketType, string> = {
  STORY: 'Story', BUG: 'Bug', TASK: 'Task', EPIC: 'Epic',
};
const TYPE_COLORS: Record<TicketType, string> = {
  STORY: 'text-brand', BUG: 'text-red-500', TASK: 'text-gray-600', EPIC: 'text-purple-600',
};
const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical',
};
const PRIORITY_DOT: Record<TicketPriority, string> = {
  LOW: 'bg-gray-300', MEDIUM: 'bg-yellow-400', HIGH: 'bg-orange-500', CRITICAL: 'bg-red-600',
};

type DescStatus = 'idle' | 'pending' | 'saving' | 'saved';

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = ['bg-brand', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

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
  const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // @mention dropdown state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [showMention, setShowMention] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);

  // Title inline edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  // Description debounce
  const [descValue, setDescValue] = useState('');
  const [descStatus, setDescStatus] = useState<DescStatus>('idle');
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticketRef = useRef<Ticket | null>(null);
  ticketRef.current = ticket;

  // Auto-resize textarea
  const descRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = 'auto';
      descRef.current.style.height = `${descRef.current.scrollHeight}px`;
    }
  }, [descValue]);

  useEffect(() => {
    if (!slug || !key || !ticketId) return;
    Promise.all([
      ticketsApi.get(slug, key, ticketId),
      workspacesApi.get(slug),
      teamsApi.list(slug, key),
    ]).then(([t, ws, tms]) => {
      setTicket(t);
      setDescValue(t.description ?? '');
      setTitleValue(t.title);
      setMembers(ws.members);
      setTeams(tms);
      const me = ws.members.find(m => m.userId === user?.id);
      setCallerRole(me?.role ?? 'MEMBER');
      ticketsApi.comments.list(slug, key, ticketId)
        .then(setComments)
        .catch(() => {});
      ticketsApi.history(slug, key, ticketId)
        .then(setHistory)
        .catch(() => {});
    }).finally(() => setLoading(false));
  }, [slug, key, ticketId]);

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
      ticketsApi.history(slug, key, t.id).then(setHistory).catch(() => {});
    } catch { /* silently revert */ }
  }

  async function saveTitle() {
    const t = ticketRef.current;
    if (!t || !titleValue.trim() || titleValue === t.title) { setEditingTitle(false); return; }
    await saveField('title', titleValue.trim());
    setEditingTitle(false);
  }

  // Filtered members for @mention dropdown
  const mentionCandidates = useMemo(() =>
    mentionQuery
      ? members.filter(m => m.username.toLowerCase().startsWith(mentionQuery.toLowerCase()))
      : members,
    [members, mentionQuery]
  );

  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const cursor = e.target.selectionStart ?? value.length;
    setCommentBody(value);
    const textBeforeCursor = value.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[0].length);
      setShowMention(true);
      setMentionIndex(0);
    } else {
      setShowMention(false);
    }
  }

  function insertMention(username: string) {
    const textarea = commentTextareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart ?? commentBody.length;
    const before = commentBody.slice(0, mentionStart);
    const after = commentBody.slice(cursor);
    const newBody = before + '@' + username + ' ' + after;
    setCommentBody(newBody);
    setShowMention(false);
    setTimeout(() => {
      textarea.focus();
      const pos = mentionStart + username.length + 2;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  }

  function handleCommentKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showMention && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionCandidates.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); insertMention(mentionCandidates[mentionIndex].username); return; }
      if (e.key === 'Escape') { setShowMention(false); return; }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddComment(e as unknown as React.FormEvent);
    }
  }

  function renderBody(body: string) {
    return body.split(/(@\w+)/g).map((part, i) =>
      /^@\w+$/.test(part)
        ? <span key={i} className="text-brand font-medium bg-brand/10 rounded px-0.5">{part}</span>
        : <span key={i}>{part}</span>
    );
  }

  async function handleDelete() {
    if (!ticket || !slug || !key) return;
    if (!confirm('Delete this ticket?')) return;
    await ticketsApi.delete(slug, key, ticket.id);
    navigate(`/workspaces/${slug}/projects/${key}`);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const body = commentBody.trim();
    if (!slug || !key || !ticketId || !body) return;
    const mentions = [...new Set((body.match(/@(\w+)/g) ?? []).map(m => m.slice(1)))];
    setSubmittingComment(true);
    try {
      await ticketsApi.comments.create(slug, key, ticketId, body, mentions);
      // Refetch from server — WebSocket will also fire but the dedup below handles it
      const fresh = await ticketsApi.comments.list(slug, key, ticketId);
      setComments(fresh);
      setShowMention(false);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!slug || !key || !ticketId) return;
    await ticketsApi.comments.delete(slug, key, ticketId, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }

  useCommentUpdates({
    slug: slug ?? '',
    key: key ?? '',
    ticketId: ticketId ?? '',
    onCreated: (comment) => {
      setComments(prev => prev.some(c => c.id === comment.id) ? prev : [...prev, comment]);
    },
    onDeleted: (commentId) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
    },
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-sm text-gray-400">Loading…</div>
    </div>
  );
  if (!ticket) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-sm text-gray-400">Ticket not found</div>
    </div>
  );

  const assigneeName = members.find(m => m.userId === ticket.assigneeId)?.username;

  return (
    <div className="min-h-screen bg-gray-50">

      <AppHeader crumbs={[
        { label: 'Workspaces', to: '/' },
        { label: slug ?? '', to: `/workspaces/${slug}` },
        { label: key ?? '', to: `/workspaces/${slug}/projects/${key}` },
        { label: ticket.projectKey },
      ]} />

      {/* Ticket header — ID + title + status + delete */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-start gap-4 justify-between">
          {/* Left: badge + editable title */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="mt-1 shrink-0 font-mono text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
              {ticket.projectKey}
            </span>
            {editingTitle ? (
              <input
                autoFocus
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="flex-1 text-xl font-bold text-gray-900 border-b-2 border-brand outline-none bg-transparent pb-0.5 leading-tight"
              />
            ) : (
              <h1
                className="flex-1 text-xl font-bold text-gray-900 cursor-text hover:text-brand transition-colors leading-tight"
                onClick={() => { setEditingTitle(true); setTitleValue(ticket.title); }}
                title="Click to edit"
              >
                {ticket.title}
              </h1>
            )}
          </div>

          {/* Right: status + delete */}
          <div className="flex items-center gap-3 shrink-0">
            <select
              value={ticket.status}
              onChange={e => saveField('status', e.target.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand transition-colors ${STATUS_COLORS[ticket.status]}`}
            >
              {(Object.keys(STATUS_LABELS) as TicketStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            {(callerRole === 'OWNER' || callerRole === 'ADMIN') && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 hover:text-red-600 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main body — 65/35 split */}
      <main className="max-w-6xl mx-auto px-8 py-6 flex gap-6 items-start">

        {/* LEFT COLUMN — description + comments */}
        <div className="flex-[65] min-w-0 space-y-6">

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Description</p>
              <span className="text-xs text-gray-400 min-w-[56px] text-right">
                {descStatus === 'pending' && 'Saving…'}
                {descStatus === 'saving' && 'Saving…'}
                {descStatus === 'saved' && <span className="text-green-500">Saved ✓</span>}
              </span>
            </div>
            <textarea
              ref={descRef}
              value={descValue}
              onChange={e => handleDescChange(e.target.value)}
              placeholder="Add a description…"
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none bg-gray-50 placeholder:text-gray-300 overflow-hidden"
              style={{ minHeight: '100px' }}
            />
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Comments */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Comments {comments.length > 0 && <span className="ml-1 text-gray-300 normal-case">({comments.length})</span>}
            </p>

            {/* Comment list */}
            <div className="space-y-4 mb-5">
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 italic">No comments yet. Be the first to comment.</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="flex gap-3 group">
                  <div className={`w-8 h-8 rounded-full ${avatarColor(c.authorUsername)} text-white text-xs font-bold flex items-center justify-center shrink-0 select-none`}>
                    {initials(c.authorUsername)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{c.authorUsername}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {(c.authorId === user?.id || callerRole === 'OWNER' || callerRole === 'ADMIN') && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity ml-auto"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{renderBody(c.body)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <form onSubmit={handleAddComment}>
              <div className="flex gap-3 items-start">
                <div className={`w-8 h-8 rounded-full ${user ? avatarColor(user.username) : 'bg-gray-300'} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                  {user ? initials(user.username) : '?'}
                </div>
                <div className="flex-1 min-w-0 relative">
                  <textarea
                    ref={commentTextareaRef}
                    rows={3}
                    placeholder="Write a comment… Type @ to mention someone"
                    value={commentBody}
                    onChange={handleCommentChange}
                    onKeyDown={handleCommentKeyDown}
                    onBlur={() => setTimeout(() => setShowMention(false), 150)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none placeholder:text-gray-300 bg-white shadow-sm"
                  />

                  {/* @mention dropdown */}
                  {showMention && mentionCandidates.length > 0 && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-56 overflow-hidden">
                      <div className="px-3 py-1.5 border-b border-gray-100">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Mention a member</span>
                      </div>
                      {mentionCandidates.slice(0, 7).map((m, i) => (
                        <button
                          key={m.userId}
                          type="button"
                          onMouseDown={e => { e.preventDefault(); insertMention(m.username); }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${i === mentionIndex ? 'bg-brand/10 text-brand-dark' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          <div className={`w-6 h-6 rounded-full ${avatarColor(m.username)} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                            {initials(m.username)}
                          </div>
                          <span className="font-medium truncate">{m.username}</span>
                          <span className="text-[10px] text-gray-400 ml-auto shrink-0">{m.role}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-300">Cmd+Enter to submit · @ to mention</span>
                    <button
                      type="submit"
                      disabled={submittingComment || !commentBody.trim()}
                      className="bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                    >
                      {submittingComment ? 'Saving…' : 'Add comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <hr className="border-gray-200" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-6 mb-4">History</p>
              <div className="space-y-1">
                {history.map(h => (
                  <HistoryRow key={h.id} entry={h} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR — metadata card */}
        <div className="flex-[35] min-w-[240px] max-w-xs">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

            <SidebarField label="Type">
              <select
                value={ticket.type}
                onChange={e => saveField('type', e.target.value)}
                className={`w-full text-sm font-medium focus:outline-none bg-transparent cursor-pointer ${TYPE_COLORS[ticket.type]}`}
              >
                {(Object.keys(TYPE_LABELS) as TicketType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </SidebarField>

            <SidebarField label="Priority">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
                <select
                  value={ticket.priority}
                  onChange={e => saveField('priority', e.target.value)}
                  className="flex-1 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                >
                  {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map(p => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </SidebarField>

            <SidebarField label="Assignee">
              <select
                value={ticket.assigneeId ?? ''}
                onChange={e => saveField('assigneeId', e.target.value)}
                className="w-full text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.username}</option>
                ))}
              </select>
              {assigneeName && (
                <div className="flex items-center gap-2 mt-1.5 pointer-events-none">
                  <div className={`w-5 h-5 rounded-full ${avatarColor(assigneeName)} text-white text-[10px] font-bold flex items-center justify-center`}>
                    {initials(assigneeName)}
                  </div>
                </div>
              )}
            </SidebarField>

            <SidebarField label="Story Points">
              <input
                type="number"
                min="0"
                max="99"
                defaultValue={ticket.storyPoints ?? ''}
                key={ticket.storyPoints ?? 'sp'}
                onBlur={e => saveField('storyPoints', e.target.value)}
                placeholder="—"
                className="w-20 text-sm text-gray-700 focus:outline-none bg-transparent border-b border-transparent focus:border-gray-300 placeholder:text-gray-300"
              />
            </SidebarField>

            {teams.length > 0 && (
              <SidebarField label="Team">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => saveField('teamId', '')}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${!ticket.teamId ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
              </SidebarField>
            )}

            <SidebarField label="Reporter">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full ${avatarColor(ticket.reporterUsername)} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                  {initials(ticket.reporterUsername)}
                </div>
                <span className="text-sm text-gray-700">{ticket.reporterUsername}</span>
              </div>
            </SidebarField>

            <SidebarField label="Created" last>
              <p className="text-sm text-gray-600">
                {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Updated {new Date(ticket.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </SidebarField>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarField({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`px-5 py-4 ${!last ? 'border-b border-gray-100' : ''}`}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      {children}
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  status: 'Status', priority: 'Priority', assignee: 'Assignee',
  type: 'Type', title: 'Title', storyPoints: 'Story Points',
};

function HistoryRow({ entry }: { entry: TicketHistoryEntry }) {
  const label = FIELD_LABELS[entry.field] ?? entry.field;
  const date = new Date(entry.changedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="flex items-start gap-3 py-2.5 group">
      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600 leading-snug">
          <span className="font-semibold text-gray-800">{entry.changedByUsername}</span>
          {' changed '}
          <span className="font-medium text-gray-700">{label}</span>
          {entry.oldValue && entry.newValue ? (
            <>
              {' from '}
              <span className="line-through text-gray-400">{entry.oldValue}</span>
              {' to '}
              <span className="font-medium text-brand">{entry.newValue}</span>
            </>
          ) : entry.newValue ? (
            <> to <span className="font-medium text-brand">{entry.newValue}</span></>
          ) : (
            <> to <span className="text-gray-400 italic">none</span></>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{date}</p>
      </div>
    </div>
  );
}

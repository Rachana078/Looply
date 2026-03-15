import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workspacesApi } from '../api/workspaces';
import type { TicketSummary, TicketType } from '../types/ticket';

const TYPE_BADGE: Record<TicketType, string> = {
  STORY: 'bg-blue-100 text-blue-700',
  BUG:   'bg-red-100 text-red-700',
  TASK:  'bg-gray-100 text-gray-600',
  EPIC:  'bg-purple-100 text-purple-700',
};

interface Props {
  onClose: () => void;
}

export default function SearchModal({ onClose }: Props) {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!slug || !query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await workspacesApi.search(slug, query.trim());
        setResults(r);
        setSelectedIdx(0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, slug]);

  function handleSelect(ticket: TicketSummary) {
    if (!slug) return;
    navigate(`/workspaces/${slug}/projects/${ticket.projectKey ?? ''}/tickets/${ticket.id}`);
    onClose();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) handleSelect(results[selectedIdx]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search tickets…"
            className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
          />
          {loading && <span className="text-xs text-gray-400">Searching…</span>}
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">Esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto py-1">
            {results.map((ticket, i) => (
              <li key={ticket.id}>
                <button
                  onClick={() => handleSelect(ticket)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIdx ? 'bg-brand/10' : 'hover:bg-gray-50'}`}
                >
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_BADGE[ticket.type]}`}>
                    {ticket.type[0]}
                  </span>
                  <span className="flex-1 text-sm text-gray-800 truncate">{ticket.title}</span>
                  <span className="text-xs text-gray-400 font-mono shrink-0">{ticket.projectKey}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">No tickets found for "{query}"</div>
        )}

        {!query && (
          <div className="px-4 py-3 text-xs text-gray-400">
            Type to search tickets in this workspace
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="bg-gray-100 px-1 rounded font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="bg-gray-100 px-1 rounded font-mono">↵</kbd> open</span>
          <span><kbd className="bg-gray-100 px-1 rounded font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

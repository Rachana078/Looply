import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuthStore } from '../store/authStore';
import NotificationBell from './NotificationBell';
import SearchModal from './SearchModal';
import api from '../api/axios';

interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  crumbs: Crumb[];
  right?: React.ReactNode;
}

export default function AppHeader({ crumbs, right }: Props) {
  const user = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cmd+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (slug) setSearchOpen(v => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slug]);

  // Close menu on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleSignOut() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  }

  const initials = user ? user.username.slice(0, 2).toUpperCase() : '??';

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo size={26} />
            <span className="text-sm font-bold text-gray-800">Looply</span>
          </Link>
          <span className="text-gray-200 select-none hidden sm:inline">|</span>
        <nav className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {c.to
                ? <Link to={c.to} className="hover:text-gray-600 transition-colors">{c.label}</Link>
                : <span className="text-gray-700 font-medium">{c.label}</span>
              }
            </span>
          ))}
        </nav>
        </div>

        <div className="flex items-center gap-2">
          {slug && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
              <kbd className="font-mono hidden sm:inline">⌘K</kbd>
            </button>
          )}
          <NotificationBell />
          {right}

          {/* User menu */}
          {user && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="w-7 h-7 rounded-full bg-brand hover:ring-2 hover:ring-brand-light hover:ring-offset-1 text-white text-xs font-bold flex items-center justify-center select-none transition-all"
                title={user.username}
              >
                {initials}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      Profile
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Sign out */}
                  <div className="py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}

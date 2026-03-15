import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types/auth';
import Logo from '../components/Logo';

// ─── tiny inline SVG icons ─────────────────────────────────────────────────
function IconKanban() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function IconAt() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  );
}
function IconTeam() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const FEATURES = [
  { icon: <IconKanban />, title: 'Kanban boards', desc: 'Drag and drop tickets across stages as work flows forward.' },
  { icon: <IconBolt />,   title: 'Real-time updates', desc: 'Team changes appear instantly — no page refresh needed.' },
  { icon: <IconAt />,     title: '@Mention teammates', desc: 'Loop anyone in directly from comments with a notification.' },
  { icon: <IconTeam />,   title: 'Teams & roles', desc: 'Owners, admins, members — everyone knows their lane.' },
];

// ─── mini kanban board (decorative) ────────────────────────────────────────
const MINI_BOARD = [
  {
    label: 'To Do',
    dot: 'bg-sky-400',
    cards: [
      { title: 'Design onboarding', color: 'border-l-amber-400' },
      { title: 'Write API docs',    color: 'border-l-gray-400' },
    ],
  },
  {
    label: 'In Progress',
    dot: 'bg-brand',
    cards: [
      { title: 'Auth & permissions', color: 'border-l-orange-400' },
    ],
  },
  {
    label: 'Done',
    dot: 'bg-emerald-400',
    cards: [
      { title: 'Project setup',   color: 'border-l-gray-300', done: true },
      { title: 'Database schema', color: 'border-l-gray-300', done: true },
    ],
  },
];

// ─── page ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notVerified, setNotVerified] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNotVerified(false);
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      setAuth(data.accessToken, data.user);
      navigate('/');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 403) {
        setNotVerified(true);
      } else {
        setError(msg ?? 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendStatus('sending');
    try {
      await api.post('/auth/resend-verification', { email });
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_0.9fr]">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-[#1a3d54] to-brand p-12 overflow-hidden relative">

        {/* subtle radial glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 60%, #4A87AC 0%, transparent 65%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <Logo size={36} />
          <span className="text-xl font-bold text-white tracking-tight">Looply</span>
        </div>

        {/* Headline + features */}
        <div className="relative z-10 my-auto py-12">
          <div className="mb-2">
            <span className="text-xs font-semibold text-accent-light bg-accent/20 border border-accent/30 px-3 py-1 rounded-full">
              Project management, simplified
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mt-4 mb-3">
            Where teams<br />stay in the loop.
          </h1>
          <p className="text-white/50 text-base mb-10 max-w-sm">
            Plan sprints, track bugs, ship features — Looply keeps your whole team aligned from backlog to done.
          </p>

          <div className="space-y-5">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3.5 group">
                <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors flex items-center justify-center text-brand-light shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini kanban preview */}
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
            Your board
          </p>
          <div className="flex gap-2">
            {MINI_BOARD.map(col => (
              <div key={col.label} className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                  <span className="text-[10px] font-semibold text-white/50 truncate">{col.label}</span>
                </div>
                <div className="space-y-1.5">
                  {col.cards.map(card => (
                    <div
                      key={card.title}
                      className={`bg-white/10 hover:bg-white/15 transition-colors rounded-lg px-2.5 py-2 border-l-2 ${card.color}`}
                    >
                      <p className={`text-[11px] font-medium leading-snug ${'done' in card && card.done ? 'text-white/30 line-through' : 'text-white/80'}`}>
                        {card.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/20 mt-4 text-center">
            Looply © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: form ────────────────────────────────────────────── */}
      <div className="flex items-center justify-center bg-gray-50 p-8 min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">

          {/* Mobile-only brand mark */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <Logo size={52} />
            <span className="mt-3 text-2xl font-bold text-gray-900 tracking-tight">Looply</span>
            <span className="text-sm text-gray-400 mt-1">Project management, simplified</span>
          </div>

          {/* Desktop greeting */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-400 mt-1">Sign in to continue to Looply</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md">
            {notVerified && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                <p className="font-medium mb-1">Email not verified</p>
                <p className="text-amber-700">Please check your inbox and click the verification link.</p>
                <button
                  onClick={handleResend}
                  disabled={resendStatus !== 'idle'}
                  className="mt-2 text-brand hover:text-brand-dark font-medium hover:underline disabled:opacity-50 text-xs"
                >
                  {resendStatus === 'sending' ? 'Sending…' : resendStatus === 'sent' ? '✓ Sent!' : 'Resend verification email'}
                </button>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-4 text-sm text-gray-600 text-center">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand hover:text-brand-dark font-medium hover:underline">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

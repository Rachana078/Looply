import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types/auth';
import Logo from '../components/Logo';

// ─── tiny inline SVG icons ─────────────────────────────────────────────────
function IconRocket() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.82m2.56-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  );
}
function IconSprint() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
function IconFree() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.625 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 119.375 7.5H12m0 0H8.625M12 7.5h3.375M12 7.5v13.5m-3.375-13.5H5.25a2.25 2.25 0 000 4.5h1.875M12 7.5h3.375m0 0H18.75a2.25 2.25 0 010 4.5h-1.875" />
    </svg>
  );
}

const PERKS = [
  { icon: <IconRocket />, title: 'Ship faster',        desc: 'Sprints, backlogs, Kanban — every workflow built in from day one.' },
  { icon: <IconCheck />,  title: 'Zero learning curve', desc: 'Intuitive by design. Your team is productive from minute one.' },
  { icon: <IconSprint />, title: 'Progress at a glance', desc: 'Charts and boards surface blockers before they slow you down.' },
  { icon: <IconFree />,   title: 'Free to start',       desc: 'No credit card. No time limit. Just create and collaborate.' },
];

// ─── decorative stat pills ──────────────────────────────────────────────────
const STATS = [
  { value: '10×', label: 'faster planning' },
  { value: '∞',   label: 'projects' },
  { value: '100%', label: 'free to start' },
];

// ─── page ───────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', { email, username, password });
      setAuth(data.accessToken, data.user);
      navigate('/');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { detail?: string; errors?: Record<string, string> } } })?.response?.data;
      if (errData?.errors) {
        setError(Object.values(errData.errors).join(', '));
      } else {
        setError(errData?.detail ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_0.9fr]">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-[#1a3d54] to-brand p-12 overflow-hidden relative">

        {/* subtle radial glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 40%, #4A87AC 0%, transparent 65%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <Logo size={36} />
          <span className="text-xl font-bold text-white tracking-tight">Looply</span>
        </div>

        {/* Headline + perks */}
        <div className="relative z-10 my-auto py-12">
          <div className="mb-2">
            <span className="text-xs font-semibold text-accent-light bg-accent/20 border border-accent/30 px-3 py-1 rounded-full">
              Join thousands of teams
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mt-4 mb-3">
            From idea to done,<br />together.
          </h1>
          <p className="text-white/50 text-base mb-10 max-w-sm">
            Looply gives your team a single place to plan work, track progress, and celebrate wins — no spreadsheets required.
          </p>

          <div className="space-y-5">
            {PERKS.map(p => (
              <div key={p.title} className="flex items-start gap-3.5 group">
                <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors flex items-center justify-center text-brand-light shrink-0">
                  {p.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{p.title}</p>
                  <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat pills */}
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
            Why teams choose Looply
          </p>
          <div className="flex gap-3">
            {STATS.map(s => (
              <div key={s.label} className="flex-1 bg-white/10 hover:bg-white/15 transition-colors rounded-xl px-3 py-3 text-center">
                <p className="text-xl font-bold text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-white/40 mt-1 leading-tight">{s.label}</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-sm text-gray-400 mt-1">Start managing projects in minutes</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="yourhandle"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
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
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-4 text-sm text-gray-600 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-brand hover:text-brand-dark font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

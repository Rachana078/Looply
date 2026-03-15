import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { workspacesApi } from '../api/workspaces';
import { authApi } from '../api/auth';
import AppHeader from '../components/AppHeader';
import type { WorkspaceSummary } from '../types/workspace';

const ROLE_STYLES: Record<string, string> = {
  OWNER:  'bg-purple-50 text-purple-700',
  ADMIN:  'bg-blue-50 text-blue-700',
  MEMBER: 'bg-gray-100 text-gray-600',
};

export default function ProfilePage() {
  const user = useAuthStore(s => s.user);
  const setAuth = useAuthStore(s => s.setAuth);
  const accessToken = useAuthStore(s => s.accessToken);

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState(user?.username ?? '');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    workspacesApi.list().then(setWorkspaces).catch(() => {});
  }, []);

  const initials = user ? user.username.slice(0, 2).toUpperCase() : '??';

  async function handleSaveUsername() {
    if (!usernameValue.trim() || usernameValue === user?.username) {
      setEditingUsername(false);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const updated = await authApi.updateProfile({ username: usernameValue.trim() });
      if (accessToken) setAuth(accessToken, updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditingUsername(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSaveError(msg ?? 'Failed to update username');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader crumbs={[{ label: 'Workspaces', to: '/' }, { label: 'Profile' }]} />

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Profile card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-brand text-white text-xl font-bold flex items-center justify-center select-none shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{user?.username}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Username</label>
              {editingUsername ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={usernameValue}
                    onChange={e => setUsernameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveUsername(); if (e.key === 'Escape') setEditingUsername(false); }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={saving}
                    className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingUsername(false); setUsernameValue(user?.username ?? ''); setSaveError(''); }}
                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-800">{user?.username}</span>
                  <button
                    onClick={() => { setEditingUsername(true); setUsernameValue(user?.username ?? ''); }}
                    className="text-xs text-brand hover:text-brand-dark"
                  >
                    Edit
                  </button>
                </div>
              )}
              {saveError && <p className="text-xs text-red-500 mt-1">{saveError}</p>}
              {saved && <p className="text-xs text-green-500 mt-1">Username updated ✓</p>}
            </div>

            {/* Email — read-only */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
              <p className="text-sm text-gray-800">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Workspace memberships */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Workspace memberships</h2>
          </div>
          {workspaces.length === 0 ? (
            <div className="px-5 py-6 text-sm text-gray-400">No workspaces yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {workspaces.map(ws => (
                <div key={ws.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{ws.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{ws.slug}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLES[ws.callerRole] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ws.callerRole}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AppHeader from '../components/AppHeader';

export default function SettingsPage() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore(s => s.clearAuth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? 'Current password is incorrect' : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader crumbs={[{ label: 'Workspaces', to: '/' }, { label: 'Settings' }]} />

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Change password */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Change password</h2>
            <p className="text-xs text-gray-400 mt-0.5">Update your password. You'll stay logged in on this device.</p>
          </div>
          <div className="px-5 py-5">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                Password changed successfully ✓
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Current password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Confirm new password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
                >
                  {saving ? 'Saving…' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white border border-red-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-red-100">
            <h2 className="text-sm font-semibold text-red-600">Danger zone</h2>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Delete account</p>
              <p className="text-xs text-gray-400 mt-0.5">Permanently delete your account and all your data. This cannot be undone.</p>
            </div>
            <button
              disabled={deleting}
              onClick={async () => {
                if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
                setDeleting(true);
                try {
                  await authApi.deleteAccount();
                  clearAuth();
                  navigate('/login');
                } catch {
                  alert('Failed to delete account. Please try again.');
                  setDeleting(false);
                }
              }}
              className="text-sm text-red-500 border border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

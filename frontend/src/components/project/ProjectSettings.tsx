import { useState, type FormEvent } from 'react';
import { teamsApi } from '../../api/teams';
import { TEAM_COLOR_OPTIONS, teamBadgeClasses, teamDotClass } from '../../utils/teamColors';
import type { ProjectTeam } from '../../types/ticket';

interface Props {
  slug: string;
  projectKey: string;
  callerRole: string;
  teams: ProjectTeam[];
  onTeamsChange: (teams: ProjectTeam[]) => void;
}

export default function ProjectSettings({ slug, projectKey, callerRole, teams, onTeamsChange }: Props) {
  const canManage = callerRole === 'OWNER' || callerRole === 'ADMIN';

  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setCreating(true);
    try {
      const team = await teamsApi.create(slug, projectKey, { name: name.trim(), color });
      onTeamsChange([...teams, team]);
      setName('');
      setColor('blue');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Failed to create team');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(teamId: string) {
    if (!confirm('Delete this team? Tickets assigned to it will become unassigned.')) return;
    await teamsApi.delete(slug, projectKey, teamId);
    onTeamsChange(teams.filter(t => t.id !== teamId));
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Teams</h2>
        <p className="text-sm text-gray-500">Group tickets by team or component.</p>
      </div>

      {/* Team list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {teams.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400 italic">No teams yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {teams.map(team => (
              <div key={team.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${teamDotClass(team.color)}`} />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${teamBadgeClasses(team.color)}`}>
                    {team.name}
                  </span>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create form — OWNER/ADMIN only */}
      {canManage && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Add team</h3>
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Backend, QA, Frontend"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {TEAM_COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${teamDotClass(c)} ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    title={c}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1 capitalize">Selected: {color}</p>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {creating ? 'Creating…' : 'Add team'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

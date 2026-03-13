import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { workspacesApi } from '../api/workspaces';
import { projectsApi } from '../api/projects';
import type { Workspace, Project } from '../types/workspace';

export default function WorkspaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [projName, setProjName] = useState('');
  const [projKey, setProjKey] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      workspacesApi.get(slug),
      projectsApi.list(slug),
    ]).then(([ws, projs]) => {
      setWorkspace(ws);
      setProjects(projs);
    }).finally(() => setLoading(false));
  }, [slug]);

  function handleNameChange(value: string) {
    setProjName(value);
    setProjKey(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
  }

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!slug) return;
    setError('');
    setCreating(true);
    try {
      const project = await projectsApi.create(slug, {
        name: projName,
        key: projKey,
        description: projDesc || undefined,
      });
      setProjects(prev => [...prev, project]);
      setShowCreate(false);
      setProjName('');
      setProjKey('');
      setProjDesc('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Failed to create project');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>;
  if (!workspace) return <div className="flex items-center justify-center h-screen text-gray-400">Workspace not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Workspaces</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-900">{workspace.name}</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Projects section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            New project
          </button>
        </div>

        {showCreate && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create project</h3>
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text" required value={projName}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                <input
                  type="text" required value={projKey}
                  onChange={e => setProjKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="PROJ"
                />
                <p className="text-xs text-gray-400 mt-1">Uppercase letters and numbers only (max 10 chars)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={projDesc}
                  onChange={e => setProjDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What is this project about?"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit" disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button" onClick={() => setShowCreate(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No projects yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {projects.map(proj => (
              <Link
                key={proj.id}
                to={`/workspaces/${slug}/projects/${proj.key}`}
                className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{proj.name}</p>
                    {proj.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{proj.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2 shrink-0">
                    {proj.key}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Members section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Members</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {workspace.members.map(m => (
              <div key={m.userId} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.username}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

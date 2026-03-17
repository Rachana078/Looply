import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import AppHeader from '../components/AppHeader';
import { workspacesApi } from '../api/workspaces';
import { ticketsApi } from '../api/tickets';
import { teamsApi } from '../api/teams';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import { useProjectUpdates } from '../hooks/useProjectUpdates';
import BacklogView from '../components/backlog/BacklogView';
import KanbanBoard from '../components/board/KanbanBoard';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import ProjectSettings from '../components/project/ProjectSettings';
import type { Project, WorkspaceMember } from '../types/workspace';
import type { TicketSummary, ProjectTeam } from '../types/ticket';

type ViewTab = 'backlog' | 'board' | 'settings';

export default function ProjectDetailPage() {
  const { slug, key } = useParams<{ slug: string; key: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const { setTickets } = useTicketStore();

  useProjectUpdates(slug ?? '', key ?? '');

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [callerRole, setCallerRole] = useState('MEMBER');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('backlog');

  useEffect(() => {
    if (!slug || !key) return;
    Promise.all([
      projectsApi.get(slug, key),
      ticketsApi.list(slug, key),
      workspacesApi.get(slug),
      teamsApi.list(slug, key),
    ]).then(([proj, tickets, workspace, tms]) => {
      setProject(proj);
      setTickets(tickets);
      setMembers(workspace.members);
      setTeams(tms);
      const me = workspace.members.find(m => m.userId === user?.id);
      setCallerRole(me?.role ?? 'MEMBER');
    }).finally(() => setLoading(false));

    return () => { setTickets([]); };
  }, [slug, key]);

  function handleTicketClick(ticketId: string) {
    navigate(`/workspaces/${slug}/projects/${key}/tickets/${ticketId}`);
  }

  function handleTicketCreated(_ticket: TicketSummary) {
    // WebSocket CREATED event handles adding to store — no optimistic add needed
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>;
  if (!project) return <div className="flex items-center justify-center h-screen text-gray-400">Project not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader crumbs={[
        { label: 'Workspaces', to: '/' },
        { label: slug ?? '', to: `/workspaces/${slug}` },
        { label: `${project.name} (${project.key})` },
      ]} />

      <main className={`px-4 sm:px-6 py-8 ${activeTab === 'board' ? '' : 'max-w-4xl mx-auto'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 overflow-x-auto">
            {(['backlog', 'board', 'settings'] as ViewTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab !== 'settings' && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0 ml-2"
            >
              Create ticket
            </button>
          )}
        </div>

        {activeTab === 'backlog' && (
          <BacklogView slug={slug ?? ''} projectKey={key ?? ''} members={members} teams={teams} onTicketClick={handleTicketClick} />
        )}
        {activeTab === 'board' && slug && key && (
          <KanbanBoard slug={slug} projectKey={key} teams={teams} onTicketClick={handleTicketClick} />
        )}
        {activeTab === 'settings' && slug && key && (
          <ProjectSettings
            slug={slug}
            projectKey={key}
            callerRole={callerRole}
            teams={teams}
            onTeamsChange={setTeams}
          />
        )}
      </main>

      {showCreate && slug && key && (
        <CreateTicketModal
          slug={slug}
          projectKey={key}
          members={members}
          teams={teams}
          onClose={() => setShowCreate(false)}
          onCreated={handleTicketCreated}
        />
      )}
    </div>
  );
}

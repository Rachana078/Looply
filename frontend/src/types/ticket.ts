export type TicketType     = 'STORY' | 'BUG' | 'TASK' | 'EPIC';
export type TicketStatus   = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectTeam {
  id: string;
  name: string;
  color: string;
}

export interface TicketSummary {
  id: string;
  title: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  assigneeUsername: string | null;
  assigneeAvatarUrl: string | null;
  storyPoints: number | null;
  position: number;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
}

export interface Ticket extends TicketSummary {
  projectId: string;
  projectKey: string;
  workspaceId: string;
  workspaceSlug: string;
  description: string | null;
  reporterId: string;
  reporterUsername: string;
  createdAt: string;
  updatedAt: string;
  // teamId, teamName, teamColor inherited from TicketSummary
}

export interface CreateTicketPayload {
  title: string;
  description?: string;
  type: TicketType;
  status?: TicketStatus;
  priority: TicketPriority;
  assigneeId?: string;
  storyPoints?: number;
  teamId?: string;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  type?: TicketType;
  priority?: TicketPriority;
  assigneeId?: string;
  storyPoints?: number | null;
  teamId?: string; // "" to clear, UUID to assign, omit for no change
}

export interface ReorderEntry {
  id: string;
  position: number;
}

export interface Comment {
  id: string;
  body: string;
  authorId: string;
  authorUsername: string;
  createdAt: string;
  updatedAt: string;
}

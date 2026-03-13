export interface WorkspaceMember {
  userId: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  callerRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  workspaceSlug: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

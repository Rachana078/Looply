export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  actorUsername: string | null;
  createdAt: string;
}

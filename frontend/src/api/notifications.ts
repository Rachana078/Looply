import api from './axios';
import type { Notification } from '../types/notification';

export const notificationsApi = {
  list: () => api.get<Notification[]>('/notifications').then(r => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then(r => r.data.count),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

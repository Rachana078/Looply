import api from './axios';
import type { UserProfile } from '../types/auth';

export const authApi = {
  me: () => api.get<UserProfile>('/auth/me').then(r => r.data),
  updateProfile: (data: { username?: string; avatarUrl?: string }) =>
    api.patch<UserProfile>('/auth/me', data).then(r => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/me/change-password', data),
  deleteAccount: () => api.delete('/auth/me'),
};

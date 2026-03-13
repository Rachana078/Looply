import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

export function useAuth() {
  const { accessToken, user, setAuth, clearAuth } = useAuthStore();

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
    }
  }

  return { accessToken, user, setAuth, clearAuth, logout, isAuthenticated: !!accessToken };
}

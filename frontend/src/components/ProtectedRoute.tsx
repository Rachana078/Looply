import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types/auth';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { accessToken, setAuth } = useAuthStore();
  const [checking, setChecking] = useState(!accessToken);
  const [allowed, setAllowed] = useState(!!accessToken);

  useEffect(() => {
    if (accessToken) return;

    // Attempt silent refresh via cookie
    api
      .post<AuthResponse>('/auth/refresh')
      .then(({ data }) => {
        setAuth(data.accessToken, data.user);
        setAllowed(true);
      })
      .catch(() => {
        setAllowed(false);
      })
      .finally(() => {
        setChecking(false);
      });
  }, [accessToken, setAuth]);

  if (checking) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types/auth';
import Logo from '../components/Logo';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }
    api.get<AuthResponse>(`/auth/verify-email?token=${token}`)
      .then(({ data }) => {
        setAuth(data.accessToken, data.user);
        setStatus('success');
        setTimeout(() => navigate('/'), 2000);
      })
      .catch((err: unknown) => {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setStatus('error');
        setMessage(detail ?? 'Verification failed. The link may have expired.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={52} />
          <span className="mt-3 text-2xl font-bold text-gray-900 tracking-tight">Looply</span>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md text-center">
          {status === 'verifying' && (
            <>
              <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 text-sm">Verifying your email…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h2>
              <p className="text-sm text-gray-500">Taking you to your dashboard…</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h2>
              <p className="text-sm text-gray-500 mb-5">{message}</p>
              <Link
                to="/register"
                className="text-brand hover:text-brand-dark font-medium text-sm hover:underline"
              >
                Back to sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

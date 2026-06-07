import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '@/lib/authClient';
import { useAuthStore } from '@/store/authStore';

// Mirrors the Better Auth session into the auth store on every change.
export function AuthBootstrap() {
  const { data, isPending } = useSession();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (isPending) return;
    setSession(data?.user || null);
  }, [data, isPending, setSession]);

  return null;
}

export function RequireAuth({ children }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'loading') return null; // wait for the session check
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export function PublicOnlyRoute({ children }) {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') return null;
  if (status === 'authenticated') return <Navigate to="/account" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role);
  const location = useLocation();

  if (status === 'loading') return null;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

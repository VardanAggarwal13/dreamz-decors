import { create } from 'zustand';
import { toast } from 'sonner';
import { authClient } from '@/lib/authClient';

// Auth is now session-cookie based (Better Auth). This store mirrors the
// current session for components; AuthBootstrap keeps it in sync.
export const useAuthStore = create((set) => ({
  user: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'

  setSession: (user) =>
    set({ user: user || null, status: user ? 'authenticated' : 'unauthenticated' }),

  logout: async () => {
    try {
      await authClient.signOut();
    } catch {
      /* ignore */
    }
    set({ user: null, status: 'unauthenticated' });
    toast.success('Logged out');
  },
}));

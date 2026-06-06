import { createAuthClient } from 'better-auth/react';

// baseURL defaults to the current origin; in dev the Vite proxy forwards
// /api/auth/* to the backend, so cookies stay first-party.
export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;

import { createAuthClient } from 'better-auth/react';

// In production the API lives on a separate origin (e.g. https://api.dreamdecords.com),
// while VITE_API_URL points at ".../api". Better Auth appends its own "/api/auth"
// base path, so we hand it the backend ORIGIN (strip the trailing "/api").
// In dev VITE_API_URL is unset → baseURL stays undefined → the Vite proxy forwards
// /api/auth/* to the backend and cookies stay first-party.
const apiUrl = import.meta.env.VITE_API_URL;
const baseURL = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : undefined;

export const authClient = createAuthClient(baseURL ? { baseURL } : {});

export const { useSession, signIn, signUp, signOut } = authClient;

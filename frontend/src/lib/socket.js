import { io } from 'socket.io-client';

let socket = null;

function socketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;
  return window.location.origin; // proxied to the API in dev
}

/**
 * Connect the socket. Auth is the Better Auth session cookie, sent
 * automatically via withCredentials — no token needed.
 */
export function connectSocket() {
  if (socket?.connected) return socket;
  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io(socketUrl(), {
    autoConnect: true,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

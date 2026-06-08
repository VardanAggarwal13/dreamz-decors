import { Server } from 'socket.io';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';

let io = null;

// Each authenticated user joins a private room named `user:<id>`, so we can
// emit to every device/tab that user has open with a single call.
const roomForUser = (userId) => `user:${userId}`;

/**
 * Attach a Socket.IO server to an existing HTTP server.
 * Clients must connect with a JWT, either as `auth: { token }` or
 * `?token=` in the handshake query.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      // CLIENT_URL may be a comma-separated list (apex + www); allow each.
      origin: (process.env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim().replace(/\/+$/, ''))
        .filter(Boolean),
      credentials: true,
    },
  });

  // Authenticate every socket from the Better Auth session cookie.
  io.use(async (socket, next) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(socket.handshake.headers),
      });
      if (!session?.user) return next(new Error('unauthorized'));
      socket.userId = String(session.user.id);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(roomForUser(socket.userId));

    socket.on('disconnect', () => {
      // socket.io leaves rooms automatically on disconnect
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Emit an event to all of a user's connected sockets.
 * No-op if Socket.IO hasn't been initialised (e.g. in scripts/tests).
 */
export function emitToUser(userId, event, payload) {
  if (!io || !userId) return false;
  io.to(roomForUser(userId)).emit(event, payload);
  return true;
}

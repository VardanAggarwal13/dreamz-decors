import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';

const PORT = Number(process.env.PORT) || 5000;

const server = http.createServer(app);
initSocket(server);

let retryCount = 0;
const MAX_RETRIES = 5;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.warn(`⚠️ Port ${PORT} busy, retrying in 1s (${retryCount}/${MAX_RETRIES})...`);
      setTimeout(() => {
        try { server.close(); } catch {}
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error(`❌ Port ${PORT} is already in use after ${MAX_RETRIES} retries.`);
      process.exit(1);
    }
  } else {
    console.error('Server error:', err);
  }
});

// Start listening immediately so Vite proxy never gets ECONNREFUSED
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✦ DreamzDecors API running on http://localhost:${PORT}`);
  console.log(`✦ Socket.IO ready for real-time notifications`);
});

// Graceful shutdown so ports are cleanly released on nodemon restarts
const shutdown = () => {
  try {
    server.close(() => process.exit(0));
  } catch {
    process.exit(0);
  }
  setTimeout(() => process.exit(0), 1000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.once('SIGUSR2', () => {
  try {
    server.close(() => process.kill(process.pid, 'SIGUSR2'));
  } catch {
    process.kill(process.pid, 'SIGUSR2');
  }
});

// Connect to MongoDB (Mongoose buffers queries until connection is established)
connectDB().catch((err) => {
  console.error('MongoDB connection error:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});


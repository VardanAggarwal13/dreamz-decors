import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please terminate existing node processes on port ${PORT}.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Start listening immediately so Vite proxy never gets ECONNREFUSED
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✦ DreamzDecors API running on http://localhost:${PORT}`);
  console.log(`✦ Socket.IO ready for real-time notifications`);
});

// Connect to MongoDB (Mongoose buffers queries until connection is established)
connectDB().catch((err) => {
  console.error('MongoDB connection error:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});


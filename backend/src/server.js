import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Wrap Express in an HTTP server so Socket.IO can share the same port.
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`✦ DreamzDecors API running on http://localhost:${PORT}`);
    console.log(`✦ Socket.IO ready for real-time notifications`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

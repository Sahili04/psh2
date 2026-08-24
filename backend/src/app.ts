import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server as SocketIOServer } from 'socket.io';
import { registerApiRoutes } from './routes/apiRoutes.js';
import { initBroadcaster } from './websocket/broadcaster.js';
import { PORT } from './config/env.js';

const fastify = Fastify({ logger: true });

async function startServer() {
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await registerApiRoutes(fastify);

  await fastify.ready();

  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  initBroadcaster(io);

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 H-02 Hospital System Server running at http://localhost:${PORT}`);
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

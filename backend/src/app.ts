import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server as SocketIOServer } from 'socket.io';
import { registerApiRoutes } from './routes/apiRoutes.js';
import { initBroadcaster } from './websocket/broadcaster.js';
import { PORT } from './config/env.js';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';

const fastify = Fastify({ logger: true });

async function startServer() {
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  await registerApiRoutes(fastify);

  const frontendDist = path.resolve(process.cwd(), '../frontend/dist');
  const altDist = path.resolve(process.cwd(), 'frontend/dist');
  const targetDist = fs.existsSync(frontendDist) ? frontendDist : fs.existsSync(altDist) ? altDist : null;

  if (targetDist) {
    await fastify.register(fastifyStatic, {
      root: targetDist,
      prefix: '/',
    });

    fastify.setNotFoundHandler((request, reply) => {
      if (request.raw.url && !request.raw.url.startsWith('/api')) {
        return (reply as any).sendFile('index.html');
      }
      return reply.status(404).send({ error: 'Not Found' });
    });
  }

  await fastify.ready();

  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
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

import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initBroadcaster(io: SocketIOServer) {
  ioInstance = io;
}

export function broadcastEvent(event: string, payload: any) {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  }
}

import { Server as HTTPServer } from 'http';
import { Socket as ClientSocket } from 'socket.io-client';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface ServerToClientEvents {
  'announcement:new': (data: any) => void;
  'ticket:update': (data: any) => void;
  'join-request:new': (data: any) => void;
  'dashboard:update': (data: any) => void;
  'score:update': (data: any) => void;
}

export interface ClientToServerEvents {
  'announcement:acknowledge': (data: any) => void;
  'ticket:claim': (data: any) => void;
  'join-request:respond': (data: any) => void;
}

export type SocketServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
export type SocketClient = Socket<ClientToServerEvents, ServerToClientEvents>;

let io: SocketServer;

export function initSocket(httpServer: HTTPServer): SocketServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket: SocketClient) => {
    console.log('Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocket(): SocketServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function emitAnnouncement(hackathonId: string, data: any) {
  if (io) {
    io.to(`hackathon:${hackathonId}`).emit('announcement:new', data);
  }
}

export function emitTicketUpdate(hackathonId: string, data: any) {
  if (io) {
    io.to(`hackathon:${hackathonId}`).emit('ticket:update', data);
  }
}

export function emitJoinRequest(teamId: string, data: any) {
  if (io) {
    io.to(`team:${teamId}`).emit('join-request:new', data);
  }
}

export function emitDashboardUpdate(hackathonId: string, data: any) {
  if (io) {
    io.to(`hackathon:${hackathonId}`).emit('dashboard:update', data);
  }
}

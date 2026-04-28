import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export interface ServerToClientEvents {
  'announcement:new': (data: any) => void;
  'ticket:update': (data: any) => void;
  'join-request:new': (data: any) => void;
  'dashboard:update': (data: any) => void;
  'score:update': (data: any) => void;
}

export interface ClientToServerEvents {
  'join-room': (roomId: string) => void;
  'leave-room': (roomId: string) => void;
  'announcement:acknowledge': (data: { announcementId: string }) => void;
  'ticket:claim': (data: { ticketId: string; hackathonId: string }) => void;
  'join-request:respond': (data: { requestId: string; accept: boolean }) => void;
}

export type SocketServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
export type SocketClient = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: { userId?: string; role?: string };
};

let io: SocketServer;

export function initSocket(httpServer: HTTPServer): SocketServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Auth middleware — reject connections without a valid JWT
  io.use((socket: any, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) return next(new Error('Server misconfiguration'));
      const payload = jwt.verify(token, secret) as any;
      socket.data.userId = payload.id || payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: SocketClient) => {
    console.log('Socket connected:', socket.id, 'userId:', socket.data.userId);

    // Room management — client requests to join/leave named rooms
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
    });

    // Announcement acknowledge (client-side tracking only for now)
    socket.on('announcement:acknowledge', (_data) => {
      // No-op server-side; could persist acknowledgements to DB here
    });

    // Ticket claim
    socket.on('ticket:claim', (data) => {
      if (!data?.ticketId || !socket.data.userId) return;
      // Emit update to the hackathon room so all mentors see the claim
      if (data.hackathonId) {
        io.to(`hackathon:${data.hackathonId}`).emit('ticket:update', {
          ticketId: data.ticketId,
          claimedBy: socket.data.userId,
        });
      }
    });

    // Join request respond
    socket.on('join-request:respond', (_data) => {
      // Response is handled via API; socket event is for UI notification
    });

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

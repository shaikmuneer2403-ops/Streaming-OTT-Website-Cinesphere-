import { io, Socket } from 'socket.io-client';
import { User } from '../types';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  }
  return socketInstance;
}

export function registerSocketUser(user: User | null) {
  const socket = getSocket();
  if (user) {
    socket.emit('user_online', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    });
  }
}

export function emitWatchActivity(movieTitle: string, progressText: string) {
  const socket = getSocket();
  socket.emit('watch_activity', {
    title: movieTitle,
    progressText
  });
}

export function joinMovieRoom(movieId: string) {
  const socket = getSocket();
  socket.emit('join_movie', movieId);
}

export function leaveMovieRoom(movieId: string) {
  const socket = getSocket();
  socket.emit('leave_movie', movieId);
}

export function joinAdminRoom() {
  const socket = getSocket();
  socket.emit('admin_join');
}

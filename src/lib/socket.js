import { io } from 'socket.io-client';

const params = new URLSearchParams(window.location.search);
const TOKEN = params.get('token') || 'remote123';
const SERVER_URL = `${window.location.protocol}//${window.location.hostname}:3001`;

export const socket = io(SERVER_URL, {
  auth: { token: TOKEN },
  reconnectionDelay: 1000,
  autoConnect: true
});

socket.on('connect', () => console.log('Connected to server'));
socket.on('connect_error', (err) => console.error('Auth failure:', err.message));

export const emit = (event, data) => {
  if (socket.connected) {
    socket.emit(event, data);
  }
};

import { io } from 'socket.io-client';

// En producción usa la URL del backend desplegado (Railway/Render)
// En local usa el hostname dinámico (funciona en LAN)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
  : `http://${window.location.hostname}:3001`;

const socket = io(BACKEND_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'], // websocket primero, polling como fallback
});

export default socket;

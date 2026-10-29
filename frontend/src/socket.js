import { io } from 'socket.io-client';

// Apunta al backend en el mismo host desde donde se abrió el navegador.
// Funciona en localhost Y en red local (ej: 192.168.1.x desde tablet o TV).
const BACKEND_URL = `http://${window.location.hostname}:3001`;

const socket = io(BACKEND_URL, { autoConnect: true });

export default socket;

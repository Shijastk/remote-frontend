import { io } from 'socket.io-client';

// POLYFILL: Some older TVs don't support CustomEvent
if (typeof window !== 'undefined' && typeof window.CustomEvent !== 'function') {
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
}

// POLYFILL: Robust URL extraction
let TOKEN = 'remote123';
export let AUTO_IP = null;
export let AUTO_CODE = null;

try {
  const query = window.location.search;
  if (query) {
    const params = new URLSearchParams(query);
    TOKEN = params.get('token') || TOKEN;
    AUTO_IP = params.get('ip');
    AUTO_CODE = params.get('code');
    window.AUTO_MODE = params.get('mode');
  }
} catch (e) { console.warn('URLSearchParams fallback'); }

// CLOUD RELAY (Set this in Vercel Environment Variables as VITE_RELAY_URL)
const RELAY_URL = import.meta.env.VITE_RELAY_URL || 'https://remote-relay-nbcl.onrender.com'; 

export let socket = null;
let currentConnectionId = null;

// Mode A: Direct Local (PC)
export const connectToLocalIp = (ip) => {
    if (socket) socket.disconnect();
    currentConnectionId = null; // Important! Clear cloud mode
    localStorage.setItem('pc-remote-last-ip', ip);
    
    socket = io(`http://${ip}:3001`, {
        auth: { token: TOKEN },
        transports: ['websocket']
    });
    setupListeners(socket);
};

// Mode B: Cloud Relay (TV)
export const joinCloudRoom = (code, isReceiver = false) => {
    if (socket) socket.disconnect();
    currentConnectionId = code;
    
    socket = io(RELAY_URL, {
        transports: ['polling', 'websocket'], // Allow polling fallback for Render
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity
    });

    socket.on('connect', () => {
        console.log('Connected to Cloud Relay');
        if (isReceiver) {
            socket.emit('agent:register', { connectionId: code });
        } else {
            socket.emit('controller:join', { connectionId: code });
        }
        window.dispatchEvent(new CustomEvent('relay:connected'));
    });

    setupListeners(socket);
};

const setupListeners = (s) => {
    s.on('connect', () => {
        console.log('Socket Connected');
        window.dispatchEvent(new CustomEvent('socket:connected'));
    });
    s.on('connect_error', (err) => {
        console.error('Socket Error:', err.message);
        window.dispatchEvent(new CustomEvent('socket:error', { detail: err.message }));
    });
    // For Cloud Relay commands
    s.on('command', ({ event, data }) => {
        window.dispatchEvent(new CustomEvent('relay:command', { detail: { event, data } }));
    });
};

export const emit = (event, data) => {
    if (!socket || !socket.connected) {
        console.warn('⚠️ Cannot emit: Socket not connected');
        return;
    }

    if (currentConnectionId) {
        console.log(`☁️ Cloud Emit [${currentConnectionId}]: ${event}`);
        socket.emit('relay', { connectionId: currentConnectionId, event, data });
    } else {
        console.log(`📍 Local Emit: ${event}`);
        socket.emit(event, data);
    }
};

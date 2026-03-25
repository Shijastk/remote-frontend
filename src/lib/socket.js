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
try {
  const query = window.location.search;
  if (query) {
    const params = new URLSearchParams(query);
    TOKEN = params.get('token') || TOKEN;
  }
} catch (e) { console.warn('URLSearchParams fallback'); }

// CLOUD RELAY (Set this in Vercel Environment Variables as VITE_RELAY_URL)
const RELAY_URL = import.meta.env.VITE_RELAY_URL || 'http://localhost:3002'; 

export let socket = null;
let currentConnectionId = null;

// Mode A: Direct Local (PC)
export const connectToLocalIp = (ip) => {
    if (socket) socket.disconnect();
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
        transports: ['websocket']
    });

    socket.on('connect', () => {
        console.log('Connected to Cloud Relay');
        if (isReceiver) {
            socket.emit('agent:register', { connectionId: code });
        } else {
            socket.emit('controller:join', { connectionId: code });
        }
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
    if (!socket || !socket.connected) return;

    if (currentConnectionId) {
        // We are in Cloud Mode
        socket.emit('relay', { connectionId: currentConnectionId, event, data });
    } else {
        // We are in Local Mode
        socket.emit(event, data);
    }
};

import React, { useState, useEffect } from 'react';
import { MousePointer2, Music, Keyboard as KeyboardIcon, Monitor, Settings, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from './lib/socket';
import Trackpad from './components/Trackpad';
import MediaControls from './components/MediaControls';
import Keyboard from './components/Keyboard';
import ScreenViewer from './components/ScreenViewer';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TABS = [
  { id: 'mouse', icon: MousePointer2, label: 'Mouse' },
  { id: 'media', icon: Music, label: 'Media' },
  { id: 'keyboard', icon: KeyboardIcon, label: 'Keys' },
  { id: 'screen', icon: Monitor, label: 'Screen' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('mouse');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [latency, setLatency] = useState(0);
  const [spotifyTrack, setSpotifyTrack] = useState(null);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onSpotifyTrack = (data) => setSpotifyTrack(data.track);
    const onPong = () => setLatency(Date.now() - pingStart);

    let pingStart = 0;
    const pingInterval = setInterval(() => {
      pingStart = Date.now();
      socket.emit('ping');
    }, 3000);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('spotify:track', onSpotifyTrack);
    socket.on('pong', onPong);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('spotify:track', onSpotifyTrack);
      socket.off('pong', onPong);
      clearInterval(pingInterval);
    };
  }, []);

  return (
    <div className="flex flex-col h-full text-zinc-100 bg-neutral-950 font-sans selection:bg-white/10">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between glass z-50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-rose-500"
          )} />
          <h1 className="text-sm font-medium tracking-tight opacity-80 uppercase">PC Remote</h1>
        </div>
        
        <div className="flex items-center gap-4 text-[11px] font-mono opacity-40">
          <span>{latency}ms</span>
          <Zap size={14} className={isConnected ? "text-yellow-500" : ""} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full w-full"
          >
            {activeTab === 'mouse' && <Trackpad />}
            {activeTab === 'media' && <MediaControls spotifyTrack={spotifyTrack} />}
            {activeTab === 'keyboard' && <Keyboard />}
            {activeTab === 'screen' && <ScreenViewer />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="glass py-2 pb-safe-offset-2 px-4 flex justify-around items-center border-t border-white/5 z-50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95",
                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-white/5 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Toast Area */}
      <div id="toast-root" />
    </div>
  );
}

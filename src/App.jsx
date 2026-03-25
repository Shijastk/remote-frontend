import React, { useState, useEffect, useRef } from 'react';
import { MousePointer2, Music, Keyboard as KeyboardIcon, Monitor, Settings, Zap, Shield, Wifi, ArrowRight, Laptop, HelpCircle, Tv, Smartphone, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CornerDownLeft, RotateCcw, Volume2, SkipBack, SkipForward, Play, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket, connectToLocalIp, joinCloudRoom, emit } from './lib/socket';
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

function ConnectionScreen({ onConnectPC, onEnterTVMode, onJoinTVCode }) {
  const [ip, setIp] = useState(localStorage.getItem('pc-remote-last-ip') || '');
  const [tvCode, setTvCode] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (e) => setError(e.detail);
    window.addEventListener('socket:error', handleError);
    return () => window.removeEventListener('socket:error', handleError);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-8 text-center space-y-8 bg-neutral-950 overflow-y-auto pt-12 pb-24">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto relative pointer-events-none">
          <Shield className="text-emerald-500" size={32} />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-emerald-500/20 rounded-3xl -z-10"
          />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Privacy Remote SaaS</h2>
      </div>

      <div className="w-full max-w-[340px] space-y-6">
        {/* PC Section */}
        <div className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl text-left">
            <div className="flex items-center gap-3">
                <Laptop size={18} className="text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">Option 1: Control a PC</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 focus-within:border-emerald-500/30 transition-all">
                <Wifi className="text-zinc-500" size={20} />
                <input 
                    type="text"
                    placeholder="PC IP (e.g. 192.168.1.10)"
                    value={ip}
                    onChange={(e) => { setIp(e.target.value); setError(null); }}
                    className="bg-transparent border-none outline-none flex-1 text-sm font-mono"
                />
            </div>
            {error && <p className="text-[10px] text-rose-500 font-medium">Connection failed. Visit PC URL once to allow.</p>}
            <button 
                onClick={() => onConnectPC(ip)}
                disabled={!ip}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-20"
            >
                Connect PC <ArrowRight size={18} />
            </button>
        </div>

        {/* TV Section */}
        <div className="space-y-4 bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl text-left">
            <div className="flex items-center gap-3">
                <Tv size={18} className="text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-40 text-blue-400">Option 2: Control a TV</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={onEnterTVMode}
                    className="flex flex-col items-center justify-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl hover:bg-blue-500/20 transition-all active:scale-95"
                >
                    <Tv size={24} className="mb-2" />
                    <span className="text-[10px] font-bold uppercase leading-tight">I am On a TV</span>
                </button>
                <div className="flex flex-col gap-2">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3 flex items-center gap-2">
                        <input 
                            type="number"
                            placeholder="Code"
                            value={tvCode}
                            onChange={(e) => setTvCode(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-center font-mono font-bold text-lg placeholder:opacity-20"
                        />
                    </div>
                    <button 
                        onClick={() => onJoinTVCode(tvCode)}
                        disabled={tvCode.length !== 6}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-[10px] uppercase tracking-wider active:scale-95 transition-all disabled:opacity-20"
                    >
                        Join TV
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function TVReceiver({ code, onExit }) {
    const [cursor, setCursor] = useState({ x: 50, y: 50 }); // in percentages
    const [lastAction, setLastAction] = useState('Waiting for Phone...');
    const [elements, setElements] = useState([
        { id: 1, label: 'YouTube', icon: '📺', x: 20, y: 30 },
        { id: 2, label: 'Netflix', icon: '🎬', x: 40, y: 30 },
        { id: 3, label: 'Spotify', icon: '🎵', x: 60, y: 30 },
        { id: 4, label: 'Browser', icon: '🌐', x: 80, y: 30 },
        { id: 5, label: 'Settings', icon: '⚙️', x: 20, y: 60 },
        { id: 6, label: 'Photos', icon: '🖼️', x: 40, y: 60 },
        { id: 7, label: 'Apps', icon: '📱', x: 60, y: 60 },
        { id: 8, label: 'Power', icon: '🛑', x: 80, y: 60 },
    ]);

    useEffect(() => {
        const onCommand = (e) => {
            const { event, data } = e.detail;
            
            if (event === 'mouse:move') {
                setCursor(prev => ({
                    x: Math.max(0, Math.min(100, prev.x + (data.dx * 0.1))),
                    y: Math.max(0, Math.min(100, prev.y + (data.dy * 0.1)))
                }));
            } else if (event === 'mouse:click') {
                setLastAction('Click detected!');
            } else if (event === 'key:press') {
               setLastAction(`Key: ${data}`);
            }
        };
        window.addEventListener('relay:command', onCommand);
        return () => window.removeEventListener('relay:command', onCommand);
    }, []);

    return (
        <div className="flex flex-col h-full bg-neutral-950 text-white overflow-hidden relative font-sans">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            {/* Header */}
            <div className="p-12 flex justify-between items-end relative z-10">
                <div className="space-y-2">
                    <h2 className="text-6xl font-black tracking-tighter text-blue-500 uppercase">Smart Remote OS</h2>
                    <p className="text-2xl text-zinc-500 font-medium">Cloud SaaS Receiver • {lastAction}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 mb-2">Pairing Code</div>
                    <div className="text-6xl font-mono font-black text-emerald-500 tracking-tighter">{code}</div>
                </div>
            </div>

            {/* Application Grid */}
            <div className="flex-1 px-12 pb-12 relative z-10">
                <div className="grid grid-cols-4 gap-8 h-full">
                    {elements.map(item => (
                        <motion.div 
                            key={item.id}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                            className="bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 p-8 transition-colors group"
                        >
                            <span className="text-8xl group-hover:scale-110 transition-transform">{item.icon}</span>
                            <span className="text-2xl font-bold tracking-tight opacity-60 group-hover:opacity-100">{item.label}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Virtual Cursor */}
            <motion.div 
                animate={{ x: `${cursor.x}vw`, y: `${cursor.y}vh` }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9999]"
            >
                <div className="relative">
                    <MousePointer2 size={32} className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] fill-blue-500" />
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-400 rounded-full blur-xl -z-10"
                    />
                </div>
            </motion.div>

            <button onClick={onExit} className="absolute bottom-8 right-8 text-zinc-800 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors">Exit Receiver</button>
        </div>
    );
}

export default function App() {
  const [appMode, setAppMode] = useState('home'); // home, pc, tv-receiver, tv-controller
  const [activeTab, setActiveTab] = useState('mouse');
  const [tvCode, setTvCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyTrack, setSpotifyTrack] = useState(null);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onSpotifyTrack = (data) => setSpotifyTrack(data.track);
    window.addEventListener('socket:connected', onConnect);
    window.addEventListener('spotify:track', (e) => onSpotifyTrack(e.detail));
    return () => {
        window.removeEventListener('socket:connected', onConnect);
    };
  }, []);

  const handleConnectPC = (ip) => {
    connectToLocalIp(ip);
    setAppMode('pc');
  };
  
  const handleEnterTVMode = () => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setTvCode(code);
      setAppMode('tv-receiver');
      joinCloudRoom(code, true);
  };

  const handleJoinTVCode = (code) => {
      setTvCode(code);
      setAppMode('tv-controller');
      joinCloudRoom(code, false);
  };

  if (appMode === 'home') return <ConnectionScreen onConnectPC={handleConnectPC} onEnterTVMode={handleEnterTVMode} onJoinTVCode={handleJoinTVCode} />;
  if (appMode === 'tv-receiver') return <TVReceiver code={tvCode} onExit={() => setAppMode('home')} />;

  const isTV = appMode === 'tv-controller';

  return (
    <div className="flex flex-col h-[100dvh] text-zinc-100 bg-neutral-950 font-sans selection:bg-white/10 overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between glass z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAppMode('home')}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              isConnected ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-rose-500"
            )} 
          />
          <h1 className="text-xs font-bold tracking-tight opacity-40 uppercase flex items-center gap-2">
            {isTV ? 'TV Remote' : 'PC Remote'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
            {isTV && <div className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20">Cloud</div>}
            <button onClick={() => setAppMode('home')} className="bg-white/5 p-2 rounded-xl text-zinc-400 hover:text-white transition-colors">
                <Settings size={16} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full w-full"
            >
              {activeTab === 'mouse' && <Trackpad />}
              {activeTab === 'media' && <MediaControls spotifyTrack={spotifyTrack} />}
              {activeTab === 'keyboard' && <Keyboard />}
              {activeTab === 'screen' && !isTV && <ScreenViewer />}
              {activeTab === 'screen' && isTV && (
                  <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4 opacity-40">
                      <Tv size={64} className="mb-4" />
                      <h3 className="text-lg font-bold">TV System Control</h3>
                      <div className="flex gap-4">
                          <button onClick={() => emit('key:press', 'power')} className="p-6 bg-red-500/20 rounded-full text-red-500 border border-red-500/30"><Power size={32}/></button>
                          <button onClick={() => emit('key:press', 'home')} className="p-6 bg-white/5 rounded-full text-white border border-white/10"><Monitor size={32}/></button>
                      </div>
                  </div>
              )}
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
                isActive ? "text-white" : "text-zinc-600"
              )}
            >
              {(isActive) && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-white/5 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div id="toast-root" />
    </div>
  );
}

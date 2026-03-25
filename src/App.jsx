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
        <h2 className="text-2xl font-bold tracking-tight text-white uppercase tracking-widest">SaaS TV Remote</h2>
      </div>

      <div className="w-full max-w-[340px] space-y-6">
        {/* TV Section - HIGHLIGHTED for Native TV App */}
        <div className="space-y-4 bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 text-center animate-in zoom-in-95 duration-700">
            <div className="flex flex-col items-center gap-4">
                <div className="p-5 bg-blue-500/10 rounded-[2rem] border border-blue-500/20 text-blue-400">
                    <Tv size={48} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white">Smart TV Mode</h3>
                   <p className="text-blue-200/40 text-xs mt-1">Perfect for Android TV & Fire TV</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 mt-4">
                <button 
                    onClick={onEnterTVMode}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-blue-500/40"
                >
                    I am On a TV
                </button>
                <div className="flex flex-col gap-2 mt-4">
                   <div className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Or Control a TV Code</div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-2">
                        <Smartphone size={16} className="opacity-20" />
                        <input 
                            type="number"
                            placeholder="Enter 6-digit code"
                            value={tvCode}
                            onChange={(e) => setTvCode(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-center font-mono font-bold text-xl placeholder:opacity-10"
                        />
                    </div>
                    <button 
                        onClick={() => onJoinTVCode(tvCode)}
                        disabled={tvCode.length !== 6}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-5"
                    >
                        Join TV
                    </button>
                </div>
            </div>
        </div>

        {/* PC Section - DE-EMPHASIZED */}
        <div className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl text-left opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
                <Laptop size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Connect to a PC</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-4">
                <input 
                    type="text"
                    placeholder="PC IP (e.g. 192.168.1.10)"
                    value={ip}
                    onChange={(e) => { setIp(e.target.value); setError(null); }}
                    className="bg-transparent border-none outline-none flex-1 text-sm font-mono"
                />
            </div>
            <button 
                onClick={() => onConnectPC(ip)}
                disabled={!ip}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-20"
            >
                Connect PC
            </button>
        </div>
      </div>
    </div>
  );
}

function TVController() {
    const sendKey = (key) => emit('key:press', key);
    
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 select-none bg-neutral-950">
            <div className="grid grid-cols-3 gap-6 mb-16 scale-110">
                <div />
                <button onClick={() => sendKey('up')} className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center active:bg-blue-500 transition-all"><ChevronUp size={40}/></button>
                <div />
                <button onClick={() => sendKey('left')} className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center active:bg-blue-500 transition-all"><ChevronLeft size={40}/></button>
                <button onClick={() => sendKey('enter')} className="w-20 h-20 rounded-[2rem] bg-blue-600 text-white font-black active:scale-90 transform transition-all shadow-2xl shadow-blue-500/50">OK</button>
                <button onClick={() => sendKey('right')} className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center active:bg-blue-500 transition-all"><ChevronRight size={40}/></button>
                <div />
                <button onClick={() => sendKey('down')} className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center active:bg-blue-500 transition-all"><ChevronDown size={40}/></button>
                <div />
            </div>

            <div className="flex gap-12">
                <button onClick={() => sendKey('backspace')} className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center active:scale-95 group">
                    <CornerDownLeft size={28} className="opacity-40 group-active:opacity-100" />
                </button>
                <button onClick={() => sendKey('escape')} className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center active:scale-95 group">
                    <RotateCcw size={26} className="opacity-40 group-active:opacity-100" />
                </button>
            </div>
            
            <div className="mt-20 text-[10px] uppercase tracking-[0.5em] font-black opacity-20 animate-pulse">Smart TV Remote Mode</div>
        </div>
    );
}

function TVReceiver({ code, onExit }) {
    const [cursor, setCursor] = useState({ x: 50, y: 50 });
    const [lastAction, setLastAction] = useState('Waiting for Phone...');
    const [focusedIndex, setFocusedIndex] = useState(0);
    const elements = [
        { id: 1, label: 'YouTube', icon: '📺' },
        { id: 2, label: 'Netflix', icon: '🎬' },
        { id: 3, label: 'Spotify', icon: '🎵' },
        { id: 4, label: 'Browser', icon: '🌐' },
        { id: 5, label: 'Settings', icon: '⚙️' },
        { id: 6, label: 'Photos', icon: '🖼️' },
        { id: 7, label: 'Apps', icon: '📱' },
        { id: 8, label: 'Power', icon: '🛑' },
    ];

    useEffect(() => {
        const handleNativeTVKeys = (e) => {
            if (e.key === 'ArrowUp') setFocusedIndex(p => Math.max(0, p - 4));
            if (e.key === 'ArrowDown') setFocusedIndex(p => Math.min(elements.length - 1, p + 4));
            if (e.key === 'ArrowLeft') setFocusedIndex(p => Math.max(0, p - 1));
            if (e.key === 'ArrowRight') setFocusedIndex(p => Math.min(elements.length - 1, p + 1));
            if (e.key === 'Enter') setLastAction(`Launching ${elements[focusedIndex].label}...`);
            if (e.key === 'Backspace' || e.key === 'Escape') onExit();
        };

        const onCommand = (e) => {
            const { event, data } = e.detail;
            
            if (event === 'mouse:move') {
                setCursor(prev => ({
                    x: Math.max(0, Math.min(100, prev.x + (data.dx * 0.1))),
                    y: Math.max(0, Math.min(100, prev.y + (data.dy * 0.1)))
                }));
            } else if (event === 'mouse:click') {
                setLastAction(`Click on ${elements[focusedIndex].label}!`);
            } else if (event === 'key:press') {
               handleNativeTVKeys({ key: data.charAt(0).toUpperCase() + data.slice(1) });
            }
        };

        window.addEventListener('relay:command', onCommand);
        window.addEventListener('keydown', handleNativeTVKeys);
        return () => {
            window.removeEventListener('relay:command', onCommand);
            window.removeEventListener('keydown', handleNativeTVKeys);
        };
    }, [focusedIndex]);

    return (
        <div className="flex flex-col h-full bg-neutral-950 text-white overflow-hidden relative font-sans">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            <div className="p-16 flex justify-between items-end relative z-10 w-full">
                <div className="space-y-4">
                    <h2 className="text-7xl font-black tracking-tighter text-blue-500 uppercase leading-none">TV REMOTE OS</h2>
                    <p className="text-3xl font-medium text-white/40 italic">{lastAction}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-12 rounded-[3.5rem] text-center shadow-2xl">
                    <div className="text-xs font-black uppercase tracking-[0.5em] opacity-40 mb-6 underline decoration-blue-500 decoration-4 underline-offset-8">Pairing Code</div>
                    <div className="text-[10rem] leading-none font-mono font-black text-emerald-500 tracking-tighter shadow-emerald-500/20 drop-shadow-2xl">{code}</div>
                </div>
            </div>

            <div className="flex-1 px-16 pb-16 relative z-10">
                <div className="grid grid-cols-4 gap-12 h-full">
                    {elements.map((item, index) => (
                        <motion.div 
                            key={item.id}
                            animate={{ 
                                scale: (focusedIndex === index || (Math.abs(cursor.x - (25 * (index%4) + 12.5)) < 10 && Math.abs(cursor.y - (index < 4 ? 30 : 60)) < 15)) ? 1.05 : 1,
                                backgroundColor: focusedIndex === index ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                                borderColor: focusedIndex === index ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.05)'
                            }}
                            className="border rounded-[3rem] flex flex-col items-center justify-center gap-8 p-12 transition-all relative overflow-hidden"
                        >
                            <span className="text-[10rem]">{item.icon}</span>
                            <span className="text-3xl font-black tracking-tight uppercase opacity-80">{item.label}</span>
                            {focusedIndex === index && (
                                <motion.div layoutId="focus-ring" className="absolute inset-0 border-4 border-blue-500/50 rounded-[3rem] -m-1" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.div 
                animate={{ x: `${cursor.x}vw`, y: `${cursor.y}vh` }}
                transition={{ type: "spring", damping: 30, stiffness: 250 }}
                className="fixed top-0 left-0 w-12 h-12 pointer-events-none z-[9999]"
            >
                <MousePointer2 size={48} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] fill-blue-500" />
            </motion.div>

            <button onClick={onExit} className="absolute bottom-12 left-12 opacity-10 hover:opacity-100 transition-opacity uppercase font-black tracking-[0.3em] text-[10px]">Exit OS</button>
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
              {activeTab === 'mouse' && !isTV && <Trackpad />}
              {activeTab === 'mouse' && isTV && <TVController />}
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

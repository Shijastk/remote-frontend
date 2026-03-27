import React, { useState, useEffect, useRef } from 'react';
import { MousePointer2, Music, Keyboard as KeyboardIcon, Monitor, Settings, Zap, Shield, Wifi, ArrowRight, Laptop, HelpCircle, Tv, Smartphone, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CornerDownLeft, RotateCcw, Volume2, SkipBack, SkipForward, Play, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket, connectToLocalIp, joinCloudRoom, emit, AUTO_IP, AUTO_CODE } from './lib/socket';
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

function ConnectionScreen({ onConnectPC, onEnterTVMode, onJoinTVCode, pcStatus }) {
  const [ip, setIp] = useState(localStorage.getItem('pc-remote-last-ip') || '');
  const [tvCode, setTvCode] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pcStatus?.ip && !ip) setIp(pcStatus.ip);
  }, [pcStatus]);

  useEffect(() => {
    const handleError = (e) => setError(e.detail);
    window.addEventListener('socket:error', handleError);
    return () => window.removeEventListener('socket:error', handleError);
  }, []);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center bg-neutral-950 overflow-hidden font-sans">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full animate-pulse delay-700" />
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-[850px] space-y-12"
      >
        <motion.div variants={item} className="space-y-4">
          <div className="w-20 h-20 bg-white shadow-[0_0_50px_rgba(255,255,255,0.1)] rounded-[2.5rem] flex items-center justify-center mx-auto relative group cursor-pointer active:scale-95 transition-transform">
            <Shield className="text-neutral-950" size={32} />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-4px] border border-dashed border-white/20 rounded-[2.8rem]"
            />
          </div>
          <div className="space-y-1">
             <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Ultra Control</h1>
             <div className="flex items-center justify-center gap-2 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Privacy Guardian Active</span>
             </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">
          {/* Mode 1: Cloud/TV */}
          <motion.div 
            variants={item}
            className="group relative bg-white/5 border border-white/5 p-8 rounded-[3rem] hover:bg-white/[0.08] transition-all overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <Tv size={120} strokeWidth={1} />
            </div>
            
            <div className="space-y-8 relative z-10">
                <div className="flex items-start gap-5">
                    <div className="p-5 bg-blue-600 rounded-[2rem] text-white shadow-2xl shadow-blue-600/40">
                        <Tv size={28} />
                    </div>
                    <div className="text-left pt-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">Smart TV Experience</h3>
                        <p className="text-sm text-white/30 mt-1 leading-relaxed">Control Android TV & Web Apps via Cloud Tunnel</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-[10px] font-black text-left uppercase text-white/20 tracking-widest pl-2">Join existing session</div>
                    <div className="flex gap-3">
                        <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-4 flex items-center gap-3 focus-within:border-blue-500/50 transition-all">
                            <Smartphone size={16} className="opacity-40" />
                            <input 
                                type="number"
                                placeholder="6-digit code"
                                value={tvCode}
                                onChange={(e) => setTvCode(e.target.value)}
                                className="bg-transparent border-none outline-none w-full text-sm font-bold font-mono tracking-widest"
                            />
                        </div>
                        <button 
                           onClick={() => onJoinTVCode(tvCode)}
                           disabled={tvCode.length !== 6}
                           className="px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest active:scale-90 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                           Join
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-12">
                <button 
                    onClick={onEnterTVMode}
                    className="w-full py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-3xl font-bold text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all"
                >
                    I am on a TV
                </button>
            </div>
          </motion.div>

          {/* Mode 2: PC/Local */}
          <motion.div 
            variants={item}
            className="relative bg-white/5 border border-white/10 p-1 rounded-[3rem] overflow-hidden group shadow-2xl shadow-black/50"
          >
            <div className="p-8 space-y-8 flex flex-col h-full">
                <div className="flex items-center gap-4">
                    <div className="p-5 bg-emerald-500 rounded-[2rem] text-neutral-950 shadow-2xl shadow-emerald-500/40">
                        <Laptop size={28} />
                    </div>
                    <div className="text-left pt-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">Desktop Control</h3>
                        <p className="text-sm text-white/30 mt-1 leading-relaxed">Direct hardware control with low-latency</p>
                    </div>
                </div>

                <div className="flex-1 space-y-6">
                    <div className="bg-black/40 border border-white/5 rounded-3xl p-4 flex items-center gap-4 focus-within:border-emerald-500/50 transition-all">
                        <input 
                            type="text"
                            placeholder="PC IP ADDRESS"
                            value={ip}
                            onChange={(e) => { setIp(e.target.value); setError(null); }}
                            className="bg-transparent border-none outline-none flex-1 text-sm font-black font-mono tracking-widest uppercase placeholder:opacity-20 text-emerald-400"
                        />
                        <button 
                            onClick={() => onConnectPC(ip)}
                            className="w-10 h-10 bg-emerald-500 text-neutral-950 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-emerald-500/40"
                        >
                            <ArrowRight size={20} strokeWidth={3} />
                        </button>
                    </div>

                    {pcStatus && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-2xl"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="text-[10px] font-black uppercase text-neutral-950/60 tracking-[0.2em]">Live Pairing Active</div>
                            </div>
                            <div className="relative p-2 bg-neutral-100 rounded-xl">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`http://${pcStatus.ip}:5173?ip=${pcStatus.ip}&token=${pcStatus.token}`)}&bgcolor=fff&color=000&margin=10`}
                                    alt="Pairing QR"
                                    className="w-32 h-32 mix-blend-multiply"
                                />
                            </div>
                            <div className="px-5 py-2 bg-emerald-500/10 rounded-full">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Scan for Instant Access</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
          </motion.div>
        </div>

        <motion.p variants={item} className="text-[10px] font-black uppercase tracking-[0.4em] opacity-10 pt-8">
           Standard Encryption v2.0 • Secured by Prism
        </motion.p>
      </motion.div>
    </div>
  );
}

function TVController() {
    const [remoteMode, setRemoteMode] = useState('dpad'); // dpad or trackpad
    const sendKey = (key) => emit('key:press', key);
    
    return (
        <div className="flex flex-col h-full bg-neutral-950 overflow-hidden">
            {/* Header Switch */}
            <div className="flex justify-center p-6 gap-2">
                <button 
                    onClick={() => setRemoteMode('dpad')}
                    className={cn(
                        "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                        remoteMode === 'dpad' ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-white/5 text-white/40"
                    )}
                >
                    D-PAD
                </button>
                <button 
                    onClick={() => setRemoteMode('trackpad')}
                    className={cn(
                        "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                        remoteMode === 'trackpad' ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-white/5 text-white/40"
                    )}
                >
                    Cursor Mode
                </button>
            </div>

            <div className="flex-1 min-h-0">
                {remoteMode === 'dpad' ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 select-none">
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
                    </div>
                ) : (
                    <div className="h-full px-6 pb-6">
                        <div className="h-full bg-white/5 border border-white/10 rounded-[3rem] p-2 overflow-hidden shadow-inner">
                            <Trackpad />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="pb-8 text-center text-[10px] uppercase tracking-[0.5em] font-black opacity-20 animate-pulse">Smart TV Remote Mode</div>
        </div>
    );
}function TVReceiver({ code, onExit }) {
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
                    x: Math.max(0, Math.min(100, prev.x + (data.dx * 0.15))),
                    y: Math.max(0, Math.min(100, prev.y + (data.dy * 0.15)))
                }));
            } else if (event === 'mouse:click') {
                setLastAction(`Clicked at ${Math.round(cursor.x)}%, ${Math.round(cursor.y)}%`);
                // Simulate focus change if clicking near an icon
                const elementX = 25 * (focusedIndex % 4) + 12.5;
                const elementY = focusedIndex < 4 ? 30 : 60;
                if (Math.abs(cursor.x - elementX) < 10 && Math.abs(cursor.y - elementY) < 15) {
                    setLastAction(`Launching ${elements[focusedIndex].label}...`);
                }
            } else if (event === 'key:press' || (event === 'key:type')) {
                const keyData = typeof data === 'string' ? data : (data.key || data.text);
                
                if (event === 'key:type') {
                    setLastAction(`Search: ${data.text}`);
                    return;
                }

                // Map common keys to Arrow formats
                let mappedKey = keyData;
                if (keyData === 'up') mappedKey = 'ArrowUp';
                if (keyData === 'down') mappedKey = 'ArrowDown';
                if (keyData === 'left') mappedKey = 'ArrowLeft';
                if (keyData === 'right') mappedKey = 'ArrowRight';
                if (keyData === 'enter') mappedKey = 'Enter';
                if (keyData === 'backspace') mappedKey = 'Backspace';
                if (keyData === 'escape') mappedKey = 'Escape';
                
                handleNativeTVKeys({ key: mappedKey });
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
            
            <div className="p-6 md:p-16 flex flex-col md:flex-row justify-between items-start md:items-end relative z-10 w-full gap-8">
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-blue-500 uppercase leading-none">TV REMOTE OS</h2>
                    <p className="text-xl md:text-3xl font-medium text-white/40 italic">{lastAction}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] text-center shadow-2xl w-full md:w-auto">
                    <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] opacity-40 mb-3 md:mb-6 underline decoration-blue-500 decoration-4 underline-offset-8">Pairing Code</div>
                    <div className="text-6xl md:text-[10rem] leading-none font-mono font-black text-emerald-500 tracking-tighter drop-shadow-2xl">{code}</div>
                </div>
            </div>

            <div className="flex-1 px-6 md:px-16 pb-6 md:pb-16 relative z-10 overflow-y-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 h-full content-start md:content-normal">
                    {elements.map((item, index) => (
                        <motion.div 
                            key={item.id}
                            animate={{ 
                                scale: (focusedIndex === index || (Math.abs(cursor.x - (25 * (index%4) + 12.5)) < 10 && Math.abs(cursor.y - (index < 4 ? 30 : 60)) < 15)) ? 1.05 : 1,
                                backgroundColor: focusedIndex === index ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                                borderColor: focusedIndex === index ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.05)'
                            }}
                            className="border rounded-[2rem] md:rounded-[3rem] flex flex-col items-center justify-center gap-4 md:gap-8 p-6 md:p-12 transition-all relative overflow-hidden"
                        >
                            <span className="text-5xl md:text-[8rem] lg:text-[10rem]">{item.icon}</span>
                            <span className="text-sm md:text-3xl font-black tracking-tight uppercase opacity-80">{item.label}</span>
                            {focusedIndex === index && (
                                <motion.div layoutId="focus-ring" className="absolute inset-0 border-4 border-blue-500/50 rounded-[2rem] md:rounded-[3rem] -m-1" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.div 
                animate={{ x: `${cursor.x}vw`, y: `${cursor.y}vh` }}
                transition={{ type: "tween", duration: 0.08, ease: "linear" }}
                className="fixed top-0 left-0 w-8 md:w-12 h-8 md:h-12 pointer-events-none z-[9999]"
            >
                <MousePointer2 size={32} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] fill-blue-500 md:hidden" />
                <MousePointer2 size={48} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] fill-blue-500 hidden md:block" />
            </motion.div>

            <button onClick={onExit} className="absolute bottom-6 md:bottom-12 left-6 md:left-12 opacity-10 hover:opacity-100 transition-opacity uppercase font-black tracking-[0.3em] text-[8px] md:text-[10px]">Exit OS</button>
        </div>
    );
}

export default function App() {
  const [appMode, setAppMode] = useState('home'); // home, pc, tv-receiver, tv-controller
  const [activeTab, setActiveTab] = useState('mouse');
  const [tvCode, setTvCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [pcStatus, setPcStatus] = useState(null);

  useEffect(() => {
    // Attempt to discover local backend on mount
    fetch('http://localhost:3001/status')
      .then(res => res.json())
      .then(data => setPcStatus(data))
      .catch(e => console.log('Auto-discovery: Backend offline or not reachable'));
  }, []);

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

  // AUTO-CONNECT via QR/Link
  useEffect(() => {
    if (AUTO_IP) {
        console.log('🚀 Auto-connecting to IP:', AUTO_IP);
        handleConnectPC(AUTO_IP);
    } else if (AUTO_CODE) {
        setTvCode(AUTO_CODE); // Ensure UI knows the code
        console.log('🚀 Auto-joining Room:', AUTO_CODE);
        handleJoinTVCode(AUTO_CODE);
    }
  }, []);

  if (appMode === 'home') return <ConnectionScreen onConnectPC={handleConnectPC} onEnterTVMode={handleEnterTVMode} onJoinTVCode={handleJoinTVCode} pcStatus={pcStatus} />;
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

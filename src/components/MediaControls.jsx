import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Maximize } from 'lucide-react';
import { emit, socket } from '../lib/socket';
import { motion } from 'framer-motion';

export default function MediaControls({ spotifyTrack }) {
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    socket.on('volume:level', (data) => {
      if (data.level !== null) setVolume(data.level);
    });
    return () => socket.off('volume:level');
  }, []);

  const handleControl = (action) => {
    emit('media:control', { action });
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleVolume = (action) => {
    emit('media:volume', { action });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="flex flex-col h-full p-8 items-center justify-center">
      <div className="w-full mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-6 rounded-[2.5rem] inline-block min-w-64 max-w-full"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 mb-2">Now Playing</p>
          <p className="text-lg font-semibold truncate px-4">
            {spotifyTrack || "Nothing Playing"}
          </p>
          <div className="flex justify-center gap-1 mt-3">
             <div className="w-1 h-3 bg-white/20 rounded-full animate-[pulse_1s_infinite]" />
             <div className="w-1 h-4 bg-white/40 rounded-full animate-[pulse_1.2s_infinite]" />
             <div className="w-1 h-3 bg-white/20 rounded-full animate-[pulse_1.4s_infinite]" />
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-8 mb-16">
        <button onClick={() => handleControl('prev')} className="p-4 text-zinc-400 hover:text-white transition-colors">
          <SkipBack size={32} />
        </button>
        <button 
          onClick={() => handleControl('play')}
          className="p-8 bg-zinc-100 text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-90 transition-all"
        >
          <Play size={32} fill="currentColor" />
        </button>
        <button onClick={() => handleControl('next')} className="p-4 text-zinc-400 hover:text-white transition-colors">
          <SkipForward size={32} />
        </button>
      </div>

      <div className="w-full max-w-xs space-y-6">
        <div className="flex items-center gap-4">
          <Volume1 size={20} className="opacity-40" />
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              animate={{ width: `${volume}%` }}
              className="absolute left-0 top-0 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
            />
          </div>
          <Volume2 size={20} className="opacity-40" />
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => handleVolume('down')} className="py-4 glass rounded-3xl flex justify-center text-zinc-300 active:bg-white/10">
            <Volume1 size={24} />
          </button>
           <button onClick={() => handleVolume('mute')} className="py-4 glass rounded-3xl flex justify-center text-zinc-300 active:bg-white/10">
            <VolumeX size={24} />
          </button>
          <button onClick={() => handleVolume('up')} className="py-4 glass rounded-3xl flex justify-center text-zinc-300 active:bg-white/10">
            <Volume2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

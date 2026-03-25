import React, { useState } from 'react';
import { emit } from '../lib/socket';
import { Send, Delete, Command, CornerDownLeft } from 'lucide-react';

const SHORTCUTS = [
  { label: 'Select All', keys: 'selectall' },
  { label: 'Copy', keys: ['LeftControl', 'C'] },
  { label: 'Paste', keys: ['LeftControl', 'V'] },
  { label: 'Undo', keys: ['LeftControl', 'Z'] },
  { label: 'Escape', key: 'Escape' },
  { label: 'Alt+Tab', keys: ['LeftAlt', 'Tab'] },
];

export default function Keyboard() {
  const [text, setText] = useState('');

  const sendText = () => {
    if (!text) return;
    emit('key:type', { text });
    setText('');
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleKeyPress = (key) => {
    emit('key:press', { key });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleShortcut = (s) => {
    if (s.keys) emit('key:combo', { keys: s.keys });
    else if (s.key) emit('key:press', { key: s.key });
    if (navigator.vibrate) navigator.vibrate(30);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <h2 className="text-xl font-semibold tracking-tight mb-6">Keyboard</h2>
      
      <div className="relative mb-8">
        <input 
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendText()}
          placeholder="Type something..."
          className="w-full bg-white/5 border border-white/5 rounded-3xl py-5 px-6 pr-16 focus:outline-none focus:border-white/20 transition-all font-medium"
        />
        <button 
          onClick={sendText}
          className="absolute right-3 top-3 bottom-3 aspect-square flex items-center justify-center bg-white text-black rounded-2xl active:scale-90 transition-all"
        >
          <Send size={18} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8 text-zinc-400">
        <button onClick={() => handleKeyPress('Enter')} className="h-16 glass rounded-2xl flex flex-col items-center justify-center gap-1 active:bg-white/5">
          <CornerDownLeft size={20} />
          <span className="text-[9px] uppercase tracking-widest font-bold">Enter</span>
        </button>
        <button onClick={() => handleKeyPress('Backspace')} className="h-16 glass rounded-2xl flex flex-col items-center justify-center gap-1 active:bg-white/5">
          <Delete size={20} />
          <span className="text-[9px] uppercase tracking-widest font-bold">Back</span>
        </button>
        <button onClick={() => handleKeyPress('Tab')} className="h-16 glass rounded-2xl flex flex-col items-center justify-center gap-1 active:bg-white/5">
          <Command size={20} />
          <span className="text-[9px] uppercase tracking-widest font-bold">Tab</span>
        </button>
        <button onClick={() => handleShortcut({ keys: 'selectall' })} className="h-16 glass rounded-2xl flex flex-col items-center justify-center gap-1 active:bg-white/5 border-emerald-500/20">
          <div className="text-[10px] font-bold">A</div>
          <span className="text-[9px] uppercase tracking-widest font-bold">Sel All</span>
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 pb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 mb-2">Shortcuts</p>
          <div className="grid grid-cols-2 gap-3">
            {SHORTCUTS.map((s, i) => (
              <button 
                key={i}
                onClick={() => handleShortcut(s)}
                className="py-4 glass rounded-2xl text-xs font-semibold hover:bg-white/5 transition-all text-left px-5"
              >
                {s.label}
              </button>
            ))}
          </div>
      </div>
    </div>
  );
}

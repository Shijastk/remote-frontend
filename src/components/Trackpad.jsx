import React, { useRef, useState, useEffect } from 'react';
import { emit } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard as KeyboardIcon, ChevronDown, Delete, CornerDownLeft } from 'lucide-react';

const SENSITIVITY = 2.0;

export default function Trackpad() {
  const trackpadRef = useRef(null);
  const inputRef = useRef(null);
  const [isPressing, setIsPressing] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Gesture State
  const lastPos = useRef({ x: 0, y: 0 });
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const scrollStartMidY = useRef(0);
  const isMoving = useRef(false);
  const isScrolling = useRef(false);
  const longPressTimer = useRef(null);

  const vibrate = (ms) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  const handleTouchStart = (e) => {
    if (isKeyboardOpen) return; // Prevent gestures when keyboard overlay is active if needed
    e.preventDefault();
    setIsPressing(true);
    const touches = e.touches;

    if (touches.length >= 2) {
      isScrolling.current = true;
      scrollStartMidY.current = (touches[0].clientY + touches[1].clientY) / 2;
      clearTimeout(longPressTimer.current);
      return;
    }

    const touch = touches[0];
    lastPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
    isMoving.current = false;
    isScrolling.current = false;

    // Long press for right click
    longPressTimer.current = setTimeout(() => {
      if (!isMoving.current && !isScrolling.current) {
        emit('mouse:click', { button: 'right' });
        vibrate(40);
        isMoving.current = true; // Mark as moved to prevent tap
      }
    }, 500);
  };

  const handleTouchMove = (e) => {
    if (isKeyboardOpen) return;
    e.preventDefault();
    const touches = e.touches;

    if (touches.length >= 2 && isScrolling.current) {
      const midY = (touches[0].clientY + touches[1].clientY) / 2;
      const dy = midY - scrollStartMidY.current;
      if (Math.abs(dy) > 1) {
        emit('mouse:scroll', { dy: dy * 5 });
        scrollStartMidY.current = midY;
      }
      return;
    }

    if (touches.length === 1) {
      const touch = touches[0];
      const dx = (touch.clientX - lastPos.current.x) * SENSITIVITY;
      const dy = (touch.clientY - lastPos.current.y) * SENSITIVITY;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        isMoving.current = true;
        clearTimeout(longPressTimer.current);
        emit('mouse:move', { dx: Math.round(dx), dy: Math.round(dy) });
      }
      lastPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e) => {
    if (isKeyboardOpen) return;
    e.preventDefault();
    setIsPressing(false);
    clearTimeout(longPressTimer.current);

    if (isScrolling.current || isMoving.current) {
      isScrolling.current = false;
      isMoving.current = false;
      return;
    }

    // It's a tap
    const duration = Date.now() - touchStartTime.current;
    if (duration < 300) {
      emit('mouse:click', { button: 'left' });
      vibrate(15);
    }
  };

  const toggleKeyboard = () => {
    const newState = !isKeyboardOpen;
    setIsKeyboardOpen(newState);
    if (newState) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      inputRef.current?.blur();
      setInputText('');
    }
    vibrate(25);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    const lastChar = val.slice(-1);
    
    if (val.length < inputText.length) {
      // Backspace handled by onKeyDown usually, but some browsers differ
    } else if (lastChar) {
       emit('key:type', { text: lastChar });
    }
    
    setInputText(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      emit('key:press', { key: 'Backspace' });
      vibrate(10);
    } else if (e.key === 'Enter') {
      emit('key:press', { key: 'Enter' });
      setInputText('');
      vibrate(20);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Trackpad</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleKeyboard}
            className={`p-3 rounded-xl transition-all ${
              isKeyboardOpen ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'
            }`}
          >
            <KeyboardIcon size={18} />
          </button>
          <button 
            onClick={() => setSelectMode(!selectMode)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectMode ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'
            }`}
          >
            {selectMode ? 'SELECT ON' : 'SELECT OFF'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col min-h-0">
        <AnimatePresence>
          {isKeyboardOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
               <div className="glass p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Type to PC..."
                      className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium"
                    />
                    <button onClick={toggleKeyboard} className="p-1 opacity-40 hover:opacity-100">
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { emit('key:press', { key: 'Backspace' }); vibrate(10); }}
                      className="flex-1 h-10 glass rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-60 active:opacity-100 bg-white/5"
                    >
                      <Delete size={14} /> Back
                    </button>
                    <button 
                      onClick={() => { emit('key:press', { key: 'Enter' }); setInputText(''); vibrate(20); }}
                      className="flex-1 h-10 glass rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-60 active:opacity-100 bg-white/5"
                    >
                      <CornerDownLeft size={14} /> Enter
                    </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          ref={trackpadRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          animate={{
            backgroundColor: isPressing ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
            borderColor: isPressing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'
          }}
          className="flex-1 rounded-[2rem] border relative overflow-hidden active:shadow-inner"
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <div className="grid grid-cols-4 grid-rows-4 gap-12">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-white rounded-full" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 h-16">
        <button 
          onPointerDown={() => emit('mouse:press', { button: 'left' })}
          onPointerUp={() => emit('mouse:release', { button: 'left' })}
          className="bg-white/5 rounded-2xl border border-white/5 font-medium text-xs uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
        >
          Left
        </button>
        <button 
          onPointerDown={() => emit('mouse:press', { button: 'right' })}
          onPointerUp={() => emit('mouse:release', { button: 'right' })}
          className="bg-white/5 rounded-2xl border border-white/5 font-medium text-xs uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
        >
          Right
        </button>
      </div>
    </div>
  );
}

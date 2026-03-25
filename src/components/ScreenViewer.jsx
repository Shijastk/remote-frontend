import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, MousePointer2, Monitor as MonitorIcon, ZoomIn, ZoomOut, Keyboard as KeyboardIcon, ChevronDown, Delete, CornerDownLeft } from 'lucide-react';
import { socket, emit } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';

const SENSITIVITY = 2.5;
const TAP_SLOP    = 8;
const TAP_MS      = 250;
const MIN_ZOOM    = 1;
const MAX_ZOOM    = 5;

export default function ScreenViewer() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [frame, setFrame]             = useState(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [screenSize, setScreenSize]   = useState({ width: 1920, height: 1080 });

  // Keyboard state
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [inputText, setInputText]           = useState('');
  const inputRef = useRef(null);

  // Zoom / pan state
  const [zoom, setZoom]               = useState(1);
  const [pan, setPan]                 = useState({ x: 0, y: 0 });

  const isStreamingRef = useRef(false);
  const imgRef         = useRef(null);
  const wrapRef        = useRef(null);

  // Gesture refs
  const lastPos        = useRef({ x: 0, y: 0 });
  const startPos       = useRef({ x: 0, y: 0 });
  const startTime      = useRef(0);
  const isDragging     = useRef(false);
  const rafPending     = useRef(false);
  const pendingDelta   = useRef({ dx: 0, dy: 0 });

  // Pinch refs
  const isPinching     = useRef(false);
  const lastPinchDist  = useRef(0);
  const zoomRef        = useRef(1);
  const panRef         = useRef({ x: 0, y: 0 });

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  useEffect(() => {
    const onFrame = (data) => {
      setFrame(`data:image/jpeg;base64,${data.frame}`);
      setIsLoading(false);
    };
    const onSize = (size) => {
      if (size && size.width) setScreenSize(size);
    };
    socket.on('screen:frame', onFrame);
    socket.on('screen:size', onSize);
    emit('screen:getSize');
    return () => {
      socket.off('screen:frame', onFrame);
      socket.off('screen:size', onSize);
      if (isStreamingRef.current) emit('screen:stop');
    };
  }, []);

  const vibrate = (ms) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  const toggleStream = () => {
    if (isStreamingRef.current) {
      emit('screen:stop');
      isStreamingRef.current = false;
      setIsStreaming(false);
      setFrame(null);
    } else {
      setIsLoading(true);
      emit('screen:start');
      emit('screen:getSize');
      isStreamingRef.current = true;
      setIsStreaming(true);
    }
    vibrate(25);
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const flushDelta = () => {
    const { dx, dy } = pendingDelta.current;
    if (dx !== 0 || dy !== 0) {
      emit('mouse:move', { dx: Math.round(dx), dy: Math.round(dy) });
      pendingDelta.current = { dx: 0, dy: 0 };
    }
    rafPending.current = false;
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
      // Backspace handled by onKeyDown
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

  const handleTouchStart = (e) => {
    if (isPinching.current) return;
    if (e.touches.length === 2) {
      isPinching.current = true;
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPinching.current || e.touches.length !== 2) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const delta = dist - lastPinchDist.current;
    lastPinchDist.current = dist;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current + delta * 0.01));
    setZoom(newZoom);
    if (newZoom <= 1) setPan({ x: 0, y: 0 });
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) isPinching.current = false;
  };

  const onPointerDown = (e) => {
    if (!isStreamingRef.current || isPinching.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPos.current  = { x: e.clientX, y: e.clientY };
    startPos.current = { x: e.clientX, y: e.clientY };
    startTime.current = Date.now();
    isDragging.current = false;
    pendingDelta.current = { dx: 0, dy: 0 };
  };

  const onPointerMove = (e) => {
    if (!isStreamingRef.current || e.buttons === 0 || isPinching.current) return;
    const curZoom = zoomRef.current;
    if (curZoom > 1) {
      const dxPx = e.clientX - lastPos.current.x;
      const dyPx = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      isDragging.current = true;
      emit('mouse:move', {
        dx: Math.round(-dxPx / curZoom * SENSITIVITY),
        dy: Math.round(-dyPx / curZoom * SENSITIVITY),
      });
      setPan(prev => ({
        x: prev.x + dxPx,
        y: prev.y + dyPx,
      }));
      return;
    }
    const dx = (e.clientX - lastPos.current.x) * SENSITIVITY;
    const dy = (e.clientY - lastPos.current.y) * SENSITIVITY;
    lastPos.current = { x: e.clientX, y: e.clientY };
    const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
    if (dist > TAP_SLOP) isDragging.current = true;
    if (!isDragging.current) return;
    pendingDelta.current.dx += dx;
    pendingDelta.current.dy += dy;
    if (!rafPending.current) {
      rafPending.current = true;
      requestAnimationFrame(flushDelta);
    }
  };

  const onPointerUp = (e) => {
    if (!isStreamingRef.current || isPinching.current) return;
    const elapsed = Date.now() - startTime.current;
    const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);

    if (!isDragging.current && elapsed < TAP_MS && dist < TAP_SLOP) {
      if (!imgRef.current) return;
      
      const img = imgRef.current;
      const rect = img.getBoundingClientRect();
      
      const contentWidth = img.naturalWidth;
      const contentHeight = img.naturalHeight;
      const imgRatio = contentWidth / contentHeight;
      const containerRatio = rect.width / rect.height;
      
      let actualWidth, actualHeight, offsetX, offsetY;
      
      if (containerRatio > imgRatio) {
        actualHeight = rect.height;
        actualWidth = actualHeight * imgRatio;
        offsetX = (rect.width - actualWidth) / 2;
        offsetY = 0;
      } else {
        actualWidth = rect.width;
        actualHeight = actualWidth / imgRatio;
        offsetX = 0;
        offsetY = (rect.height - actualHeight) / 2;
      }
      
      const rx = (e.clientX - rect.left - offsetX) / actualWidth;
      const ry = (e.clientY - rect.top - offsetY) / actualHeight;
      
      if (rx >= 0 && rx <= 1 && ry >= 0 && ry <= 1) {
        const x = Math.round(rx * screenSize.width);
        const y = Math.round(ry * screenSize.height);
        emit('mouse:moveTo', { x, y });
        setTimeout(() => emit('mouse:click', { button: 'left' }), 30);
        vibrate(10);
      }
    }
    isDragging.current = false;
    pendingDelta.current = { dx: 0, dy: 0 };
  };

  const zoomPct = Math.round(zoom * 100);

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Screen Control</h2>
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
            onClick={toggleStream}
            className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all ${
              isStreaming
                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                : 'bg-white text-black'
            }`}
          >
            {isStreaming ? <><Square size={14} /> Stop</> : <><Play size={14} fill="currentColor" /> Live View</>}
          </button>
        </div>
      </div>

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

      {isStreaming && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { setZoom(z => Math.max(MIN_ZOOM, z - 0.5)); if (zoom <= 1.5) setPan({ x: 0, y: 0 }); }}
            className="p-2 glass rounded-xl text-zinc-400 active:bg-white/10"
          >
            <ZoomOut size={18} />
          </button>
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const newZ = MIN_ZOOM + ratio * (MAX_ZOOM - MIN_ZOOM);
              setZoom(newZ);
              if (newZ <= 1) setPan({ x: 0, y: 0 });
            }}
          >
            <div className="absolute left-0 top-0 h-full bg-white/60 rounded-full transition-all"
              style={{ width: `${((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%` }} />
          </div>
          <button
            onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.5))}
            className="p-2 glass rounded-xl text-zinc-400 active:bg-white/10"
          >
            <ZoomIn size={18} />
          </button>
          <button onClick={resetZoom} className="text-[10px] font-bold opacity-40 min-w-[40px] text-center">
            {zoomPct}%
          </button>
        </div>
      )}

      <div
        className="flex-1 min-h-0 glass rounded-[2.5rem] border border-white/5 overflow-hidden relative flex items-center justify-center bg-black/20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          ref={wrapRef}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isDragging.current ? 'none' : 'transform 0.15s ease-out',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AnimatePresence mode="wait">
            {frame ? (
              <motion.img
                ref={imgRef}
                key="frame"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={frame}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="max-w-full max-h-full object-contain cursor-crosshair select-none"
                draggable={false}
                onLoad={(e) => {
                    if (screenSize.width === 1920) emit('screen:getSize');
                }}
              />
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                className="flex flex-col items-center gap-4 text-zinc-400"
              >
                <div className="w-16 h-16 rounded-full border border-dashed border-white flex items-center justify-center animate-pulse">
                  <MonitorIcon size={32} />
                </div>
                <p className="text-[10px] uppercase tracking-widest font-bold">Stream Offline</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <RefreshCw size={24} className="animate-spin opacity-50" />
          </div>
        )}
      </div>

      <div className="flex justify-center mt-4 text-zinc-400">
        <div className="flex items-center gap-2 opacity-30 text-[9px] uppercase tracking-widest font-bold">
          <MousePointer2 size={12} />
          Precision Mapping Active
        </div>
      </div>
    </div>
  );
}

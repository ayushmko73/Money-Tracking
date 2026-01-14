
import React, { useState, useRef, useEffect } from 'react';
import { SovereignEvent } from '../types';

interface EventOverlayProps {
  events: SovereignEvent[];
}

export const EventOverlay: React.FC<EventOverlayProps> = ({ events }) => {
  const activeEvents = events.filter(e => e.isActive && new Date(e.endTime) > new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  if (activeEvents.length === 0) return null;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    dragOffset.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as MouseEvent).clientY;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 60, clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, clientY - dragOffset.current.y))
      });
    };
    const handleUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  return (
    <>
      <div 
        style={{ left: position.x, top: position.y, touchAction: 'none' }}
        className={`fixed z-[800] transition-opacity cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <button 
          onClick={() => !isDragging && setIsOpen(true)}
          className="w-12 h-12 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-center border-2 border-white/20 animate-pulse"
        >
          <i className="fas fa-bolt"></i>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-black flex items-center justify-center border border-white">
            {activeEvents.length}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl scale-in overflow-hidden relative border border-white/20">
             <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors">
                <i className="fas fa-times text-lg"></i>
             </button>
             <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                   <i className="fas fa-trophy text-2xl"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sovereign Mission</h3>
                <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] mt-2 uppercase">Custom Event Inbound</p>
             </div>
             
             <div className="space-y-6 max-h-[300px] overflow-y-auto scrollbar-hide">
                {activeEvents.map(ev => (
                  <div key={ev.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                     <h4 className="font-black text-slate-900 uppercase text-sm tracking-tighter">{ev.title}</h4>
                     <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase leading-relaxed">{ev.description}</p>
                     <div className="mt-4 flex justify-between items-center text-[9px] font-black">
                        <span className="text-emerald-600">REWARD: {ev.rewardCoins} COINS</span>
                        <span className="text-slate-300 uppercase">Ends soon</span>
                     </div>
                  </div>
                ))}
             </div>
             
             <button onClick={() => setIsOpen(false)} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-black transition-all">Acknowledge Command</button>
          </div>
        </div>
      )}
    </>
  );
};

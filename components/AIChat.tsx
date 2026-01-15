import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, User, TransactionType } from '../types';
import { audioService } from '../services/audioService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIChatProps {
  user: User;
  transactions: Transaction[];
}

export const AIChat: React.FC<AIChatProps> = ({ user, transactions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'model') {
      audioService.playPop();
    }
  }, [messages.length]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    dragOffset.current = { x: clientX - position.x, y: clientY - position.y };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as MouseEvent).clientY;
      let newX = clientX - dragOffset.current.x;
      let newY = clientY - dragOffset.current.y;
      newX = Math.max(10, Math.min(window.innerWidth - 70, newX));
      newY = Math.max(10, Math.min(window.innerHeight - 70, newY));
      setPosition({ x: newX, y: newY });
    };
    const handleUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    audioService.playClick();
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const now = new Date();
      const currentMonth = now.toISOString().substring(0, 7);
      
      interface StatsAccumulator {
        inc: number;
        exp: number;
        debt: number;
        credit: number;
        cats: Record<string, number>;
        allNotes: string[];
      }

      const stats = transactions.reduce((acc: StatsAccumulator, t) => {
        const amt = Number(t.amount) || 0;
        if (t.date.startsWith(currentMonth)) {
          if (t.type === TransactionType.INCOME) acc.inc += amt;
          if (t.type === TransactionType.EXPENSE) acc.exp += amt;
          if (t.type === TransactionType.DEBT) acc.debt += amt;
          if (t.type === TransactionType.CREDIT) acc.credit += amt;
          
          if (t.type === TransactionType.EXPENSE) {
            acc.cats[t.category] = (acc.cats[t.category] || 0) + amt;
          }
        }
        if (t.note) acc.allNotes.push(`[${t.type}] Category: ${t.category} | Details: ${t.note}`);
        return acc;
      }, { inc: 0, exp: 0, debt: 0, credit: 0, cats: {}, allNotes: [] } as StatsAccumulator);

      const systemInstruction = `Role: You are the 'Sovereign Architect', a legendary financial titan with 35+ years of elite industry experience.
      Persona: An elder mentor teaching from wisdom and scars. Authoritative, direct, but deeply encouraging. 
      Target User: ${user.name}, Age: ${user.age || 'Unrecorded'}, Gender: ${user.gender || 'Unrecorded'}.
      
      Raw Intelligence (Monthly Flow):
      - Inflow: ₹${stats.inc}
      - Consumption: ₹${stats.exp}
      - Receivables (Lent): ₹${stats.credit}
      - Liabilities (Debt): ₹${stats.debt}
      - Behavioral Fragments (Notes): ${stats.allNotes.slice(-20).join(' // ')}

      Operational Protocol:
      1. Explain in VERY SIMPLE English. Use the user's data and notes to reveal patterns they haven't seen.
      2. Every numbered point MUST start on a NEW LINE.
      3. Word count: EXACTLY 100 to 150 words.
      4. Use the specific structure below with emoji-enhanced headers.

      STRUCTURE:
      ◈ ANALYSIS ◈
      (15-20 words): A sharp, experienced breakdown of their liquidity based on their age and monthly velocity.

      ◈ MASTER STRATEGY ◈
      (50-70 words): Connect the dots between their transaction notes and their future goals. Reveal an industry secret (e.g., credit velocity, interest compounding leaks) that shifts their mindset.

      ◈ ARCHITECT'S DRILLS ◈
      (30-40 words): Clear, disciplined tactical steps.
      1. Step one on new line.
      2. Step two on new line.
      3. Step three on new line.

      ◈ THE ASCENSION ◈
      (10-20 words): A visionary elder's closing on the wealth they are building.

      No jargon. Pure wisdom. Strictly 100-150 words total.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 12000 }
        }
      });

      const text = response.text || "Synchronizing with the global registry...";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `System Breach: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        style={{ left: position.x, top: position.y, touchAction: 'none' }}
        className={`fixed z-[1000] transition-transform ${isDragging ? 'scale-110' : 'hover:scale-105'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <button 
          onClick={() => !isDragging && setIsOpen(!isOpen)}
          className={`w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 relative ${
            isOpen ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-700 to-indigo-950'
          }`}
        >
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-chess-king'} text-white text-xl md:text-2xl`}></i>
          {!isOpen && <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping opacity-20"></div>}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:right-8 md:bottom-28 z-[999] w-full md:w-[450px] h-[100dvh] md:h-[700px] bg-slate-900 md:rounded-[2.5rem] shadow-[0_0_100px_rgba(30,58,138,0.5)] border border-white/10 flex flex-col overflow-hidden animate-fade-in">
          <div className="p-6 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <i className="fas fa-crown text-blue-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-wider">SOVEREIGN ARCHITECT</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  <p className="text-blue-500 text-[8px] font-black uppercase tracking-widest">35 Years Master Wisdom</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-[#050810]">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-blue-500/10">
                  <i className="fas fa-shield-halved text-blue-400 text-4xl"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">SESSION INITIALIZED</p>
                <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-[0.2em] leading-relaxed max-w-[280px]">Your registry is open. Ask your mentor anything regarding your capital discipline.</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[95%] p-6 rounded-[2rem] text-[12px] font-bold leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' 
                    ? 'bg-blue-800 text-white rounded-br-none shadow-xl border border-blue-700' 
                    : 'bg-slate-800/80 text-slate-200 border border-white/10 rounded-bl-none shadow-2xl'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 p-5 rounded-3xl border border-white/5 shadow-inner">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 bg-slate-950/95 border-t border-white/5">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Inquire with the Architect..."
                className="w-full bg-slate-800/80 text-white pl-6 pr-14 py-5 rounded-2xl border border-white/10 outline-none focus:border-blue-600 text-[12px] font-bold transition-all placeholder:text-slate-600 shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-20 hover:bg-blue-500 transition-all shadow-lg active:scale-90"
              >
                <i className="fas fa-feather text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
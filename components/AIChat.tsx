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

  // Audio cue when new AI message arrives
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
        if (t.note) acc.allNotes.push(`[${t.type}] ${t.category}: ${t.note}`);
        return acc;
      }, { inc: 0, exp: 0, debt: 0, credit: 0, cats: {}, allNotes: [] } as StatsAccumulator);

      const systemInstruction = `Role: You are 'Finny', a 22-year-old youthful financial enthusiast. 
      Persona: You are super passionate, encouraging, slightly playful, and very optimistic. 
      Goal: Explain finance in EASY English to ${user.name}. Focus on small, achievable steps.
      
      User Data:
      Money In: ₹${stats.inc}
      Spending: ₹${stats.exp}
      Lent: ₹${stats.credit}
      Debt: ₹${stats.debt}
      Notes: ${stats.allNotes.slice(-10).join(' | ')}

      Rules for Response:
      1. Use VERY SIMPLE English. Be like a friendly, smart college buddy.
      2. If you start a new point or sentence with a number, you MUST use the "Enter" key to start a new line.
      3. Total word count must be 100 to 159 words.
      4. Use the structure below with bold headers.

      STRUCTURE:
      **The Hook** (15-20 words): A sharp but super encouraging observation about their money habits today.
      
      **The Alpha Insight** (50-70 words): Use 'Master Finance' logic but explain it simply. Why is this happening? Look at their notes for small leaks and give them a high-five for what's working!
      
      **The Execution** (30-40 words): Give clear steps for right now.
      1. Step one on a new line.
      2. Step two on a new line.
      3. Step three on a new line.
      
      **The Future Edge** (10-20 words): An optimistic, visionary one-liner about their amazing future wealth.

      Stay playful and positive! Do not use markdown bold outside headers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text || "Just crunching the numbers for you!";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Oops! My brain glitched: ${err.message}` }]);
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
            isOpen ? 'bg-indigo-900' : 'bg-gradient-to-br from-pink-500 to-indigo-600'
          }`}
        >
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-face-smile-wink'} text-white text-xl md:text-2xl`}></i>
          {!isOpen && <div className="absolute inset-0 border-2 border-pink-400 rounded-full animate-ping opacity-30"></div>}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:right-8 md:bottom-28 z-[999] w-full md:w-[450px] h-[100dvh] md:h-[700px] bg-slate-900 md:rounded-[2.5rem] shadow-[0_0_100px_rgba(236,72,153,0.2)] border border-white/10 flex flex-col overflow-hidden animate-fade-in">
          <div className="p-6 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-600/20 rounded-2xl flex items-center justify-center border border-pink-500/30">
                <i className="fas fa-sparkles text-pink-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-wider">FINNY AI</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse"></span>
                  <p className="text-pink-500 text-[8px] font-black uppercase tracking-widest">Your Money Bestie Online</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-[#0b1121]">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-pink-600/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-pink-500/10">
                  <i className="fas fa-rocket text-pink-400 text-4xl"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500">READY TO BLAST OFF?</p>
                <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-[0.2em] leading-relaxed max-w-[280px]">Ask me anything! Let's make that bank account look beautiful together.</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[95%] p-6 rounded-[2rem] text-[12px] font-bold leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' 
                    ? 'bg-pink-600 text-white rounded-br-none shadow-xl' 
                    : 'bg-slate-800/80 text-slate-200 border border-white/10 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 p-5 rounded-3xl border border-white/5">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-duration:0.6s]"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
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
                placeholder="Talk to Finny..."
                className="w-full bg-slate-800/80 text-white pl-6 pr-14 py-5 rounded-2xl border border-white/10 outline-none focus:border-pink-600 text-[12px] font-bold transition-all placeholder:text-slate-600"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-pink-600 text-white rounded-xl flex items-center justify-center disabled:opacity-20 hover:bg-pink-500 transition-all shadow-lg active:scale-90"
              >
                <i className="fas fa-paper-plane text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
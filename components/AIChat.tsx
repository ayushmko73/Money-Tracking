import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, User, TransactionType } from '../types';

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
  
  // Draggable State
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

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
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

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const key = process.env.API_KEY;
      if (!key || key === "undefined") throw new Error("API_KEY synchronization pending.");

      const ai = new GoogleGenAI({ apiKey: key });
      
      const netLiquidity = transactions.reduce((sum, t) => {
        if (t.type === TransactionType.INCOME) return sum + t.amount;
        if (t.type === TransactionType.EXPENSE || t.type === TransactionType.SAVING) return sum - t.amount;
        return sum;
      }, 0);

      const systemInstruction = `You are a Senior Wealth Teacher and Tech Mentor. 
      Your mission is to teach ${user.name} (Age 17) about their data in the most efficient and clear way possible.
      
      CORE DATA VECTORS:
      • Current Assets: ₹${netLiquidity.toLocaleString()}.
      • Recent Ops Count: ${transactions.length}.
      
      STRICT CONSTRAINTS:
      1. RESPONSE LENGTH: Between 50 and 150 words ONLY. 
      2. FORMATTING: NEVER use markdown bold (**). Use DOUBLE LINE BREAKS between points.
      3. PERSONA: Act as a high-tier mentor. Explain "Why" and "How" using simple, high-impact words.
      4. SYMBOLS: Use •, :, ❌, ✍️, 📈, 💰, ✅ naturally for structure.
      5. TEACHING STYLE: Use a "Founder's Strategic Roadmap" layout. 
      
      Example Layout:
      STRATEGIC INSIGHT:
      Teaching point here.
      
      • DATA ANALYSIS:
      - Point 1
      
      ✍️ NEXT ACTION:
      1. Immediate task.
      
      6. Always use the ₹ symbol for currency.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.5,
        }
      });

      const text = response.text || "Synchronizing with Mentor Core...";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `❌ SYSTEM ERROR: ${err.message}` }]);
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
            isOpen ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-600 to-indigo-800'
          }`}
        >
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'} text-white text-xl md:text-2xl`}></i>
          {!isOpen && <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping opacity-20"></div>}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:right-8 md:bottom-28 z-[999] w-full md:w-[400px] h-[100dvh] md:h-[600px] bg-slate-900 md:rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-fade-in animate-slide-up">
          <div className="p-5 bg-slate-950/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <i className="fas fa-microchip text-blue-400"></i>
              </div>
              <div>
                <h3 className="text-white font-black text-[10px] uppercase tracking-wider">Wealth Teacher</h3>
                <p className="text-emerald-500 text-[7px] font-black uppercase tracking-widest">Sovereign Intel Sync</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide bg-slate-900/50">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-6">
                  <i className="fas fa-graduation-cap text-blue-400 text-3xl"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Awaiting Analysis Directive</p>
                <p className="text-[9px] text-slate-600 mt-2 italic leading-relaxed uppercase">Request a tactical breakdown of your financial vectors...</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] p-5 rounded-[1.5rem] text-[11px] font-bold leading-relaxed whitespace-pre-wrap shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-4 rounded-2xl border border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-5 bg-slate-950/90 border-t border-white/5">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Submit to Wealth Teacher..."
                className="w-full bg-slate-800 text-white pl-5 pr-12 py-4 rounded-2xl border border-white/5 outline-none focus:border-blue-600 text-[11px] font-bold transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-blue-500 transition-all"
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
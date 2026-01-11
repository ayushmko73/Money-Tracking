import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, User, TransactionType } from '../types';

interface AIAdvisorProps {
  user: User;
  transactions: Transaction[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ user, transactions }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getStrategicBriefing = async () => {
    setLoading(true);
    setInsight(null);
    
    try {
      // Access the standard API_KEY variable
      const key = process.env.API_KEY;
      
      if (!key) {
        throw new Error("API Key configuration missing in environment.");
      }

      // Initialize SDK right before usage
      const ai = new GoogleGenAI({ apiKey: key });
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const currentMonthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const currentSpend = currentMonthTxs
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      const categories = currentMonthTxs
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc: Record<string, number>, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      const topCategory = (Object.entries(categories) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
      const txSummary = transactions.slice(0, 15).map(t => `${t.type}: ₹${t.amount} (${t.category})`).join(', ');

      const prompt = `Act as a High-Level Financial Strategist for ${user.name} (Tier: ${user.tier}).
      Analyze current monthly spend of ₹${currentSpend.toLocaleString()} with top category "${topCategory}".
      Recent activity: ${txSummary}.
      Provide a sharp, professional 2-3 sentence strategic advice focused on wealth growth and discipline. 
      Use the ₹ symbol for currency.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text;
      if (!text) throw new Error("Received an empty response from intelligence core.");
      
      setInsight(text);
    } catch (err: any) {
      console.error("AI Error:", err);
      // Detailed error message to help the user identify the issue
      setInsight(`Strategic Link Failure: ${err?.message || 'Connection Interrupted'}. 
      Ensure your Vercel Environment Variable is named exactly 'API_KEY' and that you have triggered a new deployment after saving the variable.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-blue-500/30 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 animate-pulse"></div>
      <div className="p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/50 shadow-inner">
              <i className="fas fa-microchip text-blue-400 text-xl animate-pulse"></i>
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tight">Sovereign Intel Briefing</h3>
              <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">Strategy Synchronized in ₹</p>
            </div>
          </div>
          <button 
            onClick={getStrategicBriefing}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-bolt-lightning mr-2"></i>}
            {loading ? 'CALCULATING...' : 'EXECUTE INTEL SYNC'}
          </button>
        </div>
        
        {insight ? (
          <div className="bg-slate-950/50 border border-white/5 rounded-[2rem] p-8 text-slate-300 text-sm leading-relaxed animate-fade-in italic">
            <i className="fas fa-quote-left text-blue-500/30 text-2xl absolute -top-2 -left-2"></i>
            {insight}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Encrypted Data Stream: Awaiting Tactical Command</p>
          </div>
        )}
      </div>
    </div>
  );
};
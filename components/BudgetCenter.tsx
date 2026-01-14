
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Budget } from '../types';
import { storageService } from '../services/storageService';
import { CATEGORIES } from '../constants';

interface BudgetCenterProps {
  transactions: Transaction[];
  userId: string;
  onRefresh: () => void;
}

export const BudgetCenter: React.FC<BudgetCenterProps> = ({ transactions, userId, onRefresh }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STABLE' | 'BREACHED'>('STABLE');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const b = await storageService.getBudgets(userId);
    setBudgets(b);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const expenseSummary = useMemo(() => {
    return transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth))
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);
  }, [transactions, currentMonth]);

  const budgetAnalysis = useMemo(() => {
    const analyzed = budgets.map(b => {
      const spent = expenseSummary[b.category] || 0;
      const progress = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      const remaining = b.limit - spent;
      const isBreached = spent > b.limit;

      return { ...b, spent, progress, remaining, isBreached };
    });

    const filtered = analyzed.filter(b => {
      if (activeTab === 'STABLE') return !b.isBreached;
      return b.isBreached;
    });

    const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = (Object.values(expenseSummary) as number[]).reduce((s, v) => s + v, 0);
    const globalSaturation = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    return { filtered, totalLimit, totalSpent, globalSaturation };
  }, [budgets, expenseSummary, activeTab]);

  const handleSetBudget = async () => {
    if (!selectedCat || !limitAmount) return;
    await storageService.setBudget(userId, selectedCat, Number(limitAmount));
    setLimitAmount('');
    setSelectedCat('');
    setIsAdding(false);
    fetchData();
    onRefresh();
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    await storageService.deleteBudget(deleteTargetId);
    setDeleteTargetId(null);
    fetchData();
    onRefresh();
  };

  const availableCategories = useMemo(() => {
    const all = CATEGORIES[TransactionType.EXPENSE];
    return all.filter(c => !budgets.some(b => b.category === c));
  }, [budgets]);

  if (loading && budgets.length === 0) return (
    <div className="py-40 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Threshold Protocol...</p>
    </div>
  );

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in font-['Inter'] pb-32 px-1">
      
      {/* Threshold Protocol Header */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 md:w-80 h-48 md:h-80 bg-blue-50/60 rounded-full -mr-24 md:-mr-40 -mt-24 md:-mt-40 blur-[50px] md:blur-[100px]"></div>
        
        <div className="relative z-10 space-y-8 md:space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg md:shadow-2xl shadow-blue-500/30">
                  <i className="fas fa-shield-halved text-lg md:text-2xl"></i>
                </div>
                <span className="text-[9px] md:text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] md:tracking-[0.3em]">Guard Enforcement Active</span>
              </div>
              <h1 className="text-2xl md:text-7xl font-black tracking-tighter uppercase leading-none text-slate-900">SET <span className="text-blue-600">BUDGET</span></h1>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <i className="fas fa-plus text-[10px]"></i>
              Define Guard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="p-6 md:p-10 bg-slate-50 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-inner">
               <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase mb-2 md:mb-4 tracking-widest">Guarded Capital</p>
               <p className="text-2xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">₹{budgetAnalysis.totalLimit.toLocaleString()}</p>
            </div>
            <div className="p-6 md:p-10 bg-blue-50 rounded-2xl md:rounded-[2.5rem] border border-blue-100 shadow-inner">
               <div className="flex justify-between items-start mb-2 md:mb-4">
                  <p className="text-[9px] md:text-[11px] font-black text-blue-500 uppercase tracking-widest">Saturation Index</p>
                  <span className="text-[10px] md:text-xs font-black text-blue-600">{Math.round(budgetAnalysis.globalSaturation)}%</span>
               </div>
               <div className="w-full h-3 md:h-5 bg-white rounded-full overflow-hidden border border-blue-100 p-1">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                    style={{ width: `${Math.min(100, budgetAnalysis.globalSaturation)}%` }}
                  ></div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registry Tabs */}
      <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 max-w-sm shadow-sm overflow-hidden">
        <button 
          onClick={() => setActiveTab('STABLE')} 
          className={`flex-1 py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'STABLE' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}
        >
          Stable Guard
        </button>
        <button 
          onClick={() => setActiveTab('BREACHED')} 
          className={`flex-1 py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'BREACHED' ? 'bg-red-600 text-white shadow-xl' : 'text-slate-400'}`}
        >
          Breached
        </button>
      </div>

      {/* Guard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {budgetAnalysis.filtered.length > 0 ? budgetAnalysis.filtered.map(b => (
          <div key={b.id} className="group bg-white p-7 md:p-10 rounded-2xl md:rounded-[3.5rem] border border-slate-100 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1">
            <div className={`absolute top-0 left-0 right-0 h-1.5 md:h-2 ${b.isBreached ? 'bg-red-500 animate-pulse' : b.progress > 80 ? 'bg-orange-500' : 'bg-blue-600'}`}></div>
            
            <div className="space-y-8 md:space-y-10">
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-inner ${b.isBreached ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                  <i className={`fas ${b.isBreached ? 'fa-triangle-exclamation' : 'fa-shield-halved'}`}></i>
                </div>
                <div className="text-right">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest">Protocol Status</p>
                  <p className={`text-[10px] md:text-sm font-black uppercase ${b.isBreached ? 'text-red-600' : 'text-emerald-500'}`}>
                    {b.isBreached ? 'CRITICAL BREACH' : 'ENFORCED'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Vector Identity</p>
                <h4 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase truncate">{b.category}</h4>
                
                <div className="mt-8 space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Saturation</span>
                    <span className={b.isBreached ? 'text-red-500' : 'text-slate-900'}>{Math.round(b.progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className={`h-full transition-all duration-1000 ${b.isBreached ? 'bg-red-500' : b.progress > 80 ? 'bg-orange-500' : 'bg-blue-600'}`} 
                      style={{ width: `${Math.min(100, b.progress)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 md:mt-14 pt-6 md:pt-10 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-1">
                  {b.isBreached ? 'Breach Magnitude' : 'Guard Runway'}
                </p>
                <p className={`text-xl md:text-3xl font-black tracking-tighter leading-none ${b.isBreached ? 'text-red-600' : 'text-slate-900'}`}>
                  ₹{Math.abs(b.remaining).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDeleteTargetId(b.id)}
                  className="w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all bg-slate-50 text-slate-400 border border-slate-100 hover:bg-red-500 hover:text-white"
                  title="Scrub Guard"
                >
                  <i className="fas fa-trash-alt text-xs md:text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-24 bg-white rounded-[2rem] md:rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10 col-span-full">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-3xl mb-6">
              <i className="fas fa-shield-halved"></i>
            </div>
            <p className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-[0.4em]">
              {activeTab === 'STABLE' ? 'Zero Guard Protocols Initialized' : 'No Critical Breaches Detected'}
            </p>
          </div>
        )}
      </div>

      {/* Define Guard Modal - FIXED CENTER SCALE-IN */}
      {isAdding && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-6 bg-slate-950/95 backdrop-blur-xl animate-fade-in" style={{ touchAction: 'none' }}>
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-14 shadow-2xl animate-scale-in border border-white/20 relative overflow-hidden" style={{ touchAction: 'auto' }}>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-50 rounded-full blur-[80px] opacity-60"></div>

            <div className="relative z-10">
              <div className="text-center mb-10 md:mb-14">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-blue-50 text-blue-600 rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100">
                  <i className="fas fa-fingerprint text-2xl md:text-4xl"></i>
                </div>
                <h3 className="text-xl md:text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">DEFINE <span className="text-blue-600">GUARD</span></h3>
                <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Registry Threshold Assignment</p>
              </div>

              <div className="space-y-6 md:space-y-8">
                <div>
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Asset Partition</label>
                  <div className="relative">
                    <select 
                      value={selectedCat} 
                      onChange={e => setSelectedCat(e.target.value)}
                      className="w-full px-6 py-5 md:py-6 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-black text-xs md:text-sm uppercase appearance-none transition-all shadow-sm"
                    >
                      <option value="">SELECT VECTOR...</option>
                      {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <i className="fas fa-chevron-down text-xs"></i>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Magnitude Threshold (₹)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg md:text-2xl">₹</span>
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={limitAmount} 
                      onChange={e => setLimitAmount(e.target.value)} 
                      placeholder="0.00" 
                      className="w-full pl-12 pr-6 py-5 md:py-7 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-black text-lg md:text-3xl transition-all shadow-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12 md:mt-16 flex flex-col gap-3">
                <button 
                  onClick={handleSetBudget} 
                  className="w-full py-5 md:py-7 bg-slate-900 text-white rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <i className="fas fa-lock text-[9px] opacity-40"></i>
                  INIT PROTOCOL
                </button>
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="w-full py-4 md:py-6 bg-slate-50 text-slate-400 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest hover:text-slate-900 transition-all"
                >
                  ABORT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrub Guard Confirmation - FIXED CENTER SCALE-IN */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 md:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in" style={{ touchAction: 'none' }}>
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 text-center border border-white/10 animate-scale-in shadow-2xl" style={{ touchAction: 'auto' }}>
            <div className="w-20 h-20 md:w-24 md:h-24 bg-red-50 text-red-500 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100">
              <i className="fas fa-trash-can text-3xl md:text-4xl"></i>
            </div>
            <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Scrub Protocol?</h3>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] mt-6 leading-relaxed">
              Permanent scrubbing of this guard threshold from the registry core. 
            </p>
            <div className="mt-10 flex flex-col gap-3">
              <button onClick={executeDelete} className="w-full py-4 md:py-6 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-red-700 transition-all active:scale-95">CONFIRM SCRUB</button>
              <button onClick={() => setDeleteTargetId(null)} className="w-full py-4 md:py-6 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">ABORT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

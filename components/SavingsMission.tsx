import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Transaction, TransactionType, Goal } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';

interface SavingsMissionProps {
  transactions: Transaction[];
  onAddRequest: (type: TransactionType, category?: string) => void;
  onRefresh: () => void;
  userId: string;
}

export const SavingsMission: React.FC<SavingsMissionProps> = ({ transactions, onAddRequest, onRefresh, userId }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'REACHED'>('ACTIVE');

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storageService.getGoals(userId);
      setGoals(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async () => {
    if (!newGoalName || !newGoalAmount) return;
    audioService.playClick();
    await storageService.addGoal(userId, newGoalName.trim(), Number(newGoalAmount));
    setNewGoalName('');
    setNewGoalAmount('');
    setIsAdding(false);
    await fetchGoals();
    onRefresh();
  };

  const handleDeleteGoal = async () => {
    if (!deleteId) return;
    audioService.playClick();
    await storageService.deleteGoal(deleteId);
    setDeleteId(null);
    await fetchGoals();
    onRefresh();
  };

  const savingTotals = useMemo(() => {
    return transactions
      .filter(t => t.type === TransactionType.SAVING)
      .reduce((acc, t) => {
        // Robust matching: trim and lowercase for the key
        const key = t.category.trim().toLowerCase();
        acc[key] = (acc[key] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  const goalSummary = useMemo(() => {
    return goals.map(goal => {
      const saved = savingTotals[goal.name.trim().toLowerCase()] || 0;
      const progress = Math.min(100, (saved / goal.targetAmount) * 100);
      const isReached = progress >= 100;
      
      let colorClass = 'from-violet-600 to-indigo-600';
      if (isReached) colorClass = 'from-emerald-500 to-teal-500';
      else if (progress > 75) colorClass = 'from-blue-500 to-indigo-600';

      return { ...goal, saved, progress, colorClass, isReached };
    });
  }, [goals, savingTotals]);

  // Effect to handle "Just Completed" celebration
  useEffect(() => {
    const completedJustNow = goalSummary.filter(g => g.isReached && !localStorage.getItem(`GOAL_VICTORY_${g.id}`));
    if (completedJustNow.length > 0) {
      audioService.playVictory();
      completedJustNow.forEach(g => localStorage.setItem(`GOAL_VICTORY_${g.id}`, 'TRUE'));
    }
  }, [goalSummary]);

  const filteredSummary = useMemo(() => {
    return goalSummary.filter(g => {
      if (activeTab === 'ACTIVE') return !g.isReached;
      return g.isReached;
    });
  }, [goalSummary, activeTab]);

  const totalCommitted = useMemo(() => {
    return (Object.values(savingTotals) as number[]).reduce((sum, val) => sum + val, 0);
  }, [savingTotals]);
  
  const totalObjective = useMemo(() => goals.reduce((sum, g) => sum + g.targetAmount, 0), [goals]);

  if (loading && goals.length === 0) return (
    <div className="flex flex-col items-center justify-center py-40">
      <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in font-['Inter'] pb-32">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-violet-50/60 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32 blur-[50px] md:blur-[70px]"></div>
        
        <div className="relative z-10 space-y-6 md:space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-violet-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-bullseye text-lg md:text-2xl"></i>
                </div>
                <span className="text-[9px] md:text-[11px] font-black text-violet-600 uppercase tracking-widest">Active Objectives</span>
              </div>
              <h1 className="text-2xl md:text-7xl font-black tracking-tighter uppercase leading-none text-slate-900">SET <span className="text-violet-600">GOAL</span></h1>
            </div>
            <button 
              onClick={() => { audioService.playClick(); setIsAdding(true); }}
              className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              New Goal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="p-6 md:p-10 bg-slate-50 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-inner">
               <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase mb-2 md:mb-4 tracking-widest">Committed</p>
               <p className="text-2xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">₹{totalCommitted.toLocaleString()}</p>
            </div>
            <div className="p-6 md:p-10 bg-violet-50 rounded-2xl md:rounded-[2.5rem] border border-violet-100 shadow-inner">
               <p className="text-[9px] md:text-[11px] font-black text-violet-500 uppercase mb-2 md:mb-4 tracking-widest">Target Total</p>
               <p className="text-2xl md:text-6xl font-black text-violet-700 tracking-tight leading-none">₹{totalObjective.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 max-w-[280px] md:max-w-sm shadow-sm overflow-hidden">
        <button 
          onClick={() => { audioService.playClick(); setActiveTab('ACTIVE'); }} 
          className={`flex-1 py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'ACTIVE' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}
        >
          Active
        </button>
        <button 
          onClick={() => { audioService.playClick(); setActiveTab('REACHED'); }} 
          className={`flex-1 py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'REACHED' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400'}`}
        >
          Reached
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
        {filteredSummary.length > 0 ? filteredSummary.map(goal => (
          <div key={goal.id} className={`group bg-white p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] border border-slate-100 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${goal.isReached ? 'opacity-90 ring-4 ring-emerald-500/20' : 'hover:shadow-2xl hover:-translate-y-1'}`}>
            <div className={`absolute top-0 left-0 right-0 h-1.5 md:h-2 bg-slate-100`}>
              <div 
                className={`h-full bg-gradient-to-r ${goal.colorClass} transition-all duration-1000 shadow-sm`} 
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>
            
            <div className="space-y-6 md:space-y-8 mt-4">
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-inner ${goal.isReached ? 'bg-emerald-50 text-emerald-500' : 'bg-violet-50 text-violet-600'}`}>
                  <i className={`fas ${goal.isReached ? 'fa-award' : 'fa-rocket'}`}></i>
                </div>
                <div className="text-right">
                  <p className={`text-sm md:text-lg font-black ${goal.isReached ? 'text-emerald-500' : 'text-slate-900'}`}>{Math.round(goal.progress)}%</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase truncate">{goal.name}</h4>
                <div className="mt-6 w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div className={`h-full bg-gradient-to-r ${goal.colorClass} transition-all duration-1000`} style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-8 md:mt-12 pt-6 md:pt-10 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-1">Target</p>
                <p className={`text-xl md:text-3xl font-black tracking-tighter leading-none ${goal.isReached ? 'text-emerald-600' : 'text-slate-900'}`}>₹{goal.targetAmount.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {!goal.isReached && (
                  <button onClick={() => onAddRequest(TransactionType.SAVING, goal.name)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all bg-violet-600 text-white shadow-lg"><i className="fas fa-plus text-xs"></i></button>
                )}
                <button onClick={() => { audioService.playClick(); setDeleteId(goal.id); }} className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all bg-slate-50 text-slate-400 border border-slate-100"><i className="fas fa-trash-alt text-xs"></i></button>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-24 bg-white rounded-[2rem] md:rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10 col-span-full">
            <p className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest">Registry Empty</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-white/60 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-scale-in border border-slate-100">
            <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase text-center mb-8">SET GOAL</h3>
            <div className="space-y-6">
              <input type="text" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} placeholder="Objective Name..." className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-violet-600 font-bold text-sm shadow-sm" />
              <input type="number" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} placeholder="Target (₹)..." className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-violet-600 font-black text-lg shadow-sm" />
              <div className="flex flex-col gap-3 pt-4">
                <button onClick={handleCreateGoal} className="w-full py-5 bg-violet-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95">DEPLOY</button>
                <button onClick={() => { audioService.playClick(); setIsAdding(false); }} className="w-full py-5 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest">ABORT</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 md:p-10 text-center shadow-2xl scale-in">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100">
              <i className="fas fa-trash-can text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase">Scrub Goal?</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">This will expunge the objective definition.</p>
            <div className="mt-10 flex flex-col gap-3">
              <button onClick={handleDeleteGoal} className="w-full py-5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Confirm scrubbing</button>
              <button onClick={() => { audioService.playClick(); setDeleteId(null); }} className="w-full py-5 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest">Abort</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
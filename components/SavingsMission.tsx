
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Goal } from '../types';
import { storageService } from '../services/storageService';

interface SavingsMissionProps {
  transactions: Transaction[];
  onAddRequest: (type: TransactionType) => void;
  userId: string;
}

export const SavingsMission: React.FC<SavingsMissionProps> = ({ transactions, onAddRequest, userId }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    const data = await storageService.getGoals(userId);
    setGoals(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  const handleCreateGoal = async () => {
    if (!newGoalName || !newGoalAmount) return;
    await storageService.addGoal(userId, newGoalName, Number(newGoalAmount));
    setNewGoalName('');
    setNewGoalAmount('');
    setIsAdding(false);
    fetchGoals();
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mission?')) return;
    await storageService.deleteGoal(id);
    fetchGoals();
  };

  const getProgressForGoal = (goalName: string, target: number) => {
    const saved = transactions
      .filter(t => t.type === TransactionType.SAVING && t.category === goalName)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const progress = Math.min(100, (saved / target) * 100);
    const remaining = Math.max(0, target - saved);
    return { saved, progress, remaining };
  };

  if (loading) return (
    <div className="text-center py-20">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Savings Command</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Multiple Strategic Objectives Terminal</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all active:scale-95"
        >
          Initialize New Mission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {goals.length > 0 ? goals.map(goal => {
          const { saved, progress, remaining } = getProgressForGoal(goal.name, goal.targetAmount);
          return (
            <div key={goal.id} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group">
              <div className="p-8 bg-slate-900 text-white relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest mb-1">Strategic Goal</p>
                    <h3 className="text-2xl font-black tracking-tighter truncate max-w-[200px]">{goal.name}</h3>
                  </div>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center transition-all"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Injected</p>
                    <p className="text-xl font-black text-slate-900">₹{saved.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Needed</p>
                    <p className="text-xl font-black text-slate-900">₹{remaining.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Mission Status</span>
                    <span className="text-sm font-black text-blue-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <button 
                  onClick={() => onAddRequest(TransactionType.SAVING)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                >
                  Contribute Capital
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <i className="fas fa-bullseye text-3xl"></i>
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No Active Strategic Missions Detected</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-6 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
            >
              Initialize First Goal
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 scale-in border border-slate-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-plus-circle text-2xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Set Saving Mission</h3>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Specify your custom objective</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mission Name</label>
                <input 
                  type="text"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="e.g., New Laptop, Car, Europe Trip..."
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Capital (₹)</label>
                <input 
                  type="number"
                  value={newGoalAmount}
                  onChange={(e) => setNewGoalAmount(e.target.value)}
                  placeholder="₹ Target amount..."
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                />
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <button 
                onClick={handleCreateGoal}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all"
              >
                Launch Mission
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:text-slate-900 transition-all"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

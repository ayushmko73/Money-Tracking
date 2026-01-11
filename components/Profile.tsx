
import React, { useState, useMemo } from 'react';
import { User, Transaction } from '../types';
import { storageService } from '../services/storageService';

interface ProfileProps {
  user: User;
  transactions: Transaction[];
  onUpdate: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, transactions, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState(user.password || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const streakStats = useMemo(() => {
    if (transactions.length === 0) return { max: 0 };
    const sortedDates: string[] = Array.from<string>(new Set(transactions.map(t => t.date.split('T')[0]))).sort();
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;
    
    sortedDates.forEach((dateStr: string) => {
      const currentDate = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.ceil(Math.abs(currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) currentStreak++;
        else currentStreak = 1;
      } else currentStreak = 1;
      maxStreak = Math.max(maxStreak, currentStreak);
      prevDate = currentDate;
    });
    return { max: maxStreak };
  }, [transactions]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updated = await storageService.updateUser(user.id, { name, email, password });
    if (updated) {
      onUpdate(updated);
      setMessage('Vault Identity Updated Successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  };

  const milestones = [7, 30, 100, 365, 1000];
  const nextMilestone = milestones.find(m => m > user.streak) || 1000;
  const progressPercent = Math.min((user.streak / nextMilestone) * 100, 100);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-10 bg-gradient-to-br from-orange-500 to-red-600 text-white text-center relative overflow-hidden">
              <i className="fas fa-fire text-[8rem] absolute -bottom-5 -right-5 opacity-10 pointer-events-none"></i>
              <h3 className="text-4xl font-black relative z-10">{user.streak}</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 opacity-90 relative z-10">Unbroken Streak</p>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Milestone: {nextMilestone} Days</span>
                <span className="text-[10px] font-black text-blue-600 uppercase">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
              </div>
              
              <div className="mt-10 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Highest Peak</p>
                   <p className="font-black text-slate-900">{streakStats.max} Days</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Wealth Coins</p>
                   <p className="font-black text-amber-500">{user.coins.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Vault Identity</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Core Security Settings</p>
              </div>
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center rotate-3 shadow-xl"><i className="fas fa-user-shield text-2xl"></i></div>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-10">
              {message && <div className="p-5 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 rounded-2xl text-sm font-black text-center animate-bounce">{message}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Member Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Verified Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Update Access Key</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all" placeholder="New Password..."/>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs">Commit Vault Changes</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

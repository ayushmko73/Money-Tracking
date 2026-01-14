import React, { useState } from 'react';
import { User, Transaction, VaultTier } from '../types';

interface ProfileProps {
  user: User;
  transactions: Transaction[];
  onUpdate: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [showKey, setShowKey] = useState(false);

  const displayAge = user.age !== undefined && user.age !== null ? user.age : 'NOT RECORDED';
  const displayGender = user.gender ? user.gender : 'NOT RECORDED';

  // Tier progression logic
  const getTierProgression = () => {
    const coins = user.coins || 0;
    const tiers = [
      { name: VaultTier.COPPER, threshold: 0 },
      { name: VaultTier.SILVER, threshold: 500 },
      { name: VaultTier.GOLD, threshold: 1000 },
      { name: VaultTier.PLATINUM, threshold: 2500 },
      { name: VaultTier.DIAMOND, threshold: 5000 },
    ];

    // FIX: Using a manual loop to find the last index to support environments without findLastIndex (ES2023)
    let currentIdx = -1;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (coins >= tiers[i].threshold) {
        currentIdx = i;
        break;
      }
    }
    
    if (currentIdx === -1) currentIdx = 0;
    
    const currentTier = tiers[currentIdx];
    const nextTier = tiers[currentIdx + 1];

    if (!nextTier) {
      return {
        isMax: true,
        current: currentTier.name,
        next: 'MAXIMUM ASCENSION',
        needed: 0,
        progress: 100
      };
    }

    const range = nextTier.threshold - currentTier.threshold;
    const currentProgressInTier = coins - currentTier.threshold;
    const progressPercent = Math.min(100, (currentProgressInTier / range) * 100);

    return {
      isMax: false,
      current: currentTier.name,
      next: nextTier.name,
      needed: nextTier.threshold - coins,
      progress: progressPercent,
      nextThreshold: nextTier.threshold
    };
  };

  const progression = getTierProgression();

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in font-['Inter'] pb-32">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">IDENTITY RECORD</h1>
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] mt-3">Registry Profile</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-900 rounded-[2.5rem] p-8 text-center text-white shadow-xl relative overflow-hidden">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Discipline</p>
          <div className="text-5xl font-black mb-1">{user.streak}</div>
          <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Days Active🔥</p>
        </div>
        <div className="md:col-span-1 bg-white rounded-[2.5rem] p-8 text-center border border-slate-100 shadow-sm">
           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Capital</p>
           <div className="text-3xl font-black mb-1 flex items-center justify-center gap-2">
             <i className="fas fa-coins text-amber-500"></i>
             {(user.coins || 0).toLocaleString()}
           </div>
           <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Reserve Coins💰</p>
        </div>
        <div className="md:col-span-1 bg-blue-50 rounded-[2.5rem] p-8 text-center border border-blue-100">
           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">Status</p>
           <div className="text-xl font-black mb-1 uppercase tracking-tight">{user.tier}</div>
           <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Sovereign Tier</p>
        </div>
      </div>

      {/* Tier Progression Visual */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vault Ascension</h3>
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {progression.isMax ? 'Ultimate Sovereign' : `En Route to ${progression.next}`}
            </p>
          </div>
          {!progression.isMax && (
            <div className="text-right">
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-1">Deficit</span>
              <span className="text-lg font-black text-slate-900 flex items-center justify-end gap-1">
                <i className="fas fa-coins text-amber-500 text-sm"></i>
                {progression.needed.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="relative pt-4 pb-2">
          <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 shadow-lg"
              style={{ width: `${progression.progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-4">
            <div className="text-center">
              <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Current</span>
              <span className="text-[9px] font-black text-slate-900 uppercase bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{progression.current}</span>
            </div>
            {!progression.isMax && (
              <div className="text-center">
                <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Threshold</span>
                <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 flex items-center gap-1 justify-center">
                  <i className="fas fa-coins text-amber-500"></i>
                  {progression.nextThreshold?.toLocaleString()}
                </span>
              </div>
            )}
            <div className="text-center">
              <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Objective</span>
              <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${progression.isMax ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                {progression.next}
              </span>
            </div>
          </div>
        </div>

        {!progression.isMax && (
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex items-center gap-4 border border-slate-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
              <i className="fas fa-coins"></i>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Maintain your <span className="text-slate-900 font-black">Daily Tracking Protocol</span> to accumulate reserve capital and ascend to the next tier.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Name</label>
            <div className="px-5 py-4 bg-slate-50 rounded-xl font-black text-xs uppercase text-slate-900 border border-slate-100">{user.name}</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Email</label>
            <div className="px-5 py-4 bg-slate-50 rounded-xl font-bold text-xs text-slate-700 border border-slate-100">{user.email}</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Age Partition</label>
            <div className={`px-5 py-4 bg-slate-50 rounded-xl font-black text-xs uppercase border border-slate-100 ${displayAge === 'NOT RECORDED' ? 'text-slate-300' : 'text-slate-900'}`}>
              {displayAge}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender Class</label>
            <div className={`px-5 py-4 bg-slate-50 rounded-xl font-black text-xs uppercase border border-slate-100 ${displayGender === 'NOT RECORDED' ? 'text-slate-300' : 'text-slate-900'}`}>
              {displayGender}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Access Key</label>
          <div className="flex gap-2">
            <div className="flex-1 px-5 py-4 bg-slate-50 rounded-xl font-mono text-[10px] text-slate-400 border border-slate-100 overflow-hidden truncate">
              {showKey ? user.password : '••••••••••••••••'}
            </div>
            <button onClick={() => setShowKey(!showKey)} className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
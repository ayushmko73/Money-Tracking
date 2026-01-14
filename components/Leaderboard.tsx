import React from 'react';
import { User } from '../types';

interface LeaderboardProps {
  users: User[];
  currentUser: User;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUser }) => {
  // Rank by streak primarily, then coins as tie-breaker
  const sorted = [...users].sort((a, b) => b.streak - a.streak || b.coins - a.coins);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3, 20);
  const myRank = sorted.findIndex(u => u.id === currentUser.id) + 1;
  const isMeTop3 = myRank <= 3;

  // Podium Positions: 1st Center, 2nd Left, 3rd Right
  const podium = [
    { rank: 2, user: top3[1], color: 'slate-400', icon: 'medal', size: 'h-24', gradient: 'from-slate-100 to-white' },
    { rank: 1, user: top3[0], color: 'amber-400', icon: 'crown', size: 'h-32', gradient: 'from-amber-100 to-white' },
    { rank: 3, user: top3[2], color: 'orange-400', icon: 'medal', size: 'h-20', gradient: 'from-orange-100 to-white' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 font-['Inter'] animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-2 rounded-full mb-6 shadow-xl shadow-slate-900/20">
          <i className="fas fa-fire text-orange-500"></i>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">SOVEREIGN STREAK BOARD</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase">HALL OF <span className="text-blue-600">CONSISTENCY</span></h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">Only the most disciplined identities survive the registry</p>
      </div>

      {/* Podium Area with Shiny Background */}
      <div className="relative">
        {/* Shiny Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-gradient-to-br from-amber-400/5 via-blue-500/5 to-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/20 rounded-full blur-[60px] animate-pulse pointer-events-none"></div>

        <div className="relative flex items-end justify-center gap-4 md:gap-10 pt-16 px-4 z-10">
          {podium.map((p, idx) => (
            p.user ? (
              <div key={idx} className={`flex flex-col items-center flex-1 max-w-[150px] transition-all duration-700`}>
                <div className="relative mb-6 group">
                  <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[2.5rem] border-4 border-white shadow-2xl flex items-center justify-center bg-white overflow-hidden transform group-hover:rotate-6 transition-transform z-20 relative`}>
                    <span className="text-2xl font-black text-slate-300">{p.user.name[0]}</span>
                  </div>
                  {/* Glowing background for top tier */}
                  <div className={`absolute inset-0 rounded-[2.5rem] blur-xl opacity-40 bg-${p.color} animate-pulse`}></div>
                  
                  <div className={`absolute -top-8 left-1/2 -translate-x-1/2 text-3xl text-${p.color} drop-shadow-xl animate-float z-30`}>
                    <i className={`fas fa-${p.icon}`}></i>
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-center text-xs font-black border-2 border-white z-30">
                    #{p.rank}
                  </div>
                </div>
                <p className="font-black text-slate-900 text-[10px] md:text-xs uppercase tracking-widest text-center truncate w-full mb-1">{p.user.name}</p>
                <div className="flex flex-col items-center mb-2">
                  <span className={`font-black text-xl md:text-3xl text-${p.color}`}>{p.user.streak}🔥</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.user.coins.toLocaleString()} Coins</span>
                </div>
                {/* Pillar with Color Gradient */}
                <div className={`w-full rounded-t-[2rem] bg-gradient-to-b ${p.gradient} shadow-inner border-x border-t border-slate-100 ${p.size}`}></div>
              </div>
            ) : (
              <div key={idx} className="flex-1 max-w-[150px]"></div>
            )
          ))}
        </div>
      </div>

      {/* Rank List rest */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden mx-4 relative z-10">
        <div className="divide-y divide-slate-50">
          {rest.map((u, i) => (
            <div key={u.id} className={`p-6 md:p-8 px-8 md:px-12 flex justify-between items-center ${u.id === currentUser.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'} transition-colors group`}>
               <div className="flex items-center gap-6 md:gap-10">
                 <span className="font-black text-slate-200 text-xl group-hover:text-blue-200 transition-colors">#{i + 4}</span>
                 <div>
                   <p className="font-black text-slate-900 uppercase text-sm md:text-base">{u.name}</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Capital Accumulation: {u.coins.toLocaleString()} Coins</p>
                 </div>
               </div>
               <div className="text-right">
                 <div className="flex items-center justify-end gap-2">
                    <span className="text-xl md:text-2xl font-black text-orange-500">{u.streak}</span>
                    <span className="text-sm">🔥</span>
                 </div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol Days</p>
               </div>
            </div>
          ))}
          {rest.length === 0 && (
             <div className="p-20 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest">Registry Search Complete</div>
          )}
        </div>
      </div>

      {/* My Stats Banner */}
      {!isMeTop3 && (
        <div className="sticky bottom-10 left-0 right-0 px-4 md:px-0 z-50 animate-fade-in">
          <div className="max-w-2xl mx-auto bg-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex justify-between items-center text-white border-2 border-blue-600/30 backdrop-blur-xl">
             <div className="flex items-center gap-6">
               <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg rotate-3">
                 #{myRank}
               </div>
               <div>
                 <p className="font-black text-sm md:text-lg uppercase leading-none">Your Standing</p>
                 <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest mt-2">Active Sovereign Identity</p>
               </div>
             </div>
             <div className="text-right flex items-center gap-8">
               <div className="text-center">
                 <p className="text-xl md:text-2xl font-black text-orange-500">{currentUser.streak}🔥</p>
                 <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">My Streak</p>
               </div>
               <div className="text-center hidden md:block">
                 <p className="text-xl font-black text-amber-500">{currentUser.coins.toLocaleString()}</p>
                 <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">My Coins</p>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { User } from '../types';

interface LeaderboardProps {
  users: User[];
  currentUser: User;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUser }) => {
  // Rank by streak primarily, then coins
  const sorted = [...users].sort((a, b) => b.streak - a.streak || b.coins - a.coins);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3, 10);
  const myRank = sorted.findIndex(u => u.id === currentUser.id) + 1;
  const isMeTop3 = myRank <= 3;

  // Podium Positions: 1st Center, 2nd Left, 3rd Right
  const podium = [
    { rank: 2, user: top3[1], color: 'slate-300', icon: 'medal', size: 'h-24' },
    { rank: 1, user: top3[0], color: 'amber-400', icon: 'crown', size: 'h-32' },
    { rank: 3, user: top3[2], color: 'orange-400', icon: 'medal', size: 'h-20' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="text-center">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Streak Hall of Fame</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">Only the most consistent survive</p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 md:gap-10 pt-10 px-4">
        {podium.map((p, idx) => (
          p.user ? (
            <div key={idx} className={`flex flex-col items-center flex-1 max-w-[150px] animate-fade-in-up`} style={{ animationDelay: `${idx * 150}ms` }}>
              <div className="relative mb-4 group">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-xl flex items-center justify-center bg-slate-100 overflow-hidden`}>
                   <span className="text-2xl font-black text-slate-300">{p.user.name[0]}</span>
                </div>
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-2xl text-${p.color} drop-shadow-md`}>
                  <i className={`fas fa-${p.icon}`}></i>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-xs font-black">
                  #{p.rank}
                </div>
              </div>
              <p className="font-black text-slate-800 text-sm md:text-base text-center truncate w-full">{p.user.name}</p>
              <div className="flex flex-col items-center mt-1">
                <span className="text-orange-500 font-black text-lg">{p.user.streak}🔥</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">{p.user.coins.toLocaleString()} Coins</span>
              </div>
              <div className={`w-full mt-4 rounded-t-2xl bg-white shadow-sm border-x border-t border-slate-100 ${p.size}`}></div>
            </div>
          ) : (
            <div key={idx} className="flex-1 max-w-[150px]"></div>
          )
        ))}
      </div>

      {/* Rank List */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden mx-4">
        <div className="divide-y divide-slate-50">
          {rest.map((u, i) => (
            <div key={u.id} className={`p-6 px-10 flex justify-between items-center ${u.id === currentUser.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'} transition-colors`}>
               <div className="flex items-center gap-8">
                 <span className="font-black text-slate-200 text-lg">#{i + 4}</span>
                 <div>
                   <p className="font-black text-slate-800">{u.name}</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.coins.toLocaleString()} Coins Accumulated</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-xl font-black text-orange-500">{u.streak}🔥</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase">Streak</p>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Personal Rank Footer */}
      {!isMeTop3 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl animate-bounce-in">
          <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl flex justify-between items-center text-white border-4 border-blue-600">
             <div className="flex items-center gap-5">
               <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl">
                 #{myRank}
               </div>
               <div>
                 <p className="font-black text-lg">Your Performance</p>
                 <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Global Ranking Status</p>
               </div>
             </div>
             <div className="text-right flex items-center gap-6">
               <div className="text-center">
                 <p className="text-xl font-black text-orange-500">{currentUser.streak}🔥</p>
                 <p className="text-[8px] font-black uppercase text-slate-500">Streak</p>
               </div>
               <div className="text-center">
                 <p className="text-xl font-black text-amber-500">{currentUser.coins.toLocaleString()}</p>
                 <p className="text-[8px] font-black uppercase text-slate-500">Coins</p>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

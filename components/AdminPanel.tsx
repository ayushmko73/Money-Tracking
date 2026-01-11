
import React from 'react';
import { User, Transaction } from '../types';

interface AdminPanelProps {
  users: User[];
  transactions: Transaction[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">Master Sovereign Console</h4>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Active User Identity & Access Audit</p>
          </div>
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
            <i className="fas fa-user-shield"></i>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Sovereign Identity</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Verified Email</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Access Key (Password)</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Vault Wealth</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Streak</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Synchronization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all uppercase">
                        {user.name[0]}
                      </div>
                      <span className="font-black text-slate-800 text-sm tracking-tight">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-500 italic">{user.email}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono font-bold border border-slate-200 group-hover:bg-white transition-all select-all">
                      {user.password || 'SECURE_AUTH'}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-amber-500 text-sm">
                    {user.coins.toLocaleString()} <span className="text-[9px] uppercase opacity-50 ml-1">Coins</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter inline-flex items-center gap-1.5">
                      <i className="fas fa-fire"></i> {user.streak}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">End of Audit Stream • {users.length} Active Profiles</p>
        </div>
      </div>
    </div>
  );
};

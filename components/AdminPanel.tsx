import React, { useState, useMemo } from 'react';
import { User, Transaction } from '../types';
import { storageService } from '../services/storageService';
import { ADMIN_EMAIL } from '../constants';

interface AdminPanelProps {
  users: User[];
  transactions: Transaction[];
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, onRefresh }) => {
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [filterGender, setFilterGender] = useState('');
  const [filterMinStreak, setFilterMinStreak] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchGender = filterGender ? u.gender === filterGender : true;
      const matchStreak = filterMinStreak ? (u.streak || 0) >= parseInt(filterMinStreak) : true;
      return matchGender && matchStreak;
    });
  }, [users, filterGender, filterMinStreak]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // Pass both ID and Email for a guaranteed double-vector purge
      const success = await storageService.deleteUser(deleteTarget.id, deleteTarget.email);
      if (success) {
        onRefresh();
        setDeleteTarget(null);
      } else {
        alert("Operation Fault: Registry scrub failed. Identity might be protected by Supabase RLS.");
      }
    } catch (e: any) {
      console.error("Critical Purge Exception:", e);
      alert(`Terminal Error: ${e.message || "Registry synchronization fault."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-32">
      <div className="text-center mb-10">
         <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">ADMIN <span className="text-blue-600">PANEL</span></h1>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Global Registry Audit</p>
      </div>

      <div className="space-y-8">
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 w-full">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-3 block ml-1 tracking-widest">Gender Partition</label>
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs uppercase shadow-sm focus:border-blue-600 transition-all">
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-3 block ml-1 tracking-widest">Min Streak</label>
            <input type="number" placeholder="Enter threshold..." value={filterMinStreak} onChange={e => setFilterMinStreak(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs shadow-sm focus:border-blue-600 outline-none transition-all" />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hidden md:block">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.3em]">
              <tr>
                <th className="px-8 py-6">Member Identity</th>
                <th className="px-8 py-6">Vitals</th>
                <th className="px-8 py-6">Access Key</th>
                <th className="px-8 py-6 text-center">Streak</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-8">
                    <p className="font-black text-slate-900 text-sm uppercase">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{user.email}</p>
                  </td>
                  <td className="px-8 py-8">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest">
                          {user.age !== undefined && user.age !== null ? `${user.age} Yrs` : '??'}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                          {user.gender || 'N/A'}
                        </span>
                      </div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-key text-[10px] text-blue-500"></i>
                      <span className="font-mono text-[10px] tracking-tighter text-slate-900 font-bold">
                        {user.password || 'NO_KEY_FOUND'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center text-orange-500 font-black text-lg">{user.streak || 0}🔥</td>
                  <td className="px-8 py-8 text-right">
                    {user.email !== ADMIN_EMAIL ? (
                      <button onClick={() => setDeleteTarget(user)} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"><i className="fas fa-trash-alt text-[10px]"></i></button>
                    ) : (
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest border border-blue-100 px-3 py-1 rounded-lg">ROOT</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-slate-900 text-sm uppercase">{user.name}</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{user.email}</p>
                </div>
                <p className="text-orange-500 font-black text-base">{user.streak || 0}🔥</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Registry Key</span>
                    <span className="font-mono text-[10px] font-bold text-blue-600">
                      {user.password || 'N/A'}
                    </span>
                 </div>
                 <div className="flex gap-2">
                  <span className="bg-white px-3 py-1 rounded-lg border border-slate-100 text-[8px] font-black uppercase tracking-widest">{user.age !== undefined && user.age !== null ? user.age : '??'} Yrs</span>
                  <span className="bg-white border border-slate-100 text-blue-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{user.gender || 'N/A'}</span>
                </div>
              </div>

              {user.email !== ADMIN_EMAIL && (
                <button onClick={() => setDeleteTarget(user)} className="w-full py-4 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Execute Purge</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 text-center shadow-2xl scale-in border border-slate-100">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100">
              <i className="fas fa-trash-alt text-3xl"></i>
            </div>
            <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight leading-none">Purge Identity?</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase mt-6 leading-relaxed tracking-widest">Permanent wipe of <span className="text-slate-900">{deleteTarget.name}</span>.</p>
            <div className="mt-10 flex flex-col gap-3">
              <button onClick={handleDeleteConfirm} disabled={isDeleting} className="py-5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                {isDeleting ? 'Processing...' : 'CONFIRM PURGE'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="py-5 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">ABORT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
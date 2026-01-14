
import React, { useState, useEffect } from 'react';
import { RecurringTransaction, RecurrenceFrequency, TransactionType } from '../types';
import { storageService } from '../services/storageService';
import { COLORS } from '../constants';

interface RecurringManagerProps {
  userId: string;
  onRefresh: () => void;
}

export const RecurringManager: React.FC<RecurringManagerProps> = ({ userId, onRefresh }) => {
  const [templates, setTemplates] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    const data = await storageService.getRecurringTransactions(userId);
    setTemplates(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [userId]);

  const handleToggle = async (id: string, current: boolean) => {
    await storageService.updateRecurringTransaction(id, { isActive: !current });
    await fetchTemplates();
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await storageService.deleteRecurringTransaction(deleteTarget);
    setDeleteTarget(null);
    await fetchTemplates();
    onRefresh();
  };

  const getNextOccurrence = (r: RecurringTransaction) => {
    const last = r.lastProcessedDate ? new Date(r.lastProcessedDate) : new Date(r.startDate);
    const next = new Date(last);
    if (r.frequency === RecurrenceFrequency.DAILY) next.setDate(next.setDate(next.getDate() + 1));
    else if (r.frequency === RecurrenceFrequency.WEEKLY) next.setDate(next.getDate() + 7);
    else if (r.frequency === RecurrenceFrequency.MONTHLY) next.setMonth(next.getMonth() + 1);
    else if (r.frequency === RecurrenceFrequency.YEARLY) next.setFullYear(next.getFullYear() + 1);
    return next.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  };

  if (loading) return <div className="p-20 flex justify-center"><div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-10 animate-fade-in font-['Inter'] pb-32">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/60 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
              <i className="fas fa-rotate text-xl"></i>
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Temporal Automation Hub</span>
          </div>
          <h1 className="text-3xl md:text-7xl font-black tracking-tighter uppercase leading-none text-slate-900">FLOW <span className="text-emerald-600">NEXUS</span></h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4 max-w-lg">Monitor and govern your automated capital vectors. The system executes these flows autonomously based on the defined pulse.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(r => (
          <div key={r.id} className={`group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all ${!r.isActive ? 'grayscale opacity-60' : 'hover:shadow-2xl'}`}>
            <div className="flex justify-between items-start mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: COLORS[r.type] }}>
                    <i className={`fas ${r.type === TransactionType.INCOME ? 'fa-arrow-up' : 'fa-arrow-down'} text-xs`}></i>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase leading-none">{r.category}</h4>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{r.frequency} Protocol</p>
                  </div>
               </div>
               <button 
                onClick={() => handleToggle(r.id, r.isActive)}
                className={`w-12 h-6 rounded-full relative transition-all ${r.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${r.isActive ? 'right-1' : 'left-1'}`}></div>
               </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Magnitude</span>
                <span className="text-2xl font-black text-slate-900">₹{r.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Pulse</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{getNextOccurrence(r)}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-end gap-2">
               <button 
                onClick={() => setDeleteTarget(r.id)}
                className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
               >
                 <i className="fas fa-trash-alt text-xs"></i>
               </button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-3xl mb-6">
              <i className="fas fa-clock"></i>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Autonomous Flows Offline</p>
            <p className="text-[8px] font-bold text-slate-300 uppercase mt-2 tracking-widest">Enable 'Recurring Protocol' in the entry form to initialize automation.</p>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in">
           <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 text-center shadow-2xl border border-slate-100">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <i className="fas fa-trash-alt text-3xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Terminate Flow?</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-6 leading-relaxed">
                 Permanent deactivation and scrubbing of this automated capital vector.
              </p>
              <div className="mt-12 flex flex-col gap-4">
                 <button onClick={handleDelete} className="py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">TERMINATE</button>
                 <button onClick={() => setDeleteTarget(null)} className="py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">ABORT</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

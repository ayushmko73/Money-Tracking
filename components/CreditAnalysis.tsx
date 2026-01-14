import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { storageService } from '../services/storageService';

interface CreditAnalysisProps {
  transactions: Transaction[];
  onAddRequest: (type: TransactionType) => void;
  onRefresh: () => void;
  onEditRequest: (tx: Transaction) => void;
}

export const CreditAnalysis: React.FC<CreditAnalysisProps> = ({ transactions, onRefresh, onEditRequest }) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RECOVERED'>('PENDING');

  const creditStats = useMemo(() => {
    const allCredits = transactions.filter(t => t.type === TransactionType.CREDIT);
    const outstanding = allCredits.filter(c => !c.resolved).reduce((sum, t) => sum + t.amount, 0);
    const recovered = allCredits.filter(c => c.resolved).reduce((sum, t) => sum + t.amount, 0);
    const filtered = allCredits.filter(c => activeTab === 'PENDING' ? !c.resolved : c.resolved);
    return { allCredits, filtered, outstanding, recovered };
  }, [transactions, activeTab]);

  const handleResolve = async (txId: string, isDefault: boolean = false) => {
    setIsProcessing(true);
    try {
      const tx = transactions.find(t => t.id === txId);
      if (tx) {
        const updates: Partial<Transaction> = { 
          resolved: true,
          note: isDefault ? (tx.note + "\n[SYSTEM: MARKED AS DEFAULTED]") : tx.note
        };
        await storageService.updateTransaction(txId, updates);
      }
      setConfirmId(null);
      setDefaultId(null);
      onRefresh(); 
    } catch (e) {
      console.error("Credit operation failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTx = (confirmId || defaultId) ? creditStats.allCredits.find(c => c.id === (confirmId || defaultId)) : null;

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in font-['Inter'] pb-32">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/60 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
        <div className="relative z-10 space-y-6 md:space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-hand-holding-heart text-lg md:text-2xl"></i>
                </div>
                <span className="text-[9px] md:text-[11px] font-black text-blue-600 uppercase tracking-widest">Active Credits</span>
              </div>
              <h1 className="text-2xl md:text-7xl font-black tracking-tighter uppercase leading-none text-slate-900">CREDIT <span className="text-blue-600">LEDGER</span></h1>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="p-6 md:p-10 bg-slate-50 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-inner">
               <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase mb-2 md:mb-4 tracking-widest">Receivables</p>
               <p className="text-2xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">₹{creditStats.outstanding.toLocaleString()}</p>
            </div>
            <div className="p-6 md:p-10 bg-emerald-50 rounded-2xl md:rounded-[2.5rem] border border-emerald-100 shadow-inner">
               <p className="text-[9px] md:text-[11px] font-black text-emerald-500 uppercase mb-2 md:mb-4 tracking-widest">Recovered</p>
               <p className="text-2xl md:text-6xl font-black text-emerald-700 tracking-tight leading-none">₹{creditStats.recovered.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 max-w-sm shadow-sm overflow-hidden">
        <button onClick={() => setActiveTab('PENDING')} className={`flex-1 py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'PENDING' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>Active</button>
        <button onClick={() => setActiveTab('RECOVERED')} className={`flex-1 py-3 md:py-4 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'RECOVERED' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400'}`}>Settled</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
        {creditStats.filtered.length > 0 ? creditStats.filtered.map(c => (
          <div key={c.id} className={`group bg-white p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] border border-slate-100 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${c.resolved ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-2xl hover:-translate-y-1'}`}>
            {!c.resolved && <div className="absolute top-0 left-0 right-0 h-1.5 md:h-2 bg-blue-600"></div>}
            <div className="space-y-6 md:space-y-8">
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-inner ${c.resolved ? 'bg-slate-100 text-slate-300' : 'bg-blue-50 text-blue-600'}`}><i className={`fas ${c.resolved ? 'fa-check-circle' : 'fa-handshake-angle'}`}></i></div>
                <div className="text-right">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest">Date</p>
                  <p className="text-[10px] md:text-sm font-black text-slate-900">{new Date(c.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Asset</p>
                <h4 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase truncate">{c.category}</h4>
              </div>
            </div>
            <div className="mt-8 md:mt-12 pt-6 md:pt-10 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-1">Amount</p>
                <p className={`text-xl md:text-3xl font-black tracking-tighter leading-none ${c.resolved ? 'text-slate-300 line-through' : 'text-slate-900'}`}>₹{c.amount.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {!c.resolved && (
                  <>
                    <button onClick={() => setConfirmId(c.id)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm"><i className="fas fa-check text-xs"></i></button>
                    <button onClick={() => setDefaultId(c.id)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all bg-red-50 text-red-500 border border-red-100 shadow-sm"><i className="fas fa-skull text-xs"></i></button>
                  </>
                )}
                <button onClick={() => onEditRequest(c)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all bg-slate-50 text-slate-400 border border-slate-100 shadow-sm"><i className="fas fa-pen text-xs"></i></button>
              </div>
            </div>
          </div>
        )) : <div className="py-24 bg-white rounded-[2rem] md:rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10 col-span-full"><p className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-[0.4em]">Empty Registry</p></div>}
      </div>

      {(confirmId || defaultId) && selectedTx && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-white/60 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 text-center shadow-2xl animate-scale-in border border-slate-100">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 ${defaultId ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
              <i className={`fas ${defaultId ? 'fa-skull' : 'fa-hand-holding-heart'} text-xl`}></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase">{defaultId ? 'Declare Default?' : 'Recover Credit?'}</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4 leading-relaxed">
              {defaultId 
                ? `Confirming total loss of ₹${selectedTx.amount.toLocaleString()}. Record will be resolved as defaulted.`
                : `Confirming receipt of ₹${selectedTx.amount.toLocaleString()}. Record will be resolved as recovered.`}
            </p>
            <div className="mt-10 flex flex-col gap-3">
              <button 
                onClick={() => handleResolve(defaultId || confirmId!, !!defaultId)} 
                className={`w-full py-5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-xl ${defaultId ? 'bg-red-600' : 'bg-emerald-600'}`}
              >
                CONFIRM OPERATION
              </button>
              <button onClick={() => {setConfirmId(null); setDefaultId(null);}} className="w-full py-5 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase hover:text-slate-900">ABORT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
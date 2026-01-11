
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { storageService } from '../services/storageService';

interface CreditAnalysisProps {
  transactions: Transaction[];
  onAddRequest: (type: TransactionType) => void;
  onRefresh: () => void;
}

export const CreditAnalysis: React.FC<CreditAnalysisProps> = ({ transactions, onAddRequest, onRefresh }) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const creditStats = useMemo(() => {
    const credits = transactions.filter(t => t.type === TransactionType.CREDIT);
    const outstanding = credits.filter(c => !c.resolved).reduce((sum, t) => sum + t.amount, 0);
    const recovered = credits.filter(c => c.resolved).reduce((sum, t) => sum + t.amount, 0);
    return { credits, outstanding, recovered };
  }, [transactions]);

  const handleResolve = async (txId: string) => {
    setIsProcessing(true);
    try {
      await storageService.toggleTransactionStatus(txId);
      setConfirmId(null);
      onRefresh(); 
    } catch (e) {
      console.error("Settlement failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTx = confirmId ? creditStats.credits.find(c => c.id === confirmId) : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10 bg-blue-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Money Lend</h2>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Tactical Receivables Ledger</p>
          </div>
          <button 
            onClick={() => onAddRequest(TransactionType.CREDIT)}
            className="w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center transition-all"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Outstanding Lend</p>
               <p className="text-3xl font-black text-slate-900">₹{creditStats.outstanding.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100">
               <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Total Recovered</p>
               <p className="text-3xl font-black text-emerald-600">₹{creditStats.recovered.toLocaleString()}</p>
            </div>
          </div>

          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 ml-1">Sovereign Debtors</h4>
          <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide">
            {creditStats.credits.length > 0 ? creditStats.credits.map(c => (
              <div key={c.id} className={`p-6 bg-white rounded-3xl border border-slate-100 flex justify-between items-center transition-all ${c.resolved ? 'opacity-40 grayscale scale-[0.98]' : 'hover:border-blue-200 shadow-sm'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.resolved ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <i className={`fas ${c.resolved ? 'fa-check' : 'fa-indian-rupee-sign'}`}></i>
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-lg leading-none">{c.category}</p>
                    <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">Lend via {c.paymentMethod} on {new Date(c.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <p className="text-xl font-black text-slate-900">₹{c.amount.toLocaleString()}</p>
                  <button 
                    onClick={() => {
                      if (c.resolved) handleResolve(c.id);
                      else setConfirmId(c.id);
                    }}
                    className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${c.resolved ? 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
                  >
                    {c.resolved ? 'Re-open' : 'Mark Paid'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                <i className="fas fa-users-slash text-4xl text-slate-200 mb-4"></i>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">No Active Lend Vectors</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmId && selectedTx && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 text-center scale-in border border-slate-100">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <i className="fas fa-indian-rupee-sign text-3xl"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Confirm Settlement?</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 leading-relaxed">
              Confirm that <span className="text-slate-900 font-black">{selectedTx.category}</span> has fully settled the lend of <span className="text-emerald-600 font-black">₹{selectedTx.amount.toLocaleString()}</span>. This amount will be added back to your <span className="font-black">{selectedTx.paymentMethod}</span> balance.
            </p>
            <div className="mt-10 space-y-3">
              <button 
                onClick={() => handleResolve(confirmId)}
                disabled={isProcessing}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Confirm Recovery'}
              </button>
              <button 
                onClick={() => setConfirmId(null)}
                disabled={isProcessing}
                className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:text-slate-900 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

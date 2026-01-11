
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { storageService } from '../services/storageService';

interface DebtControlProps {
  transactions: Transaction[];
  onAddRequest: (type: TransactionType) => void;
  onRefresh: () => void;
}

export const DebtControl: React.FC<DebtControlProps> = ({ transactions, onAddRequest, onRefresh }) => {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const debtStats = useMemo(() => {
    const debts = transactions.filter(t => t.type === TransactionType.DEBT);
    const outstanding = debts.filter(d => !d.resolved).reduce((sum, t) => sum + t.amount, 0);
    const settled = debts.filter(d => d.resolved).reduce((sum, t) => sum + t.amount, 0);
    return { debts, outstanding, settled };
  }, [transactions]);

  const handleResolve = async (txId: string) => {
    setIsProcessing(true);
    try {
      await storageService.toggleTransactionStatus(txId);
      setConfirmId(null);
      onRefresh();
    } catch (e) {
      console.error("Debt settlement failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTx = confirmId ? debtStats.debts.find(d => d.id === confirmId) : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Money Borrow</h2>
            <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Hazard Payables Registry</p>
          </div>
          <button 
            onClick={() => onAddRequest(TransactionType.DEBT)}
            className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-red-500/20"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
               <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">Liability Balance</p>
               <p className="text-3xl font-black text-slate-900">₹{debtStats.outstanding.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Settled</p>
               <p className="text-3xl font-black text-slate-900">₹{debtStats.settled.toLocaleString()}</p>
            </div>
          </div>

          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 ml-1">Active Creditors</h4>
          <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide">
            {debtStats.debts.length > 0 ? debtStats.debts.map(d => (
              <div key={d.id} className={`p-6 bg-white rounded-3xl border border-slate-100 flex justify-between items-center transition-all ${d.resolved ? 'opacity-40 grayscale' : 'hover:border-red-200 shadow-sm'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${d.resolved ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    <i className={`fas ${d.resolved ? 'fa-check' : 'fa-user-clock'}`}></i>
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-lg leading-none">{d.category}</p>
                    <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">Borrow via {d.paymentMethod} on {new Date(d.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <p className="text-xl font-black text-slate-900">₹{d.amount.toLocaleString()}</p>
                  <button 
                    onClick={() => {
                      if (d.resolved) handleResolve(d.id);
                      else setConfirmId(d.id);
                    }}
                    className={`px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${d.resolved ? 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500' : 'bg-slate-900 text-white shadow-xl'}`}
                  >
                    {d.resolved ? 'Re-open' : 'Settle Owed'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                <i className="fas fa-shield-check text-4xl text-emerald-500 mb-4"></i>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Zero Active Liabilities Detected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmId && selectedTx && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-sm bg-white rounded-[2.5rem] shadow-2xl p-10 text-center scale-in border border-slate-100">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <i className="fas fa-user-clock text-3xl"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Confirm Settlement?</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 leading-relaxed">
              Confirm that you have fully paid back <span className="text-slate-900 font-black">{selectedTx.category}</span> the amount of <span className="text-red-600 font-black">₹{selectedTx.amount.toLocaleString()}</span>. This will be deducted from your <span className="font-black">{selectedTx.paymentMethod}</span> balance.
            </p>
            <div className="mt-10 space-y-3">
              <button 
                onClick={() => handleResolve(confirmId)}
                disabled={isProcessing}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Confirm Settlement'}
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

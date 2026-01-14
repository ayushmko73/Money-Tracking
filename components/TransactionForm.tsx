
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType, Goal, CustomCategory, CustomChannel } from '../types';
import { storageService } from '../services/storageService';
import { CATEGORIES } from '../constants';

interface TransactionFormProps {
  onSubmit: (t: any) => void;
  onClose: () => void;
  userId: string;
  initialType?: TransactionType;
  initialCategory?: string;
  editingTransaction?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSubmit, 
  onClose, 
  userId, 
  initialType, 
  initialCategory, 
  editingTransaction 
}) => {
  const [type, setType] = useState<TransactionType>(editingTransaction?.type || initialType || TransactionType.EXPENSE);
  const [amount, setAmount] = useState(editingTransaction?.amount.toString() || '');
  const [category, setCategory] = useState(editingTransaction?.category || initialCategory || '');
  const [paymentMethod, setPaymentMethod] = useState(editingTransaction?.paymentMethod || '');
  const [note, setNote] = useState(editingTransaction?.note || '');
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [customChans, setCustomChans] = useState<CustomChannel[]>([]);
  const [isAddingVector, setIsAddingVector] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string, type: 'CAT' | 'CHAN' } | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const [fetchedGoals, fetchedCats, fetchedChans] = await Promise.all([
      storageService.getGoals(userId),
      storageService.getCustomCategories(userId),
      storageService.getCustomChannels(userId)
    ]);
    setGoals(fetchedGoals);
    setCustomCats(fetchedCats);
    setCustomChans(fetchedChans);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const defaultChannels = ['Cash', 'Bank', 'UPI', 'Credit Card', 'Online'];

  const getDisplayCategories = () => {
    const defaults = CATEGORIES[type] || [];
    const customs = customCats.filter(c => c.type === type).map(c => c.name);
    return Array.from(new Set([...defaults, ...customs]));
  };

  const getDisplayChannels = () => {
    const customs = customChans.map(c => c.name);
    return Array.from(new Set([...defaultChannels, ...customs]));
  };

  const displayCategories = type === TransactionType.SAVING 
    ? goals.map(g => g.name) 
    : getDisplayCategories();

  const displayChannels = getDisplayChannels();

  const isNewCategory = category.trim() !== '' && !displayCategories.some(c => c.toLowerCase() === category.trim().toLowerCase());
  const isNewChannel = paymentMethod.trim() !== '' && !displayChannels.some(c => c.toLowerCase() === paymentMethod.trim().toLowerCase());

  const handleCreateCategory = async () => {
    if (!category.trim() || isAddingVector) return;
    setIsAddingVector(true);
    await storageService.addCustomCategory(userId, category.trim(), type);
    await fetchData();
    setIsAddingVector(false);
  };

  const handleCreateChannel = async () => {
    if (!paymentMethod.trim() || isAddingVector) return;
    setIsAddingVector(true);
    await storageService.addCustomChannel(userId, paymentMethod.trim());
    await fetchData();
    setIsAddingVector(false);
  };

  const handleCategoryDoubleClick = (catName: string) => {
    const custom = customCats.find(c => c.name === catName && c.type === type);
    if (custom) setDeleteConfirm({ id: custom.id, name: custom.name, type: 'CAT' });
  };

  const handleChannelDoubleClick = (chanName: string) => {
    const custom = customChans.find(c => c.name === chanName);
    if (custom) setDeleteConfirm({ id: custom.id, name: custom.name, type: 'CHAN' });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'CAT') {
      await storageService.deleteCustomCategory(deleteConfirm.id);
      if (category === deleteConfirm.name) setCategory('');
    } else {
      await storageService.deleteCustomChannel(deleteConfirm.id);
      if (paymentMethod === deleteConfirm.name) setPaymentMethod('');
    }
    setDeleteConfirm(null);
    await fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please specify a valid magnitude.");
      return;
    }

    onSubmit({
      type,
      amount: parseFloat(amount),
      category: category.trim() || 'Default',
      paymentMethod: paymentMethod.trim() || 'Default',
      note: note.trim(),
      date: editingTransaction?.date || new Date().toISOString(),
      resolved: editingTransaction?.resolved || false
    });
  };

  const typeTheme = {
    [TransactionType.EXPENSE]: { color: 'text-red-500', bg: 'bg-red-500', light: 'bg-red-50', border: 'border-red-100' },
    [TransactionType.INCOME]: { color: 'text-emerald-500', bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-100' },
    [TransactionType.CREDIT]: { color: 'text-blue-500', bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-100' },
    [TransactionType.DEBT]: { color: 'text-orange-500', bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-100' },
    [TransactionType.SAVING]: { color: 'text-indigo-500', bg: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-100' },
  };

  const currentTheme = typeTheme[type];

  return (
    <div className="fixed inset-0 z-[1200] flex items-end md:items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-fade-in px-0 md:px-6">
      <div className="w-full max-w-lg md:max-w-2xl bg-white rounded-t-[2.5rem] md:rounded-[3.5rem] shadow-2xl animate-scale-in border-t md:border border-slate-200 flex flex-col max-h-[96dvh] md:max-h-[90vh] overflow-hidden relative">
        
        {/* Mobile Drag Indicator */}
        <div className="md:hidden w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

        <header className="px-6 py-4 md:px-12 md:py-8 flex justify-between items-center border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 ${currentTheme.light} rounded-xl flex items-center justify-center ${currentTheme.color} border ${currentTheme.border}`}>
              <i className="fas fa-shield-halved text-sm md:text-lg"></i>
            </div>
            <div>
              <h2 className="text-sm md:text-xl font-black uppercase tracking-tight text-slate-900 leading-none">
                {editingTransaction ? 'EDIT RECORD' : 'NEW ENTRY'}
              </h2>
              <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">Sovereign Asset Terminal</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all active:scale-90"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-12 scrollbar-hide pb-safe">
          
          <section className="space-y-4">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Asset Modality</label>
             <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-2 px-2 pb-2">
               {Object.values(TransactionType).map(t => (
                 <button 
                   key={t} 
                   type="button" 
                   onClick={() => { setType(t); setCategory(''); }} 
                   className={`shrink-0 px-6 py-3.5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${
                     type === t 
                       ? `${typeTheme[t].bg} text-white border-transparent shadow-xl` 
                       : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                   }`}
                 >
                   {t}
                 </button>
               ))}
             </div>
          </section>

          <section className="space-y-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Capital Magnitude (₹)</label>
            <div className="relative">
              <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-2xl md:text-4xl font-black transition-colors ${amount ? 'text-slate-900' : 'text-slate-200'}`}>₹</span>
              <input 
                ref={amountRef}
                type="number" 
                inputMode="decimal"
                required
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="0.00" 
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] md:rounded-[2.5rem] py-6 md:py-10 pl-14 md:pl-16 pr-8 text-3xl md:text-6xl font-black tracking-tighter text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-200 font-mono"
              />
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Allocation Vector</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  placeholder="e.g. Dining, Rent..." 
                  className="w-full px-6 py-4 md:py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs md:text-sm uppercase outline-none focus:border-slate-900 focus:bg-white transition-all shadow-sm" 
                />
                {isNewCategory && (
                  <button 
                    type="button" 
                    onClick={handleCreateCategory}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90"
                  >
                    <i className={`fas ${isAddingVector ? 'fa-spinner fa-spin' : 'fa-plus'} text-xs`}></i>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {displayCategories.map(c => (
                  <button 
                    key={c} 
                    type="button" 
                    onClick={() => setCategory(c)}
                    onDoubleClick={() => handleCategoryDoubleClick(c)}
                    className={`px-3 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-all ${
                      category.toLowerCase() === c.toLowerCase() 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Medium / Channel</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)} 
                  placeholder="e.g. Bank, Cash..." 
                  className="w-full px-6 py-4 md:py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs md:text-sm uppercase outline-none focus:border-slate-900 focus:bg-white transition-all shadow-sm" 
                />
                {isNewChannel && (
                  <button 
                    type="button" 
                    onClick={handleCreateChannel}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90"
                  >
                    <i className={`fas ${isAddingVector ? 'fa-spinner fa-spin' : 'fa-plus'} text-xs`}></i>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {displayChannels.map(c => (
                  <button 
                    key={c} 
                    type="button" 
                    onClick={() => setPaymentMethod(c)}
                    onDoubleClick={() => handleChannelDoubleClick(c)}
                    className={`px-3 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-all ${
                      paymentMethod.toLowerCase() === c.toLowerCase() 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tactical Note (Optional)</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="Entry details or strategic context..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 outline-none focus:border-slate-900 focus:bg-white font-bold text-xs md:text-sm transition-all h-28 md:h-32 resize-none shadow-sm"
            ></textarea>
          </section>

          <div className="flex flex-col gap-4 mt-8">
            <button 
              type="submit" 
              className="w-full py-6 md:py-8 bg-slate-950 text-white rounded-[1.8rem] md:rounded-[2.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.5em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4"
            >
              <i className="fas fa-lock text-[8px] opacity-30"></i>
              {editingTransaction ? 'UPDATE VAULT RECORD' : 'COMMIT TO REGISTRY'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full py-5 text-slate-300 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              ABORT OPERATION
            </button>
          </div>
        </form>

        {/* Delete Confirmation for Custom Tags */}
        {deleteConfirm && (
          <div className="absolute inset-0 z-[1300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in">
            <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 text-center shadow-2xl scale-in">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100">
                <i className="fas fa-trash-can text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">PURGE TAG?</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-6 leading-relaxed">
                Expunge <span className="text-slate-900">"{deleteConfirm.name}"</span> from the global registry.
              </p>
              <div className="mt-10 flex flex-col gap-3">
                <button onClick={executeDelete} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95">EXECUTE PURGE</button>
                <button onClick={() => setDeleteConfirm(null)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">ABORT</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

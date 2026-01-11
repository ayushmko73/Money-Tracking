
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TransactionType, PaymentMethod, Goal, CustomCategory } from '../types';
import { COLORS } from '../constants';
import { storageService } from '../services/storageService';

interface TransactionFormProps {
  onAdd: (t: any) => void;
  onClose: () => void;
  initialType?: TransactionType;
  userId: string;
}

const TYPE_ICONS = {
  [TransactionType.INCOME]: 'fa-arrow-trend-up',
  [TransactionType.EXPENSE]: 'fa-receipt',
  [TransactionType.CREDIT]: 'fa-indian-rupee-sign',
  [TransactionType.DEBT]: 'fa-user-clock',
  [TransactionType.SAVING]: 'fa-vault'
};

const DISPLAY_NAMES = {
  [TransactionType.INCOME]: 'INCOME',
  [TransactionType.EXPENSE]: 'EXPENSE',
  [TransactionType.CREDIT]: 'LEND',
  [TransactionType.DEBT]: 'BORROW',
  [TransactionType.SAVING]: 'SAVING'
};

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, onClose, initialType, userId }) => {
  const [type, setType] = useState<TransactionType>(initialType || TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.SAVING);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);

  useEffect(() => {
    storageService.getGoals(userId).then(setGoals);
    storageService.getCustomCategories(userId).then(setCustomCats);
  }, [userId]);

  const isCreditOrDebt = type === TransactionType.CREDIT || type === TransactionType.DEBT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !category) return;

    // Auto-save category for future use if it doesn't exist
    const exists = customCats.some(c => c.name.toLowerCase() === category.toLowerCase() && c.type === type);
    if (!exists && type !== TransactionType.SAVING) {
      await storageService.addCustomCategory(userId, category, type);
    }

    onAdd({
      type,
      amount: parseFloat(amount),
      category: category,
      paymentMethod,
      note: '',
      date: new Date(date).toISOString()
    });
    onClose();
  };

  const activeColor = COLORS[type];
  const suggestedCategories = customCats.filter(c => c.type === type).map(c => c.name);

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-950/90 backdrop-blur-xl p-0 md:p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 scale-in max-h-[95vh] flex flex-col">
        <div className="bg-slate-900 p-6 md:p-8 text-white relative flex-shrink-0">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">New Asset Entry</h2>
              <p className="text-blue-400 text-[8px] font-black uppercase tracking-[0.3em] mt-1">Sovereign Financial Terminal</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all group">
              <i className="fas fa-times text-slate-300 group-hover:rotate-90 transition-transform"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8 overflow-y-auto scrollbar-hide flex-1">
          <div className="bg-slate-50 p-2 rounded-[2rem] flex gap-2 overflow-x-auto scrollbar-hide">
            {Object.values(TransactionType).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory(''); 
                }}
                className={`flex-1 min-w-[90px] flex flex-col items-center gap-2 py-4 rounded-[2rem] transition-all relative ${
                  type === t 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/30' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <i className={`fas ${TYPE_ICONS[t]} text-sm`}></i>
                <span className="text-[8px] font-black uppercase tracking-widest">{DISPLAY_NAMES[t]}</span>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Capital Amount</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black" style={{ color: amount ? activeColor : '#cbd5e1' }}>₹</div>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:border-blue-600 focus:bg-white outline-none font-black text-3xl text-slate-900 transition-all placeholder:text-slate-200"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {type === TransactionType.SAVING ? 'Strategic Goal' : (isCreditOrDebt ? 'Identity (Who?)' : 'Category Identification')}
                </label>
                {suggestedCategories.length > 0 && !isCreditOrDebt && type !== TransactionType.SAVING && (
                  <Link to="/categories" onClick={onClose} className="text-[8px] font-black text-blue-500 uppercase tracking-widest hover:underline">Manage My Labels</Link>
                )}
              </div>
              
              {type === TransactionType.SAVING && goals.length > 0 ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:border-blue-600 focus:bg-white outline-none font-bold text-slate-700 transition-all appearance-none"
                  required
                >
                  <option value="">Select Strategic Goal...</option>
                  {goals.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </select>
              ) : (
                <>
                  {suggestedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {suggestedCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${
                            category === cat 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:border-blue-600 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                      placeholder={type === TransactionType.SAVING ? "Name your goal..." : isCreditOrDebt ? "Identity (e.g. Rahul)" : "Type new category..."}
                      required
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                      <i className="fas fa-pen text-[10px] text-slate-300"></i>
                    </div>
                  </div>
                  {!isCreditOrDebt && type !== TransactionType.SAVING && (
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1 ml-1">New labels will be archived for future strategy</p>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Event Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none font-bold text-slate-700 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Payment Channel</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none font-bold text-slate-700 transition-all text-sm appearance-none"
                >
                  {Object.values(PaymentMethod).map(pm => <option key={pm} value={pm}>{pm}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-[0.98] relative overflow-hidden"
              style={{ backgroundColor: activeColor }}
            >
              Authorize {DISPLAY_NAMES[type]} Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

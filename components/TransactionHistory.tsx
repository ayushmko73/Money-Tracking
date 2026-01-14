
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { COLORS } from '../constants';
import { storageService } from '../services/storageService';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onRefresh: () => void;
  onEditRequest: (tx: Transaction) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onRefresh, onEditRequest }) => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(today.toISOString().split('T')[0]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
    setSelectedDate(null);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const { calendarDays, monthSummary } = useMemo(() => {
    const days = [];
    let income = 0;
    let expense = 0;
    let lend = 0;
    let borrow = 0;

    for (let i = 0; i < firstDayOfMonth; i++) days.push({ date: null, active: false });
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTxs = transactions.filter(t => t.date.startsWith(dateStr));
      
      dayTxs.forEach(t => {
        if (t.type === TransactionType.INCOME) income += t.amount;
        else if (t.type === TransactionType.EXPENSE) expense += t.amount;
        else if (t.type === TransactionType.CREDIT) lend += t.amount;
        else if (t.type === TransactionType.DEBT) borrow += t.amount;
      });

      days.push({ 
        date: d, 
        active: dayTxs.length > 0, 
        count: dayTxs.length, 
        fullDate: dateStr, 
        txs: dayTxs,
        dayIncome: dayTxs.some(t => t.type === TransactionType.INCOME),
        dayExpense: dayTxs.some(t => t.type === TransactionType.EXPENSE)
      });
    }
    return { calendarDays: days, monthSummary: { income, expense, lend, borrow } };
  }, [viewYear, viewMonth, transactions]);

  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' });
  const selectedDayData = calendarDays.find(d => d.fullDate === selectedDate);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await storageService.deleteTransaction(deleteConfirmId);
    setDeleteConfirmId(null);
    onRefresh();
  };

  const TYPE_ICONS = {
    [TransactionType.INCOME]: 'fa-arrow-trend-up',
    [TransactionType.EXPENSE]: 'fa-receipt',
    [TransactionType.CREDIT]: 'fa-hand-holding-dollar',
    [TransactionType.DEBT]: 'fa-user-clock',
    [TransactionType.SAVING]: 'fa-vault'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">TRANSACTIONS</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Chronological Wealth Registry</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100">
           <button onClick={handlePrevMonth} className="w-10 h-10 rounded-2xl hover:bg-slate-50 flex items-center justify-center transition-all">
             <i className="fas fa-chevron-left text-xs text-slate-400"></i>
           </button>
           <span className="font-black text-xs uppercase tracking-widest px-4">{monthName} {viewYear}</span>
           <button onClick={handleNextMonth} className="w-10 h-10 rounded-2xl hover:bg-slate-50 flex items-center justify-center transition-all">
             <i className="fas fa-chevron-right text-xs text-slate-400"></i>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Inflow', val: monthSummary.income, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
          { label: 'Total Outflow', val: monthSummary.expense, color: 'text-red-500', bg: 'bg-red-50/50' },
          { label: 'Active Lend', val: monthSummary.lend, color: 'text-blue-500', bg: 'bg-blue-50/50' },
          { label: 'Active Borrow', val: monthSummary.borrow, color: 'text-amber-500', bg: 'bg-amber-50/50' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-[2rem] border border-white shadow-sm ${stat.bg}`}>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-lg md:text-xl font-black ${stat.color}`}>₹{stat.val.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="grid grid-cols-7 gap-2 text-center mb-6">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} className="text-[9px] font-black text-slate-300 tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3 md:gap-4">
            {calendarDays.map((day, i) => (
              <button 
                key={i} 
                disabled={!day.date} 
                onClick={() => day.fullDate && setSelectedDate(day.fullDate)} 
                className={`aspect-square rounded-2xl md:rounded-3xl flex flex-col items-center justify-center transition-all relative group
                  ${!day.date ? 'bg-transparent cursor-default' : 
                    selectedDate === day.fullDate ? 'bg-slate-900 text-white shadow-xl scale-110 z-10' : 
                    day.active ? 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-100' : 'bg-white hover:bg-slate-50 text-slate-300 border border-slate-50'}
                `}
              >
                {day.date && (
                  <>
                    <span className="text-sm font-black">{day.date}</span>
                    {day.active && (
                      <div className="absolute bottom-2 flex gap-1">
                        {day.dayIncome && <div className="w-1 h-1 rounded-full bg-emerald-500"></div>}
                        {day.dayExpense && <div className="w-1 h-1 rounded-full bg-red-500"></div>}
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col">
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-10 text-slate-400">
            {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }) : 'Registry Log'}
          </h4>
          
          <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide max-h-[500px]">
            {selectedDayData && selectedDayData.txs && selectedDayData.txs.length > 0 ? (
              selectedDayData.txs.map(t => (
                <div key={t.id} className="group p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-slate-200 transition-all relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: COLORS[t.type] }}>
                         <i className={`fas ${TYPE_ICONS[t.type]}`}></i>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm leading-tight">{t.category}</p>
                        <p className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">{t.paymentMethod} • {t.type}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className={`font-black text-sm ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-slate-900'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </p>
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEditRequest(t)} className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Edit</button>
                        <button onClick={() => setDeleteConfirmId(t.id)} className="text-[8px] font-black text-red-500 uppercase tracking-widest">Purge</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                <i className="fas fa-receipt text-3xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Zero Vectors Logged</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
           <div className="w-full max-sm bg-white rounded-[3rem] p-10 text-center shadow-2xl scale-in border border-slate-100">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <i className="fas fa-trash-alt text-3xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Expunge Vector?</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-6 leading-relaxed">
                 Warning: Permanent removal of this asset vector from the Sovereign Vault. This action cannot be decoupled.
              </p>
              <div className="mt-12 flex flex-col gap-4">
                 <button onClick={handleDelete} className="py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all active:scale-95">Execute Permanent Purge</button>
                 <button onClick={() => setDeleteConfirmId(null)} className="py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">Abort Expunge</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

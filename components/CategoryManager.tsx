
import React, { useState, useEffect } from 'react';
import { TransactionType, CustomCategory } from '../types';
import { storageService } from '../services/storageService';
import { COLORS } from '../constants';

interface CategoryManagerProps {
  userId: string;
}

const TYPE_LABELS = {
  [TransactionType.INCOME]: 'Income',
  [TransactionType.EXPENSE]: 'Expense',
  [TransactionType.CREDIT]: 'Lend',
  [TransactionType.DEBT]: 'Borrow',
  [TransactionType.SAVING]: 'Saving'
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({ userId }) => {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TransactionType>(TransactionType.EXPENSE);

  const fetchCategories = async () => {
    const data = await storageService.getCustomCategories(userId);
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, [userId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await storageService.addCustomCategory(userId, newName.trim(), newType);
    setNewName('');
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    await storageService.deleteCustomCategory(id);
    fetchCategories();
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-slate-400 font-black uppercase text-[10px] tracking-widest">Accessing Category Vault...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Category Vault</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Manage Custom Sovereign Labels</p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8">Initialize New Vector</h3>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Custom Category Name (e.g. Side Gig)" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-slate-700 transition-all"
            required
          />
          <select 
            value={newType}
            onChange={(e) => setNewType(e.target.value as TransactionType)}
            className="px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-slate-700 transition-all appearance-none"
          >
            {Object.values(TransactionType).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <button 
            type="submit" 
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl"
          >
            Deploy Category
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest ml-4">Active Sovereign Vectors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.length > 0 ? categories.map(cat => (
            <div key={cat.id} className="p-6 bg-white rounded-3xl border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-black"
                  style={{ backgroundColor: COLORS[cat.type] }}
                >
                  {TYPE_LABELS[cat.type][0]}
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm leading-none">{cat.name}</p>
                  <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">{TYPE_LABELS[cat.type]} Strategy</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(cat.id)}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
              >
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            </div>
          )) : (
            <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
              <i className="fas fa-tags text-4xl text-slate-200 mb-4"></i>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Zero Custom Categories Defined</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

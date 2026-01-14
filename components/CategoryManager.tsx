
import React, { useState, useEffect } from 'react';
import { TransactionType, CustomCategory, CustomChannel } from '../types';
import { storageService } from '../services/storageService';
import { COLORS } from '../constants';

interface CategoryManagerProps {
  userId: string;
}

const TYPE_LABELS = {
  [TransactionType.INCOME]: 'Income',
  [TransactionType.EXPENSE]: 'Expense',
  [TransactionType.CREDIT]: 'Lend',
  [TransactionType.DEBT]: 'Debt',
  [TransactionType.SAVING]: 'Saving'
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'CHANNELS'>('CATEGORIES');
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [channels, setChannels] = useState<CustomChannel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [isAdding, setIsAdding] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Delete Confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  const fetchData = async () => {
    try {
      const [cats, chans] = await Promise.all([
        storageService.getCustomCategories(userId),
        storageService.getCustomChannels(userId)
      ]);
      setCategories(cats);
      setChannels(chans);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsAdding(true);
    if (activeTab === 'CATEGORIES') {
      await storageService.addCustomCategory(userId, newName.trim(), newType);
    } else {
      await storageService.addCustomChannel(userId, newName.trim());
    }
    setNewName('');
    await fetchData();
    setIsAdding(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    if (activeTab === 'CATEGORIES') {
      await storageService.updateCustomCategory(id, { name: editName.trim() });
    } else {
      await storageService.updateCustomChannel(id, { name: editName.trim() });
    }
    setEditingId(null);
    await fetchData();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    if (activeTab === 'CATEGORIES') {
      setCategories(prev => prev.filter(c => c.id !== id));
      await storageService.deleteCustomCategory(id);
    } else {
      setChannels(prev => prev.filter(c => c.id !== id));
      await storageService.deleteCustomChannel(id);
    }
    setDeleteTarget(null);
    await fetchData();
  };

  if (loading) return (
    <div className="py-40 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Vector Registry...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in font-['Inter'] pb-32 px-4 md:px-0">
      {/* Registry Terminal Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-slate-100 pb-10">
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">REGISTRY <span className="text-blue-600">VAULT</span></h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-4">Personalize Sovereign Asset Vectors</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto shadow-inner">
          <button 
            onClick={() => setActiveTab('CATEGORIES')} 
            className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CATEGORIES' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400'}`}
          >
            Vector List
          </button>
          <button 
            onClick={() => setActiveTab('CHANNELS')} 
            className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CHANNELS' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400'}`}
          >
            Channel Hub
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
        {/* Management Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-slate-900 text-white p-10 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-600/20 transition-all duration-700"></div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-10 relative z-10">NEW <span className="text-blue-400">VECTOR</span></h3>
            
            <form onSubmit={handleAdd} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Label Name</label>
                <input 
                  type="text" 
                  placeholder="Registry Identity..." 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-400 focus:bg-white/10 text-white font-bold text-sm transition-all placeholder:text-white/20"
                  required
                />
              </div>

              {activeTab === 'CATEGORIES' && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Modality</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.CREDIT, TransactionType.DEBT].map(t => (
                      <button
                        key={t} type="button" onClick={() => setNewType(t)}
                        className={`px-4 py-3 rounded-xl border text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                          newType === t 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[t] }}></div>
                        {TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={isAdding} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-50 transition-all active:scale-[0.98] mt-4">
                {isAdding ? 'COMMITTING...' : 'COMMIT TO VAULT'}
              </button>
            </form>
          </div>
        </div>

        {/* Registry Log Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Active Registry Definitions</h3>
            <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[8px] font-black uppercase">
              {(activeTab === 'CATEGORIES' ? categories : channels).length} Entries
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeTab === 'CATEGORIES' ? categories : channels).map(item => (
              <div key={item.id} className="group bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between transition-all hover:shadow-xl hover:-translate-y-1">
                {editingId === item.id ? (
                  <div className="flex gap-3 w-full animate-fade-in">
                    <input 
                      type="text" 
                      autoFocus
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      className="flex-1 bg-slate-50 px-5 py-3 rounded-xl text-xs font-black outline-none border-2 border-blue-500 transition-all" 
                    />
                    <button onClick={() => handleUpdate(item.id)} className="px-5 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg">Commit</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                        <i className={`fas ${activeTab === 'CATEGORIES' ? 'fa-tag' : 'fa-credit-card'} text-xs md:text-sm`}></i>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{item.name}</p>
                        {activeTab === 'CATEGORIES' && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[(item as CustomCategory).type] }}></div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{TYPE_LABELS[(item as CustomCategory).type]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button onClick={() => {setEditingId(item.id); setEditName(item.name);}} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-all border border-transparent hover:border-slate-200">
                        <i className="fas fa-pen text-[10px]"></i>
                      </button>
                      <button onClick={() => setDeleteTarget({id: item.id, name: item.name})} className="w-10 h-10 rounded-xl bg-red-50 text-red-400 hover:text-white hover:bg-red-500 flex items-center justify-center transition-all">
                        <i className="fas fa-trash-alt text-[10px]"></i>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {(activeTab === 'CATEGORIES' ? categories : channels).length === 0 && (
              <div className="col-span-full py-32 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] animate-pulse">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm">
                  <i className="fas fa-folder-open text-2xl"></i>
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Registry Partition Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Override Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[3rem] md:rounded-[4rem] p-10 md:p-14 text-center border border-white/20 animate-scale-in shadow-2xl">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner border border-red-100">
              <i className="fas fa-biohazard text-4xl"></i>
            </div>
            <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">PURGE VECTOR?</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-8 leading-relaxed">
              Permanent expunge of <span className="text-slate-900 font-black">"{deleteTarget.name}"</span> from the global registry core. This action is terminal.
            </p>
            <div className="mt-12 flex flex-col gap-4">
              <button onClick={executeDelete} className="w-full py-5 md:py-6 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-red-700 transition-all active:scale-95">EXECUTE PERMANENT PURGE</button>
              <button onClick={() => setDeleteTarget(null)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">ABORT OPERATION</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { storageService } from './services/storageService';
import { User, Transaction, TransactionType, VaultTier, PaymentMethod } from './types';
import { ADMIN_EMAIL, ADMIN_PASSWORD, COLORS } from './constants';
import { DailyTrend, CategoryPie } from './components/Charts';
import { TransactionForm } from './components/TransactionForm';
import { AdminPanel } from './components/AdminPanel';
import { Donation } from './components/Donation';
import { Profile } from './components/Profile';
import { Leaderboard } from './components/Leaderboard';
import { AIAdvisor } from './components/AIAdvisor';
import { DebtControl } from './components/DebtControl';
import { SavingsMission } from './components/SavingsMission';
import { CreditAnalysis } from './components/CreditAnalysis';
import { TransactionHistory } from './components/TransactionHistory';
import { CategoryManager } from './components/CategoryManager';

// --- Auth Component ---
const Auth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const adminUser = await storageService.getUserByEmail(ADMIN_EMAIL);
        if (adminUser) {
          storageService.saveSession(adminUser);
          onLogin(adminUser);
          return;
        }
      }
      const user = await storageService.getUserByEmail(email);
      if (isRegister) {
        if (user) setError('Email already registered.');
        else {
          const newUser = await storageService.createUser(email, name || email.split('@')[0], password);
          storageService.saveSession(newUser);
          onLogin(newUser);
        }
      } else {
        if (!user) setError('No account found.');
        else if (user.password && user.password !== password) setError('Incorrect password.');
        else {
          storageService.saveSession(user);
          onLogin(user);
        }
      }
    } catch (err) {
      setError("Vault initialization failed. Check your Supabase connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-6 font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-10 border border-white/10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-6 shadow-xl shadow-slate-900/30">
            <i className="fas fa-vault text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">FinTrack Sovereign</h1>
          <p className="text-blue-600 mt-2 font-black uppercase text-[9px] tracking-[0.3em]">Advanced Wealth Discipline Terminal</p>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-black rounded-2xl border-l-4 border-red-500">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && <input type="text" required placeholder="Sovereign Identity" value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 outline-none font-bold text-sm" />}
          <input type="email" required placeholder="Verified Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 outline-none font-bold text-sm" />
          <input type="password" required placeholder="Access Key" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 outline-none font-bold text-sm" />
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs hover:bg-black">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : (isRegister ? 'Initialize Vault' : 'Decrypt Assets')}
          </button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">{isRegister ? 'Existing Member? Access Now' : 'Join the Global Sovereign Elite'}</button>
      </div>
    </div>
  );
};

const LogoutModal: React.FC<{ isOpen: boolean; onConfirm: () => void; onCancel: () => void }> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 p-8 md:p-10 scale-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <i className="fas fa-power-off text-2xl"></i>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Terminate Session?</h3>
        </div>
        <div className="mt-8 space-y-3">
          <button onClick={onConfirm} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-red-600 transition-all">Confirm Termination</button>
          <button onClick={onCancel} className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:text-slate-900 transition-all">Stay Secure</button>
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void; user: User; onLogoutClick: () => void }> = ({ isOpen, onClose, user, onLogoutClick }) => {
  const location = useLocation();
  const isAdmin = user.email === ADMIN_EMAIL;
  const TIER_COLORS = { [VaultTier.COPPER]: 'from-orange-400 to-orange-600', [VaultTier.SILVER]: 'from-slate-300 to-slate-500', [VaultTier.GOLD]: 'from-amber-300 to-amber-600', [VaultTier.PLATINUM]: 'from-cyan-300 to-blue-500', [VaultTier.DIAMOND]: 'from-indigo-400 to-purple-600' };
  
  const menuCategories = useMemo(() => isAdmin ? [
    { title: 'ADMINISTRATION CORE', items: [{ name: 'Admin Console', path: '/admin', icon: 'fa-user-shield' }, { name: 'Assets Overview', path: '/', icon: 'fa-layer-group' }] }
  ] : [
    { title: 'STRATEGIC CORE', items: [{ name: 'Assets Overview', path: '/', icon: 'fa-layer-group' }] }, 
    { title: 'WEALTH OPTIMIZATION', items: [
      { name: 'Asset History', path: '/history', icon: 'fa-clock-rotate-left' },
      { name: 'Money Lend', path: '/credit', icon: 'fa-indian-rupee-sign' }, 
      { name: 'Money Borrow', path: '/debt', icon: 'fa-user-clock' }, 
      { name: 'Savings Missions', path: '/savings', icon: 'fa-vault' }
    ] }, 
    { title: 'ELITE PROGRESSION', items: [
      { name: 'Global Ranks', path: '/leaderboard', icon: 'fa-trophy' }, 
      { name: 'Identity Settings', path: '/profile', icon: 'fa-user-gear' }, 
      { name: 'Support', path: '/support', icon: 'fa-heart' }
    ] }
  ], [isAdmin]);

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
      <div className={`fixed top-0 left-0 bottom-0 w-full max-w-[320px] bg-slate-950 text-white z-[210] shadow-2xl transition-transform duration-500 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-8">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${TIER_COLORS[user.tier]} rounded-2xl flex items-center justify-center shadow-lg shadow-black/50`}><i className="fas fa-crown text-white"></i></div>
              <div><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{user.tier}</p><p className="text-xl font-black">{user.name}</p></div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
          </div>
          <div className="flex-1 space-y-10 overflow-y-auto scrollbar-hide">
            {menuCategories.map((cat, idx) => (
              <div key={idx}>
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">{cat.title}</h3>
                <div className="space-y-2">
                  {cat.items.map((item, i) => (
                    <Link key={i} to={item.path} onClick={onClose} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                      <i className={`fas ${item.icon} w-5 text-center`}></i><span className="font-bold text-sm">{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={onLogoutClick} className="mt-8 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-white transition-all">Terminate Session</button>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formInitialType, setFormInitialType] = useState<TransactionType | undefined>(undefined);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => { 
    storageService.getSavedSession().then(u => { 
      if (u) setCurrentUser(u); 
      setLoading(false); 
    }); 
    
    // Periodically check connection
    const checkConn = async () => {
      const ok = await storageService.checkConnection();
      setIsConnected(ok);
    };
    checkConn();
    const interval = setInterval(checkConn, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const refreshData = async () => {
    if (!currentUser) return;
    
    // Re-verify connection on refresh
    const ok = await storageService.checkConnection();
    setIsConnected(ok);

    const [txs, allUsers] = await Promise.all([
      storageService.getTransactions(currentUser.email === ADMIN_EMAIL ? undefined : currentUser.id),
      storageService.getAllUsers()
    ]);
    setTransactions(txs);
    setUsers(allUsers);
    
    const fresh = await storageService.getUserByEmail(currentUser.email);
    if (fresh) setCurrentUser(fresh);
  };

  useEffect(() => { if (currentUser) refreshData(); }, [currentUser?.id]);

  const handleAdd = async (tx: any) => { 
    if (!currentUser) return; 
    try {
      await storageService.addTransaction(currentUser.id, tx); 
      await refreshData(); 
      setShowForm(false); 
    } catch (err) {
      alert("Storage Error: Local backup successful, but Cloud Sync failed. Verify your Supabase configuration.");
    }
  };
  
  const triggerForm = (type?: TransactionType) => { setFormInitialType(type); setShowForm(true); };

  const { netBalance, channelBalances } = useMemo(() => {
    const balances = {
      [PaymentMethod.SAVING]: 0,
      [PaymentMethod.ONLINE]: 0,
      [PaymentMethod.WALLET]: 0
    };

    transactions.forEach(t => {
      let delta = 0;
      switch (t.type) {
        case TransactionType.INCOME: delta = t.amount; break;
        case TransactionType.EXPENSE: delta = -t.amount; break;
        case TransactionType.SAVING: delta = -t.amount; break;
        case TransactionType.CREDIT: 
          delta = t.resolved ? 0 : -t.amount; 
          break;
        case TransactionType.DEBT:
          delta = t.resolved ? 0 : t.amount;
          break;
      }
      if (t.paymentMethod in balances) {
        balances[t.paymentMethod as keyof typeof balances] += delta;
      }
    });

    const total = Object.values(balances).reduce((a, b) => a + b, 0);
    return { netBalance: total, channelBalances: balances };
  }, [transactions]);

  const TYPE_ICONS = {
    [TransactionType.INCOME]: 'fa-arrow-trend-up',
    [TransactionType.EXPENSE]: 'fa-receipt',
    [TransactionType.CREDIT]: 'fa-indian-rupee-sign',
    [TransactionType.DEBT]: 'fa-user-clock',
    [TransactionType.SAVING]: 'fa-vault'
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-10"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div><p className="font-black text-[10px] tracking-[0.5em] uppercase animate-pulse">Synchronizing Vectors</p></div>;
  if (!currentUser) return <Auth onLogin={setCurrentUser} />;

  const DashboardHub = (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Command Hub</h2>
          <div className="flex items-center gap-3 mt-3">
             <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] bg-slate-100 inline-block px-3 py-1 rounded-full border border-slate-200">{currentUser.tier} ELITE STATUS • MASTER SESSION ACTIVE</p>
             <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
               {isConnected ? 'Sync Online' : 'Sync Offline'}
             </div>
          </div>
        </div>
        <button onClick={() => triggerForm()} className="w-full lg:w-auto bg-blue-600 text-white font-black px-10 py-5 rounded-[2rem] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3">
          <i className="fas fa-plus-circle"></i> New Asset Entry
        </button>
      </div>
      
      <AIAdvisor user={currentUser} transactions={transactions} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-wallet text-6xl"></i></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Net Liquidity</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{netBalance.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-bolt text-6xl"></i></div>
          <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-3">Discipline Streak</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{currentUser.streak} Days</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-coins text-6xl"></i></div>
          <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-3">Vault Coins</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{currentUser.coins.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(channelBalances).map(([method, bal]) => (
          <div key={method} className="bg-slate-900 p-6 rounded-3xl border border-white/5 flex justify-between items-center group hover:bg-slate-800 transition-all cursor-default">
            <div>
              <p className="text-blue-400 text-[8px] font-black uppercase tracking-widest mb-1">{method} Channel</p>
              <p className="text-xl font-black text-white">₹{bal.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
               <i className={`fas ${method === 'SAVING' ? 'fa-vault' : method === 'ONLINE' ? 'fa-globe' : 'fa-wallet'} text-xs`}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-10 border-l-4 border-blue-600 pl-4">Wealth Projection</h4>
          <DailyTrend transactions={transactions} />
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-10 border-l-4 border-emerald-500 pl-4">Asset Allocation</h4>
          <CategoryPie transactions={transactions} />
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Recent Sovereign Activity</h4>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-full">Ledger Synchronized</span>
        </div>
        <div className="space-y-4">
          {transactions.slice(0, 10).map((tx) => (
            <div key={tx.id} className="group p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-3xl flex justify-between items-center transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-6">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: COLORS[tx.type] }}
                >
                  <i className={`fas ${TYPE_ICONS[tx.type]} text-xs`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-slate-900 text-lg leading-none">{tx.category}</p>
                    {tx.resolved && (
                      <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">Settled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(tx.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </p>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{tx.paymentMethod}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p 
                  className="text-xl font-black tracking-tight transition-colors"
                  style={{ color: (tx.type === TransactionType.INCOME || (tx.type === TransactionType.CREDIT && tx.resolved)) ? '#10b981' : '#1e293b' }}
                >
                  {(tx.type === TransactionType.INCOME || (tx.type === TransactionType.DEBT && !tx.resolved)) ? '+' : '-'}₹{tx.amount.toLocaleString()}
                </p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 group-hover:text-blue-500 transition-colors">Transaction Vector</p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
               <i className="fas fa-receipt text-4xl text-slate-200 mb-4 animate-pulse"></i>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Activity Logged in Vault</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Router>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={currentUser} onLogoutClick={() => setShowLogoutConfirm(true)} />
      <div className="min-h-screen bg-slate-50">
        <nav className="glass-effect border-b border-slate-100 sticky top-0 z-[150] h-20 flex justify-between items-center px-6">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"><i className="fas fa-bars-staggered"></i></button>
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-all">
                <i className="fas fa-shield-halved"></i>
              </div>
              <span className="font-black text-slate-900 text-xl tracking-tighter hidden sm:inline group-hover:text-blue-600 transition-colors">FinTrack</span>
            </Link>
            <Link to="/profile" className="flex items-center gap-3 group">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{currentUser.streak}🔥 Streak</p>
                <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{currentUser.name}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-sm font-black shadow-xl group-hover:bg-blue-600 transition-all border-2 border-transparent group-hover:border-white">{currentUser.name[0]}</div>
            </Link>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-12">
          <Routes>
            <Route path="/" element={DashboardHub} />
            <Route path="/debt" element={<DebtControl transactions={transactions} onAddRequest={triggerForm} onRefresh={refreshData} />} />
            <Route path="/credit" element={<CreditAnalysis transactions={transactions} onAddRequest={triggerForm} onRefresh={refreshData} />} />
            <Route path="/savings" element={<SavingsMission transactions={transactions} onAddRequest={triggerForm} userId={currentUser.id} />} />
            <Route path="/history" element={<TransactionHistory transactions={transactions} />} />
            <Route path="/categories" element={<CategoryManager userId={currentUser.id} />} />
            <Route path="/leaderboard" element={<Leaderboard users={users} currentUser={currentUser} />} />
            <Route path="/profile" element={<Profile user={currentUser} transactions={transactions} onUpdate={setCurrentUser} />} />
            <Route path="/admin" element={currentUser.email === ADMIN_EMAIL ? <AdminPanel users={users} transactions={transactions} /> : <Navigate to="/" />} />
            <Route path="/support" element={<Donation />} />
          </Routes>
        </main>
        {showForm && <TransactionForm onAdd={handleAdd} onClose={() => setShowForm(false)} initialType={formInitialType} userId={currentUser.id} />}
        <LogoutModal isOpen={showLogoutConfirm} onConfirm={() => { storageService.logout(); setCurrentUser(null); setShowLogoutConfirm(false); }} onCancel={() => setShowLogoutConfirm(false)} />
      </div>
    </Router>
  );
};
export default App;
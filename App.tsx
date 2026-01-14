import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { storageService } from './services/storageService';
import { audioService } from './services/audioService';
import { User, Transaction, TransactionType, SovereignEvent } from './types';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './constants';
import { DailyTrend, TopSpendingChart } from './components/Charts';
import { TransactionForm } from './components/TransactionForm';
import { AdminPanel } from './components/AdminPanel';
import { Donation } from './components/Donation';
import { Profile } from './components/Profile';
import { Leaderboard } from './components/Leaderboard';
import { AIChat } from './components/AIChat';
import { DebtControl } from './components/DebtControl';
import { SavingsMission } from './components/SavingsMission';
import { CreditAnalysis } from './components/CreditAnalysis';
import { BudgetCenter } from './components/BudgetCenter';
import { TransactionHistory } from './components/TransactionHistory';
import { EventOverlay } from './components/EventOverlay';

const Auth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const VERIFIED_DOMAINS = ['@gmail.com', '@outlook.com', '@icloud.com', '@proton.me', '@yahoo.com'];

  const isEmailValid = useMemo(() => {
    const regex = /^[a-zA-Z0-9._%+-]+@(gmail|outlook|hotmail|yahoo|icloud|protonmail|me|proton)\.(com|me)$/;
    return regex.test(email.toLowerCase());
  }, [email]);

  const isPasswordValid = useMemo(() => {
    return password.length >= 6;
  }, [password]);

  const canRegister = useMemo(() => {
    return isEmailValid && isPasswordValid && name.trim().length >= 3;
  }, [isEmailValid, isPasswordValid, name]);

  const handleDomainSelect = (domain: string) => {
    audioService.playClick();
    const currentVal = email.split('@')[0];
    setEmail(currentVal + domain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    audioService.playClick();
    setLoading(true);
    setError('');
    const targetEmail = email.trim().toLowerCase();
    try {
      if (targetEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const adminUser = await storageService.getUserByEmail(ADMIN_EMAIL);
        if (adminUser) {
          storageService.saveSession(adminUser);
          audioService.playSuccess();
          onLogin(adminUser);
          return;
        }
      }
      const user = await storageService.getUserByEmail(targetEmail);
      if (isRegister) {
        if (!isEmailValid) {
          setError('Restricted Identity Vector. Please use a verified domain (Gmail/Outlook).');
          setLoading(false);
          return;
        }
        if (!isPasswordValid) {
          setError('Security Constraint: Access Key must be at least 6 characters.');
          setLoading(false);
          return;
        }
        if (user) {
          setError('Identity vector already exists in the registry.');
        } else {
          const parsedAge = age ? parseInt(age) : undefined;
          const newUser = await storageService.createUser(
            targetEmail, 
            name.trim() || targetEmail.split('@')[0], 
            password,
            isNaN(parsedAge as any) ? undefined : parsedAge,
            gender || undefined
          );
          storageService.saveSession(newUser);
          audioService.playSuccess();
          onLogin(newUser);
        }
      } else {
        if (!user) {
          setError('Vault access denied. Identity not found.');
        } else if (user.password && user.password !== password) {
          setError('Invalid Access Key authorization.');
        } else {
          storageService.saveSession(user);
          audioService.playSuccess();
          onLogin(user);
        }
      }
    } catch (err: any) {
      setError(err.message || "Terminal Sync Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-['Inter'] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12 border border-slate-100 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform rotate-3">
            <i className="fas fa-shield-halved text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">SOVEREIGN <span className="text-blue-600">VAULT</span></h1>
          <p className="text-slate-400 mt-3 font-black uppercase text-[9px] tracking-[0.3em]">{isRegister ? 'New Identity Registry' : 'Authentication Hub'}</p>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-[10px] font-black rounded-xl border-l-4 border-red-500 uppercase tracking-widest flex items-center gap-3 animate-fade-in">
            <i className="fas fa-triangle-exclamation text-sm"></i>
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input type="text" required placeholder="Display Name (Min 3 chars)" value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-sm outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm" />
          )}
          <div className="relative">
            <input type="email" required placeholder="Email Address (e.g. user@gmail.com)" value={email} onChange={e => setEmail(e.target.value.toLowerCase().replace(/\s/g, ''))} className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold text-sm outline-none transition-all ${isRegister ? (email ? (isEmailValid ? 'border-emerald-500' : 'border-red-500') : 'border-transparent') : 'border-transparent focus:border-blue-600'} focus:bg-white shadow-sm`} />
            {isRegister && email && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <i className={`fas ${isEmailValid ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-red-500'} text-[10px]`}></i>
              </div>
            )}
          </div>
          {isRegister && (
            <div className="flex flex-wrap gap-2 px-1">
              {VERIFIED_DOMAINS.map(domain => (
                <button key={domain} type="button" onClick={() => handleDomainSelect(domain)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-black text-slate-500 rounded-lg uppercase tracking-widest transition-colors border border-slate-200">{domain}</button>
              ))}
            </div>
          )}
          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-sm outline-none focus:border-blue-600 transition-all shadow-sm" />
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-sm outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer">
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
          <div className="relative">
            <input type="password" required placeholder={isRegister ? "Access Key (Min 6 chars)" : "Access Key"} value={password} onChange={e => setPassword(e.target.value)} className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold text-sm outline-none transition-all ${isRegister && password ? (isPasswordValid ? 'border-emerald-500 focus:border-emerald-500' : 'border-red-500 focus:border-red-500') : 'border-transparent focus:border-blue-600'} focus:bg-white shadow-sm`} />
            {isRegister && password && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <i className={`fas ${isPasswordValid ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-red-500'} text-[10px]`}></i>
              </div>
            )}
          </div>
          <button type="submit" disabled={loading || (isRegister && !canRegister)} className={`w-full text-white font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px] mt-2 ${isRegister && !canRegister ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-black'}`}>
            {loading ? <span className="flex items-center justify-center gap-2"><i className="fas fa-circle-notch fa-spin"></i> Syncing...</span> : (isRegister ? 'Initialize Identity' : 'Vault Access')}
          </button>
        </form>
        <button onClick={() => { audioService.playClick(); setIsRegister(!isRegister); setError(''); setEmail(''); setPassword(''); setName('');}} className="w-full mt-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] hover:text-blue-600 transition-colors">
          {isRegister ? 'Return to Access Gate' : 'New Identity? Request Registry'}
        </button>
      </div>
    </div>
  );
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void; user: User; onLogoutRequest: () => void }> = ({ isOpen, onClose, user, onLogoutRequest }) => {
  const location = useLocation();
  const isAdmin = user.email === ADMIN_EMAIL;
  const menuItems = isAdmin ? [
    { path: '/admin', icon: 'fa-user-shield', label: 'Admin Panel' }
  ] : [
    { path: '/', icon: 'fa-house', label: 'Dashboard' },
    { path: '/history', icon: 'fa-list-ul', label: 'History' },
    { path: '/budgets', icon: 'fa-chart-pie', label: 'Budgets' },
    { path: '/debt', icon: 'fa-hand-holding-dollar', label: 'Debt' },
    { path: '/credit', icon: 'fa-hand-holding-heart', label: 'Credit' },
    { path: '/savings', icon: 'fa-bullseye', label: 'Set Goal' },
    { path: '/leaderboard', icon: 'fa-trophy', label: 'Ranks' },
    { path: '/profile', icon: 'fa-user-gear', label: 'Profile' },
    { path: '/support', icon: 'fa-circle-dollar-to-slot', label: 'Support' },
  ];
  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => { audioService.playClick(); onClose(); }} />
      <aside className={`fixed top-0 left-0 bottom-0 w-[260px] bg-white z-[1001] shadow-2xl transition-transform duration-300 ease-out border-r border-slate-100 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className={`w-10 h-10 rounded-xl ${isAdmin ? 'bg-blue-600' : 'bg-slate-800'} text-white flex items-center justify-center font-black text-xs uppercase shadow-md`}>
              {isAdmin ? <i className="fas fa-crown text-[10px]"></i> : user.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-slate-900 uppercase truncate leading-none mb-1">{isAdmin ? 'Administrator' : user.name}</p>
              <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{isAdmin ? 'ROOT LEVEL' : user.tier}</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map((item, i) => (
            <Link key={i} to={item.path} onClick={() => { audioService.playClick(); onClose(); }} className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all ${location.pathname === item.path ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <i className={`fas ${item.icon} text-xs`}></i>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            </Link>
          ))}
          <button onClick={() => { audioService.playClick(); onLogoutRequest(); }} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-red-500 hover:bg-red-50 transition-all mt-4 group">
            <i className="fas fa-power-off text-xs group-hover:rotate-90 transition-transform"></i>
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<SovereignEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialCategory, setInitialCategory] = useState<string | undefined>(undefined);
  const [initialType, setInitialType] = useState<TransactionType | undefined>(undefined);
  const [isBgmOn, setIsBgmOn] = useState(false);
  
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const refreshData = async () => {
    if (!currentUser) return;
    try {
      const [txs, allUsers, allEvents, fresh] = await Promise.all([
        storageService.getTransactions(currentUser.id),
        storageService.getAllUsers(),
        storageService.getEvents(),
        storageService.getUserByEmail(currentUser.email)
      ]);
      setTransactions(txs);
      setUsers(allUsers);
      setEvents(allEvents);
      if (fresh) setCurrentUser(fresh);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    storageService.getSavedSession().then(u => {
      if (u) setCurrentUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (currentUser) refreshData(); }, [currentUser?.id]);

  const handleEditRequest = (tx: Transaction) => {
    audioService.playClick();
    setEditingTransaction(tx);
    setInitialCategory(undefined);
    setInitialType(undefined);
    setShowForm(true);
  };

  const handleBgmToggle = () => {
    audioService.playClick();
    const playing = audioService.toggleBGM();
    setIsBgmOn(playing);
  };

  const netLiquidity = useMemo(() => {
    return transactions.reduce((acc: number, t: Transaction): number => {
      const amountValue = Number(t.amount) || 0;
      const currentAcc = Number(acc) || 0;
      switch (t.type) {
        case TransactionType.INCOME: return currentAcc + amountValue;
        case TransactionType.EXPENSE:
        case TransactionType.SAVING: return currentAcc - amountValue;
        case TransactionType.CREDIT: return t.resolved ? currentAcc : currentAcc - amountValue;
        case TransactionType.DEBT: return t.resolved ? currentAcc : currentAcc + amountValue;
        default: return currentAcc;
      }
    }, 0);
  }, [transactions]);

  const topSpendingData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const grouped = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount: Number(amount) }))
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  }, [transactions]);

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!currentUser) return <Auth onLogin={setCurrentUser} />;

  return (
    <Router>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Inter']">
        <header className="sticky top-0 bg-white/90 backdrop-blur-md z-[900] border-b border-slate-100 px-6 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => { audioService.playClick(); setIsMenuOpen(true); }} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
              <i className="fas fa-bars text-xs"></i>
            </button>
            <button onClick={handleBgmToggle} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isBgmOn ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
              <i className={`fas ${isBgmOn ? 'fa-volume-high' : 'fa-volume-xmark'} text-[10px]`}></i>
            </button>
          </div>
          <div className="flex items-center gap-3">
             {!isAdmin && (
               <>
                 <div className="bg-orange-50 px-4 py-2 rounded-xl text-[9px] font-black text-orange-600 border border-orange-100 flex items-center gap-1">{currentUser.streak}🔥</div>
                 <div className="bg-amber-50 px-4 py-2 rounded-xl text-[9px] font-black text-amber-600 border border-amber-100 flex items-center gap-1.5"><i className="fas fa-coins text-amber-500"></i><span>{(currentUser.coins || 0).toLocaleString()}</span></div>
                 <button onClick={() => { audioService.playClick(); setEditingTransaction(null); setInitialCategory(undefined); setInitialType(undefined); setShowForm(true); }} className="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition-all"><i className="fas fa-plus"></i></button>
               </>
             )}
             {isAdmin && <div className="bg-blue-50 px-4 py-2 rounded-xl text-[9px] font-black text-blue-600 border border-blue-100 flex items-center gap-2"><i className="fas fa-user-shield"></i><span>ADMIN MODE</span></div>}
          </div>
        </header>
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={currentUser} onLogoutRequest={() => setShowLogoutConfirm(true)} />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={isAdmin ? <Navigate to="/admin" /> : (
              <div className="space-y-10">
                <div className="flex justify-between items-end">
                  <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">CORE <span className="text-blue-600">HUB</span></h1>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>LIQUIDITY: ₹{netLiquidity.toLocaleString()}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[300px]"><h4 className="text-[9px] font-black uppercase text-slate-400 mb-8 tracking-widest">Trend</h4><DailyTrend transactions={transactions} /></div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col"><h4 className="text-[9px] font-black uppercase text-slate-400 mb-8 tracking-widest">Consumption</h4><TopSpendingChart data={topSpendingData} /></div>
                </div>
              </div>
            )} />
            <Route path="/history" element={!isAdmin ? <TransactionHistory transactions={transactions} onRefresh={refreshData} onEditRequest={handleEditRequest} /> : <Navigate to="/admin" />} />
            <Route path="/credit" element={!isAdmin ? <CreditAnalysis transactions={transactions} onAddRequest={() => { audioService.playClick(); setEditingTransaction(null); setInitialType(TransactionType.CREDIT); setInitialCategory(undefined); setShowForm(true); }} onRefresh={refreshData} onEditRequest={handleEditRequest} /> : <Navigate to="/admin" />} />
            <Route path="/debt" element={!isAdmin ? <DebtControl transactions={transactions} onAddRequest={() => { audioService.playClick(); setEditingTransaction(null); setInitialType(TransactionType.DEBT); setInitialCategory(undefined); setShowForm(true); }} onRefresh={refreshData} onEditRequest={handleEditRequest} /> : <Navigate to="/admin" />} />
            <Route path="/savings" element={!isAdmin ? <SavingsMission transactions={transactions} onAddRequest={(type, cat) => { audioService.playClick(); setEditingTransaction(null); setInitialType(type); setInitialCategory(cat); setShowForm(true); }} onRefresh={refreshData} userId={currentUser.id} /> : <Navigate to="/admin" />} />
            <Route path="/budgets" element={!isAdmin ? <BudgetCenter transactions={transactions} userId={currentUser.id} onRefresh={refreshData} /> : <Navigate to="/admin" />} />
            <Route path="/leaderboard" element={!isAdmin ? <Leaderboard users={users} currentUser={currentUser} /> : <Navigate to="/admin" />} />
            <Route path="/profile" element={!isAdmin ? <Profile user={currentUser} transactions={transactions} onUpdate={setCurrentUser} /> : <Navigate to="/admin" />} />
            <Route path="/support" element={!isAdmin ? <Donation /> : <Navigate to="/admin" />} />
            {isAdmin && <Route path="/admin" element={<AdminPanel users={users} transactions={transactions} onRefresh={refreshData} />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        {!isAdmin && <AIChat user={currentUser} transactions={transactions} />}
        {!isAdmin && <EventOverlay events={events} />}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
            <div className="w-full max-sm bg-white rounded-[2.5rem] p-10 text-center shadow-2xl">
               <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><i className="fas fa-power-off text-2xl"></i></div>
               <h3 className="text-xl font-black text-slate-900 uppercase mb-4 tracking-tight">Logout?</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-8">Confirming termination of the current session vector.</p>
               <div className="flex flex-col gap-3">
                  <button onClick={() => { audioService.playClick(); storageService.logout(); setCurrentUser(null); setShowLogoutConfirm(false); }} className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Confirm Termination</button>
                  <button onClick={() => { audioService.playClick(); setShowLogoutConfirm(false); }} className="w-full py-4 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900">Abort</button>
               </div>
            </div>
          </div>
        )}
        {showForm && !isAdmin && (
          <TransactionForm 
            userId={currentUser.id} 
            editingTransaction={editingTransaction}
            initialCategory={initialCategory}
            initialType={initialType}
            onSubmit={async (t) => { 
              audioService.playCoin();
              if (editingTransaction) {
                await storageService.updateTransaction(editingTransaction.id, t);
              } else {
                await storageService.addTransaction(currentUser.id, t);
              }
              await refreshData(); 
              setShowForm(false);
              setEditingTransaction(null);
              setInitialCategory(undefined);
              setInitialType(undefined);
            } } 
            onClose={() => { audioService.playClick(); setShowForm(false); setEditingTransaction(null); setInitialCategory(undefined); setInitialType(undefined); }} 
          />
        )}
      </div>
    </Router>
  );
};

export default App;
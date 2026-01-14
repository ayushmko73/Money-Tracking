
import { User, Transaction, TransactionType, VaultTier, Goal, Budget, SovereignEvent, CustomCategory, CustomChannel, RecurringTransaction } from '../types';
import { supabase } from './supabaseClient';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../constants';

const SESSION_KEY = 'FINTRACK_SOVEREIGN_SESSION_PERMANENT';

// Local Storage Keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'SOVEREIGN_DATA_TRANSACTIONS',
  GOALS: 'SOVEREIGN_DATA_GOALS',
  BUDGETS: 'SOVEREIGN_DATA_BUDGETS',
  CUSTOM_CATEGORIES: 'SOVEREIGN_DATA_CATEGORIES',
  CUSTOM_CHANNELS: 'SOVEREIGN_DATA_CHANNELS',
  RECURRING: 'SOVEREIGN_DATA_RECURRING'
};

const calculateTier = (coins: number): VaultTier => {
  if (coins >= 5000) return VaultTier.DIAMOND;
  if (coins >= 2500) return VaultTier.PLATINUM;
  if (coins >= 1000) return VaultTier.GOLD;
  if (coins >= 500) return VaultTier.SILVER;
  return VaultTier.COPPER;
};

const getKolkataDate = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

// Generic Local Helper
const getLocal = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setLocal = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storageService = {
  // --- AUTH & SESSION (Remains on Supabase/Local Mix) ---
  saveSession: (user: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, ts: Date.now() }));
  },

  getSavedSession: async (): Promise<User | null> => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    try {
      const { email } = JSON.parse(sessionStr);
      return await storageService.getUserByEmail(email);
    } catch { return null; }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    if (email === ADMIN_EMAIL) {
      const { data: adminExists } = await supabase.from('users').select('*').eq('email', ADMIN_EMAIL).maybeSingle();
      if (!adminExists) {
        const adminUser = {
          id: crypto.randomUUID(), email: ADMIN_EMAIL, name: 'Administrator', password: ADMIN_PASSWORD,
          coins: 1000, streak: 0, lastEntryDate: null, createdAt: new Date().toISOString(), tier: VaultTier.GOLD
        };
        await supabase.from('users').insert(adminUser);
        return adminUser as User;
      }
      return adminExists as User;
    }

    const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (error) {
      console.error("User fetch failure:", error);
      return null;
    }
    return data as User;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User | null> => {
    const { data: existing, error: fetchErr } = await supabase.from('users').select('*').eq('id', userId).single();
    if (fetchErr) return null;

    const currentCoins = updates.coins !== undefined ? updates.coins : (existing?.coins || 0);
    const tier = calculateTier(currentCoins);
    
    const payload: any = { 
      ...existing, 
      ...updates, 
      tier,
      age: updates.age !== undefined ? (updates.age === null ? null : Number(updates.age)) : existing.age,
      gender: updates.gender !== undefined ? updates.gender : existing.gender
    };
    
    const { data, error } = await supabase.from('users').update(payload).eq('id', userId).select().single();
    if (error) return null;
    return data as User;
  },

  createUser: async (email: string, name: string, password?: string, age?: number, gender?: string): Promise<User> => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const basePayload: any = {
      id, email, name, password,
      age: age ? Number(age) : null,
      gender: gender || null,
      coins: 100, streak: 0, lastEntryDate: null, createdAt, tier: VaultTier.COPPER
    };
    const { error } = await supabase.from('users').insert(basePayload);
    if (error) throw new Error(`Registration failed: ${error.message}`);
    return basePayload as User;
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    return !error;
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data } = await supabase.from('users').select('*').neq('email', ADMIN_EMAIL).order('streak', { ascending: false });
    return (data || []) as User[];
  },

  // --- TRANSACTIONS (Moved to LocalStorage) ---
  getTransactions: async (userId?: string): Promise<Transaction[]> => {
    const all = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const filtered = userId ? all.filter(t => t.userId === userId) : all;
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addTransaction: async (userId: string, tx: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> => {
    const newTx: Transaction = { ...tx, id: crypto.randomUUID(), userId, resolved: tx.resolved ?? false };
    const all = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    all.push(newTx);
    setLocal(STORAGE_KEYS.TRANSACTIONS, all);

    // Update User Coins/Streak on Supabase for the Leaderboard/Profile sync
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (user && user.email !== ADMIN_EMAIL) {
      const today = getKolkataDate();
      let newStreak = Number(user.streak) || 0;
      if (user.lastEntryDate !== today) {
        if (user.lastEntryDate) {
          const lastDate = new Date(user.lastEntryDate);
          const currentDate = new Date(today);
          // Fix: Ensure arithmetic on dates uses getTime() explicitly for safety
          const diff = Math.round((currentDate.getTime() - lastDate.getTime()) / 86400000);
          newStreak = diff === 1 ? (Number(user.streak) || 0) + 1 : 1;
        } else { newStreak = 1; }
      }
      const newCoins = (Number(user.coins) || 0) + 50; 
      await supabase.from('users').update({ 
        coins: newCoins, 
        streak: newStreak, 
        lastEntryDate: today, 
        tier: calculateTier(newCoins) 
      }).eq('id', userId);
    }
    return newTx;
  },

  updateTransaction: async (txId: string, updates: Partial<Transaction>): Promise<void> => {
    const all = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const index = all.findIndex(t => t.id === txId);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates };
      setLocal(STORAGE_KEYS.TRANSACTIONS, all);
    }
  },

  deleteTransaction: async (txId: string): Promise<void> => {
    const all = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const filtered = all.filter(t => t.id !== txId);
    setLocal(STORAGE_KEYS.TRANSACTIONS, filtered);
  },

  toggleTransactionStatus: async (txId: string): Promise<void> => {
    const all = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const index = all.findIndex(t => t.id === txId);
    if (index !== -1) {
      all[index].resolved = !all[index].resolved;
      setLocal(STORAGE_KEYS.TRANSACTIONS, all);
    }
  },

  // --- GOALS (Moved to LocalStorage) ---
  getGoals: async (userId: string): Promise<Goal[]> => {
    return getLocal<Goal>(STORAGE_KEYS.GOALS).filter(g => g.userId === userId);
  },

  addGoal: async (userId: string, name: string, targetAmount: number): Promise<Goal> => {
    const newGoal = { id: crypto.randomUUID(), userId, name, targetAmount, createdAt: new Date().toISOString() };
    const all = getLocal<Goal>(STORAGE_KEYS.GOALS);
    all.push(newGoal);
    setLocal(STORAGE_KEYS.GOALS, all);
    return newGoal;
  },

  deleteGoal: async (goalId: string): Promise<void> => {
    const all = getLocal<Goal>(STORAGE_KEYS.GOALS);
    setLocal(STORAGE_KEYS.GOALS, all.filter(g => g.id !== goalId));
  },

  // --- BUDGETS (Moved to LocalStorage) ---
  getBudgets: async (userId: string): Promise<Budget[]> => {
    return getLocal<Budget>(STORAGE_KEYS.BUDGETS).filter(b => b.userId === userId);
  },

  setBudget: async (userId: string, category: string, limit: number): Promise<Budget> => {
    const all = getLocal<Budget>(STORAGE_KEYS.BUDGETS);
    const existingIndex = all.findIndex(b => b.userId === userId && b.category === category);
    
    if (existingIndex !== -1) {
      all[existingIndex].limit = limit;
      setLocal(STORAGE_KEYS.BUDGETS, all);
      return all[existingIndex];
    } else {
      const newBudget = { id: crypto.randomUUID(), userId, category, limit };
      all.push(newBudget);
      setLocal(STORAGE_KEYS.BUDGETS, all);
      return newBudget;
    }
  },

  deleteBudget: async (budgetId: string): Promise<void> => {
    const all = getLocal<Budget>(STORAGE_KEYS.BUDGETS);
    setLocal(STORAGE_KEYS.BUDGETS, all.filter(b => b.id !== budgetId));
  },

  // --- EVENTS (Remains on Supabase for Global Visibility) ---
  getEvents: async (): Promise<SovereignEvent[]> => {
    const { data } = await supabase.from('sovereign_events').select('*').order('startTime', { ascending: false });
    return (data || []) as SovereignEvent[];
  },

  createEvent: async (event: Omit<SovereignEvent, 'id'>): Promise<SovereignEvent> => {
    const newEvent = { ...event, id: crypto.randomUUID() };
    await supabase.from('sovereign_events').insert(newEvent);
    return newEvent as SovereignEvent;
  },

  deleteEvent: async (eventId: string): Promise<void> => { await supabase.from('sovereign_events').delete().eq('id', eventId); },

  // --- CUSTOM CATEGORIES (Moved to LocalStorage) ---
  getCustomCategories: async (userId: string): Promise<CustomCategory[]> => {
    return getLocal<CustomCategory>(STORAGE_KEYS.CUSTOM_CATEGORIES).filter(c => c.userId === userId);
  },

  addCustomCategory: async (userId: string, name: string, type: TransactionType): Promise<CustomCategory> => {
    const newCat = { id: crypto.randomUUID(), userId, name, type };
    const all = getLocal<CustomCategory>(STORAGE_KEYS.CUSTOM_CATEGORIES);
    all.push(newCat);
    setLocal(STORAGE_KEYS.CUSTOM_CATEGORIES, all);
    return newCat;
  },

  updateCustomCategory: async (id: string, updates: Partial<CustomCategory>): Promise<void> => {
    const all = getLocal<CustomCategory>(STORAGE_KEYS.CUSTOM_CATEGORIES);
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      setLocal(STORAGE_KEYS.CUSTOM_CATEGORIES, all);
    }
  },

  deleteCustomCategory: async (id: string): Promise<void> => {
    const all = getLocal<CustomCategory>(STORAGE_KEYS.CUSTOM_CATEGORIES);
    setLocal(STORAGE_KEYS.CUSTOM_CATEGORIES, all.filter(c => c.id !== id));
  },

  // --- CUSTOM CHANNELS (Moved to LocalStorage) ---
  getCustomChannels: async (userId: string): Promise<CustomChannel[]> => {
    return getLocal<CustomChannel>(STORAGE_KEYS.CUSTOM_CHANNELS).filter(c => c.userId === userId);
  },

  addCustomChannel: async (userId: string, name: string): Promise<CustomChannel> => {
    const newChan = { id: crypto.randomUUID(), userId, name };
    const all = getLocal<CustomChannel>(STORAGE_KEYS.CUSTOM_CHANNELS);
    all.push(newChan);
    setLocal(STORAGE_KEYS.CUSTOM_CHANNELS, all);
    return newChan;
  },

  updateCustomChannel: async (id: string, updates: Partial<CustomChannel>): Promise<void> => {
    const all = getLocal<CustomChannel>(STORAGE_KEYS.CUSTOM_CHANNELS);
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      setLocal(STORAGE_KEYS.CUSTOM_CHANNELS, all);
    }
  },

  deleteCustomChannel: async (id: string): Promise<void> => {
    const all = getLocal<CustomChannel>(STORAGE_KEYS.CUSTOM_CHANNELS);
    setLocal(STORAGE_KEYS.CUSTOM_CHANNELS, all.filter(c => c.id !== id));
  },

  // --- RECURRING TRANSACTIONS (Moved to LocalStorage) ---
  getRecurringTransactions: async (userId: string): Promise<RecurringTransaction[]> => {
    return getLocal<RecurringTransaction>(STORAGE_KEYS.RECURRING).filter(r => r.userId === userId);
  },

  updateRecurringTransaction: async (id: string, updates: Partial<RecurringTransaction>): Promise<void> => {
    const all = getLocal<RecurringTransaction>(STORAGE_KEYS.RECURRING);
    const idx = all.findIndex(r => r.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      setLocal(STORAGE_KEYS.RECURRING, all);
    }
  },

  deleteRecurringTransaction: async (id: string): Promise<void> => {
    const all = getLocal<RecurringTransaction>(STORAGE_KEYS.RECURRING);
    setLocal(STORAGE_KEYS.RECURRING, all.filter(r => r.id !== id));
  }
};

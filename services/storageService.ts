import { User, Transaction, TransactionType, VaultTier, Goal, CustomCategory } from '../types';
import { supabase } from './supabaseClient';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../constants';

const DB_KEY = 'FINTRACK_SOVEREIGN_MASTER_VAULT_PERMANENT';
const SESSION_KEY = 'FINTRACK_SOVEREIGN_SESSION_PERMANENT';

interface LocalDB {
  users: User[];
  transactions: Transaction[];
  goals: Goal[];
  customCategories: CustomCategory[];
}

const getLocalDB = (): LocalDB => {
  const data = localStorage.getItem(DB_KEY);
  if (data) return JSON.parse(data);
  return { users: [], transactions: [], goals: [], customCategories: [] };
};

const saveLocalDB = (db: LocalDB) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const calculateTier = (coins: number): VaultTier => {
  if (coins >= 5000) return VaultTier.DIAMOND;
  if (coins >= 2500) return VaultTier.PLATINUM;
  if (coins >= 1000) return VaultTier.GOLD;
  if (coins >= 500) return VaultTier.SILVER;
  return VaultTier.COPPER;
};

export const storageService = {
  checkConnection: async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (error) throw error;
      if (data) return data as User;
    } catch (e) { 
      console.warn('Supabase fetch user failed, using local fallback:', e);
    }

    const db = getLocalDB();
    let localUser = db.users.find(u => u.email === email) || null;
    if (!localUser && email === ADMIN_EMAIL) {
      localUser = {
        id: 'admin-hard-id',
        email: ADMIN_EMAIL,
        name: 'Administrator',
        password: ADMIN_PASSWORD,
        coins: 1000,
        streak: 0,
        lastEntryDate: null,
        createdAt: new Date().toISOString(),
        tier: VaultTier.GOLD
      };
      db.users.push(localUser);
      saveLocalDB(db);
    }
    return localUser;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User | null> => {
    const db = getLocalDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    const currentUser = userIdx !== -1 ? db.users[userIdx] : null;
    
    if (!currentUser && userId !== 'admin-hard-id') return null;

    const currentCoins = updates.coins !== undefined ? updates.coins : (currentUser?.coins || 0);
    const updatedUser = { ...(currentUser || {}), ...updates, id: userId, tier: calculateTier(currentCoins) } as User;
    
    if (userIdx !== -1) {
      db.users[userIdx] = updatedUser;
      saveLocalDB(db);
    }

    try {
      await supabase.from('users').upsert({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        password: updatedUser.password,
        coins: updatedUser.coins,
        streak: updatedUser.streak,
        lastEntryDate: updatedUser.lastEntryDate,
        createdAt: updatedUser.createdAt,
        tier: updatedUser.tier
      });
    } catch (e) { 
      console.error('Supabase sync failed for user update:', e);
    }

    return updatedUser;
  },

  createUser: async (email: string, name: string, password?: string): Promise<User> => {
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      password,
      coins: 100,
      streak: 0,
      lastEntryDate: null,
      createdAt: new Date().toISOString(),
      tier: VaultTier.COPPER
    };
    
    const db = getLocalDB();
    db.users.push(newUser);
    saveLocalDB(db);

    try {
      await supabase.from('users').insert(newUser);
    } catch (e) { 
      console.error('Supabase create user sync failed:', e);
    }

    return newUser;
  },

  getTransactions: async (userId?: string): Promise<Transaction[]> => {
    try {
      let query = supabase.from('transactions').select('*').order('date', { ascending: false });
      if (userId) query = query.eq('userId', userId);
      
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        // Refresh local cache with Supabase data
        const db = getLocalDB();
        if (userId) {
          db.transactions = [
            ...db.transactions.filter(t => t.userId !== userId),
            ...(data as Transaction[])
          ];
        } else {
          db.transactions = data as Transaction[];
        }
        saveLocalDB(db);
        return data as Transaction[];
      }
    } catch (e) { 
      console.warn('Supabase fetch transactions failed, using local cache:', e);
    }

    const db = getLocalDB();
    return userId ? db.transactions.filter(t => t.userId === userId) : db.transactions;
  },

  addTransaction: async (userId: string, tx: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> => {
    const newTx: Transaction = { ...tx, id: crypto.randomUUID(), userId, resolved: false };
    
    const db = getLocalDB();
    db.transactions.unshift(newTx);
    
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
      const user = db.users[userIdx];
      const today = new Date().toISOString().split('T')[0];
      const lastDate = user.lastEntryDate?.split('T')[0];
      
      user.coins += tx.type === TransactionType.SAVING ? 100 : 50;
      if (lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        user.streak = (lastDate === yesterday) ? user.streak + 1 : 1;
        user.lastEntryDate = new Date().toISOString();
      }
      user.tier = calculateTier(user.coins);
      
      try { 
        await supabase.from('users').upsert({
          id: user.id,
          coins: user.coins,
          streak: user.streak,
          lastEntryDate: user.lastEntryDate,
          tier: user.tier
        }); 
      } catch(e) {
        console.error('User stats sync failed during transaction add:', e);
      }
    }
    saveLocalDB(db);

    try {
      const { error } = await supabase.from('transactions').insert({
        id: newTx.id,
        userId: newTx.userId,
        amount: newTx.amount,
        type: newTx.type,
        category: newTx.category,
        paymentMethod: newTx.paymentMethod,
        note: newTx.note,
        date: newTx.date,
        resolved: newTx.resolved
      });
      if (error) throw error;
    } catch (e) { 
      console.error('Supabase transaction insert failed:', e);
    }

    return newTx;
  },

  toggleTransactionStatus: async (txId: string): Promise<void> => {
    const db = getLocalDB();
    const tx = db.transactions.find(t => t.id === txId);
    if (tx) {
      tx.resolved = !tx.resolved;
      saveLocalDB(db);
      try {
        await supabase.from('transactions').update({ resolved: tx.resolved }).eq('id', txId);
      } catch (e) {
        console.error('Supabase toggle status sync failed:', e);
      }
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      if (data) return data.sort((a, b) => b.streak - a.streak || b.coins - a.coins) as User[];
    } catch (e) {
      console.warn('Supabase fetch all users failed:', e);
    }
    return getLocalDB().users.sort((a, b) => b.streak - a.streak || b.coins - a.coins);
  },

  getGoals: async (userId: string): Promise<Goal[]> => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      if (data) return data as Goal[];
    } catch (e) { 
      console.warn('Supabase fetch goals failed:', e);
    }

    const db = getLocalDB();
    return db.goals.filter(g => g.userId === userId);
  },

  addGoal: async (userId: string, name: string, targetAmount: number): Promise<Goal> => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      userId,
      name,
      targetAmount,
      createdAt: new Date().toISOString()
    };
    
    const db = getLocalDB();
    db.goals.push(newGoal);
    saveLocalDB(db);

    try {
      await supabase.from('goals').insert({
        id: newGoal.id,
        userId: newGoal.userId,
        name: newGoal.name,
        targetAmount: newGoal.targetAmount,
        createdAt: newGoal.createdAt
      });
    } catch (e) {
      console.error('Supabase add goal sync failed:', e);
    }

    return newGoal;
  },

  deleteGoal: async (goalId: string): Promise<void> => {
    const db = getLocalDB();
    db.goals = db.goals.filter(g => g.id !== goalId);
    saveLocalDB(db);

    try {
      await supabase.from('goals').delete().eq('id', goalId);
    } catch (e) {
      console.error('Supabase delete goal sync failed:', e);
    }
  },

  getCustomCategories: async (userId: string): Promise<CustomCategory[]> => {
    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('userId', userId);
      
      if (error) throw error;
      if (data) return data as CustomCategory[];
    } catch (e) {
      console.warn('Supabase fetch categories failed:', e);
    }

    const db = getLocalDB();
    return db.customCategories ? db.customCategories.filter(c => c.userId === userId) : [];
  },

  addCustomCategory: async (userId: string, name: string, type: TransactionType): Promise<CustomCategory> => {
    const newCat: CustomCategory = { id: crypto.randomUUID(), userId, name, type };
    const db = getLocalDB();
    if (!db.customCategories) db.customCategories = [];
    db.customCategories.push(newCat);
    saveLocalDB(db);

    try {
      await supabase.from('custom_categories').insert({
        id: newCat.id,
        userId: newCat.userId,
        name: newCat.name,
        type: newCat.type
      });
    } catch (e) {
      console.error('Supabase add category sync failed:', e);
    }

    return newCat;
  },

  deleteCustomCategory: async (id: string): Promise<void> => {
    const db = getLocalDB();
    if (db.customCategories) {
      db.customCategories = db.customCategories.filter(c => c.id !== id);
      saveLocalDB(db);
    }

    try {
      await supabase.from('custom_categories').delete().eq('id', id);
    } catch (e) {
      console.error('Supabase delete category sync failed:', e);
    }
  }
};
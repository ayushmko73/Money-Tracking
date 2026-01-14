
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  CREDIT = 'CREDIT',
  DEBT = 'DEBT',
  SAVING = 'SAVING'
}

export enum VaultTier {
  COPPER = 'COPPER',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND'
}

/* Added RecurrenceFrequency enum */
export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string; 
  paymentMethod: string; 
  note: string;
  date: string;
  resolved?: boolean; 
}

/* Added CustomCategory interface */
export interface CustomCategory {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
}

/* Added CustomChannel interface */
export interface CustomChannel {
  id: string;
  userId: string;
  name: string;
}

/* Added RecurringTransaction interface */
export interface RecurringTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  lastProcessedDate?: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  age?: number;
  gender?: string;
  coins: number;
  streak: number;
  lastEntryDate: string | null;
  createdAt: string;
  tier: VaultTier;
}

export interface SovereignEvent {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  type: 'CHALLENGE' | 'BONUS' | 'ANNOUNCEMENT';
}

export interface AppState {
  currentUser: User | null;
  transactions: Transaction[];
  users: User[]; 
  goals: Goal[];
  budgets: Budget[];
  events: SovereignEvent[];
}

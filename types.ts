
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  CREDIT = 'CREDIT',
  DEBT = 'DEBT',
  SAVING = 'SAVING'
}

export enum PaymentMethod {
  SAVING = 'SAVING',
  ONLINE = 'ONLINE',
  WALLET = 'WALLET'
}

export enum VaultTier {
  COPPER = 'COPPER',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND'
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  createdAt: string;
}

export interface CustomCategory {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string; // Used for counterparty name in Credit/Debt, or Goal Name in Saving
  paymentMethod: PaymentMethod;
  note: string;
  date: string;
  resolved?: boolean; 
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  coins: number;
  streak: number;
  lastEntryDate: string | null;
  createdAt: string;
  tier: VaultTier;
}

export interface AppState {
  currentUser: User | null;
  transactions: Transaction[];
  users: User[]; 
  goals: Goal[];
}


import { TransactionType, PaymentMethod } from './types';

export const CATEGORIES = {
  [TransactionType.INCOME]: [],
  [TransactionType.EXPENSE]: [],
  [TransactionType.CREDIT]: [],
  [TransactionType.DEBT]: [],
  [TransactionType.SAVING]: []
};

export const COLORS = {
  [TransactionType.INCOME]: '#10b981', // emerald-500
  [TransactionType.EXPENSE]: '#ef4444', // red-500
  [TransactionType.CREDIT]: '#3b82f6', // blue-500
  [TransactionType.DEBT]: '#f59e0b', // amber-500
  [TransactionType.SAVING]: '#8b5cf6', // violet-500
};

export const ADMIN_EMAIL = 'admin@finance.com';
export const ADMIN_PASSWORD = 'Ak@supabase123';

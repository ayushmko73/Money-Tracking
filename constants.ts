
import { TransactionType } from './types';

export const CATEGORIES = {
  [TransactionType.INCOME]: ['Salary', 'Freelance', 'Dividends', 'Gift', 'Rental', 'Bonus', 'Tax Refund'],
  [TransactionType.EXPENSE]: ['Dining', 'Rent', 'Groceries', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Travel', 'Education', 'Subscriptions'],
  [TransactionType.CREDIT]: ['Personal Loan', 'Business Credit', 'Advance Payment', 'Inter-account Transfer'],
  [TransactionType.DEBT]: ['Credit Card', 'Personal Debt', 'Mortgage', 'Student Loan', 'EMI'],
  [TransactionType.SAVING]: ['Emergency Fund', 'Retirement', 'Investment', 'Vacation fund', 'Property']
};

export const COLORS = {
  [TransactionType.INCOME]: '#10b981', // emerald-500
  [TransactionType.EXPENSE]: '#ef4444', // red-500
  [TransactionType.CREDIT]: '#3b82f6', // blue-500
  [TransactionType.DEBT]: '#f97316', // orange-500
  [TransactionType.SAVING]: '#8b5cf6', // violet-500
};

export const ADMIN_EMAIL = 'admin@finance.com';
export const ADMIN_PASSWORD = 'Ak@supabase123';

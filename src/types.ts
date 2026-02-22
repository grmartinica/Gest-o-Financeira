export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  created_at: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Alimentação', color: '#ef4444' },
  { id: 'rent', name: 'Aluguel', color: '#3b82f6' },
  { id: 'transport', name: 'Transporte', color: '#f59e0b' },
  { id: 'entertainment', name: 'Lazer', color: '#8b5cf6' },
  { id: 'health', name: 'Saúde', color: '#10b981' },
  { id: 'salary', name: 'Salário', color: '#22c55e' },
  { id: 'other', name: 'Outros', color: '#6b7280' },
];

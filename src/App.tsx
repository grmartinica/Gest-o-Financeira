import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar, 
  Tag, 
  Trash2, 
  PieChart as PieChartIcon,
  LayoutDashboard,
  History,
  X,
  ChevronRight,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  AlertCircle,
  CreditCard,
  ArrowRightLeft,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Transaction, CATEGORIES, TransactionType, PaymentMethod, Account, ACCOUNTS, DEFAULT_PAYMENT_METHODS } from './types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryModal from './components/CategoryModal';
import AccountModal from './components/AccountModal';
import PaymentMethodModal from './components/PaymentMethodModal';
import TransferModal from './components/TransferModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'balance' | 'income' | 'expense';
  icon: React.ReactNode;
}

const SummaryCard = ({ title, amount, type, icon }: SummaryCardProps) => {
  const isNegative = amount < 0;
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(amount));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        <div className={cn(
          "p-3 rounded-xl",
          type === 'balance' && "bg-zinc-100 text-zinc-600",
          type === 'income' && "bg-emerald-50 text-emerald-600",
          type === 'expense' && "bg-rose-50 text-rose-600"
        )}>
          {icon}
        </div>
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</span>
      </div>
      <div>
        <h3 className={cn(
          "text-2xl font-bold tracking-tight",
          type === 'balance' && isNegative ? "text-rose-600" : "text-zinc-900",
          type === 'income' && "text-emerald-600",
          type === 'expense' && "text-rose-600"
        )}>
          {type === 'balance' && isNegative ? '-' : ''}{formattedAmount}
        </h3>
      </div>
    </motion.div>
  );
};

const PAYMENT_METHODS: { id: PaymentMethod; name: string }[] = [
  { id: 'credit_card', name: 'Cartão de Crédito' },
  { id: 'debit_card', name: 'Cartão de Débito' },
  { id: 'pix', name: 'PIX' },
  { id: 'cash', name: 'Dinheiro' },
  { id: 'other', name: 'Outro' },
];

// --- Main App ---

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categories, setCategories] = useState<Category[]>(CATEGORIES); // Start with default
  const [accounts, setAccounts] = useState<Account[]>(ACCOUNTS); // Start with default
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(DEFAULT_PAYMENT_METHODS); // Start with default
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  
  // Form state (Transaction)
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Use native JS for safety
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('other');
  const [accountId, setAccountId] = useState('default');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTransactions();
      fetchCategories();
      fetchAccounts();
      fetchPaymentMethods();
    }
  }, [session]);

  async function fetchTransactions() {
    if (!isSupabaseConfigured) {
      // Mock data for demo if not configured
      const mockData: Transaction[] = [
        { id: '1', created_at: new Date().toISOString(), description: 'Salário Mensal', amount: 5000, type: 'income', category: 'salary', date: '2024-03-01', paymentMethod: 'pix', accountId: 'default' },
        { id: '2', created_at: new Date().toISOString(), description: 'Aluguel', amount: 1500, type: 'expense', category: 'rent', date: '2024-03-05', paymentMethod: 'debit_card', accountId: 'default' },
        { id: '3', created_at: new Date().toISOString(), description: 'Supermercado', amount: 450.50, type: 'expense', category: 'food', date: '2024-03-10', paymentMethod: 'credit_card', accountId: 'default' },
        { id: '4', created_at: new Date().toISOString(), description: 'Freelance Design', amount: 1200, type: 'income', category: 'other', date: '2024-03-12', paymentMethod: 'pix', accountId: 'default' },
        { id: '5', created_at: new Date().toISOString(), description: 'Academia', amount: 120, type: 'expense', category: 'health', date: '2024-03-15', paymentMethod: 'debit_card', accountId: 'default' },
      ];
      setTransactions(mockData);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    if (!isSupabaseConfigured) {
      // Use default categories for demo
      setCategories(CATEGORIES);
      return;
    }
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      // Combine default and user-added categories
      const combined = [...CATEGORIES, ...data].reduce((acc, current) => {
        if (!acc.find(item => item.id === current.id)) {
          acc.push(current);
        }
        return acc;
      }, [] as Category[]);
      setCategories(combined);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(CATEGORIES); // Fallback to default
    }
  }

  async function fetchAccounts() {
    if (!isSupabaseConfigured) {
      setAccounts(ACCOUNTS);
      return;
    }
    try {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) throw error;
      const combined = [...ACCOUNTS, ...data].reduce((acc, current) => {
        if (!acc.find(item => item.id === current.id)) {
          acc.push(current);
        }
        return acc;
      }, [] as Account[]);
      setAccounts(combined);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts(ACCOUNTS);
    }
  }

  async function fetchPaymentMethods() {
    if (!isSupabaseConfigured) {
      setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      return;
    }
    try {
      const { data, error } = await supabase.from('payment_methods').select('*');
      if (error) throw error;
      const combined = [...DEFAULT_PAYMENT_METHODS, ...data].reduce((acc, current) => {
        if (!acc.find(item => item.id === current.id)) {
          acc.push(current);
        }
        return acc;
      }, [] as PaymentMethod[]);
      setPaymentMethods(combined);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods(DEFAULT_PAYMENT_METHODS);
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    const newTransaction = {
      description,
      amount: parseFloat(amount),
      type,
      category,
      date,
      paymentMethod,
      accountId,
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('transactions').insert([newTransaction]);
        if (error) throw error;
        fetchTransactions();
      } catch (error) {
        console.error('Error adding transaction:', error);
      }
    } else {
      // Local update for demo
      const mockNew: Transaction = {
        ...newTransaction,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      };
      setTransactions([mockNew, ...transactions]);
    }

    // Reset form
    setDescription('');
    setAmount('');
    setIsModalOpen(false);
  }

  async function handleDeleteTransaction(id: string) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    } else {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  }

  async function handleAddTransfer(fromAccountId: string, toAccountId: string, amount: number, date: string) {
    const transferId = new Date().toISOString(); // Unique ID for the transfer

    const expenseTransaction: Omit<Transaction, 'id' | 'created_at'> = {
      description: `Transferência para ${accounts.find(a => a.id === toAccountId)?.name}`,
      amount,
      type: 'expense',
      category: 'transfer',
      date,
      paymentMethod: 'other',
      accountId: fromAccountId,
      transferId,
    };

    const incomeTransaction: Omit<Transaction, 'id' | 'created_at'> = {
      description: `Transferência de ${accounts.find(a => a.id === fromAccountId)?.name}`,
      amount,
      type: 'income',
      category: 'transfer',
      date,
      paymentMethod: 'other',
      accountId: toAccountId,
      transferId,
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('transactions').insert([expenseTransaction, incomeTransaction]);
        if (error) throw error;
        fetchTransactions();
      } catch (error) {
        console.error('Error adding transfer:', error);
      }
    } else {
      const mockExpense: Transaction = {
        ...expenseTransaction,
        id: `exp-${transferId}`,
        created_at: transferId,
      };
      const mockIncome: Transaction = {
        ...incomeTransaction,
        id: `inc-${transferId}`,
        created_at: transferId,
      };
      setTransactions([mockExpense, mockIncome, ...transactions]);
    }
  }

  const filteredTransactions = transactions.filter(t => {
    if (selectedAccountId !== 'all' && t.accountId !== selectedAccountId) return false;
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = accounts.reduce((acc, account) => {
    const accountTransactions = transactions.filter(t => t.accountId === account.id);
    const income = accountTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = accountTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return acc + account.initialBalance + income - expense;
  }, 0);

  const selectedAccountBalance = selectedAccount 
    ? selectedAccount.initialBalance + totalIncome - totalExpenses
    : balance;

  const chartData = categories.map(cat => {
    const total = transactions
      .filter(t => t.category === cat.id && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { name: cat.name, value: total, color: cat.color };
  }).filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">FinanceFlow</span>
          </div>

          <div className='flex-1 justify-center items-center hidden sm:flex'>
            <select 
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-zinc-100 text-zinc-600 rounded-full text-xs font-medium hover:bg-zinc-200 transition-all px-3 py-1.5 appearance-none"
            >
              <option value="all">Todas as Contas</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAccountModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-xs font-medium hover:bg-zinc-200 transition-all"
            >
              <Landmark className="w-3.5 h-3.5" />
              Gerenciar Contas
            </button>
            <button 
              onClick={() => setIsPaymentMethodModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-xs font-medium hover:bg-zinc-200 transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Formas de Pagamento
            </button>
            <button 
              onClick={() => setIsTransferModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-xs font-medium hover:bg-zinc-200 transition-all"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Transferência
            </button>
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-xs font-medium hover:bg-zinc-200 transition-all"
            >
              <Tag className="w-3.5 h-3.5" />
              Gerenciar Categorias
            </button>

            {!isSupabaseConfigured && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5" />
                Modo Demonstração
              </div>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Transação</span>
            </button>
            {session && (
              <button 
                onClick={() => supabase.auth.signOut()}
                className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-all flex items-center gap-2"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Grid */}
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8",
          selectedAccountId !== 'all' && "md:grid-cols-4"
        )}>
          <SummaryCard 
            title="Saldo Total" 
            amount={balance} 
            type="balance" 
            icon={<Wallet className="w-6 h-6" />} 
          />
          {selectedAccountId !== 'all' && (
            <SummaryCard 
              title={`Saldo ${selectedAccount?.name}`}
              amount={selectedAccountBalance} 
              type="balance" 
              icon={<Landmark className="w-6 h-6" />} 
            />
          )}
          <SummaryCard 
            title="Receitas" 
            amount={totalIncome} 
            type="income" 
            icon={<TrendingUp className="w-6 h-6" />} 
          />
          <SummaryCard 
            title="Despesas" 
            amount={totalExpenses} 
            type="expense" 
            icon={<TrendingDown className="w-6 h-6" />} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-lg font-semibold">Transações Recentes</h2>
                </div>
                <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-lg">
                  {(['all', 'income', 'expense'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                        filter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      {f === 'all' ? 'Todas' : f === 'income' ? 'Entradas' : 'Saídas'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-zinc-100">
                {loading ? (
                  <div className="p-12 text-center text-zinc-400">Carregando...</div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400">Nenhuma transação encontrada.</div>
                ) : (
                  filteredTransactions.map((t) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={t.id} 
                      className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {t.category === 'transfer' ? <ArrowRightLeft className="w-5 h-5" /> : t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(t.date), "dd 'de' MMM", { locale: ptBR })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {categories.find(c => c.id === t.category)?.name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {paymentMethods.find(p => p.id === t.paymentMethod)?.name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Landmark className="w-3 h-3" />
                              {accounts.find(a => a.id === t.accountId)?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "font-semibold",
                          t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                        </span>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-2 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-8">
            {/* Spending Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-semibold">Gastos por Categoria</h2>
              </div>
              
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                    Sem dados para exibir
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-600">{item.name}</span>
                    </div>
                    <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Setup Guide (only if not configured) */}
            {!isSupabaseConfigured && (
              <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-lg">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-400" />
                  Conectar Supabase
                </h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Para salvar seus dados permanentemente, configure as variáveis de ambiente no AI Studio.
                </p>
                <div className="space-y-3">
                  <div className="text-[10px] font-mono bg-white/5 p-2 rounded border border-white/10">
                    VITE_SUPABASE_URL<br/>
                    VITE_SUPABASE_ANON_KEY
                  </div>
                  <a 
                    href="https://supabase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-center py-2 bg-white text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-colors"
                  >
                    Criar Projeto Supabase
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Nova Transação */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Nova Transação</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div className="flex p-1 bg-zinc-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                      type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-zinc-500"
                    )}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                      type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500"
                    )}
                  >
                    Receita
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Descrição</label>
                  <input 
                    required
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Aluguel, Salário..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Valor (R$)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data</label>
                    <input 
                      required
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Categoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Forma de Pagamento</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all appearance-none"
                  >
                    {paymentMethods.map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Conta</label>
                  <select 
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all appearance-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 active:scale-[0.98] mt-4"
                >
                  Adicionar Transação
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        setCategories={setCategories}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accounts={accounts}
        setAccounts={setAccounts}
      />

      <PaymentMethodModal
        isOpen={isPaymentMethodModalOpen}
        onClose={() => setIsPaymentMethodModalOpen(false)}
        paymentMethods={paymentMethods}
        setPaymentMethods={setPaymentMethods}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        onAddTransfer={handleAddTransfer}
      />
    </div>
  );
}

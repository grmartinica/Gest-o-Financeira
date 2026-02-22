import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Transaction, CATEGORIES, TransactionType } from './types';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    if (!isSupabaseConfigured) {
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
      alert('Erro ao conectar com o Supabase. Verifique se a tabela "transactions" existe.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount) return;

    if (!isSupabaseConfigured) {
      alert('Supabase não configurado. Adicione as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const newTransaction = {
      description,
      amount: parseFloat(amount),
      type,
      category,
      date,
    };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        setTransactions([data[0], ...transactions]);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao salvar transação no banco de dados.');
    }
  }

  async function deleteTransaction(id: string) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      // Fallback for demo
      setTransactions(transactions.filter(t => t.id !== id));
    }
  }

  function resetForm() {
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory(CATEGORIES[0].name);
    setDate(format(new Date(), 'yyyy-MM-dd'));
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const chartData = CATEGORIES.map(cat => {
    const value = transactions
      .filter(t => t.category === cat.name && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { name: cat.name, value, color: cat.color };
  }).filter(item => item.value > 0);

  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthName = format(d, 'MMM', { locale: ptBR });
    const monthStart = startOfMonth(d);
    const monthEnd = endOfMonth(d);

    const income = transactions
      .filter(t => t.type === 'income' && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
      .reduce((acc, t) => acc + t.amount, 0);

    return { name: monthName, income, expenses };
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-zinc-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Wallet size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">FinanceFlow</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'dashboard' ? "bg-emerald-50 text-emerald-700 font-medium" : "text-zinc-500 hover:bg-zinc-100"
            )}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'history' ? "bg-emerald-50 text-emerald-700 font-medium" : "text-zinc-500 hover:bg-zinc-100"
            )}
          >
            <History size={20} />
            Histórico
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-100">
          <div className="mb-4">
            <div className={cn(
              "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full w-fit",
              isSupabaseConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-500")} />
              {isSupabaseConfigured ? "Conectado ao Supabase" : "Modo Offline / Não Configurado"}
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-white">
            <p className="text-xs text-zinc-400 mb-1">Saldo Total</p>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900">
              {activeTab === 'dashboard' ? 'Visão Geral' : 'Histórico de Transações'}
            </h2>
            <p className="text-zinc-500">Bem-vindo de volta ao seu controle financeiro.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-emerald-200 transition-all active:scale-95"
          >
            <Plus size={20} />
            Nova Transação
          </button>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="space-y-8">
            {!isSupabaseConfigured && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <X size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">Configuração Necessária</h4>
                  <p className="text-amber-700 text-sm mt-1">
                    Para usar o banco de dados real, configure as variáveis de ambiente 
                    <code className="bg-amber-100 px-1 rounded mx-1 font-mono text-xs">VITE_SUPABASE_URL</code> e 
                    <code className="bg-amber-100 px-1 rounded mx-1 font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> no seu arquivo <code className="bg-amber-100 px-1 rounded mx-1 font-mono text-xs">.env</code>.
                  </p>
                </div>
              </div>
            )}
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Receitas</span>
                </div>
                <p className="text-zinc-500 text-sm mb-1">Total Recebido</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                    <TrendingDown size={20} />
                  </div>
                  <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">Despesas</span>
                </div>
                <p className="text-zinc-500 text-sm mb-1">Total Gasto</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Wallet size={20} />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Saldo</span>
                </div>
                <p className="text-zinc-500 text-sm mb-1">Saldo Atual</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                </p>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={18} className="text-zinc-400" />
                  <h3 className="font-bold text-zinc-900">Fluxo Mensal</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                      <Tooltip 
                        cursor={{ fill: '#f4f4f5' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Receita" />
                      <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Despesa" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon size={18} className="text-zinc-400" />
                  <h3 className="font-bold text-zinc-900">Gastos por Categoria</h3>
                </div>
                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                      <PieChartIcon size={48} className="mb-2 opacity-20" />
                      <p>Sem dados para exibir</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="font-bold text-zinc-900">Transações Recentes</h3>
                <button 
                  onClick={() => setActiveTab('history')}
                  className="text-sm text-emerald-600 font-medium hover:underline"
                >
                  Ver todas
                </button>
              </div>
              <div className="divide-y divide-zinc-100">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}>
                        {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{t.description}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="flex items-center gap-1"><Tag size={12} /> {t.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {format(parseISO(t.date), 'dd MMM', { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                    <p className={cn(
                      "font-bold",
                      t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                    </p>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="p-10 text-center text-zinc-400">
                    Nenhuma transação encontrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Data</th>
                    <th className="px-6 py-4 font-semibold">Descrição</th>
                    <th className="px-6 py-4 font-semibold">Categoria</th>
                    <th className="px-6 py-4 font-semibold">Valor</th>
                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-zinc-600">
                        {format(parseISO(t.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-zinc-900">{t.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className={cn(
                          "font-bold",
                          t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="text-zinc-400 hover:text-rose-600 transition-colors p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="p-20 text-center text-zinc-400">
                  <History size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Seu histórico está vazio.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-zinc-900">Nova Transação</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={cn(
                      "py-2 rounded-lg text-sm font-medium transition-all",
                      type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={cn(
                      "py-2 rounded-lg text-sm font-medium transition-all",
                      type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    Receita
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Descrição</label>
                  <input 
                    type="text" 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Aluguel, Supermercado..."
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Valor</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Data</label>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Categoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 mt-4"
                >
                  Confirmar Transação
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

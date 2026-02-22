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
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Transaction, CATEGORIES, TransactionType } from './types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Sistema de Finanças</h1>
        <p className="text-zinc-600 mb-6">Se você está vendo esta mensagem, o React está funcionando corretamente.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-zinc-900 text-white px-6 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Recarregar
        </button>
        
        <div className="mt-8 text-left text-xs text-zinc-400 bg-zinc-50 p-4 rounded-lg overflow-auto max-h-40">
          <p>Status Supabase: {isSupabaseConfigured ? 'Configurado' : 'Não Configurado'}</p>
          <p>Transações: {transactions.length}</p>
          <p>Loading: {loading ? 'Sim' : 'Não'}</p>
        </div>
      </div>
    </div>
  );
}

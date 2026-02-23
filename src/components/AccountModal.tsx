import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit, Landmark } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Account } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
}

export default function AccountModal({ isOpen, onClose, accounts, setAccounts }: AccountModalProps) {
  const [newAccountName, setNewAccountName] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState('0');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (editingAccount) {
      setNewAccountName(editingAccount.name);
      setNewInitialBalance(String(editingAccount.initialBalance));
    } else {
      setNewAccountName('');
      setNewInitialBalance('0');
    }
  }, [editingAccount]);

  function handleSelectForEdit(account: Account) {
    setEditingAccount(account);
  }

  function cancelEdit() {
    setEditingAccount(null);
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccountName) return;

    const newAccount: Omit<Account, 'id'> & { id?: string } = {
      id: newAccountName.toLowerCase().replace(/\s+/g, '-'),
      name: newAccountName,
      initialBalance: parseFloat(newInitialBalance),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('accounts').insert(newAccount).select();
        if (error) throw error;
        if (data) {
          setAccounts([...accounts, ...data]);
        }
      } catch (error) {
        console.error('Error adding account:', error);
      }
    } else {
      setAccounts([...accounts, newAccount as Account]);
    }

    setNewAccountName('');
    setNewInitialBalance('0');
  }

  async function handleUpdateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAccount) return;

    const updatedAccount = {
      name: newAccountName,
      initialBalance: parseFloat(newInitialBalance),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .update(updatedAccount)
          .eq('id', editingAccount.id)
          .select();
        
        if (error) throw error;

        if (data) {
          setAccounts(accounts.map(a => a.id === editingAccount.id ? data[0] : a));
        }
      } catch (error) {
        console.error('Error updating account:', error);
      }
    } else {
      setAccounts(accounts.map(a => a.id === editingAccount.id ? { ...a, ...updatedAccount } : a));
    }

    cancelEdit();
  }

  async function handleDeleteAccount(id: string) {
    if (id === 'default') return; // Cannot delete default account

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) throw error;
        setAccounts(accounts.filter(a => a.id !== id));
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    } else {
      setAccounts(accounts.filter(a => a.id !== id));
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Gerenciar Contas</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={editingAccount ? handleUpdateAccount : handleAddAccount} className="flex items-end gap-2 mb-6 pb-6 border-b border-zinc-100">
                <div className="flex-grow space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nome da Conta</label>
                  <input 
                    required
                    type="text" 
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Ex: Carteira, Banco..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                  />
                </div>
                <div className="space-y-1.5 w-32">
                   <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Saldo Inicial</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    value={newInitialBalance}
                    onChange={(e) => setNewInitialBalance(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="submit"
                    className="h-12 px-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 active:scale-[0.98] flex items-center justify-center"
                  >
                    {editingAccount ? 'Salvar' : <Plus className="w-5 h-5" />}
                  </button>
                  {editingAccount && (
                    <button 
                      type="button"
                      onClick={cancelEdit}
                      className="h-12 px-4 bg-zinc-100 text-zinc-800 rounded-xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98]"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50">
                    <div className="flex items-center gap-3">
                      <Landmark className="w-4 h-4 text-zinc-400" />
                      <span className="font-medium">{acc.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-zinc-500 font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.initialBalance)}</span>
                      {acc.id !== 'default' && (
                        <>
                          <button 
                            onClick={() => handleSelectForEdit(acc)}
                            className="p-1 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

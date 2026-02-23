import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit, Plus, CreditCard } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PaymentMethod } from '../types';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, paymentMethods, setPaymentMethods }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    if (currentPaymentMethod) {
      setName(currentPaymentMethod.name);
    } else {
      setName('');
    }
  }, [currentPaymentMethod]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPaymentMethod: Omit<PaymentMethod, 'id'> = { name };

    if (isSupabaseConfigured) {
      try {
        if (isEditing && currentPaymentMethod) {
          const { data, error } = await supabase
            .from('payment_methods')
            .update({ name })
            .eq('id', currentPaymentMethod.id)
            .select();
          if (error) throw error;
          setPaymentMethods(paymentMethods.map(pm => pm.id === data[0].id ? data[0] : pm));
        } else {
          const { data, error } = await supabase
            .from('payment_methods')
            .insert(newPaymentMethod)
            .select();
          if (error) throw error;
          setPaymentMethods([...paymentMethods, data[0]]);
        }
      } catch (error) {
        console.error('Error saving payment method:', error);
      }
    } else {
      if (isEditing && currentPaymentMethod) {
        setPaymentMethods(paymentMethods.map(pm => pm.id === currentPaymentMethod.id ? { ...pm, name } : pm));
      } else {
        setPaymentMethods([...paymentMethods, { ...newPaymentMethod, id: new Date().toISOString() }]);
      }
    }

    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('payment_methods').delete().eq('id', id);
        if (error) throw error;
        setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
      } catch (error) {
        console.error('Error deleting payment method:', error);
      }
    } else {
      setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentPaymentMethod(null);
    setName('');
  };

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
              <h2 className="text-xl font-bold tracking-tight">Gerenciar Formas de Pagamento</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {paymentMethods.map(pm => (
                  <div key={pm.id} className="flex items-center justify-between bg-zinc-50 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-zinc-500" />
                      <span className="font-medium">{pm.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setIsEditing(true);
                          setCurrentPaymentMethod(pm);
                        }}
                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(pm.id)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100">
              <form onSubmit={handleSave} className="space-y-4">
                <h3 className="font-semibold text-lg">{isEditing ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nome</label>
                  <input 
                    required
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Cartão Nubank"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {isEditing ? 'Salvar Alterações' : 'Adicionar Forma de Pagamento'}
                  </button>
                  {isEditing && (
                    <button 
                      type="button"
                      onClick={resetForm}
                      className="w-full py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentMethodModal;

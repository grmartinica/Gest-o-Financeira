import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category, CATEGORIES } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function CategoryModal({ isOpen, onClose, categories, setCategories }: CategoryModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#cccccc');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  React.useEffect(() => {
    if (editingCategory) {
      setNewCategoryName(editingCategory.name);
      setNewCategoryColor(editingCategory.color);
    } else {
      setNewCategoryName('');
      setNewCategoryColor('#cccccc');
    }
  }, [editingCategory]);

  function handleSelectForEdit(category: Category) {
    setEditingCategory(category);
  }

  function cancelEdit() {
    setEditingCategory(null);
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const categoryData = {
      name: newCategoryName,
      color: newCategoryColor,
    };

    if (isSupabaseConfigured) {
      try {
        // Let Supabase handle the ID generation
        const { data, error } = await supabase.from('categories').insert(categoryData).select();
        if (error) throw error;
        if (data && data.length > 0) {
          setCategories([...categories, data[0]]);
        }
      } catch (error) {
        console.error('Error adding category:', error);
      }
    } else {
      // Use a more robust unique ID for local state
      const newCategory: Category = {
        ...categoryData,
        id: new Date().toISOString(),
      };
      setCategories([...categories, newCategory]);
    }

    setNewCategoryName('');
    setNewCategoryColor('#cccccc');
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory) return;

    const updatedCategory = {
      name: newCategoryName,
      color: newCategoryColor,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update(updatedCategory)
          .eq('id', editingCategory.id)
          .select();
        
        if (error) throw error;

        if (data) {
          setCategories(categories.map(c => c.id === editingCategory.id ? data[0] : c));
        }
      } catch (error) {
        console.error('Error updating category:', error);
      }
    } else {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...updatedCategory } : c));
    }

    cancelEdit();
  }

  async function handleDeleteCategory(id: string) {
    if (CATEGORIES.some(c => c.id === id)) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        setCategories(categories.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    } else {
      setCategories(categories.filter(c => c.id !== id));
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
              <h2 className="text-xl font-bold tracking-tight">Gerenciar Categorias</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="flex items-end gap-2 mb-6 pb-6 border-b border-zinc-100">
                <div className="flex-grow space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nome da Categoria</label>
                  <input 
                    required
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Educação"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cor</label>
                  <input 
                    type="color" 
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-14 h-12 p-1 bg-zinc-50 border border-zinc-100 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="submit"
                    className="h-12 px-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 active:scale-[0.98] flex items-center justify-center"
                  >
                    {editingCategory ? 'Salvar' : <Plus className="w-5 h-5" />}
                  </button>
                  {editingCategory && (
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
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    {!CATEGORIES.some(c => c.id === cat.id) && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleSelectForEdit(cat)}
                          className="p-1 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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

-- Execute este SQL no editor de consultas do seu projeto Supabase
-- para criar a tabela de transações necessária.

CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso público (para fins de demonstração)
-- Em produção, você deve usar autenticação e vincular transações a usuários.
CREATE POLICY "Allow public access" ON transactions
  FOR ALL USING (true) WITH CHECK (true);

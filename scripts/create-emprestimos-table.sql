-- Tabela para emprestimos (dinheiro emprestado para outras pessoas)
CREATE TABLE IF NOT EXISTS emprestimos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_pessoa TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_devolucao DATE NOT NULL,
  devolvido BOOLEAN DEFAULT FALSE,
  data_devolvido DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE emprestimos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "emprestimos_select_all" ON emprestimos FOR SELECT USING (true);
CREATE POLICY "emprestimos_insert_all" ON emprestimos FOR INSERT WITH CHECK (true);
CREATE POLICY "emprestimos_update_all" ON emprestimos FOR UPDATE USING (true);
CREATE POLICY "emprestimos_delete_all" ON emprestimos FOR DELETE USING (true);

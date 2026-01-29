-- Criar tabela de pagamentos do carro
CREATE TABLE IF NOT EXISTS pagamentos_carro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  valor DECIMAL(10, 2) NOT NULL,
  data_pagamento DATE NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir pagamentos iniciais
INSERT INTO pagamentos_carro (valor, data_pagamento, descricao) VALUES
  (6000.00, '2026-01-15', 'Pagamento do carro'),
  (2000.00, '2026-01-20', 'Pagamento do carro'),
  (380.00, '2026-01-28', 'Pagamento do carro');

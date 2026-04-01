-- Tabela de Subcategorias
CREATE TABLE IF NOT EXISTS subcategorias (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  categoria VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(categoria, nome)
);

-- Tabela de Templates de Contas
CREATE TABLE IF NOT EXISTS templates_contas (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  subcategoria VARCHAR(100),
  fornecedor VARCHAR(200),
  valor_padrao DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Contas Bancárias
CREATE TABLE IF NOT EXISTS contas_bancarias (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(100) NOT NULL,
  banco VARCHAR(100),
  agencia VARCHAR(20),
  conta VARCHAR(30),
  tipo VARCHAR(30) DEFAULT 'Corrente',
  cor VARCHAR(7) DEFAULT '#3B82F6',
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar colunas na tabela de contas
ALTER TABLE contas ADD COLUMN IF NOT EXISTS fornecedor VARCHAR(200);
ALTER TABLE contas ADD COLUMN IF NOT EXISTS subcategoria VARCHAR(100);

-- Adicionar colunas na tabela de transacoes para créditos
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS tipo_credito VARCHAR(50);
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS conta_bancaria_id VARCHAR(36);
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE;

-- Inserir algumas subcategorias padrão
INSERT IGNORE INTO subcategorias (categoria, nome) VALUES 
-- Moradia
('Moradia', 'Aluguel'),
('Moradia', 'Condomínio'),
('Moradia', 'IPTU'),
('Moradia', 'Luz'),
('Moradia', 'Água'),
('Moradia', 'Gás'),
('Moradia', 'Internet'),
('Moradia', 'Manutenção'),
-- Alimentação
('Alimentação', 'Supermercado'),
('Alimentação', 'Restaurante'),
('Alimentação', 'Delivery'),
('Alimentação', 'Padaria'),
-- Transporte
('Transporte', 'Combustível'),
('Transporte', 'Estacionamento'),
('Transporte', 'Uber/99'),
('Transporte', 'Manutenção Veículo'),
('Transporte', 'IPVA'),
('Transporte', 'Seguro'),
-- Saúde
('Saúde', 'Plano de Saúde'),
('Saúde', 'Farmácia'),
('Saúde', 'Consultas'),
('Saúde', 'Exames'),
-- Educação
('Educação', 'Mensalidade'),
('Educação', 'Cursos'),
('Educação', 'Livros'),
('Educação', 'Material'),
-- Lazer
('Lazer', 'Streaming'),
('Lazer', 'Cinema'),
('Lazer', 'Viagem'),
('Lazer', 'Academia'),
-- Serviços
('Serviços', 'Celular'),
('Serviços', 'Assinaturas'),
('Serviços', 'Serviços Online');

-- Inserir uma conta bancária de exemplo
INSERT IGNORE INTO contas_bancarias (id, nome, banco, tipo) VALUES 
('default', 'Conta Principal', 'Meu Banco', 'Corrente');

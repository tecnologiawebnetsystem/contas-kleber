-- =====================================================
-- SCRIPT DE CORREÇÕES DO SCHEMA - fix_schema_completo.sql
-- Aplica todos os campos e tabelas que estavam faltando
-- =====================================================

-- 1. Adicionar tipo 'caixinha' ao ENUM da tabela contas (se ainda nao foi feito)
ALTER TABLE contas 
  MODIFY COLUMN tipo ENUM('fixa', 'parcelada', 'diaria', 'poupanca', 'viagem', 'caixinha') 
  NOT NULL DEFAULT 'fixa';

-- 2. Adicionar categoria 'Caixinha' ao ENUM da tabela contas
ALTER TABLE contas
  MODIFY COLUMN categoria ENUM(
    'Moradia',
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer',
    'Gasto Viagem',
    'Vestuário',
    'Serviços',
    'Poupanca',
    'Viagem',
    'Caixinha',
    'Outros'
  ) DEFAULT 'Outros';

-- 3. Adicionar campo 'data_devolvido' na tabela emprestimos (se nao existir)
ALTER TABLE emprestimos
  ADD COLUMN IF NOT EXISTS data_devolvido DATE DEFAULT NULL;

-- 4. Adicionar campo 'carro' na tabela pagamentos_carro (se nao existir)
ALTER TABLE pagamentos_carro
  ADD COLUMN IF NOT EXISTS carro VARCHAR(50) NULL;

-- 5. Adicionar campos faltantes na tabela consultorias
ALTER TABLE consultorias
  ADD COLUMN IF NOT EXISTS dia_recebimento INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS valor_hora DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS valor_mensal DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Ativa';

-- Atualizar registros existentes de consultorias sem status
UPDATE consultorias SET status = 'Ativa' WHERE status IS NULL;

-- 6. Criar tabelas da caixinha (caixinha_config e caixinha_depositos)
CREATE TABLE IF NOT EXISTS caixinha_config (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL DEFAULT 'Caixinha',
  meta_valor DECIMAL(15,2) NOT NULL DEFAULT 35000.00,
  data_inicio DATE NOT NULL DEFAULT '2026-01-01',
  data_fim DATE NOT NULL DEFAULT '2026-12-31',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS caixinha_depositos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  data DATE NOT NULL,
  valor_planejado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  valor_depositado DECIMAL(15,2) DEFAULT NULL,
  observacao TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_caixinha_depositos_data (data)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configuração padrão da caixinha se não existir
INSERT INTO caixinha_config (id, nome, meta_valor, data_inicio, data_fim)
SELECT UUID(), 'Caixinha 2026', 35000.00, '2026-01-01', '2026-12-31'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM caixinha_config LIMIT 1);

-- 7. Criar tabelas auxiliares (subcategorias, templates_contas, contas_bancarias)
CREATE TABLE IF NOT EXISTS subcategorias (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  categoria VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subcategoria (categoria, nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS templates_contas (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  subcategoria VARCHAR(100) DEFAULT NULL,
  fornecedor VARCHAR(200) DEFAULT NULL,
  valor_padrao DECIMAL(10,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contas_bancarias (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(100) NOT NULL,
  banco VARCHAR(100) DEFAULT NULL,
  agencia VARCHAR(20) DEFAULT NULL,
  conta VARCHAR(30) DEFAULT NULL,
  tipo VARCHAR(30) DEFAULT 'Corrente',
  cor VARCHAR(7) DEFAULT '#3B82F6',
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Criar tabelas de impostos/lançamentos
CREATE TABLE IF NOT EXISTS impostos_descontos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('imposto', 'desconto') NOT NULL,
  aplicavel_a ENUM('PJ', 'CLT', 'Ambos') NOT NULL,
  valor_padrao DECIMAL(10,2) DEFAULT 0,
  tipo_valor ENUM('percentual', 'fixo') DEFAULT 'percentual',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lancamentos_mensais (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  consultoria_id CHAR(36) NOT NULL,
  mes_referencia DATE NOT NULL,
  salario_bruto DECIMAL(12,2) NOT NULL,
  salario_liquido DECIMAL(12,2) DEFAULT NULL,
  observacoes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (consultoria_id) REFERENCES consultorias(id) ON DELETE CASCADE,
  UNIQUE KEY unique_consultoria_mes (consultoria_id, mes_referencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lancamento_itens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  lancamento_id CHAR(36) NOT NULL,
  imposto_desconto_id CHAR(36) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('imposto', 'desconto') NOT NULL,
  tipo_valor ENUM('percentual', 'fixo') NOT NULL,
  valor_aplicado DECIMAL(10,2) NOT NULL,
  resultado DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lancamento_id) REFERENCES lancamentos_mensais(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Adicionar colunas extras na tabela contas (subcategoria e fornecedor)
ALTER TABLE contas
  ADD COLUMN IF NOT EXISTS fornecedor VARCHAR(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subcategoria VARCHAR(100) DEFAULT NULL;

-- 10. Adicionar colunas extras na tabela transacoes (tipo_credito, conta_bancaria_id, recorrente)
ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS tipo_credito VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS conta_bancaria_id CHAR(36) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE;

SELECT 'Schema corrigido com sucesso!' AS status;

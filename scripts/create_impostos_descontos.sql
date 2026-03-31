-- Tabela para cadastro de tipos de impostos e descontos
CREATE TABLE IF NOT EXISTS impostos_descontos (
  id VARCHAR(36) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('imposto', 'desconto') NOT NULL,
  aplicavel_a ENUM('PJ', 'CLT', 'Ambos') NOT NULL,
  valor_padrao DECIMAL(10,2) DEFAULT 0,
  tipo_valor ENUM('percentual', 'fixo') DEFAULT 'percentual',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Inserir impostos PJ padrão
INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES
(UUID(), 'IRPJ', 'imposto', 'PJ', 4.80, 'percentual', TRUE),
(UUID(), 'CSLL', 'imposto', 'PJ', 2.88, 'percentual', TRUE),
(UUID(), 'COFINS', 'imposto', 'PJ', 3.00, 'percentual', TRUE),
(UUID(), 'PIS', 'imposto', 'PJ', 0.65, 'percentual', TRUE);

-- Inserir descontos CLT padrão
INSERT INTO impostos_descontos (id, nome, tipo, aplicavel_a, valor_padrao, tipo_valor, ativo) VALUES
(UUID(), 'INSS', 'desconto', 'CLT', 14.00, 'percentual', TRUE),
(UUID(), 'IRRF', 'desconto', 'CLT', 0.00, 'percentual', TRUE),
(UUID(), 'Plano de Saúde', 'desconto', 'CLT', 0.00, 'fixo', TRUE),
(UUID(), 'Vale Refeição/Alimentação', 'desconto', 'CLT', 0.00, 'fixo', TRUE),
(UUID(), 'Outros Descontos', 'desconto', 'CLT', 0.00, 'fixo', TRUE);

-- Tabela para itens de lançamento (impostos/descontos aplicados)
CREATE TABLE IF NOT EXISTS lancamento_itens (
  id VARCHAR(36) NOT NULL,
  lancamento_id VARCHAR(36) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('imposto', 'desconto') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  percentual DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (lancamento_id) REFERENCES lancamentos_mensais(id) ON DELETE CASCADE
);

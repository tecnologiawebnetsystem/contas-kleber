-- Tabela para lançamentos mensais de salário
CREATE TABLE IF NOT EXISTS lancamentos_mensais (
  id VARCHAR(36) NOT NULL,
  consultoria_id VARCHAR(36) NOT NULL,
  mes_referencia DATE NOT NULL,
  salario_bruto DECIMAL(12,2) NOT NULL,
  salario_liquido DECIMAL(12,2),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (consultoria_id) REFERENCES consultorias(id) ON DELETE CASCADE,
  UNIQUE KEY unique_consultoria_mes (consultoria_id, mes_referencia)
);

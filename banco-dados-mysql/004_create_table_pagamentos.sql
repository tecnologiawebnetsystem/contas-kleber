-- ============================================
-- SCRIPT 004: Tabela de Pagamentos
-- Registra os pagamentos das contas
-- ============================================

USE contas_kleber;

CREATE TABLE IF NOT EXISTS pagamentos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conta_id CHAR(36) NOT NULL,
  mes INT NOT NULL CHECK (mes >= 0 AND mes <= 11),
  ano INT NOT NULL,
  data_pagamento DATE DEFAULT NULL,
  anexo TEXT DEFAULT NULL,
  valor_ajustado DECIMAL(15,2) DEFAULT NULL,
  vencimento_ajustado INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_pagamentos_conta 
    FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE,
  
  CONSTRAINT uk_pagamentos_conta_mes_ano 
    UNIQUE (conta_id, mes, ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para otimização
CREATE INDEX idx_pagamentos_conta ON pagamentos(conta_id);
CREATE INDEX idx_pagamentos_mes_ano ON pagamentos(mes, ano);
CREATE INDEX idx_pagamentos_data ON pagamentos(data_pagamento);

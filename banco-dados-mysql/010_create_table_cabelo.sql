-- ============================================
-- SCRIPT 010: Tabela de Cabelo
-- Controle de agendamentos de luz e progressiva
-- ============================================

USE contas_kleber;

CREATE TABLE IF NOT EXISTS cabelo (
  id               CHAR(36)                    PRIMARY KEY DEFAULT (UUID()),
  tipo             ENUM('luz','progressiva')   NOT NULL,
  numero           TINYINT                     NOT NULL COMMENT 'Numero do servico: 1, 2, 3 ou 4',
  feita            BOOLEAN                     NOT NULL DEFAULT FALSE,
  data_realizada   DATE                        DEFAULT NULL COMMENT 'Data em que o servico foi realizado',
  created_at       TIMESTAMP                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP                   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_cabelo_tipo_numero (tipo, numero),
  INDEX idx_cabelo_tipo   (tipo),
  INDEX idx_cabelo_feita  (feita)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Inserir as 8 linhas iniciais (4 luzes + 4 progressivas)
-- todas marcadas como nao feitas
-- ============================================
INSERT IGNORE INTO cabelo (tipo, numero, feita) VALUES
  ('luz',         1, FALSE),
  ('luz',         2, FALSE),
  ('luz',         3, FALSE),
  ('luz',         4, FALSE),
  ('progressiva', 1, FALSE),
  ('progressiva', 2, FALSE),
  ('progressiva', 3, FALSE),
  ('progressiva', 4, FALSE);

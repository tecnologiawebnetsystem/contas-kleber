-- =====================================================
-- Script para criar tabela de usuários
-- Execute este script no phpMyAdmin da HostGator
-- =====================================================

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    pin VARCHAR(6) NOT NULL UNIQUE,
    perfil INT NOT NULL DEFAULT 2,
    tema VARCHAR(20) DEFAULT 'verde',
    ativo TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para otimização
    INDEX idx_pin (pin),
    INDEX idx_perfil (perfil),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Perfis de acesso:
-- 1 = Acesso Total (administrador)
-- 2 = Consulta (somente visualização)
-- =====================================================

-- Inserir usuário Kleber (perfil 1 - acesso total)
INSERT INTO usuarios (nome, pin, perfil, tema, ativo) 
VALUES ('Kleber Goncalves', '080754', 1, 'verde', 1);

-- Inserir usuário Pamela (perfil 2 - consulta)
INSERT INTO usuarios (nome, pin, perfil, tema, ativo) 
VALUES ('Pamela Goncalves', '191018', 2, 'rosa', 1);

-- =====================================================
-- Verificar se os usuários foram criados corretamente
-- =====================================================
SELECT * FROM usuarios;

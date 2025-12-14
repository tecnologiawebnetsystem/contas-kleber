-- Criar tabela de configurações para notificações por e-mail
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_destino TEXT NOT NULL DEFAULT 'seu-email@exemplo.com',
  notificacoes_ativadas BOOLEAN DEFAULT false,
  notificar_vencimento BOOLEAN DEFAULT true,
  notificar_atraso BOOLEAN DEFAULT true,
  dias_antecedencia INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão se não existir
INSERT INTO configuracoes (email_destino, notificacoes_ativadas, notificar_vencimento, notificar_atraso, dias_antecedencia)
SELECT 'seu-email@exemplo.com', false, true, true, 3
WHERE NOT EXISTS (SELECT 1 FROM configuracoes LIMIT 1);

-- Retornar configuração criada
SELECT * FROM configuracoes LIMIT 1;

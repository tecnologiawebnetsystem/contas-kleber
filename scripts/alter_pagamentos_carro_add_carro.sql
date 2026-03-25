-- Adiciona o campo 'carro' na tabela pagamentos_carro
-- Valores permitidos: 'palio_sporting' | 'volvo_xc60'

ALTER TABLE pagamentos_carro
  ADD COLUMN carro VARCHAR(50) NULL;

-- (Opcional) Se quiser garantir que apenas valores válidos sejam inseridos,
-- adicione uma constraint CHECK:
ALTER TABLE pagamentos_carro
  ADD CONSTRAINT chk_carro CHECK (carro IN ('palio_sporting', 'volvo_xc60'));

-- (Opcional) Atualizar registros existentes sem carro definido,
-- caso precise preencher com um valor padrão:
-- UPDATE pagamentos_carro SET carro = 'palio_sporting' WHERE carro IS NULL;

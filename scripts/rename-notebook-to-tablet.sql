-- Renomear contas de Notebook para Tablet
-- Alterado de 'descricao' para 'nome' que é a coluna correta
UPDATE contas 
SET nome = 'Tablet - Kleber'
WHERE nome = 'Notebook - Kleber';

UPDATE contas 
SET nome = 'Tablet - Pamela'
WHERE nome = 'Notebook - Pamela';

-- Verificar as atualizações
-- Atualizado SELECT para usar 'nome' ao invés de 'descricao' e 'usuario'
SELECT id, nome, categoria, valor 
FROM contas 
WHERE nome LIKE 'Tablet%'
ORDER BY nome;

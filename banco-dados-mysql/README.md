# Banco de Dados MySQL - Sistema de Controle de Contas

## Estrutura dos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `000_script_completo.sql` | Script completo para criar toda a estrutura de uma vez |
| `001_create_database.sql` | Cria o banco de dados |
| `002_create_table_saldo.sql` | Tabela de saldo disponível |
| `003_create_table_contas.sql` | Tabela de contas |
| `004_create_table_pagamentos.sql` | Tabela de pagamentos |
| `005_create_table_transacoes.sql` | Tabela de transações (histórico) |
| `006_create_table_configuracoes.sql` | Tabela de configurações |
| `007_create_table_emprestimos.sql` | Tabela de empréstimos |
| `008_create_table_pagamentos_carro.sql` | Tabela de pagamentos do carro |
| `009_insert_dados_iniciais.sql` | Dados iniciais do sistema |
| `999_limpar_banco.sql` | Script para limpar todos os dados |

## Como Instalar

### Opção 1: Script Completo (Recomendado)

Execute apenas o arquivo `000_script_completo.sql`:

```bash
mysql -u root -p < 000_script_completo.sql
```

### Opção 2: Scripts Individuais

Execute os scripts na ordem numérica:

```bash
mysql -u root -p < 001_create_database.sql
mysql -u root -p contas_kleber < 002_create_table_saldo.sql
mysql -u root -p contas_kleber < 003_create_table_contas.sql
mysql -u root -p contas_kleber < 004_create_table_pagamentos.sql
mysql -u root -p contas_kleber < 005_create_table_transacoes.sql
mysql -u root -p contas_kleber < 006_create_table_configuracoes.sql
mysql -u root -p contas_kleber < 007_create_table_emprestimos.sql
mysql -u root -p contas_kleber < 008_create_table_pagamentos_carro.sql
mysql -u root -p contas_kleber < 009_insert_dados_iniciais.sql
```

## Configuração do Ambiente

1. Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE=contas_kleber
```

## Tabelas do Sistema

### saldo
Controla o saldo disponível do usuário.

### contas
Armazena todas as contas:
- **fixa**: Contas fixas mensais (aluguel, internet, etc.)
- **parcelada**: Compras parceladas
- **diaria**: Gastos diários
- **poupanca**: Depósitos na poupança
- **viagem**: Reservas para viagens

### pagamentos
Registra quando uma conta foi paga.

### transacoes
Histórico de créditos e débitos.

### configuracoes
Configurações do sistema (e-mail, WhatsApp, notificações).

### emprestimos
Controle de dinheiro emprestado a terceiros.

### pagamentos_carro
Controle do financiamento do veículo.

## Requisitos

- MySQL 8.0 ou superior
- Node.js 18+ (para a aplicação)

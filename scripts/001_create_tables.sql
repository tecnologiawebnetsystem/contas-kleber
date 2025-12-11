-- Criar tabela de contas
create table if not exists public.contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor decimal(10, 2) not null,
  vencimento integer not null check (vencimento >= 1 and vencimento <= 31),
  tipo text not null check (tipo in ('fixa', 'parcelada')),
  parcelas integer,
  data_inicio date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Criar tabela de pagamentos
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas(id) on delete cascade,
  mes integer not null check (mes >= 0 and mes <= 11),
  ano integer not null,
  data_pagamento date not null,
  anexo text,
  created_at timestamp with time zone default now(),
  unique(conta_id, mes, ano)
);

-- Criar tabela de configurações
create table if not exists public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  email_destino text not null,
  notificacoes_ativadas boolean default true,
  notificar_vencimento boolean default true,
  notificar_atraso boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilitar Row Level Security
alter table public.contas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.configuracoes enable row level security;

-- Políticas RLS para contas (acesso público para este app simples)
create policy "contas_select_all"
  on public.contas for select
  using (true);

create policy "contas_insert_all"
  on public.contas for insert
  with check (true);

create policy "contas_update_all"
  on public.contas for update
  using (true);

create policy "contas_delete_all"
  on public.contas for delete
  using (true);

-- Políticas RLS para pagamentos
create policy "pagamentos_select_all"
  on public.pagamentos for select
  using (true);

create policy "pagamentos_insert_all"
  on public.pagamentos for insert
  with check (true);

create policy "pagamentos_update_all"
  on public.pagamentos for update
  using (true);

create policy "pagamentos_delete_all"
  on public.pagamentos for delete
  using (true);

-- Políticas RLS para configurações
create policy "configuracoes_select_all"
  on public.configuracoes for select
  using (true);

create policy "configuracoes_insert_all"
  on public.configuracoes for insert
  with check (true);

create policy "configuracoes_update_all"
  on public.configuracoes for update
  using (true);

create policy "configuracoes_delete_all"
  on public.configuracoes for delete
  using (true);

-- Criar índices para melhor performance
create index if not exists idx_contas_tipo on public.contas(tipo);
create index if not exists idx_pagamentos_conta_id on public.pagamentos(conta_id);
create index if not exists idx_pagamentos_mes_ano on public.pagamentos(mes, ano);

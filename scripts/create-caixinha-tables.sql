-- Criar tabela de configuração da caixinha
create table if not exists public.caixinha_config (
  id uuid primary key default gen_random_uuid(),
  meta_valor decimal(10, 2) not null default 35000,
  data_inicio date not null default '2026-01-01',
  data_fim date not null default '2026-12-31',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Criar tabela de depósitos da caixinha
create table if not exists public.caixinha_depositos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  valor_planejado decimal(10, 2) not null,
  valor_depositado decimal(10, 2),
  observacao text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilitar Row Level Security
alter table public.caixinha_config enable row level security;
alter table public.caixinha_depositos enable row level security;

-- Políticas RLS para caixinha_config
create policy "caixinha_config_select_all"
  on public.caixinha_config for select
  using (true);

create policy "caixinha_config_insert_all"
  on public.caixinha_config for insert
  with check (true);

create policy "caixinha_config_update_all"
  on public.caixinha_config for update
  using (true);

create policy "caixinha_config_delete_all"
  on public.caixinha_config for delete
  using (true);

-- Políticas RLS para caixinha_depositos
create policy "caixinha_depositos_select_all"
  on public.caixinha_depositos for select
  using (true);

create policy "caixinha_depositos_insert_all"
  on public.caixinha_depositos for insert
  with check (true);

create policy "caixinha_depositos_update_all"
  on public.caixinha_depositos for update
  using (true);

create policy "caixinha_depositos_delete_all"
  on public.caixinha_depositos for delete
  using (true);

-- Criar índices para melhor performance
create index if not exists idx_caixinha_depositos_data on public.caixinha_depositos(data);

-- Inserir configuração padrão se não existir
insert into public.caixinha_config (meta_valor, data_inicio, data_fim)
select 35000, '2026-01-01', '2026-12-31'
where not exists (select 1 from public.caixinha_config);

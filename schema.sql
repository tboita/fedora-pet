-- Schema do app de monitoramento da Fedora
-- Rodar no SQL Editor do Supabase

create table if not exists alimentacao (
  id uuid primary key default gen_random_uuid(),
  registrado_em timestamptz not null default now(),
  quantidade_colocada numeric,
  quantidade_restante numeric,
  tipo text not null default 'seca' check (tipo in ('seca', 'umida')),
  observacoes text
);

create table if not exists agua (
  id uuid primary key default gen_random_uuid(),
  registrado_em timestamptz not null default now(),
  quantidade_colocada numeric,
  quantidade_restante numeric,
  observacoes text
);

create table if not exists necessidades (
  id uuid primary key default gen_random_uuid(),
  registrado_em timestamptz not null default now(),
  tipo text not null check (tipo in ('coco', 'xixi')),
  consistencia text,
  observacoes text
);

create table if not exists medicamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  dose text,
  frequencia text not null check (frequencia in ('diario', '48h', '30dias')),
  horario_padrao time,
  ativo boolean not null default true,
  proxima_dose timestamptz,
  observacoes text,
  criado_em timestamptz not null default now()
);

create table if not exists medicacao_log (
  id uuid primary key default gen_random_uuid(),
  medicamento_id uuid references medicamentos(id) on delete cascade,
  dado_em timestamptz not null default now(),
  observacoes text
);

create table if not exists peso (
  id uuid primary key default gen_random_uuid(),
  registrado_em timestamptz not null default now(),
  peso_kg numeric not null
);

create table if not exists comportamento (
  id uuid primary key default gen_random_uuid(),
  registrado_em timestamptz not null default now(),
  observacoes text not null
);

-- RLS: app pessoal de um usuário só
alter table alimentacao enable row level security;
alter table agua enable row level security;
alter table necessidades enable row level security;
alter table medicamentos enable row level security;
alter table medicacao_log enable row level security;
alter table peso enable row level security;
alter table comportamento enable row level security;

create policy "allow all alimentacao" on alimentacao for all using (true) with check (true);
create policy "allow all agua" on agua for all using (true) with check (true);
create policy "allow all necessidades" on necessidades for all using (true) with check (true);
create policy "allow all medicamentos" on medicamentos for all using (true) with check (true);
create policy "allow all medicacao_log" on medicacao_log for all using (true) with check (true);
create policy "allow all peso" on peso for all using (true) with check (true);
create policy "allow all comportamento" on comportamento for all using (true) with check (true);

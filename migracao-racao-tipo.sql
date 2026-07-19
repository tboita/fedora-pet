-- Migração: adiciona o tipo de ração (seca/úmida) na tabela de alimentação
-- Rodar no SQL Editor do Supabase (projeto que já está em uso)

alter table alimentacao
  add column if not exists tipo text not null default 'seca' check (tipo in ('seca', 'umida'));

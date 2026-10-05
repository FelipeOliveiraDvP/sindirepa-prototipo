-- ============================================================
-- leads — captura de e-mail (lista de espera e calculadora)
-- Consumida por src/lib/data/leads.ts
-- ============================================================

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  origem        text not null,
  consentimento boolean not null default false,
  criado_em     timestamptz not null default now(),
  unique (email, origem)
);

-- LGPD: o consentimento vive no MESMO registro do e-mail. Guardar
-- contato sem o registro do consentimento que o autorizou é o que a lei
-- não perdoa, e separar em tabelas convida as duas coisas a divergirem.
comment on column public.leads.consentimento is
  'Consentimento LGPD dado no ato da captura. Nunca preencher por padrão.';

alter table public.leads enable row level security;

-- Sem policy, de propósito: RLS ligado e nenhuma policy = ninguém lê nem
-- escreve com a chave anônima. Só a service role (que ignora RLS) grava,
-- e só através de Server Action. E-mail de lead não pode ser legível
-- pelo navegador em hipótese nenhuma.

-- ============================================================
-- calculos_anonimos — base do benchmark regional
-- Consumida por src/lib/data/calculos.ts
-- Regras em docs/saas/09-benchmark.md
-- ============================================================

create table if not exists public.calculos_anonimos (
  id                  uuid primary key default gen_random_uuid(),

  -- Identificador efêmero de sessão. NÃO é usuário e não persiste entre
  -- visitas. Existe só para deduplicar.
  sessao              text not null,

  segmento            text not null check (segmento in ('mecanica', 'funilaria')),

  -- Id de src/lib/regioes.ts. NULL quando o usuário não informou ou
  -- marcou "outra" — esses cálculos não entram em recorte regional.
  regiao              text,

  origem              text not null,

  custo_real_unidade  numeric not null check (custo_real_unidade > 0),
  preco_sugerido      numeric not null check (preco_sugerido > 0),
  ponto_equilibrio    numeric not null check (ponto_equilibrio > 0),
  unidades_produtivas numeric not null check (unidades_produtivas > 0),
  ocupacao            numeric not null check (ocupacao > 0 and ocupacao <= 1),
  custo_total_mensal  numeric not null check (custo_total_mensal >= 0),

  criado_em           timestamptz not null default now(),

  -- UMA SESSÃO = UM REGISTRO. Quem mexe nos sliders dez vezes conta uma
  -- na amostra. Sem isso o usuário mais curioso pesa dez vezes mais que
  -- o mais decidido, e enviesa a mediana da região inteira.
  unique (sessao)
);

-- O recorte de agregação do benchmark é sempre região × segmento.
-- Nunca misturar hora de mecânica com UT de funilaria.
create index if not exists calculos_anonimos_recorte_idx
  on public.calculos_anonimos (regiao, segmento);

comment on table public.calculos_anonimos is
  'Uso anônimo da calculadora. NUNCA gravar nome, e-mail, CNPJ, telefone '
  'ou nome da oficina aqui. É dado de negócio agregável, não dado pessoal.';

alter table public.calculos_anonimos enable row level security;

-- Sem policy: só a service role escreve, via Server Action.
--
-- ⬜ FASE 5: a leitura do benchmark NÃO deve ser um select direto nesta
-- tabela. Criar uma view ou function agregadora que devolva mediana,
-- quartis e N — e que retorne vazio abaixo do N mínimo. Assim a regra de
-- 09-benchmark.md fica garantida pelo banco, e nenhum bug de cliente
-- consegue vazar faixa de mercado com amostra pequena.
-- O N mínimo (proposta: 30 para faixa, 10 para posição) precisa da
-- confirmação do Felipe antes de virar código.

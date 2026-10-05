-- ============================================================
-- Conta e configuração da oficina — entidades de docs/geral/06-dados.md
--
-- ⚠️ A migration 300 revogou os default privileges do schema public.
-- Por isso TODA tabela aqui traz um GRANT explícito para `authenticated`,
-- e cada GRANT vem acompanhado das policies que restringem as linhas.
-- Grant sem policy não expõe nada (RLS nega por omissão), mas policy
-- sem grant quebra a aplicação em silêncio — os dois andam juntos.
--
-- `anon` NÃO recebe grant em nada aqui. Desde a Leva 3 a calculadora
-- exige conta; deslogado só vê a landing e a prévia de três campos do
-- herói, que não toca nenhuma destas tabelas.
-- ============================================================

-- ── Oficina ─────────────────────────────────────────────────
create table if not exists public.oficinas (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  cnpj      text,
  -- Id de src/lib/regioes.ts. NULL = não informado.
  cidade    text,
  uf        text not null default 'SP',
  segmento  text not null default 'mecanica'
              check (segmento in ('mecanica', 'funilaria')),
  criado_em timestamptz not null default now()
);

-- ── Usuário ─────────────────────────────────────────────────
-- Estende auth.users com o vínculo à oficina. A identidade (e-mail,
-- senha, confirmação) fica inteira no schema auth do Supabase: senha
-- não é problema que este projeto deva resolver sozinho.
create table if not exists public.usuarios (
  id         uuid primary key references auth.users(id) on delete cascade,
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  nome       text,
  papel      text not null default 'dono' check (papel in ('dono', 'gestor')),
  criado_em  timestamptz not null default now()
);

create index if not exists usuarios_oficina_idx on public.usuarios (oficina_id);

-- ── Produtivo ───────────────────────────────────────────────
create table if not exists public.produtivos (
  id                  uuid primary key default gen_random_uuid(),
  oficina_id          uuid not null references public.oficinas(id) on delete cascade,
  nome                text,
  salario_bruto       numeric not null default 0 check (salario_bruto >= 0),
  percentual_encargos numeric not null default 0.8 check (percentual_encargos >= 0),
  ativo               boolean not null default true
);

create index if not exists produtivos_oficina_idx on public.produtivos (oficina_id);

-- ── Custo fixo ──────────────────────────────────────────────
create table if not exists public.custos_fixos (
  id           uuid primary key default gen_random_uuid(),
  oficina_id   uuid not null references public.oficinas(id) on delete cascade,
  categoria    text not null,
  descricao    text,
  valor_mensal numeric not null default 0 check (valor_mensal >= 0),
  ativo        boolean not null default true
);

create index if not exists custos_fixos_oficina_idx on public.custos_fixos (oficina_id);

-- ── Configuração de cálculo — VERSIONADA ────────────────────
-- 06-dados.md: "Nunca sobrescrever: criar nova versão. Os módulos
-- posteriores dependem de snapshot histórico."
--
-- A regra é aplicada pelo BANCO: não há policy de UPDATE nem de DELETE
-- nesta tabela. Salvar sempre insere. Assim a promessa de histórico não
-- depende de ninguém lembrar dela na camada de aplicação.
create table if not exists public.configuracoes_calculo (
  id                         uuid primary key default gen_random_uuid(),
  oficina_id                 uuid not null references public.oficinas(id) on delete cascade,
  labor_cost_model_id        text not null default 'salario_fixo'
                               check (labor_cost_model_id in ('salario_fixo', 'comissao')),
  work_unit                  text not null check (work_unit in ('hora', 'UT')),
  dias_uteis_mes             numeric not null check (dias_uteis_mes > 0),
  unidades_por_dia           numeric not null check (unidades_por_dia > 0),
  ocupacao                   numeric not null check (ocupacao > 0 and ocupacao <= 1),
  impostos_sobre_faturamento numeric not null check (impostos_sobre_faturamento >= 0),
  margem_desejada            numeric not null check (margem_desejada >= 0),
  preco_unidade_atual        numeric check (preco_unidade_atual >= 0),

  -- ── SNAPSHOT DO RESULTADO ────────────────────────────────────
  -- 06-dados.md: "os módulos posteriores dependem de snapshot
  -- histórico". Sem estas colunas o histórico seria irreconstruível:
  -- os parâmetros são versionados, mas `produtivos` e `custos_fixos`
  -- guardam só o estado atual. Recalcular uma versão antiga com a
  -- equipe de hoje produziria um número que nunca existiu.
  --
  -- Gravar o resultado no momento do salvamento é o que torna a série
  -- do painel verdadeira. São dado derivado, e é exatamente por isso
  -- que precisam ser congelados.
  custo_real_unidade         numeric check (custo_real_unidade > 0),
  preco_unidade_sugerido     numeric check (preco_unidade_sugerido > 0),
  ponto_de_equilibrio        numeric check (ponto_de_equilibrio > 0),
  unidades_produtivas        numeric check (unidades_produtivas > 0),

  criado_em                  timestamptz not null default now(),

  -- Impostos + margem >= 100% estoura o cálculo (divisor <= 0). O mesmo
  -- bloqueio de validate.ts, agora também no banco: configuração inválida
  -- não pode ser persistida nem por bug de aplicação.
  constraint divisor_positivo
    check (impostos_sobre_faturamento + margem_desejada < 1)
);

create index if not exists configuracoes_oficina_idx
  on public.configuracoes_calculo (oficina_id, criado_em desc);

-- ============================================================
--  RLS — cada oficina só enxerga a si mesma
-- ============================================================

/**
 * A oficina do usuário logado.
 *
 * SECURITY DEFINER de propósito: as policies de `usuarios` não podem
 * depender de uma consulta a `usuarios` sem entrar em recursão. A
 * função roda com o privilégio do dono, lê uma linha e devolve um uuid.
 *
 * `search_path` fixo e vazio: função SECURITY DEFINER sem search_path
 * travado é vetor clássico de escalonamento — um schema malicioso no
 * caminho sequestraria a resolução dos nomes.
 */
create or replace function public.oficina_do_usuario()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select oficina_id from public.usuarios where id = auth.uid();
$$;

revoke all on function public.oficina_do_usuario() from public, anon;
grant execute on function public.oficina_do_usuario() to authenticated;

alter table public.oficinas              enable row level security;
alter table public.usuarios              enable row level security;
alter table public.produtivos            enable row level security;
alter table public.custos_fixos          enable row level security;
alter table public.configuracoes_calculo enable row level security;

-- ── oficinas ────────────────────────────────────────────────
create policy oficinas_leitura on public.oficinas
  for select to authenticated
  using (id = public.oficina_do_usuario());

create policy oficinas_alteracao on public.oficinas
  for update to authenticated
  using (id = public.oficina_do_usuario())
  with check (id = public.oficina_do_usuario());

-- Sem policy de INSERT: a oficina nasce junto com o usuário, num
-- fluxo de servidor (service role). Deixar o cliente criar oficina
-- solta abriria caminho para lixo na base sem dono.

-- ── usuarios ────────────────────────────────────────────────
create policy usuarios_leitura on public.usuarios
  for select to authenticated
  using (id = auth.uid());

create policy usuarios_alteracao on public.usuarios
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── produtivos, custos_fixos: CRUD dentro da própria oficina ─
create policy produtivos_tudo on public.produtivos
  for all to authenticated
  using (oficina_id = public.oficina_do_usuario())
  with check (oficina_id = public.oficina_do_usuario());

create policy custos_fixos_tudo on public.custos_fixos
  for all to authenticated
  using (oficina_id = public.oficina_do_usuario())
  with check (oficina_id = public.oficina_do_usuario());

-- ── configuracoes_calculo: só ler e inserir ─────────────────
-- A ausência de policy de UPDATE/DELETE é o que torna o versionamento
-- uma garantia e não uma convenção.
create policy configuracoes_leitura on public.configuracoes_calculo
  for select to authenticated
  using (oficina_id = public.oficina_do_usuario());

create policy configuracoes_insercao on public.configuracoes_calculo
  for insert to authenticated
  with check (oficina_id = public.oficina_do_usuario());

-- ============================================================
--  GRANTS — necessários porque a migration 300 revogou os defaults
-- ============================================================
grant select, update         on public.oficinas              to authenticated;
grant select, update         on public.usuarios              to authenticated;
grant select, insert, update, delete on public.produtivos    to authenticated;
grant select, insert, update, delete on public.custos_fixos  to authenticated;
grant select, insert         on public.configuracoes_calculo to authenticated;

-- `anon` fica de fora de todas. Visitante deslogado não lê nada disso.

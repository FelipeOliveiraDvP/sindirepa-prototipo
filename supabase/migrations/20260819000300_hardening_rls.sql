-- ============================================================
-- Endurecimento de acesso — defesa em profundidade
--
-- RLS já está ligado nas duas tabelas, sem nenhuma policy, o que por si
-- só nega tudo para `anon` e `authenticated`. Esta migration existe
-- para o caso em que RLS seja desligado por acidente — um clique no
-- painel, um `alter table ... disable row level security` num script.
--
-- Sem os REVOKE abaixo, esse acidente expõe a tabela inteira à chave
-- anônima, que roda no navegador de qualquer visitante. Com eles, o
-- acidente não basta: seria preciso desligar RLS E conceder grant.
-- ============================================================

-- O Supabase concede privilégios a anon/authenticated em toda tabela
-- nova do schema public. Estas tabelas não são para o cliente: elas são
-- escritas exclusivamente por Server Action, com a service role.
revoke all on public.leads from anon, authenticated;
revoke all on public.calculos_anonimos from anon, authenticated;

-- Mesma proteção para tabelas FUTURAS deste schema.
--
-- ⚠️ FASE 4: a partir daqui, tabela nova nasce SEM acesso do cliente.
-- Quando entrarem as tabelas de conta e configuração da oficina — que
-- o usuário logado precisa ler e escrever — cada uma vai exigir um
-- GRANT explícito, acompanhado das policies de RLS que restringem cada
-- linha ao dono dela.
--
-- Isso é de propósito: privilégio explícito por tabela é chato de
-- escrever uma vez e barato de auditar para sempre. O padrão inverso
-- vaza dado no dia em que alguém criar uma tabela sem pensar.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;

-- ────────────────────────────────────────────────────────────
-- NÃO aplicado, e o motivo:
--
--   alter table public.leads force row level security;
--
-- FORCE faz o RLS valer também para o DONO da tabela. A service role
-- tem BYPASSRLS e continuaria escrevendo normalmente, então a aplicação
-- não quebraria — mas o editor de tabelas do painel do Supabase pode
-- deixar de listar as linhas, e perder a inspeção visual do banco custa
-- mais do que o ganho marginal de segurança neste momento.
--
-- Revisar quando houver dado de verdade em produção.
-- ────────────────────────────────────────────────────────────

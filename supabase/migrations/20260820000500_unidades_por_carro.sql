-- Ponto de equilíbrio em carros atendidos.
--
-- `unidades_por_carro` é a média de unidades de trabalho que a oficina
-- fatura por carro. Não entra em nenhum dos 7 passos de
-- docs/geral/06-dados.md: é um divisor que o painel aplica sobre o
-- resultado, para dizer o equilíbrio em carros além de em unidades.
--
-- NULLABLE E SEM DEFAULT, de propósito. Não existe média plausível para
-- chutar — varia demais entre revisão de mecânica e colisão de
-- funilaria —, e um default aqui viraria número inventado exibido como
-- se o dono tivesse informado (CLAUDE.md, regra 4). Ausente significa
-- ausente, e o painel mostra estado vazio.
--
-- `configuracoes_calculo` é insert-only (migration 400): não há UPDATE
-- nem backfill a fazer. As versões antigas ficam com NULL, que é a
-- verdade sobre elas — o campo não existia quando foram salvas.

alter table public.configuracoes_calculo
  add column if not exists unidades_por_carro numeric;

comment on column public.configuracoes_calculo.unidades_por_carro is
  'Média de unidades de trabalho faturadas por carro atendido. NULL = não informado. Só o painel lê.';

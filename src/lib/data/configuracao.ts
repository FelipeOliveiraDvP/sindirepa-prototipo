import type { SupabaseClient } from "@supabase/supabase-js";
import { agregadoPadrao, paraCalculoInput, type EntradaAgregada } from "@/lib/pricing/aggregate";
import { calcular } from "@/lib/pricing/calculate";
import { definicaoDoSegmento, ehSegmento, SEGMENTO_PADRAO } from "@/lib/pricing/segmento";
import type { CustoFixo } from "@/lib/pricing/types";

/**
 * Configuração de cálculo da oficina.
 *
 * ═══ CLIENTE DE SESSÃO, NÃO SERVICE ROLE ═══
 * Todas as funções recebem o cliente do usuário logado. Isso faz cada
 * consulta passar pelas policies de RLS da migration 400 — se uma
 * policy estiver errada, a operação falha em vez de vazar dado de outra
 * oficina. Ler dado de usuário com privilégio total transformaria
 * qualquer descuido de `where` num vazamento entre oficinas.
 *
 * ═══ VERSIONAMENTO ═══
 * `configuracoes_calculo` só aceita INSERT e SELECT — não existe policy
 * de UPDATE nem de DELETE. Salvar cria uma versão nova; a leitura pega
 * a mais recente. 06-dados.md exige o histórico porque os módulos
 * seguintes dependem de snapshot.
 *
 * `produtivos` e `custos_fixos` NÃO são versionados: são o estado atual
 * da oficina, e a foto histórica que importa está na configuração.
 */

export type ConfiguracaoSalva = {
  entrada: EntradaAgregada;
  atualizadoEm: string | null;
};

export async function salvarConfiguracao(
  db: SupabaseClient,
  oficinaId: string,
  entrada: EntradaAgregada,
): Promise<void> {
  const def = definicaoDoSegmento(entrada.segmento);

  // Segmento vive na oficina, não na configuração: ele identifica o
  // negócio, não um cenário de cálculo.
  const { error: erroOficina } = await db
    .from("oficinas")
    .update({ segmento: entrada.segmento })
    .eq("id", oficinaId);
  if (erroOficina) throw new Error(`Falha ao salvar segmento: ${erroOficina.message}`);

  // A interface pergunta quantidade e média; o banco guarda um a um
  // (06-dados.md). A expansão é a mesma de paraCalculoInput, então o
  // número não muda ao salvar.
  const quantidade = Math.max(0, Math.trunc(entrada.quantidadeProdutivos));
  await db.from("produtivos").delete().eq("oficina_id", oficinaId);
  if (quantidade > 0) {
    const { error } = await db.from("produtivos").insert(
      Array.from({ length: quantidade }, () => ({
        oficina_id: oficinaId,
        salario_bruto: entrada.salarioMedio,
        percentual_encargos: entrada.percentualEncargos,
        ativo: true,
      })),
    );
    if (error) throw new Error(`Falha ao salvar equipe: ${error.message}`);
  }

  await db.from("custos_fixos").delete().eq("oficina_id", oficinaId);
  if (entrada.custosFixos.length > 0) {
    const { error } = await db.from("custos_fixos").insert(
      entrada.custosFixos.map((c) => ({
        oficina_id: oficinaId,
        categoria: c.categoria,
        descricao: c.descricao ?? null,
        valor_mensal: c.valorMensal,
        ativo: c.ativo !== false,
      })),
    );
    if (error) throw new Error(`Falha ao salvar custos fixos: ${error.message}`);
  }

  /**
   * Snapshot do resultado, congelado no momento do salvamento.
   *
   * POR QUE GRAVAR DADO DERIVADO: `produtivos` e `custos_fixos` guardam
   * só o estado ATUAL — não são versionados. Recalcular uma configuração
   * de três meses atrás com a equipe de hoje produziria um número que
   * nunca existiu. A série do painel só é verdadeira porque o resultado
   * é congelado aqui.
   *
   * Quando o cálculo não fecha (falta salário, por exemplo), grava nulo:
   * a configuração vale, o resultado é que não existe ainda.
   */
  const resultado = calcular(paraCalculoInput(entrada), { segmento: entrada.segmento });
  const snapshot = resultado.ok
    ? {
        custo_real_unidade: resultado.resultado.custoRealUnidade,
        preco_unidade_sugerido: resultado.resultado.precoUnidadeSugerido,
        ponto_de_equilibrio: resultado.resultado.pontoDeEquilibrio,
        unidades_produtivas: resultado.resultado.unidadesProdutivas,
      }
    : {};

  const { error: erroConfig } = await db.from("configuracoes_calculo").insert({
    oficina_id: oficinaId,
    labor_cost_model_id: "salario_fixo",
    work_unit: def.unidade,
    dias_uteis_mes: entrada.diasUteisMes,
    unidades_por_dia: entrada.unidadesPorDia,
    ocupacao: entrada.ocupacao,
    impostos_sobre_faturamento: entrada.impostosSobreFaturamento,
    margem_desejada: entrada.margemDesejada,
    preco_unidade_atual: entrada.precoUnidadeAtual > 0 ? entrada.precoUnidadeAtual : null,
    // Não informado grava NULL, nunca 0: 0 carro por unidade não é um fato
    // sobre a oficina, é a ausência do dado.
    unidades_por_carro: entrada.unidadesPorCarro > 0 ? entrada.unidadesPorCarro : null,
    ...snapshot,
  });
  if (erroConfig) throw new Error(`Falha ao salvar configuração: ${erroConfig.message}`);
}

/**
 * Última configuração salva, reconstruída na forma que a interface usa.
 *
 * Devolve `null` quando a oficina ainda não salvou nada — quem chama
 * decide o que fazer, e a decisão é começar dos padrões, nunca de zeros.
 */
export async function carregarConfiguracao(
  db: SupabaseClient,
  oficinaId: string,
): Promise<ConfiguracaoSalva | null> {
  const { data: config } = await db
    .from("configuracoes_calculo")
    .select("*")
    .eq("oficina_id", oficinaId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!config) return null;

  const { data: oficina } = await db
    .from("oficinas")
    .select("segmento")
    .eq("id", oficinaId)
    .maybeSingle();

  const segmento = ehSegmento(oficina?.segmento) ? oficina.segmento : SEGMENTO_PADRAO;

  const { data: produtivos } = await db
    .from("produtivos")
    .select("salario_bruto, percentual_encargos, ativo")
    .eq("oficina_id", oficinaId);

  const { data: custos } = await db
    .from("custos_fixos")
    .select("categoria, descricao, valor_mensal, ativo")
    .eq("oficina_id", oficinaId);

  const ativos = (produtivos ?? []).filter((p) => p.ativo !== false);

  // Média, não soma: a interface pergunta salário médio. Com todos os
  // salários iguais — que é o caso de quem preencheu pela calculadora —
  // a média devolve exatamente o valor digitado.
  const salarioMedio =
    ativos.length > 0
      ? ativos.reduce((acc, p) => acc + Number(p.salario_bruto), 0) / ativos.length
      : 0;

  const custosFixos: CustoFixo[] = (custos ?? []).map((c) => ({
    categoria: c.categoria,
    descricao: c.descricao ?? undefined,
    valorMensal: Number(c.valor_mensal),
    ativo: c.ativo !== false,
  }));

  const padrao = agregadoPadrao(segmento);

  return {
    atualizadoEm: config.criado_em ?? null,
    entrada: {
      segmento,
      quantidadeProdutivos: ativos.length,
      salarioMedio,
      percentualEncargos:
        ativos.length > 0 ? Number(ativos[0].percentual_encargos) : padrao.percentualEncargos,
      diasUteisMes: Number(config.dias_uteis_mes),
      unidadesPorDia: Number(config.unidades_por_dia),
      ocupacao: Number(config.ocupacao),
      custosFixos: custosFixos.length > 0 ? custosFixos : padrao.custosFixos,
      impostosSobreFaturamento: Number(config.impostos_sobre_faturamento),
      margemDesejada: Number(config.margem_desejada),
      precoUnidadeAtual: config.preco_unidade_atual ? Number(config.preco_unidade_atual) : 0,
      unidadesPorCarro: config.unidades_por_carro ? Number(config.unidades_por_carro) : 0,
    },
  };
}

export type PontoDoHistorico = {
  criadoEm: string;
  custoRealUnidade: number;
  precoUnidadeSugerido: number;
};

/**
 * Série do custo ao longo do tempo, para o painel.
 *
 * Lê o SNAPSHOT gravado em cada versão, nunca recalcula. Recalcular uma
 * configuração antiga com a equipe e os custos de hoje produziria um
 * número que nunca existiu — e a série inteira viraria ficção.
 *
 * Versões sem snapshot (salvas antes de o cálculo fechar) são
 * descartadas: um ponto sem valor não é zero, é ausência.
 */
export async function carregarHistorico(
  db: SupabaseClient,
  oficinaId: string,
  limite = 24,
): Promise<PontoDoHistorico[]> {
  const { data } = await db
    .from("configuracoes_calculo")
    .select("criado_em, custo_real_unidade, preco_unidade_sugerido")
    .eq("oficina_id", oficinaId)
    .not("custo_real_unidade", "is", null)
    .order("criado_em", { ascending: false })
    .limit(limite);

  return (data ?? [])
    .map((v) => ({
      criadoEm: v.criado_em as string,
      custoRealUnidade: Number(v.custo_real_unidade),
      precoUnidadeSugerido: Number(v.preco_unidade_sugerido),
    }))
    .reverse();
}

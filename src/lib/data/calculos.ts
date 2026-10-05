import type { Origem } from "@/lib/analytics/events";
import type { Segmento } from "@/lib/pricing/segmento";
import { ArmazenamentoIndisponivelError } from "./erros";
import { supabase } from "./supabase";

/**
 * Cálculo anônimo — o ativo de pesquisa de mercado do produto.
 *
 * ═══ POR QUE ISTO EXISTE ANTES DA TELA QUE O USA ═══
 * É a base do benchmark regional (docs/saas/09-benchmark.md), que só
 * pode mostrar faixa acima de um N mínimo por região e segmento. A base
 * nasce vazia, então cada semana sem gravar é amostra perdida — a
 * gravação entra bem antes de /benchmark existir, de propósito.
 *
 * Tabela esperada no Supabase:
 *
 *   create table public.calculos_anonimos (
 *     id                  uuid primary key default gen_random_uuid(),
 *     sessao              text not null,
 *     segmento            text not null,
 *     regiao              text,
 *     origem              text not null,
 *     custo_real_unidade  numeric not null,
 *     preco_sugerido      numeric not null,
 *     ponto_equilibrio    numeric not null,
 *     unidades_produtivas numeric not null,
 *     ocupacao            numeric not null,
 *     custo_total_mensal  numeric not null,
 *     criado_em           timestamptz not null default now(),
 *     unique (sessao)
 *   );
 *   alter table public.calculos_anonimos enable row level security;
 *   -- Sem policy: só a service role escreve, via Server Action.
 *
 * ⚠️ LGPD — o que NÃO entra aqui:
 * nome, e-mail, CNPJ, telefone, endereço, nome da oficina. Nada que
 * identifique. 06-dados.md exige consentimento explícito só para
 * `CalculoAnonimo` COM e-mail, e este registro nunca carrega e-mail —
 * é dado de negócio agregável, não dado pessoal.
 *
 * ⚠️ `unique (sessao)`: um usuário que recalcula dez vezes conta UMA
 * na amostra. Sem isso, quem brinca com os sliders enviesa o N e a
 * mediana da região inteira.
 */

export type CalculoAnonimo = {
  /** Identificador efêmero de sessão. Não é usuário, não persiste entre visitas. */
  sessao: string;
  segmento: Segmento;
  /** Id de lib/regioes.ts. Vazio quando não informado — não agrega. */
  regiao: string;
  origem: Origem;
  custoRealUnidade: number;
  precoUnidadeSugerido: number;
  pontoDeEquilibrio: number;
  unidadesProdutivas: number;
  ocupacao: number;
  custoTotalMensal: number;
};

/**
 * Grava o cálculo. Diferente de `registrarLead`, NÃO lança para o
 * usuário: isto é coleta de pesquisa em segundo plano, e falhar aqui
 * não pode atrapalhar quem está usando a calculadora. Quem chama loga
 * e segue.
 */
export async function registrarCalculoAnonimo(calculo: CalculoAnonimo): Promise<void> {
  if (!supabase) {
    throw new ArmazenamentoIndisponivelError();
  }

  const { error } = await supabase.from("calculos_anonimos").upsert(
    {
      sessao: calculo.sessao,
      segmento: calculo.segmento,
      regiao: calculo.regiao || null,
      origem: calculo.origem,
      custo_real_unidade: calculo.custoRealUnidade,
      preco_sugerido: calculo.precoUnidadeSugerido,
      ponto_equilibrio: calculo.pontoDeEquilibrio,
      unidades_produtivas: calculo.unidadesProdutivas,
      ocupacao: calculo.ocupacao,
      custo_total_mensal: calculo.custoTotalMensal,
    },
    // Reenvio da mesma sessão sobrescreve: vale o cálculo mais maduro,
    // não o primeiro rascunho.
    { onConflict: "sessao" },
  );

  if (error) {
    throw new Error(`Falha ao registrar cálculo anônimo: ${error.message}`);
  }
}

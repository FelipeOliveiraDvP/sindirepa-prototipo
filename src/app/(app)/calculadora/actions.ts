"use server";

import type { Origem } from "@/lib/analytics/events";
import { registrarCalculoAnonimo } from "@/lib/data/calculos";
import { ehSegmento } from "@/lib/pricing/segmento";

/**
 * Server Action que grava o cálculo anônimo.
 *
 * ⚠️ SILENCIOSA POR DESIGN. Falha aqui não pode virar mensagem para
 * quem está calculando: é coleta de pesquisa em segundo plano, e o
 * usuário não pediu por ela. Erro vai para o log do servidor e o
 * cálculo dele continua funcionando normalmente.
 *
 * ⚠️ Nada aqui carrega dado de contato nem identifica a oficina. O
 * `sessao` é efêmero e não é usuário.
 */

type Payload = {
  sessao: string;
  segmento: string;
  regiao: string;
  origem: Origem;
  custoRealUnidade: number;
  precoUnidadeSugerido: number;
  pontoDeEquilibrio: number;
  unidadesProdutivas: number;
  ocupacao: number;
  custoTotalMensal: number;
};

/** Números vindos do cliente são revalidados: payload é entrada não confiável. */
function finito(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

export async function guardarCalculoAnonimo(payload: Payload): Promise<void> {
  if (!payload?.sessao || !ehSegmento(payload.segmento)) return;

  const numeros = {
    custoRealUnidade: finito(payload.custoRealUnidade),
    precoUnidadeSugerido: finito(payload.precoUnidadeSugerido),
    pontoDeEquilibrio: finito(payload.pontoDeEquilibrio),
    unidadesProdutivas: finito(payload.unidadesProdutivas),
    ocupacao: finito(payload.ocupacao),
    custoTotalMensal: finito(payload.custoTotalMensal),
  };

  // Um NaN ou Infinity contamina a mediana da região inteira. Descartar
  // o registro é sempre melhor que agregar lixo.
  if (Object.values(numeros).some((n) => n === null)) return;

  try {
    await registrarCalculoAnonimo({
      sessao: payload.sessao,
      segmento: payload.segmento,
      regiao: payload.regiao,
      origem: payload.origem,
      ...(numeros as Record<keyof typeof numeros, number>),
    });
  } catch (erro) {
    console.error("[calculo-anonimo]", erro instanceof Error ? erro.message : erro);
  }
}

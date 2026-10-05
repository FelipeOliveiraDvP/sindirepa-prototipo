import type { EntradaAgregada } from "./aggregate";

/**
 * Cenários do simulador `/e-se`. Cada função devolve uma NOVA
 * `EntradaAgregada` — a mesma forma que a calculadora já usa — pronta
 * para `paraCalculoInput()` e `calcular()`.
 *
 * Vive em `lib/pricing` e não no componente por causa da restrição de
 * docs/saas/03-telas.md, seção 7: "nenhuma fórmula nova — se aparecer
 * aritmética fora de `lib/pricing` para o simulador, é bug". Multiplicar
 * um percentual ou somar um delta de pontos é aritmética, então mora
 * aqui, testável sem montar componente — mesmo padrão de
 * `aggregate.ts`.
 *
 * Cada função é pura e não altera a entrada recebida.
 */

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Contratar (ou dispensar) N produtivos, com o mesmo salário médio de hoje. */
export function cenarioProdutivoExtra(
  entrada: EntradaAgregada,
  quantidadeExtra: number,
): EntradaAgregada {
  return {
    ...entrada,
    quantidadeProdutivos: Math.max(0, entrada.quantidadeProdutivos + quantidadeExtra),
  };
}

/** Uma categoria de custo fixo sobe (ou cai) um percentual sobre o valor de hoje. */
export function cenarioCustoFixoMuda(
  entrada: EntradaAgregada,
  categoria: string,
  percentual: number,
): EntradaAgregada {
  return {
    ...entrada,
    custosFixos: entrada.custosFixos.map((c) =>
      c.categoria === categoria ? { ...c, valorMensal: c.valorMensal * (1 + percentual) } : c,
    ),
  };
}

/** Taxa de ocupação sobe ou desce N pontos percentuais. Nunca sai de ]0, 1]. */
export function cenarioOcupacaoMuda(
  entrada: EntradaAgregada,
  deltaPontos: number,
): EntradaAgregada {
  return { ...entrada, ocupacao: clamp(entrada.ocupacao + deltaPontos, 0.01, 1) };
}

/** Salário médio sobe ou desce um percentual sobre o valor de hoje. */
export function cenarioSalarioMuda(
  entrada: EntradaAgregada,
  percentual: number,
): EntradaAgregada {
  return { ...entrada, salarioMedio: Math.max(0, entrada.salarioMedio * (1 + percentual)) };
}

/** Margem desejada sobe ou desce N pontos percentuais. Nunca sai de [0, 0.9]. */
export function cenarioMargemMuda(entrada: EntradaAgregada, deltaPontos: number): EntradaAgregada {
  return { ...entrada, margemDesejada: clamp(entrada.margemDesejada + deltaPontos, 0, 0.9) };
}

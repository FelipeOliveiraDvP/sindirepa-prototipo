import { somarReais } from "./money";
import type { CalculoResultado, CustoFixo } from "./types";

/**
 * Análises do painel — todas derivadas do MESMO `CalculoResultado` que a
 * calculadora produz. Nenhuma delas introduz número novo: são leituras
 * diferentes da mesma conta (docs/geral/06-dados.md).
 *
 * Funções puras, sem React — mesmo padrão de calculate.ts. O painel só
 * formata e rotula.
 */

export type PesoCategoria = {
  categoria: string;
  /** R$ por unidade de trabalho. */
  valorPorUnidade: number;
  /** Fração do CUSTO total (mão de obra + custos fixos) — soma 1 na lista inteira. */
  fracaoDoCusto: number;
};

/**
 * Para onde vai o dinheiro: mão de obra e cada categoria de custo fixo
 * ativa, ordenadas da maior para a menor. Categorias em R$ 0 não entram
 * — pesar 0% não ensina nada.
 *
 * Soma das frações sempre 1 (100%), porque `total` é a mesma soma que
 * compõe os itens — é o invariante que o teste cobra.
 */
export function pesosPorCategoria(
  custoMaoDeObra: number,
  rotuloMaoDeObra: string,
  custosFixos: CustoFixo[],
  unidadesProdutivas: number,
): PesoCategoria[] {
  const fixosAtivos = custosFixos.filter((c) => c.ativo !== false && c.valorMensal > 0);
  const total = somarReais([custoMaoDeObra, ...fixosAtivos.map((c) => c.valorMensal)]);

  if (total <= 0 || unidadesProdutivas <= 0) return [];

  const itens = [
    { categoria: rotuloMaoDeObra, valorMensal: custoMaoDeObra },
    ...fixosAtivos.map((c) => ({ categoria: c.categoria, valorMensal: c.valorMensal })),
  ];

  return itens
    .map((item) => ({
      categoria: item.categoria,
      valorPorUnidade: item.valorMensal / unidadesProdutivas,
      fracaoDoCusto: item.valorMensal / total,
    }))
    .sort((a, b) => b.fracaoDoCusto - a.fracaoDoCusto);
}

export type Alavanca = {
  categoria: string;
  fracaoDoCusto: number;
  /** Quanto o custo real por unidade cairia se esta categoria caísse 10%. */
  reducaoPorUnidade: number;
  novoCustoRealUnidade: number;
};

/**
 * A categoria que mais pesa — e o que aconteceria se ela caísse 10%.
 *
 * Nunca recomenda cortar; só quantifica. É diagnóstico, não conselho de
 * preço (a mesma restrição de `09-benchmark.md` vale aqui).
 */
export function maiorAlavanca(
  pesos: PesoCategoria[],
  custoRealUnidade: number,
): Alavanca | null {
  const maior = pesos[0];
  if (!maior) return null;

  const reducaoPorUnidade = maior.valorPorUnidade * 0.1;

  return {
    categoria: maior.categoria,
    fracaoDoCusto: maior.fracaoDoCusto,
    reducaoPorUnidade,
    novoCustoRealUnidade: custoRealUnidade - reducaoPorUnidade,
  };
}

/**
 * Quanto as unidades disponíveis e não vendidas custam por mês.
 *
 * Torna a taxa de ocupação tangível em reais — é o campo que o produto
 * aposta que trava o usuário (CLAUDE.md), e hoje ele é só um percentual
 * abstrato. Zero quando a ocupação é 100%: não sobra unidade ociosa.
 */
export function custoDaOciosidade(resultado: CalculoResultado): number {
  const unidadesOciosas = resultado.unidadesDisponiveis - resultado.unidadesProdutivas;
  return unidadesOciosas * resultado.custoRealUnidade;
}

/**
 * Ponto de equilíbrio em unidades por mês, não só em R$.
 *
 * "Preciso vender 380 UTs por mês" é mais acionável que um preço mínimo
 * isolado. Usa o preço que a oficina realmente pratica quando informado
 * — senão o preço sugerido, que é a melhor referência disponível.
 */
export function pontoDeEquilibrioEmUnidades(
  custoTotalMensal: number,
  impostosSobreFaturamento: number,
  precoReferencia: number,
): number {
  const divisor = precoReferencia * (1 - impostosSobreFaturamento);
  if (divisor <= 0) return 0;
  return custoTotalMensal / divisor;
}

/**
 * Ponto de equilíbrio em CARROS por mês.
 *
 * "Preciso atender 38 carros por mês" é a leitura que o dono de oficina
 * já usa para pensar o dia — ele conta carro no pátio, não unidade
 * vendida. É a mesma conta de `pontoDeEquilibrioEmUnidades`, dividida
 * pela média que ele informa (docs/geral/06-dados.md).
 *
 * Devolve `null`, não 0, quando a média não foi informada: não informado
 * e "zero carros" são coisas diferentes, e só `null` deixa o painel
 * distinguir estado vazio de resultado.
 */
export function pontoDeEquilibrioEmCarros(
  unidadesEquilibrio: number,
  unidadesPorCarro: number,
): number | null {
  if (unidadesPorCarro <= 0) return null;
  return unidadesEquilibrio / unidadesPorCarro;
}

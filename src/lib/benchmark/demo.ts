import type { Porte } from "@/lib/porte";
import { CATEGORIAS_CUSTO_FIXO_COMUNS, definicaoDoSegmento, type Segmento } from "@/lib/pricing/segmento";
import type { FaixaComposicao } from "@/lib/pricing/types";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  DADO ILUSTRATIVO — NÃO É PESQUISA DE MERCADO
 * ═══════════════════════════════════════════════════════════════════
 *
 * Existe por um motivo prático: o Felipe precisa VER a tela de
 * benchmark pronta antes de haver amostra real, para demonstrar a
 * terceiros. Isso é legítimo. O que não é legítimo é um número
 * inventado passar por dado real — CLAUDE.md, regra 4.
 *
 * TRÊS TRAVAS, e nenhuma depende de alguém lembrar:
 *
 *   1. O SELO VEM JUNTO DO DADO. `amostraIlustrativa()` devolve os
 *      números E o texto do selo no mesmo objeto. Não há como obter um
 *      sem o outro, e os componentes que renderizam não têm prop para
 *      desligar a tarja — e desde a Leva 4 cada BLOCO com dado do
 *      grupo carrega a própria tarja, não só o topo da tela
 *      (docs/saas/09-benchmark.md, "Modo demonstração").
 *   2. SÓ LIGA POR VARIÁVEL DE AMBIENTE. Sem `NEXT_PUBLIC_BENCHMARK_DEMO`,
 *      `amostraIlustrativa()` devolve null e a tela cai no estado de
 *      amostra insuficiente — que é o comportamento correto em produção.
 *   3. GUARDA NO BUILD. `scripts/check-tokens.mjs` falha se a variável
 *      aparecer em arquivo versionado.
 *
 * O risco não é o Felipe se enganar: é um print numa reunião com o
 * SINDIREPA, ou o modo ficar ligado por esquecimento. O protótipo
 * Lovable gerava a distribuição com `Math.random()` a cada render — é
 * exatamente o que não fazer, e por isso os números abaixo são fixos:
 * dado que muda sozinho a cada carregamento é mentira duas vezes.
 *
 * Quando a agregação real de `configuracoes_calculo × oficinas` passar
 * do N mínimo de docs/saas/09-benchmark.md, isto sai inteiro.
 *
 * ═══ LEVA 4: PORTE ENTROU NO RECORTE ═══
 * "Parecidas" passou a significar região × segmento × porte, não só
 * região × segmento — comparar uma oficina de 2 produtivos com uma de
 * 15 não ensina nada a nenhuma das duas. As faixas de custo e de preço
 * abaixo têm uma entrada por porte; a composição mediana continua por
 * segmento apenas — simplificação deliberada, registrada abaixo.
 */

export const SELO_ILUSTRATIVO = "DADO ILUSTRATIVO — não é pesquisa de mercado";

export const EXPLICACAO_ILUSTRATIVO =
  "Estes números servem só para mostrar como a tela funciona. Eles não vêm de pesquisa e não representam o mercado. O benchmark real aparece quando houver oficinas parecidas suficientes na sua região.";

export type FaixaBenchmark = {
  minimo: number;
  p25: number;
  mediana: number;
  p75: number;
  maximo: number;
  /** Quantas oficinas compõem a faixa. */
  n: number;
};

/** Fração mediana do grupo, por categoria da composição. Soma 1 por segmento. */
export type ComposicaoMediana = Record<FaixaComposicao["id"], number>;

export type AmostraIlustrativa = {
  /** Sempre presente. É o que impede o número de viajar sozinho. */
  selo: typeof SELO_ILUSTRATIVO;
  explicacao: typeof EXPLICACAO_ILUSTRATIVO;
  porte: Porte;
  /** Custo real por unidade, do grupo. */
  faixaCusto: FaixaBenchmark;
  /** Preço praticado, do grupo — sempre acima do custo pela margem e impostos embutidos. */
  faixaPreco: FaixaBenchmark;
  composicaoMediana: ComposicaoMediana;
  /** Histograma do custo real por unidade, no mesmo recorte. */
  distribuicao: FaixaDistribuicao[];
  /** Mediana do grupo por tipo de custo, para a tabela por categoria. */
  medianaPorCategoria: MedianaPorCategoria;
  /** Série mensal do custo mediano do grupo, do mais antigo para o mais recente. */
  tendencia: PontoMensal[];
};

/** Um mês da série do grupo. `mes` em "AAAA-MM" para ordenar como string. */
export type PontoMensal = {
  mes: string;
  valor: number;
};

/** Uma barra do histograma. `contagem` é quantas oficinas caem na faixa. */
export type FaixaDistribuicao = {
  minimo: number;
  maximo: number;
  contagem: number;
};

/**
 * Peso mediano de cada tipo de custo no custo total do grupo.
 *
 * Mesma semântica de `PesoCategoria.fracaoDoCusto` (analise.ts): fração
 * do CUSTO (mão de obra + custos fixos), não do preço. Comparar contra
 * `composicaoMediana`, que é fração do PREÇO, daria número errado.
 *
 * Mão de obra fica fora do mapa de custos fixos porque o rótulo dela vem
 * do segmento na copy, e casar por string de exibição seria frágil.
 */
export type MedianaPorCategoria = {
  maoDeObra: number;
  /** Chaveado pela categoria, exatamente como em `segmento.ts`. */
  custosFixos: Record<string, number>;
};

/**
 * Fixos de propósito: dado que muda a cada render é mentira duas vezes.
 *
 * Porte maior tende a ter faixa mais alta nestes números de exemplo —
 * mais estrutura fixa por trás —, mas isso é só verossimilhança de
 * demonstração, não uma correlação real observada em nenhuma amostra.
 */
const FAIXAS_CUSTO: Record<Segmento, Record<Porte, FaixaBenchmark>> = {
  mecanica: {
    pequena: { minimo: 58, p25: 79, mediana: 97, p75: 122, maximo: 175, n: 14 },
    media: { minimo: 62, p25: 84, mediana: 103, p75: 128, maximo: 190, n: 47 },
    grande: { minimo: 68, p25: 91, mediana: 112, p75: 140, maximo: 205, n: 9 },
  },
  funilaria: {
    pequena: { minimo: 50, p25: 66, mediana: 82, p75: 104, maximo: 150, n: 11 },
    media: { minimo: 55, p25: 71, mediana: 88, p75: 112, maximo: 165, n: 31 },
    grande: { minimo: 60, p25: 78, mediana: 96, p75: 121, maximo: 178, n: 7 },
  },
};

const FAIXAS_PRECO: Record<Segmento, Record<Porte, FaixaBenchmark>> = {
  mecanica: {
    pequena: { minimo: 78, p25: 104, mediana: 128, p75: 160, maximo: 230, n: 14 },
    media: { minimo: 84, p25: 111, mediana: 136, p75: 169, maximo: 250, n: 47 },
    grande: { minimo: 92, p25: 120, mediana: 148, p75: 184, maximo: 270, n: 9 },
  },
  funilaria: {
    pequena: { minimo: 68, p25: 87, mediana: 108, p75: 137, maximo: 198, n: 11 },
    media: { minimo: 74, p25: 94, mediana: 116, p75: 148, maximo: 218, n: 31 },
    grande: { minimo: 81, p25: 103, mediana: 127, p75: 160, maximo: 235, n: 7 },
  },
};

/** Soma sempre 1,00 por segmento — checado em demo.test.ts. */
const COMPOSICAO_MEDIANA: Record<Segmento, ComposicaoMediana> = {
  mecanica: { maoDeObra: 0.42, custosFixos: 0.24, impostos: 0.08, margem: 0.26 },
  funilaria: { maoDeObra: 0.38, custosFixos: 0.29, impostos: 0.08, margem: 0.25 },
};

/**
 * Forma do histograma: peso relativo de cada uma das 8 faixas, da mais
 * barata para a mais cara. Assimétrica à direita de propósito — é o
 * formato típico de distribuição de preço, com cauda longa em cima.
 *
 * É uma CONSTANTE, e as contagens saem dela por regra fixa. O protótipo
 * Lovable regerava a distribuição com `Math.random()` a cada render;
 * aqui duas chamadas devolvem sempre o mesmo array, o que o
 * `demo.test.ts` cobra.
 */
const PERFIL_DISTRIBUICAO = [3, 8, 12, 9, 6, 4, 3, 2] as const;

/**
 * Recorta a faixa em 8 barras e distribui o N pelo perfil acima.
 *
 * Deriva de `FAIXAS_CUSTO` em vez de repetir números à mão: garante, por
 * construção, que o histograma e a faixa contam a mesma história — mesmo
 * mínimo, mesmo máximo, mesmo N. Dois conjuntos de números escritos
 * separadamente divergiriam na primeira edição.
 *
 * As contagens são inteiras e somam exatamente `faixa.n`: reparte pelo
 * maior resto, então nenhum arredondamento some com uma oficina.
 */
function distribuicaoDaFaixa(faixa: FaixaBenchmark): FaixaDistribuicao[] {
  const total = PERFIL_DISTRIBUICAO.reduce((a, b) => a + b, 0);
  const largura = (faixa.maximo - faixa.minimo) / PERFIL_DISTRIBUICAO.length;

  const exatos = PERFIL_DISTRIBUICAO.map((peso) => (peso / total) * faixa.n);
  const contagens = exatos.map(Math.floor);

  let restante = faixa.n - contagens.reduce((a, b) => a + b, 0);
  const porResto = exatos
    .map((v, i) => ({ i, resto: v - Math.floor(v) }))
    .sort((a, b) => b.resto - a.resto);

  for (let k = 0; restante > 0; k++, restante--) {
    contagens[porResto[k % porResto.length].i] += 1;
  }

  return contagens.map((contagem, i) => ({
    minimo: faixa.minimo + largura * i,
    maximo: faixa.minimo + largura * (i + 1),
    contagem,
  }));
}

/**
 * Peso mediano por tipo de custo. Soma 1,00 por segmento — checado em
 * demo.test.ts, que é o que impede uma edição de deixar a tabela com
 * total de 97%.
 *
 * Funilaria carrega mão de obra mais leve e material mais pesado que
 * mecânica. É verossimilhança de demonstração, não correlação observada.
 */
const MEDIANA_MAO_DE_OBRA: Record<Segmento, number> = {
  mecanica: 0.58,
  funilaria: 0.48,
};

const MEDIANA_CUSTOS_FIXOS: Record<Segmento, Record<string, number>> = {
  mecanica: {
    Aluguel: 0.11,
    Energia: 0.04,
    "Água": 0.01,
    "Internet e telefone": 0.01,
    Contador: 0.03,
    "Software de gestão": 0.02,
    Seguros: 0.02,
    "Salários administrativos + encargos": 0.08,
    "Pró-labore": 0.05,
    "Manutenção e ferramental": 0.03,
    Marketing: 0.01,
    Outros: 0.01,
  },
  funilaria: {
    Aluguel: 0.1,
    Energia: 0.04,
    "Água": 0.01,
    "Internet e telefone": 0.01,
    Contador: 0.025,
    "Software de gestão": 0.015,
    Seguros: 0.02,
    "Salários administrativos + encargos": 0.07,
    "Pró-labore": 0.045,
    "Manutenção e ferramental": 0.025,
    Marketing: 0.01,
    Outros: 0.01,
    "Tinta e vernizes (média mensal)": 0.06,
    "Material de pintura — lixa, massa, fita (média mensal)": 0.035,
    "Cabine de pintura — energia, gás e manutenção": 0.03,
    "EPI e filtros": 0.01,
    "Descarte de resíduos": 0.005,
  },
};

/**
 * As chaves de `MEDIANA_CUSTOS_FIXOS` têm de existir de verdade em
 * `segmento.ts`. Uma categoria renomeada lá e não aqui deixaria a coluna
 * do grupo silenciosamente vazia — falhar alto é melhor.
 */
export function categoriasSemMediana(segmento: Segmento): string[] {
  const conhecidas = new Set(Object.keys(MEDIANA_CUSTOS_FIXOS[segmento]));
  return [
    ...CATEGORIAS_CUSTO_FIXO_COMUNS,
    ...definicaoDoSegmento(segmento).categoriasCustoFixoAdicionais,
  ].filter((c) => !conhecidas.has(c));
}

/**
 * Doze meses de custo mediano do grupo, como MULTIPLICADORES da mediana
 * atual. O último é 1 por construção: a série termina exatamente no
 * número que a faixa já publica, senão o gráfico e a barra contariam
 * histórias diferentes sobre o mesmo grupo.
 *
 * A curva sobe devagar, com um degrau no meio. É verossimilhança de
 * demonstração — não é inflação medida, não é índice, não é pesquisa.
 */
const PERFIL_TENDENCIA = [
  0.911, 0.918, 0.927, 0.934, 0.946, 0.955, 0.963, 0.974, 0.981, 0.988, 0.994, 1,
] as const;

/**
 * Ancorada em `mesDeReferencia` para a série não "andar" a cada render
 * dentro do mesmo mês — o mesmo motivo de os outros números serem fixos.
 * Muda de mês em mês, o que é o comportamento certo para uma série
 * temporal: o eixo acompanha o calendário.
 */
function tendenciaDaFaixa(faixa: FaixaBenchmark, referencia: Date): PontoMensal[] {
  return PERFIL_TENDENCIA.map((fator, i) => {
    const d = new Date(
      Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() - (PERFIL_TENDENCIA.length - 1 - i), 1),
    );
    const mes = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { mes, valor: faixa.mediana * fator };
  });
}

/** true só quando a variável de ambiente estiver explicitamente ligada. */
export function modoDemonstracaoLigado(): boolean {
  return process.env.NEXT_PUBLIC_BENCHMARK_DEMO === "1";
}

/**
 * Amostra ilustrativa, ou `null` quando o modo está desligado.
 *
 * Devolver null é o caminho normal: em produção a tela mostra o estado
 * de amostra insuficiente, que é honesto e é o que o usuário real vê
 * nos primeiros meses.
 */
export function amostraIlustrativa(
  segmento: Segmento,
  porte: Porte,
  /** Injetável só para teste. Em produção é sempre "agora". */
  referencia: Date = new Date(),
): AmostraIlustrativa | null {
  if (!modoDemonstracaoLigado()) return null;

  return {
    selo: SELO_ILUSTRATIVO,
    explicacao: EXPLICACAO_ILUSTRATIVO,
    porte,
    faixaCusto: FAIXAS_CUSTO[segmento][porte],
    faixaPreco: FAIXAS_PRECO[segmento][porte],
    composicaoMediana: COMPOSICAO_MEDIANA[segmento],
    distribuicao: distribuicaoDaFaixa(FAIXAS_CUSTO[segmento][porte]),
    medianaPorCategoria: {
      maoDeObra: MEDIANA_MAO_DE_OBRA[segmento],
      custosFixos: MEDIANA_CUSTOS_FIXOS[segmento],
    },
    tendencia: tendenciaDaFaixa(FAIXAS_CUSTO[segmento][porte], referencia),
  };
}

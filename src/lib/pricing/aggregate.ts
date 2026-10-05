import { DEFAULTS } from "./defaults";
import { custosFixosPadrao, SEGMENTO_PADRAO, type Segmento } from "./segmento";
import type { CalculoInput, CustoFixo } from "./types";

/**
 * Entrada agregada — a forma como a INTERFACE pergunta.
 *
 * A lib de cálculo pensa em lista de produtivos, um a um, porque é
 * assim que a oficina existe no banco (docs/geral/06-dados.md). Mas a
 * calculadora pergunta "quantos mecânicos" e "salário médio", porque
 * pedir salário nome por nome no primeiro contato é um formulário de 30
 * campos — e cada campo a mais é uma oficina a menos usando.
 *
 * Este módulo é a ponte, e é pura de propósito: o herói da landing e a
 * tela cheia da calculadora usam exatamente a mesma conversão, então o
 * número preliminar da landing nunca pode divergir do número da tela.
 *
 * A configuração por mecânico individual aparece só em /oficina, onde o
 * usuário já está logado e já viu valor.
 */
export type EntradaAgregada = {
  /**
   * Governa unidade, categorias de custo e rótulo do produtivo —
   * nunca a aritmética. Por isso vive aqui, na forma que a INTERFACE
   * pergunta, e não em `CalculoInput`, que é só número.
   */
  segmento: Segmento;
  quantidadeProdutivos: number;
  /** R$/mês. 0 = não informado — não tem padrão, ver defaults.ts. */
  salarioMedio: number;
  percentualEncargos: number;
  diasUteisMes: number;
  unidadesPorDia: number;
  ocupacao: number;
  custosFixos: CustoFixo[];
  impostosSobreFaturamento: number;
  margemDesejada: number;
  /** 0 = não informado. */
  precoUnidadeAtual: number;
  /**
   * Unidades de trabalho faturadas, em média, por carro atendido.
   * 0 = não informado, e não informado NÃO é zero.
   *
   * Não entra em `paraCalculoInput`: não é insumo de nenhum dos 7 passos
   * de 06-dados.md. É um divisor que o painel aplica SOBRE o resultado,
   * para dizer o ponto de equilíbrio em carros além de em unidades.
   *
   * Sem padrão de propósito — a média varia demais entre revisão de
   * mecânica e colisão de funilaria, e chutar aqui seria dado inventado.
   */
  unidadesPorCarro: number;
};

/** Estado inicial da calculadora. Só o salário fica em branco. */
export function agregadoPadrao(segmento: Segmento = SEGMENTO_PADRAO): EntradaAgregada {
  return {
    segmento,
    quantidadeProdutivos: DEFAULTS.quantidadeProdutivos,
    salarioMedio: DEFAULTS.salarioBruto,
    percentualEncargos: DEFAULTS.percentualEncargos,
    diasUteisMes: DEFAULTS.diasUteisMes,
    unidadesPorDia: DEFAULTS.unidadesPorDia,
    ocupacao: DEFAULTS.ocupacao,
    custosFixos: custosFixosPadrao(segmento),
    impostosSobreFaturamento: DEFAULTS.impostosSobreFaturamento,
    margemDesejada: DEFAULTS.margemDesejada,
    precoUnidadeAtual: 0,
    unidadesPorCarro: 0,
  };
}

/**
 * Expande a média em N produtivos idênticos.
 *
 * Matematicamente equivalente a somar salários individuais, porque o
 * passo 3 da fórmula é uma soma: N × média = Σ individuais quando a
 * média é a real. Trocar para salários individuais depois não muda
 * nenhum outro passo.
 */
export function paraCalculoInput(entrada: EntradaAgregada): CalculoInput {
  const quantidade = Math.max(0, Math.trunc(entrada.quantidadeProdutivos));

  return {
    produtivos: Array.from({ length: quantidade }, () => ({
      salarioBruto: entrada.salarioMedio,
      percentualEncargos: entrada.percentualEncargos,
      ativo: true,
    })),
    custosFixos: entrada.custosFixos,
    jornada: {
      diasUteisMes: entrada.diasUteisMes,
      unidadesPorDia: entrada.unidadesPorDia,
      ocupacao: entrada.ocupacao,
    },
    parametros: {
      impostosSobreFaturamento: entrada.impostosSobreFaturamento,
      margemDesejada: entrada.margemDesejada,
      precoUnidadeAtual: entrada.precoUnidadeAtual,
    },
  };
}

/**
 * Entrada mínima do herói da landing: 3 campos.
 *
 * Todo o resto vem dos padrões. É o que permite mostrar um número
 * preliminar honesto antes de pedir qualquer outra coisa — e o que
 * garante que o valor não mude ao chegar em /calculadora, porque a
 * conversão é a mesma.
 */
export type EntradaHeroi = {
  quantidadeProdutivos: number;
  salarioMedio: number;
  totalCustosFixos: number;
};

/**
 * Categoria comum que recebe o total da landing — precisa bater com uma
 * entrada real de `CATEGORIAS_CUSTO_FIXO_COMUNS` (segmento.ts).
 */
const CATEGORIA_QUE_RECEBE_O_TOTAL_DA_LANDING = "Outros";

export function doHeroi(entrada: EntradaHeroi): EntradaAgregada {
  return {
    ...agregadoPadrao(SEGMENTO_PADRAO),
    quantidadeProdutivos: entrada.quantidadeProdutivos,
    salarioMedio: entrada.salarioMedio,

    /**
     * Leva 4.1: o valor da landing deixou de virar uma 13ª linha
     * sintética ("Total informado na landing") e passou a somar direto
     * na categoria "Outros" — que já existe, sempre em R$ 0 por padrão.
     *
     * Antes disso, remover a linha sintética sem realocar o valor teria
     * apagado silenciosamente o dinheiro que a pessoa já informou — por
     * isso a soma acontece aqui, nunca um filtro que descarta.
     *
     * As demais categorias continuam aparecendo zeradas: é o checklist
     * que faz o usuário lembrar do contador e do seguro que ele
     * esqueceu — distribuir o total nelas por conta própria seria
     * inventar dado que ele não informou.
     */
    custosFixos: custosFixosPadrao(SEGMENTO_PADRAO).map((c) =>
      c.categoria === CATEGORIA_QUE_RECEBE_O_TOTAL_DA_LANDING
        ? { ...c, valorMensal: entrada.totalCustosFixos }
        : c,
    ),
  };
}

/**
 * Troca o segmento preservando o que o usuário já digitou.
 *
 * As categorias comuns mantêm o valor; as do segmento antigo saem
 * SE estiverem zeradas, e ficam se tiverem valor — apagar dado digitado
 * porque o usuário corrigiu o tipo da oficina seria punir a correção.
 * As do segmento novo entram em R$ 0 no fim da lista.
 */
export function trocarSegmento(entrada: EntradaAgregada, segmento: Segmento): EntradaAgregada {
  if (segmento === entrada.segmento) return entrada;

  const sugeridas = custosFixosPadrao(segmento);
  const jaSugerida = new Set(sugeridas.map((c) => c.categoria));

  const preservados = entrada.custosFixos.filter(
    (c) => jaSugerida.has(c.categoria) || c.valorMensal > 0,
  );
  const presentes = new Set(preservados.map((c) => c.categoria));

  return {
    ...entrada,
    segmento,
    custosFixos: [
      ...preservados,
      ...sugeridas.filter((c) => !presentes.has(c.categoria)),
    ],
  };
}

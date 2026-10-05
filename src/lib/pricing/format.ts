import { unit as unitPadrao, type UnitLabel } from "./config";

/**
 * Regras de exibição de docs/geral/06-dados.md.
 *
 * Este é o ÚNICO lugar onde valor calculado vira texto. Arredondamento
 * acontece aqui e em nenhum outro ponto — o cálculo intermediário
 * mantém a precisão cheia.
 */

/**
 * Intl insere espaço estreito não-quebrável (U+202F) ou não-quebrável
 * (U+00A0) entre "R$" e o número, dependendo do runtime e da versão do
 * ICU. Normalizar para espaço comum deixa a saída estável entre Node e
 * navegador, e testável sem depender de qual byte o ICU escolheu.
 */
function normalizarEspacos(texto: string): string {
  return texto.replace(/[  ]/g, " ");
}

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `R$ 1.234,56` — milhar com ponto, decimal com vírgula, sempre 2 casas. */
export function formatarMoeda(valor: number): string {
  return normalizarEspacos(moeda.format(valor));
}

const percentual = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Recebe fração (0,145) e devolve `14,5%`. */
export function formatarPercentual(fracao: number): string {
  return `${percentual.format(fracao * 100)}%`;
}

const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `2,5 h` — rótulo vindo de WORK_UNIT_LABEL, nunca literal. */
export function formatarUnidades(quantidade: number, unit: UnitLabel = unitPadrao): string {
  return `${decimal.format(quantidade)} ${unit.abbrev}`;
}

/** `1.234,5` — para contagens grandes de unidade sem sufixo. */
export function formatarDecimal(valor: number): string {
  return decimal.format(valor);
}

const decimalPreciso = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

/**
 * `542,08` — só para a memória de cálculo.
 *
 * DESVIO CONSCIENTE da regra de 1 casa decimal para unidades
 * (06-dados.md). A memória de cálculo existe para ser CONFERIDA: se ela
 * mostra "÷ 542,1" mas o cálculo usou 542,08, quem refizer a conta na
 * mão pode chegar a um centavo diferente e concluir, com razão, que o
 * número não fecha. Numa ferramenta cuja promessa é mostrar a conta
 * aberta, reprodutibilidade vale mais que a casa decimal a menos.
 *
 * Em toda a interface fora da memória, `formatarDecimal` continua valendo.
 */
export function formatarDecimalPreciso(valor: number): string {
  return decimalPreciso.format(valor);
}

const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function formatarInteiro(valor: number): string {
  return inteiro.format(valor);
}

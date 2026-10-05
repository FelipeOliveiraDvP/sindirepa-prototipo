
import {
  formatarDecimal,
  formatarDecimalPreciso,
  formatarInteiro,
  formatarMoeda,
  formatarPercentual,
} from "./format";
import { produtivosAtivos } from "./labor-cost-model";
import { LEXICO_PADRAO, type Lexico } from "./segmento";
import type { CalculoInput, CalculoResultado } from "./types";

/**
 * A memória de cálculo — o elemento assinatura do produto.
 *
 * Onde outros produtos escondem a conta, este a expõe. É a tradução
 * direta do princípio "Transparente" e a regra derivada de
 * CLAUDE.md: nenhum número aparece na interface sem que o usuário
 * consiga abrir e ver de onde veio.
 *
 * Vive junto da fórmula, e não em src/lib/copy/, porque é narrativa da
 * própria fórmula: se um passo do cálculo mudar, o texto tem de mudar
 * no mesmo commit. Separar convidaria os dois a divergirem em silêncio.
 *
 * Devolve exatamente os 7 passos de docs/geral/06-dados.md, na ordem,
 * com os números do usuário substituídos. Ordem e quantidade são
 * cobertas por teste — não é decoração, é o contrato da peça.
 */

export type PassoMemoria = {
  /** 1 a 7, na ordem de 06-dados.md. */
  numero: number;
  titulo: string;
  /** A conta com os números do usuário, já formatados. */
  conta: string;
  /** O resultado do passo, formatado. */
  resultado: string;
  /** Por que este passo existe, em linguagem de oficina. */
  porque?: string;
};

export function memoriaDeCalculo(
  input: CalculoInput,
  r: CalculoResultado,
  lexico: Lexico = LEXICO_PADRAO,
): PassoMemoria[] {
  const { unit, produtivo } = lexico;
  const { jornada, parametros } = input;
  const ativos = produtivosAtivos(input.produtivos);
  const qtd = ativos.length;
  const rotuloQtd = qtd === 1 ? produtivo.singular : produtivo.plural;

  const divisor = 1 - parametros.impostosSobreFaturamento - parametros.margemDesejada;

  return [
    {
      numero: 1,
      titulo: `${capitalizar(unit.plural)} disponíveis no mês`,
      conta: `${formatarInteiro(qtd)} ${rotuloQtd} × ${formatarInteiro(jornada.diasUteisMes)} dias × ${formatarDecimal(jornada.unidadesPorDia)} ${unit.plural} por dia`,
      resultado: `${formatarDecimalPreciso(r.unidadesDisponiveis)} ${unit.plural}`,
      porque: `Tudo que a sua equipe consegue trabalhar num mês, se cada ${unit.singular} fosse vendida.`,
    },
    {
      numero: 2,
      titulo: `${capitalizar(unit.plural)} realmente vendidas`,
      conta: `${formatarDecimalPreciso(r.unidadesDisponiveis)} ${unit.plural} × ${formatarPercentual(jornada.ocupacao)} de ocupação`,
      resultado: `${formatarDecimalPreciso(r.unidadesProdutivas)} ${unit.plural}`,
      porque: `É por aqui que o custo se dilui. Quanto menos ${unit.plural} vendidas, mais caro fica cada uma.`,
    },
    {
      numero: 3,
      titulo: "Custo da mão de obra no mês",
      conta: `soma dos salários × (1 + encargos) de ${formatarInteiro(qtd)} ${rotuloQtd}`,
      resultado: formatarMoeda(r.custoMaoDeObra),
      porque: "O salário mais tudo que se paga além dele: FGTS, INSS, 13º, férias e benefícios.",
    },
    {
      numero: 4,
      titulo: "Custos fixos no mês",
      conta: "soma de aluguel, energia, contador, software e o resto da lista",
      resultado: formatarMoeda(r.custoFixoTotal),
      porque: "Tudo que a oficina paga todo mês mesmo quando não entra carro.",
    },
    {
      numero: 5,
      titulo: "Custo total no mês",
      conta: `${formatarMoeda(r.custoMaoDeObra)} + ${formatarMoeda(r.custoFixoTotal)}`,
      resultado: formatarMoeda(r.custoTotalMensal),
    },
    {
      numero: 6,
      titulo: `Custo real ${unit.ofDefinite}`,
      conta: `${formatarMoeda(r.custoTotalMensal)} ÷ ${formatarDecimalPreciso(r.unidadesProdutivas)} ${unit.plural}`,
      resultado: formatarMoeda(r.custoRealUnidade),
      porque: `Quanto custa manter um ${produtivo.singular} trabalhando por uma ${unit.singular}, com tudo incluso.`,
    },
    {
      numero: 7,
      titulo: `Preço ${unit.ofDefinite} sugerido`,
      conta: `${formatarMoeda(r.custoRealUnidade)} ÷ (100% − ${formatarPercentual(parametros.impostosSobreFaturamento)} de impostos − ${formatarPercentual(parametros.margemDesejada)} de margem) = ${formatarMoeda(r.custoRealUnidade)} ÷ ${formatarPercentual(divisor)}`,
      resultado: formatarMoeda(r.precoUnidadeSugerido),
      porque:
        "Divide pelo que sobra, e não soma a margem por cima do custo. É o que garante que a margem sobre a venda seja de verdade a que você definiu.",
    },
  ];
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

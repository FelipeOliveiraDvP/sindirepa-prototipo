import { getLaborCostModel, produtivosAtivos, type LaborCostModelId } from "./labor-cost-model";
import { somarReais } from "./money";
import { lexicoDoSegmento, SEGMENTO_PADRAO, type Segmento } from "./segmento";
import type {
  Calculo,
  CalculoInput,
  CalculoResultado,
  Comparativo,
  FaixaComposicao,
} from "./types";
import { avisosDoResultado, validar } from "./validate";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  A FÓRMULA DESTE ARQUIVO É INFERIDA. NÃO FOI VALIDADA.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Fonte: docs/geral/06-dados.md, que a reconstruiu a partir do modelo
 * padrão de custo-hora de serviço. Ela NÃO foi extraída da calculadora
 * que já está no ar em calculadoramaodeobra.nocobi.com.
 *
 * REGRA DE PRECEDÊNCIA: se algum número aqui divergir da calculadora em
 * produção, A QUE ESTÁ NO AR VENCE — ela já tem uso real e leads
 * associados. Corrigir 06-dados.md primeiro, depois este arquivo.
 *
 * O Felipe optou por implementar assim mesmo, para não travar a Leva 1.
 * `PONTOS_DE_DIVERGENCIA` abaixo registra cada escolha, para que a
 * validação depois seja um diff e não uma arqueologia.
 *
 * Nada disso aparece para o usuário. É registro interno.
 * ═══════════════════════════════════════════════════════════════════
 */
export const FORMULA_STATUS = "INFERIDA" as const;

/** Onde a fórmula inferida tem mais chance de divergir da de produção. */
export const PONTOS_DE_DIVERGENCIA = [
  {
    duvida: "Salários administrativos entram em custo fixo ou em mão de obra?",
    implementado: "custo fixo",
    base: "06-dados.md lista a categoria em custos fixos; 07-copy.md diz que quem não põe a mão no carro entra em custos fixos",
  },
  {
    duvida: "A margem é markup divisor ou margem sobre custo?",
    implementado: "markup divisor — custo ÷ (1 − impostos − margem)",
    base: "06-dados.md é explícito: garante margem sobre o preço de venda, não sobre o custo",
  },
  {
    duvida: "Qual o percentual padrão de encargos?",
    implementado: "80%, editável e nunca travado",
    base: "06-dados.md — referência conservadora para CLT; Simples fica em 60–70%",
  },
  {
    duvida: "Impostos entram no cálculo do preço ou são tratados fora dele?",
    implementado: "dentro, no passo 7",
    base: "06-dados.md, passo 7",
  },
] as const;

export type OpcoesCalculo = {
  /**
   * Governa apenas o TEXTO das mensagens — unidade e rótulo do
   * produtivo. Nenhum passo da fórmula olha para o segmento, e existe
   * teste garantindo que trocá-lo não move nenhum número.
   */
  segmento?: Segmento;
  laborCostModelId?: LaborCostModelId;
};

/**
 * Os 7 passos de 06-dados.md, na ordem.
 *
 * Função pura: mesma entrada, mesma saída, sem React, sem I/O, sem
 * data do sistema. É o coração do produto e precisa poder ser testada
 * sem montar um componente.
 *
 * Arredondamento: nenhum. Acontece só na exibição (format.ts). Somas de
 * dinheiro passam por money.ts para não acumular erro de float.
 */
export function calcular(input: CalculoInput, opcoes: OpcoesCalculo = {}): Calculo {
  const { segmento = SEGMENTO_PADRAO, laborCostModelId = "salario_fixo" } = opcoes;
  const lexico = lexicoDoSegmento(segmento);

  const erros = validar(input, lexico);
  if (erros.length > 0) return { ok: false, erros };

  const { jornada, parametros } = input;
  const ativos = produtivosAtivos(input.produtivos);

  // 1. unidadesDisponiveis = produtivos × diasUteisMes × unidadesPorDia
  const unidadesDisponiveis = ativos.length * jornada.diasUteisMes * jornada.unidadesPorDia;

  // 2. unidadesProdutivas = unidadesDisponiveis × ocupacao
  const unidadesProdutivas = unidadesDisponiveis * jornada.ocupacao;

  // 3. custoMaoDeObra — via modelo plugável
  const custoMaoDeObra = getLaborCostModel(laborCostModelId).monthlyLaborCost({
    produtivos: input.produtivos,
  });

  // 4. custoFixoTotal = Σ (custos fixos mensais)
  const custoFixoTotal = somarReais(
    input.custosFixos.filter((c) => c.ativo !== false).map((c) => c.valorMensal),
  );

  // 5. custoTotalMensal
  const custoTotalMensal = somarReais([custoMaoDeObra, custoFixoTotal]);

  // 6. custoRealUnidade
  const custoRealUnidade = custoTotalMensal / unidadesProdutivas;

  // 7. precoUnidadeSugerido — markup divisor, não margem sobre custo.
  //    validar() já garantiu que o divisor é positivo.
  const divisor = 1 - parametros.impostosSobreFaturamento - parametros.margemDesejada;
  const precoUnidadeSugerido = custoRealUnidade / divisor;

  /**
   * Abaixo deste valor cada unidade vendida dá prejuízo. É o número
   * mais forte da tela — cobre custo e imposto, sem nenhuma margem.
   */
  const pontoDeEquilibrio = custoRealUnidade / (1 - parametros.impostosSobreFaturamento);

  const resultadoParcial: CalculoResultado = {
    unidadesDisponiveis,
    unidadesProdutivas,
    custoMaoDeObra,
    custoFixoTotal,
    custoTotalMensal,
    custoRealUnidade,
    precoUnidadeSugerido,
    pontoDeEquilibrio,
    composicao: composicaoDoPreco({
      custoMaoDeObra,
      custoFixoTotal,
      unidadesProdutivas,
      precoUnidadeSugerido,
      impostos: parametros.impostosSobreFaturamento,
      margem: parametros.margemDesejada,
    }),
    comparativo: compararComPrecoAtual({
      precoUnidadeAtual: parametros.precoUnidadeAtual,
      precoUnidadeSugerido,
      custoRealUnidade,
      pontoDeEquilibrio,
      unidadesProdutivas,
      impostos: parametros.impostosSobreFaturamento,
    }),
    avisos: [],
  };

  return {
    ok: true,
    resultado: {
      ...resultadoParcial,
      avisos: avisosDoResultado(input, resultadoParcial, lexico),
    },
  };
}

/**
 * As quatro faixas da barra empilhada. Somadas, dão exatamente o preço
 * sugerido — é o que torna a barra honesta:
 *   custo + preço×(impostos + margem) = preço×divisor + preço×(1−divisor)
 */
function composicaoDoPreco(args: {
  custoMaoDeObra: number;
  custoFixoTotal: number;
  unidadesProdutivas: number;
  precoUnidadeSugerido: number;
  impostos: number;
  margem: number;
}): FaixaComposicao[] {
  const valores = {
    maoDeObra: args.custoMaoDeObra / args.unidadesProdutivas,
    custosFixos: args.custoFixoTotal / args.unidadesProdutivas,
    impostos: args.precoUnidadeSugerido * args.impostos,
    margem: args.precoUnidadeSugerido * args.margem,
  } as const;

  return (Object.keys(valores) as Array<keyof typeof valores>).map((id) => ({
    id,
    valorPorUnidade: valores[id],
    fracaoDoPreco: valores[id] / args.precoUnidadeSugerido,
  }));
}

function compararComPrecoAtual(args: {
  precoUnidadeAtual: number | undefined;
  precoUnidadeSugerido: number;
  custoRealUnidade: number;
  pontoDeEquilibrio: number;
  unidadesProdutivas: number;
  impostos: number;
}): Comparativo | null {
  const atual = args.precoUnidadeAtual;

  // 0 é "não informado", não zero. Cobrar R$ 0 por unidade não é um
  // cenário de negócio, é campo em branco (06-dados.md).
  if (atual === undefined || atual <= 0) return null;

  return {
    diferencaPorUnidade: args.precoUnidadeSugerido - atual,
    impactoMensal: (args.precoUnidadeSugerido - atual) * args.unidadesProdutivas,
    margemRealAtual: 1 - args.custoRealUnidade / atual - args.impostos,
    abaixoDoEquilibrio: atual < args.pontoDeEquilibrio,
  };
}

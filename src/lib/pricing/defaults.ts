import { custosFixosPadrao, SEGMENTO_PADRAO, type Segmento } from "./segmento";
import type { CalculoInput } from "./types";

/**
 * Padrões de docs/geral/06-dados.md.
 *
 * POR QUE QUASE TODO CAMPO TEM PADRÃO: quem não muda nada precisa
 * chegar perto de um resultado plausível. É a diferença entre uma
 * calculadora usada e uma abandonada (docs/saas/03-telas.md).
 *
 * ═══ A EXCEÇÃO: SALÁRIO ═══
 * `salarioBruto` NÃO tem padrão, por decisão do Felipe.
 *
 * 06-dados.md deixou o campo marcado "—" e qualquer valor que
 * inventássemos aqui poderia passar por referência de mercado — o que
 * CLAUDE.md proíbe. Preferimos o campo vazio a um número que finge ser
 * dado.
 *
 * CONSEQUÊNCIA, e ela é real: a calculadora abre SEM resultado, o que
 * contraria "padrões já produzem resultado" de 03-telas.md. A exceção
 * está registrada no próprio 03-telas.md. O tratamento na interface é
 * pedir o salário de forma clara — nunca mostrar R$ 0,00 como se fosse
 * um cálculo. Por isso `validar()` bloqueia com `sem_salario` em vez de
 * devolver zero.
 *
 * Convenção: 0 significa "não informado", igual a `precoUnidadeAtual`.
 * Ninguém paga R$ 0 de salário, então não há ambiguidade.
 */
export const SALARIO_NAO_INFORMADO = 0;

/**
 * As categorias de custo fixo mudaram de casa: agora dependem do
 * segmento e vivem em segmento.ts. Funilaria carrega tinta, material de
 * pintura, cabine e descarte, que não existem em mecânica.
 *
 * Reexportadas aqui só para não quebrar import antigo.
 */
export {
  CATEGORIAS_CUSTO_FIXO_COMUNS,
  categoriasCustoFixo,
  custosFixosPadrao,
} from "./segmento";

export const DEFAULTS = {
  quantidadeProdutivos: 4,
  /** Sem padrão de propósito. Ver a exceção documentada acima. */
  salarioBruto: SALARIO_NAO_INFORMADO,
  /** 80% é referência conservadora para CLT. Simples fica em 60–70%. Editável, nunca travado. */
  percentualEncargos: 0.8,
  diasUteisMes: 22,
  /** 44h semanais ÷ 5. */
  unidadesPorDia: 8.8,
  /** O campo mais importante e o mais ignorado pelo mercado. */
  ocupacao: 0.7,
  /** Simples Nacional, Anexo III, faixa inicial. */
  impostosSobreFaturamento: 0.06,
  margemDesejada: 0.15,
} as const;

/**
 * Teto de sanidade para disparar o aviso de resultado implausível.
 *
 * ⚠️ NÃO É DADO DE MERCADO e não pode virar um. CLAUDE.md proíbe
 * inventar número de mercado. Isto é só um
 * limite de sanidade para detectar entrada digitada errada (um zero
 * a mais no salário, ocupação de 1%). Se algum dia existir referência
 * real de preço de unidade, ela vem da base de CalculoAnonimo — não
 * daqui.
 */
export const TETO_SANIDADE_UNIDADE = 1000;

/**
 * Entrada completa com os padrões. É o estado inicial da calculadora.
 *
 * ⚠️ Este input NÃO produz cálculo válido: falta o salário, que não tem
 * padrão. `calcular(inputPadrao())` devolve `ok: false` com
 * `sem_salario`. É o comportamento pretendido, não um bug.
 */
export function inputPadrao(segmento: Segmento = SEGMENTO_PADRAO): CalculoInput {
  return {
    produtivos: Array.from({ length: DEFAULTS.quantidadeProdutivos }, () => ({
      salarioBruto: DEFAULTS.salarioBruto,
      percentualEncargos: DEFAULTS.percentualEncargos,
      ativo: true,
    })),
    custosFixos: custosFixosPadrao(segmento),
    jornada: {
      diasUteisMes: DEFAULTS.diasUteisMes,
      unidadesPorDia: DEFAULTS.unidadesPorDia,
      ocupacao: DEFAULTS.ocupacao,
    },
    parametros: {
      impostosSobreFaturamento: DEFAULTS.impostosSobreFaturamento,
      margemDesejada: DEFAULTS.margemDesejada,
    },
  };
}

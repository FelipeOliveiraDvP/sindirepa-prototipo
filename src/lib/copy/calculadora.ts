import { LEXICO_PADRAO, type Lexico } from "@/lib/pricing/segmento";
import type { FaixaComposicao } from "@/lib/pricing/types";
import { capitalizar, criarTermos } from "./common";

/**
 * Copy da calculadora. pt-BR, tom de docs/geral/07-copy.md.
 *
 * Glossário obrigatório — sempre o mesmo termo, nunca sinônimo bonito:
 * oficina (não empresa) · mecânico ou produtivo (não colaborador) ·
 * custo real da unidade (não custo-hora nem CH) · ponto de equilíbrio
 * (não break-even) · taxa de ocupação (não produtividade) · custos
 * fixos (não despesas).
 *
 * ═══ POR QUE É UMA FÁBRICA ═══
 * Unidade e rótulo do produtivo vêm do segmento: funilaria opera em UT
 * e não tem mecânico. Os named exports no fim do arquivo são o caso
 * mecânica — usados pelas landings, que são SSG e não têm segmento.
 * Dentro de `(app)`, consumir via provider.
 */
export function criarCopyCalculadora(lexico: Lexico = LEXICO_PADRAO) {
  const { unit, produtivo } = lexico;
  const TERMOS = criarTermos(lexico);

  return {
    TITULO: `Calculadora de custo real ${unit.ofDefinite}`,

    SUBTITULO:
      "Preencha com os números da sua oficina. O resultado muda enquanto você digita.",

    SECOES: {
      /**
       * Segmento e cidade. Aparece nos DOIS modos: o segmento governa a
       * unidade e as categorias de custo da tela inteira, e sem poder
       * trocá-lo fora do guiado o usuário fica preso na escolha que fez
       * na primeira visita.
       */
      oficina: {
        titulo: "Sua oficina",
        descricao: "Define a unidade de trabalho e os custos que vamos perguntar.",
      },
      equipe: {
        titulo: "Sua equipe",
        descricao: "Quem vende trabalho na sua oficina.",
      },
      jornada: {
        titulo: "Sua jornada",
        descricao: "Quanto tempo a equipe tem disponível e quanto disso vira serviço.",
      },
      custosFixos: {
        titulo: "Seus custos fixos",
        descricao: "O que a oficina paga todo mês mesmo quando não entra carro.",
      },
      comercial: {
        titulo: "Seus números comerciais",
        descricao: "Impostos, a margem que você quer e o que cobra hoje.",
      },
    },

    CAMPOS: {
      quantidadeProdutivos: {
        label: `Quantos ${produtivo.plural}`,
        ajuda: TERMOS.produtivos.ajuda,
        exemplo: "ex: 4",
      },
      salarioMedio: {
        label: "Salário médio, por mês",
        ajuda: `O salário bruto médio dos seus ${produtivo.plural}, sem contar encargos — eles entram no campo seguinte.`,
        exemplo: "ex: R$ 3.200,00",
      },
      percentualEncargos: {
        label: "Encargos sobre o salário",
        ajuda: `${TERMOS.encargos.ajuda} Em oficina no Simples costuma ficar mais baixo que em CLT pura.`,
        exemplo: "ex: 80%",
      },
      diasUteisMes: {
        label: "Dias abertos por mês",
        ajuda: "Quantos dias a oficina abre num mês típico.",
        exemplo: "ex: 22",
      },
      unidadesPorDia: {
        label: `${capitalizar(unit.plural)} de trabalho por dia`,
        ajuda: `Quantas ${unit.plural} cada ${produtivo.singular} fica à disposição por dia. Não é quanto ele vende — é quanto ele está lá.`,
        exemplo: "ex: 8,8",
      },
      ocupacao: {
        label: TERMOS.ocupacao.label,
        ajuda: TERMOS.ocupacao.ajuda,
        exemplo: "ex: 70%",
      },
      impostosSobreFaturamento: {
        label: "Impostos sobre o faturamento",
        ajuda: TERMOS.impostos.ajuda,
        exemplo: "ex: 6%",
      },
      margemDesejada: {
        label: TERMOS.margem.label,
        ajuda: TERMOS.margem.ajuda,
        exemplo: "ex: 15%",
      },
      /**
       * Opcional, e é o único campo cuja ausência não muda nenhum número
       * do cálculo — só a leitura do equilíbrio em carros, no painel.
       *
       * Fica na jornada porque é volume de trabalho, não preço. E o
       * rótulo sai do léxico do segmento: escrever a unidade literal aqui
       * quebra check-tokens.
       */
      unidadesPorCarro: {
        label: `${capitalizar(unit.plural)} faturadas por carro`,
        ajuda: `Opcional. Em média, quantas ${unit.plural} você fatura num carro que passa pela oficina. Serve para dizer seu ponto de equilíbrio em carros atendidos, não só em ${unit.plural}.`,
        exemplo: "ex: 3,5",
      },
      precoUnidadeAtual: {
        label: `Quanto você cobra hoje ${unit.per}`,
        ajuda:
          "Opcional. Se informar, mostramos a diferença entre o que você cobra e o que o cálculo indica.",
        exemplo: "ex: R$ 90,00",
      },
    },

    /** Rótulos das faixas da barra de composição. A lib devolve só o id. */
    COMPOSICAO_LABEL: {
      maoDeObra: "Mão de obra direta",
      custosFixos: "Custos fixos",
      impostos: "Impostos",
      margem: "Margem",
    } as Record<FaixaComposicao["id"], string>,

    COMPOSICAO_AJUDA: {
      maoDeObra: `Salário e encargos dos ${produtivo.plural}, divididos pelas ${unit.plural} que a oficina realmente vende.`,
      custosFixos: `Aluguel, energia, contador e o resto, divididos pelas mesmas ${unit.plural}.`,
      impostos: "O percentual do faturamento que vai para o regime tributário da oficina.",
      margem: "O que sobra depois de pagar tudo.",
    } as Record<FaixaComposicao["id"], string>,

    RESULTADO: {
      custoReal: TERMOS.custoReal,
      precoSugerido: TERMOS.precoSugerido,
      pontoDeEquilibrio: TERMOS.pontoDeEquilibrio,

      /** Rótulo do disclosure da memória de cálculo. Elemento assinatura. */
      verMemoria: "Ver como esse número foi calculado",
      esconderMemoria: "Esconder o cálculo",
      verComposicao: "Composição do preço",

      /** Estado antes de informar o salário. Não é erro — é um pedido. */
      aguardando: {
        titulo: "Falta um número",
        // "aparece aqui na hora" seria o idiomático, mas a palavra colide
        // com a unidade de trabalho e confundiria a migração para UT.
        ajuda: `Informe o salário médio dos seus ${produtivo.plural} e o custo ${unit.ofDefinite} aparece aqui.`,
      },
    },

    /**
     * Como dar má notícia (07-copy.md): fato + causa provável + próximo
     * passo. Sem alarme, sem dedo na cara. O número faz o trabalho.
     *
     * E o próximo passo é ENTENDER O CUSTO, nunca "subir o preço" —
     * restrição de posicionamento.
     */
    DIAGNOSTICO: {
      abaixoDoCusto: (diferenca: string) =>
        `Seu preço atual está ${diferenca} abaixo do custo ${unit.ofDefinite}.`,
      causaProvavel: `Na maioria dos casos isso vem da taxa de ocupação: ${unit.plural} disponíveis que não viram serviço vendido.`,
      proximoPasso: "Veja a composição do preço para entender onde o custo se concentra.",
      acimaDoCusto: (diferenca: string) =>
        `Seu preço atual está ${diferenca} acima do custo ${unit.ofDefinite}.`,
    },

    ACOES: {
      receberPorEmail: "Receber por e-mail",
      baixarPdf: "Baixar em PDF",
      criarConta: "Criar conta",
      salvarConfiguracao: "Salvar configuração",
      adicionarCustoFixo: "Adicionar custo fixo",
    },
  } as const;
}

export type CopyCalculadora = ReturnType<typeof criarCopyCalculadora>;

/**
 * Caso mecânica. Mantido como named exports para as landings e para os
 * componentes que ainda não passam pelo provider de segmento.
 */
const PADRAO = criarCopyCalculadora(LEXICO_PADRAO);

export const TITULO = PADRAO.TITULO;
export const SUBTITULO = PADRAO.SUBTITULO;
export const SECOES = PADRAO.SECOES;
export const CAMPOS = PADRAO.CAMPOS;
export const COMPOSICAO_LABEL = PADRAO.COMPOSICAO_LABEL;
export const COMPOSICAO_AJUDA = PADRAO.COMPOSICAO_AJUDA;
export const RESULTADO = PADRAO.RESULTADO;
export const DIAGNOSTICO = PADRAO.DIAGNOSTICO;
export const ACOES = PADRAO.ACOES;

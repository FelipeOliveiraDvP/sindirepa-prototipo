import type { Segmento } from "@/lib/pricing/segmento";

/**
 * Copy do chrome do produto. pt-BR, tom de docs/geral/07-copy.md.
 */

/**
 * Destinos da navegação.
 *
 * `disponivel` é roadmap, não texto: o destino já está descrito aqui,
 * mas só aparece quando a rota existir de verdade. Link morto em
 * ferramenta que o dono de oficina desconfia custa mais que a
 * conveniência de deixar pronto.
 *
 * A navegação inteira some quando há menos de dois destinos — hoje é o
 * caso. Ela nasce sozinha quando /oficina entrar (03-telas.md: duas
 * telas não justificam estrutura de navegação).
 */
export const DESTINOS = [
  {
    href: "/painel",
    label: "Painel",
    disponivel: true,
  },
  {
    href: "/calculadora",
    label: "Calculadora",
    disponivel: true,
  },
  {
    href: "/benchmark",
    label: "Benchmark",
    disponivel: true,
  },
  {
    href: "/e-se",
    label: "E se...",
    disponivel: true,
  },
  {
    /**
     * Leva 4.1: rótulo do menu virou "Configurações" (era "Oficina"),
     * por pedido do Felipe, e o destino foi para o fim da lista — os
     * outros quatro são consultados com mais frequência. A rota
     * continua `/oficina`; o `<title>` da página (`OFICINA.titulo` em
     * lib/copy/conta.ts) e a aba interna "Oficina" dentro da tela não
     * mudam, por decisão dele: ali "Oficina" ainda é o nome certo para
     * o grupo de dados (nome, CNPJ, cidade).
     */
    href: "/oficina",
    label: "Configurações",
    disponivel: true,
  },
] as const;

export const NAV = {
  rotulo: "Navegação principal",
  irParaInicio: "Ir para o início",
} as const;

/**
 * Rótulo do segmento na interface.
 *
 * Fica no chrome porque o segmento muda a unidade de todos os números
 * da tela, e o usuário precisa conseguir conferir e corrigir sem
 * caçar. É informação de contexto, não configuração escondida.
 */
export const SEGMENTO = {
  label: "Tipo de oficina",
  ajuda: "Muda a unidade de trabalho e os custos que aparecem na lista.",
  trocar: "Trocar",
} as const;

export const SEGMENTO_DESCRICAO: Record<Segmento, string> = {
  mecanica: "Manutenção mecânica e elétrica. Trabalha e cobra por unidade de tempo.",
  funilaria: "Reparação de colisão e pintura. Trabalha em UT e negocia com seguradora.",
};

/**
 * Modo guiado. Tom de 07-copy.md: direto, sem entusiasmo forçado,
 * nunca condescendente — o usuário não é ingênuo, ele nunca teve o dado.
 */
export const GUIADO = {
  passoDe: (atual: number, total: number) => `Passo ${atual} de ${total}`,
  voltar: "Voltar",
  proximo: "Continuar",
  concluir: "Ver meu resultado",

  /**
   * Saída para quem não quer ser guiado. Fica visível o tempo todo:
   * prender alguém num wizard é a forma mais rápida de perder quem já
   * sabe o que está fazendo.
   */
  pular: "Preencher tudo de uma vez",

  /** Aparece assim que o cálculo fica possível, e acompanha até o fim. */
  parcial: "Com o que você já informou",


  /** Atalho para refazer o guiado, na tela completa. */
  refazer: "Refazer passo a passo",
} as const;

/**
 * Aviso de privacidade do cálculo anônimo.
 *
 * 06-dados.md pede "aviso de privacidade explícito". Explícito significa
 * visível na tela, não enterrado numa política — o público desconfia de
 * software que promete demais, e coleta silenciosa é exatamente o que
 * queima essa confiança.
 *
 * Não é caixa de consentimento: o registro não carrega dado pessoal.
 * Consentimento explícito continua obrigatório quando houver e-mail.
 */
export const PRIVACIDADE = {
  calculoAnonimo:
    "Os números deste cálculo entram, sem identificação, na base que forma o benchmark regional. Nome, e-mail e CNPJ nunca são gravados aqui.",
} as const;

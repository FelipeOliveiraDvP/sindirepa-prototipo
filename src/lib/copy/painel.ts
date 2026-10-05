/**
 * Copy do painel. pt-BR, tom de docs/geral/07-copy.md.
 *
 * O painel mostra apenas dado do PRÓPRIO usuário. Não é dashboard de
 * métricas de negócio, e a copy não pode sugerir que seja.
 */

export const PAINEL = {
  titulo: "Sua oficina hoje",
  subtitulo: "Os números que saem da configuração que você salvou.",

  semConfiguracao: {
    titulo: "Falta salvar sua configuração",
    texto:
      "Preencha a calculadora e salve. A partir daí este painel mostra seus números e como eles mudam ao longo do tempo.",
    acao: "Ir para a calculadora",
  },

  atalhoCalculadora: "Ajustar os números",

  /** Sobrescrito do H1. O nome da oficina é que vira título. */
  kicker: "Painel",

  /** Quando a oficina não tem nome salvo. */
  semNome: "Sua oficina",

  /**
   * Linha de contexto sob o nome: cidade · segmento · equipe.
   * Parte ausente some em vez de virar "—" ou separador solto.
   */
  identificacao: (partes: (string | null | undefined)[]) =>
    partes.filter(Boolean).join(" · "),

  equipe: (n: number, rotulo: string) => `${n} ${rotulo}`,
} as const;

export const HISTORICO = {
  titulo: "Como seu custo mudou",
  /** Só faz sentido com duas versões ou mais. */
  poucasVersoes:
    "A partir da segunda vez que você salvar, esta seção mostra como seu custo evoluiu.",
  /** O que a série significa — e o que ela NÃO significa. */
  nota: "Cada ponto é uma vez em que você salvou a configuração. A linha mostra o seu custo, não o do mercado.",
  versoes: (n: number) => `${n} ${n === 1 ? "versão salva" : "versões salvas"}`,

  /** Curva do grupo — só existe em modo demonstração. */
  rotuloGrupo: "grupo",
  /** Referência horizontal do custo da própria oficina. */
  rotuloVoce: "você",
  legendaGrupo: "é a mediana das oficinas parecidas, mês a mês.",
  /** Substitui `nota` quando há curva do grupo na tela. */
  notaComGrupo:
    "Cada ponto escuro é uma vez em que você salvou a configuração. A linha do grupo serve para você saber se o movimento foi seu ou do mercado.",

  /** Leitura do movimento mais recente, quando há pelo menos 3 pontos. */
  tendencia: {
    subiu: "Na última vez que você salvou, o custo subiu.",
    caiu: "Na última vez que você salvou, o custo caiu.",
    estavel: "O custo não mudou desde a última vez que você salvou.",
  },
} as const;

/**
 * Análises do painel. Todas leem o MESMO cálculo — nenhum número novo,
 * só um ângulo diferente sobre ele.
 *
 * O que sobrou aqui na Leva 4.1 é o que é resumo da PRÓPRIA oficina.
 * O peso por categoria virou `TABELA_CUSTOS` e mudou de tela: comparado
 * contra a mediana do grupo, ele passou a ser análise de benchmark
 * (docs/saas/03-telas.md, seções 5 e 6).
 */
export const ANALISES = {
  maiorAlavanca: {
    titulo: "Sua maior alavanca",
    descricao: (categoria: string) => `${categoria} é o que mais pesa no seu custo.`,
    seCaisseDez: (reducao: string, novoCusto: string) =>
      `Se essa categoria caísse 10%, seu custo real cairia ${reducao}, para ${novoCusto}.`,
  },

  /** Sublinha do tile de ponto de equilíbrio em R$. */
  equilibrioEmReais: {
    nota: "abaixo disso cada unidade vendida dá prejuízo",
  },

  ociosidade: {
    titulo: "O custo da ociosidade",
    ajuda:
      "Quanto custam, por mês, as unidades que sua equipe tem disponíveis e não vende. É a taxa de ocupação em reais, não em percentual.",
    zerada: "Sua equipe vende tudo que tem disponível. Não há custo de ociosidade a mostrar.",
  },

  /**
   * Rótulo curto de propósito: em tile de um quarto de largura, "Ponto
   * de equilíbrio, em unidades por mês" quebrava em duas linhas e
   * desalinhava o número dos vizinhos. A unidade já aparece no valor.
   */
  volumeDeEquilibrio: {
    label: "Quanto vender por mês",
    ajuda:
      "Quanto você precisa vender por mês para não operar no prejuízo. É o ponto de equilíbrio em volume, não em preço.",
  },

  /**
   * A mesma conta do equilíbrio, na unidade que o dono usa para pensar o
   * dia: carro no pátio. Só existe se ele informou a média por carro —
   * sem isso, o card orienta a preencher em vez de mostrar zero.
   */
  /**
   * Sublinha do tile de volume, não tile próprio: carros e unidades são
   * a mesma leitura em duas escalas, e separá-las criava dois cartões
   * dizendo "ponto de equilíbrio" com números diferentes.
   */
  equilibrioEmCarros: {
    semMedia: "Informe quanto você fatura por carro para ver em carros.",
    acao: "Informar na calculadora",
    carros: (n: string) => `≈ ${n} carros por mês`,
  },
} as const;

/**
 * Copy do benchmark. Volta a ser página própria na Leva 4
 * (docs/saas/03-telas.md, seção 5) — o painel guarda só um resumo que
 * leva até `/benchmark`.
 *
 * "Parecidas" agora tem definição operacional: região × segmento ×
 * porte (docs/saas/09-benchmark.md). Por isso porte e recorte
 * aparecem em `recorte()`, sempre visíveis na tela cheia.
 */
export const BENCHMARK = {
  titulo: "Como você está perto de oficinas parecidas",
  mediana: "mediana",

  semCidade:
    "Informe a cidade da oficina na configuração para comparar com oficinas parecidas.",

  /** Diferente de amostra insuficiente: aqui não há nem cálculo próprio para comparar. */
  semCalculo: {
    titulo: "Calcule primeiro o custo da sua oficina",
    texto: "Sem o seu número, não há o que posicionar contra o de oficinas parecidas.",
    acao: "Ir para a calculadora",
  },

  semPrecoAtual:
    "Informe quanto você cobra hoje, na calculadora, para ver onde seu preço se posiciona.",

  /** Estado normal nos primeiros meses. Não é falha. */
  insuficiente: {
    titulo: "Ainda não há oficinas parecidas suficientes.",
    texto:
      "A comparação aparece quando houver amostra que sustente uma faixa, no mesmo recorte de região, segmento e porte. Até lá, preferimos não mostrar número nenhum a mostrar um número que não significa nada.",
  },

  /**
   * Posição, nunca recomendação de preço. 09-benchmark.md: o produto
   * que recomenda número vira responsável por ele.
   */
  posicao: {
    abaixoDoQuartil: "Seu preço está entre os mais baixos do grupo.",
    abaixoDaMediana: "Seu preço está abaixo da mediana do grupo.",
    acimaDaMediana: "Seu preço está acima da mediana do grupo.",
    acimaDoQuartil: "Seu preço está entre os mais altos do grupo.",
  },

  /**
   * O mesmo conjunto, para CUSTO. Existia só a versão de preço, e o
   * bloco de custo a reusava — dizendo "seu preço" embaixo de um número
   * que é custo. Continua sendo posição, nunca recomendação.
   */
  posicaoCusto: {
    abaixoDoQuartil: "Seu custo está entre os mais baixos do grupo.",
    abaixoDaMediana: "Seu custo está abaixo da mediana do grupo.",
    acimaDaMediana: "Seu custo está acima da mediana do grupo.",
    acimaDoQuartil: "Seu custo está entre os mais altos do grupo.",
  },

  rodape:
    "A comparação é sobre preço praticado. Quem define o seu preço é o seu custo, que só você conhece.",

  /** Cartão-resumo no painel — leva até a tela cheia, não repete os números. */
  resumo: {
    cta: "Ver comparação completa",
  },

  /** Recorte sempre visível: o usuário precisa saber contra quem está sendo comparado. */
  recorte: (cidade: string, porteLabel: string) =>
    `${cidade} · porte ${porteLabel.toLowerCase()}`,

  custo: {
    titulo: "Custo real por unidade",
    ajuda: "Seu custo real contra o de oficinas do mesmo recorte.",
  },

  preco: {
    titulo: "Preço praticado e preço sugerido",
    ajuda: "O que você cobra hoje e o que a calculadora sugere, na mesma faixa do grupo.",
    semAtual: "Você ainda não informou quanto cobra hoje — mostrando só o preço sugerido.",
  },

  composicao: {
    titulo: "Composição comparada",
    ajuda:
      "Cada categoria do seu preço contra a mediana do grupo. É a análise que mais ensina, porque aponta onde procurar — não só se o número está alto.",
    /** Rótulos curtos das duas barras de cada categoria. */
    rotuloSua: "Você",
    rotuloGrupo: "Grupo",
  },
} as const;

/**
 * Histograma da distribuição do grupo.
 *
 * Só existe com amostra — sem ela, o card cai em `BENCHMARK.insuficiente`,
 * que é o estado normal nos primeiros meses e não é falha
 * (docs/saas/09-benchmark.md).
 */
export const DISTRIBUICAO = {
  titulo: "Distribuição na sua região",
  ajuda:
    "Quantas oficinas do mesmo recorte ficam em cada faixa de custo. A barra destacada é a faixa onde você está.",
  /** Rótulo da barra do próprio usuário, para quem não distingue cor. */
  suaFaixa: "sua faixa",
  oficinas: (n: number) => `${n} ${n === 1 ? "oficina" : "oficinas"}`,
} as const;

/**
 * Tabela por tipo de custo.
 *
 * Sem modo demonstração, as colunas do grupo simplesmente não são
 * renderizadas e a tabela vira o detalhamento próprio — que é útil
 * sozinho. Um card vazio seria pior que uma tabela mais curta.
 */
export const TABELA_CUSTOS = {
  titulo: "Detalhamento por tipo de custo",
  ajuda:
    "Cada categoria do seu custo, do maior peso para o menor. Custo, aqui, é mão de obra e custos fixos — impostos e margem incidem sobre o preço, não sobre o que a oficina gasta.",
  colunas: {
    categoria: "Categoria",
    porMes: "Por mês",
    porUnidade: "Por unidade",
    peso: "% do custo",
    grupo: "Grupo",
    diferenca: "Diferença",
  },
  total: "Total",
  /** Categoria que o grupo não tem — nunca 0, que seria afirmar algo. */
  semDadoDoGrupo: "—",
  /**
   * Diferença como FATO, sem juízo. "Acima" não é ruim: pode ser
   * estrutura melhor, região mais cara, equipe mais experiente
   * (docs/geral/05-marca.md, regra do vermelho).
   */
  rodapeComparacao:
    "A diferença mostra posição, não acerto. Estar acima do grupo numa categoria pode ser estrutura melhor, não desperdício.",
} as const;

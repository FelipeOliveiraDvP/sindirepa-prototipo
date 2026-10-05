import { BRAND, PROGRAM } from "@/lib/brand";
import { unit } from "@/lib/pricing/config";

/**
 * Copy da única landing — apresentação do produto.
 *
 * ═══ RESTRIÇÃO DE POSICIONAMENTO — NÃO NEGOCIÁVEL ═══
 *
 * Superfície pública, com a marca dos parceiros. NÃO promete aumento de
 * margem. O enquadramento é transparência e profissionalização.
 *
 * Proibido:  "aumente sua margem", "cobre o que você merece",
 *            "pare de perder dinheiro", "dobre seu lucro"
 * Permitido: "saiba quanto custa de verdade", "preço com base em
 *            cálculo, não em achismo", "descubra seu ponto de
 *            equilíbrio", "mostre ao cliente como o preço é formado"
 *
 * O ganho econômico é consequência de precificar certo — nunca a
 * manchete. Toda headline nova passa por esta tabela antes de subir.
 *
 * ═══ DUAS REGRAS PRÓPRIAS DESTA PEÇA (decisão do Felipe) ═══
 *
 * 1. FALA SÓ DO QUE EXISTE. A landing descreve a plataforma em tempo
 *    presente e tudo o que descreve já está no ar: calculadora passo
 *    a passo, benchmark regional e simulador "E se…". Orçamento,
 *    apontamento e integração ficam FORA da página, inclusive do FAQ —
 *    cadastrar aqui um módulo que não existe é descrever como presente
 *    um produto que não está todo aberto.
 * 2. A CONTA E O PREÇO SÃO HONESTOS. O primeiro cálculo é gratuito, e
 *    a copy diz isso sem fingir que a ferramenta é gratuita — o uso do
 *    produto tem plano pago, e o valor só é publicado quando existir.
 *    A conta é explicada pelo motivo prático dela: guardar a
 *    configuração da oficina. Nunca fingir que a conta é opcional.
 */

export const HEROI = {
  titulo: "Preço de mão de obra com base em cálculo, não em achismo",
  subtitulo: `A plataforma da sua oficina abre a conta que forma o preço: quanto custa ${unit.definite}, o que entra e por quê. Item a item, na tela do celular.`,
  cta: "Fazer o primeiro cálculo grátis",
  /** Nota de honestidade: o que é grátis é o primeiro cálculo, não a ferramenta. */
  nota: `O primeiro cálculo é gratuito. Pede uma conta para guardar a configuração da sua oficina — criar leva um minuto.`,
} as const;

export const PROVA = {
  titulo: "Uma iniciativa com o setor",
  texto: `Selecionada na Chamada de Aceleração para Gestão em Oficinas Automotivas do ${PROGRAM.accelerator} com o ${PROGRAM.union}.`,
  /**
   * Sem depoimento inventado e sem "mais de X oficinas confiam".
   * Quando houver número real, entra aqui — e só então.
   */
} as const;

/**
 * As dores: a situação de negócio em volta da conta. Situação, não
 * matemática — a matemática fica na tela da calculadora, que explica
 * cada passo.
 */
export const DORES = {
  titulo: "Onde a conta da oficina se perde",
  blocos: [
    {
      titulo: "O preço nasce da comparação",
      texto:
        "A referência mais usada é o que a oficina vizinha cobra. Ninguém sabe se aquele número cobre os custos dela — e os custos dela não são os seus.",
    },
    {
      titulo: "Não existe tempo de referência",
      texto:
        "Sem uma base de quanto tempo o serviço leva, o mesmo reparo é orçado de um jeito hoje e de outro amanhã, dependendo de quem atende.",
    },
    {
      titulo: "O sistema de gestão não responde isso",
      texto:
        "O ERP cuida de ordem de serviço, peça, estoque e faturamento. Ele não diz quanto custa a sua mão de obra nem se o preço fecha a conta.",
    },
    {
      titulo: "O cliente pergunta e não há resposta",
      texto:
        "Quando o consumidor quer saber por que o serviço custa aquilo, a única resposta disponível é o valor final. Sem a composição aberta, parece arbitrário.",
    },
  ],
} as const;

/**
 * Os três módulos, em tempo presente — porque os três estão no ar.
 * Mecânica de honestidade do benchmark SEM descer ao detalhe técnico:
 * a copy diz que a amostra aparece na tela, que é o mesmo contrato do
 * /benchmark (09-benchmark.md) levado para fora do produto.
 */
export const MODULOS = {
  titulo: "O que a plataforma faz",
  itens: [
    {
      titulo: "Calculadora passo a passo",
      texto: `Salário, encargos, custos fixos, ocupação e impostos entram na conta, um passo por vez. Sai o custo real ${unit.ofDefinite}, o preço sugerido e o ponto de equilíbrio, com a composição aberta.`,
    },
    {
      titulo: "Benchmark regional",
      texto:
        "Onde o seu número está em relação a oficinas de porte parecido na sua região. A amostra aparece na tela — enquanto a sua região não tem amostra suficiente, a página diz isso, e não inventa.",
    },
    {
      titulo: "Simulador e se…",
      texto:
        "Mexeu numa variável, viu o efeito no custo na hora. Serviço na rua, aumento de salário, mês de ociosidade: o que acontece antes de acontecer com você.", // token-ok: "na hora" aqui significa "imediatamente", é tempo, não a unidade de trabalho
    },
  ],
} as const;

/** Os 5 princípios de CLAUDE.md. É o diferencial declarado do produto. */
export const TRANSPARENCIA = {
  titulo: "Nenhum número sem a conta atrás",
  texto:
    "Todo valor que aparece na tela pode ser aberto até a origem: de onde veio cada parcela, qual dado seu entrou e qual foi a operação. É isso que permite mostrar ao cliente como o preço é formado.",
  principios: [
    { titulo: "Educativa", texto: "Explica por que o número é aquele, não só qual é." },
    { titulo: "Intuitiva", texto: "Sem jargão contábil sem tradução. Processo curto e óbvio." },
    {
      titulo: "Transparente",
      texto: "A composição do preço aberta, item a item. Nunca caixa-preta.",
    },
    { titulo: "Baseada em dados", texto: "Indicador e informação real, não estimativa genérica." },
    { titulo: "Parametrizável", texto: "Você ajusta o simulador com os dados da sua oficina." },
  ],
} as const;

export const PARA_QUEM = {
  titulo: "Para quem é",
  itens: [
    {
      titulo: "Oficina independente",
      texto:
        "De um mecânico para cima. Foi desenhada pensando em oficinas de três a oito produtivos, onde o custo fixo pesa e quase nunca é medido.",
    },
    {
      titulo: "Quem já tem sistema de gestão",
      texto:
        "A plataforma responde a pergunta que o ERP não responde. Não é mais um sistema para alimentar.",
    },
    {
      titulo: "Quem atende no balcão",
      texto:
        "Feita para o celular, em pé, no meio do movimento. Nenhum fluxo exige duas mãos, tutorial ou trinta campos.",
    },
    {
      titulo: "Quem precisa explicar o preço",
      texto:
        "Se o seu cliente pergunta por que custa aquilo, a composição aberta é a resposta — e ela cabe na tela do celular.",
    },
  ],
} as const;

export const FAQ = {
  titulo: "Perguntas frequentes",
  perguntas: [
    {
      pergunta: "Isso substitui o meu sistema de gestão?",
      resposta: `Não, e não é para substituir. Seu ERP cuida de ordem de serviço, peça, estoque e faturamento. O ${BRAND.name} cuida da conta que forma o preço da mão de obra — a pergunta que ele não responde.`,
    },
    {
      pergunta: "Preciso criar conta?",
      resposta:
        "Para usar, sim — e o motivo é prático: seus custos mudam, e sem guardar a configuração você teria que digitar tudo de novo a cada visita. A conta é sua e os dados ficam com a sua oficina.",
    },
    {
      pergunta: "Quanto custa?",
      resposta:
        "O primeiro cálculo é gratuito, para você ver a conta inteira antes de decidir. Continuar usando a ferramenta tem plano pago, e o valor é publicado aqui antes de qualquer cobrança.",
    },
    {
      pergunta: "Como vocês calculam?",
      resposta: `Somamos mão de obra com encargos e todos os custos fixos do mês, e dividimos pelas ${unit.plural} que a oficina realmente vende — não pelas disponíveis. O preço sugerido acrescenta impostos e a margem que você definir. Cada passo fica visível na tela.`,
    },
    {
      pergunta: "Preciso instalar alguma coisa?",
      resposta:
        "Não. Funciona no navegador do celular ou do computador, sem instalação e sem configuração.",
    },
    {
      pergunta: "O que acontece com os meus dados?",
      resposta:
        "Os números da sua oficina são usados para o seu cálculo. Nada é compartilhado sem o seu consentimento, e o aviso aparece antes de qualquer gravação.",
    },
  ],
} as const;

export const FECHAMENTO = {
  titulo: "Comece pelo número que falta",
  texto: "Preço com base em cálculo, não em achismo.",
  cta: "Calcular o custo da minha oficina",
} as const;

/**
 * Termos de busca da landing. ÚNICO lugar (com os termos comuns) onde
 * "hora" aparece à mão com token-ok: termo de busca é o que a pessoa
 * DIGITA no Google, não copy de interface — tokenizar geraria
 * palavra-chave que ninguém pesquisa.
 */
export const TERMOS_DE_BUSCA = [
  "calcular preço hora oficina mecânica", // token-ok: termo de busca real
  "custo hora mão de obra oficina", // token-ok: termo de busca real
  "como formar preço de serviço automotivo",
] as const;

export const RODAPE = {
  privacidade:
    "Seus dados são usados apenas para o cálculo que você pediu. Nada é compartilhado sem o seu consentimento.",
} as const;

export const FAQPAGE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.perguntas.map((item) => ({
    "@type": "Question",
    name: item.pergunta,
    acceptedAnswer: { "@type": "Answer", text: item.resposta },
  })),
};

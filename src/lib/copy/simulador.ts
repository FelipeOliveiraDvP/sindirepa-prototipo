/**
 * Copy do simulador `/e-se`. pt-BR, tom de docs/geral/07-copy.md.
 *
 * O simulador é exploração, não configuração — nenhum texto aqui pode
 * sugerir que um cenário fica gravado (docs/saas/03-telas.md, seção 7).
 */

export const SIMULADOR = {
  titulo: "E se...",
  subtitulo:
    "Cada alavanca abaixo parte da sua configuração salva, muda uma coisa por vez, e mostra o antes e o depois. Nada aqui é gravado.",

  semConfiguracao: {
    titulo: "Falta salvar sua configuração",
    texto: "O simulador parte do que você já calculou e salvou. Comece pela calculadora.",
    acao: "Ir para a calculadora",
  },

  hoje: "Sua situação hoje",

  depois: "Depois",

  bloqueado: "Esse cenário não fecha uma conta válida com o ajuste atual.",

  levarParaCalculadora: "Levar este cenário para a calculadora",

  alavancas: {
    produtivo: {
      titulo: "Contratar mais um produtivo",
      ajuda: "Quantos produtivos a mais, com o mesmo salário médio de hoje.",
      label: "Produtivos a mais",
    },
    custoFixo: {
      titulo: "Um custo fixo sobe",
      ajuda: "Escolha a categoria e o quanto ela subiria — em percentual sobre o valor de hoje.",
      categoriaLabel: "Categoria",
      percentualLabel: "Aumento",
    },
    ocupacao: {
      titulo: "A ocupação muda",
      ajuda: "Quantos pontos percentuais a taxa de ocupação subiria ou cairia.",
      label: "Variação da ocupação",
    },
    salario: {
      titulo: "O salário médio muda",
      ajuda: "Quanto o salário médio da equipe subiria ou cairia, em percentual.",
      label: "Variação do salário",
    },
    margem: {
      titulo: "A margem desejada muda",
      ajuda: "Quantos pontos percentuais a margem desejada mudaria.",
      label: "Variação da margem",
    },
  },
} as const;

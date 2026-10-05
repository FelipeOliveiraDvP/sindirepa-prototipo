/**
 * Copy compartilhada entre landing e produto. pt-BR.
 * Tom de voz e glossário em docs/geral/07-copy.md.
 *
 * A tagline vive aqui, e não em src/lib/brand.ts, porque contém a
 * unidade de trabalho — que é token própria.
 *
 * ═══ POR QUE ISTO É UMA FÁBRICA ═══
 * Com mecânica e funilaria ativas, unidade e rótulo do produtivo
 * dependem do segmento: funilaria fala em UT e não tem mecânico.
 * As constantes exportadas no fim do arquivo são o caso mecânica, e
 * existem para as landings — que são SSG e não têm usuário, logo não
 * têm segmento.
 */
import { LEXICO_PADRAO, type Lexico } from "@/lib/pricing/segmento";

export function criarTermos({ unit, produtivo }: Lexico) {
  return {
    custoReal: {
      label: `Custo real ${unit.ofDefinite}`,
      ajuda: `Quanto custa manter um ${produtivo.singular} trabalhando por uma ${unit.singular}, com tudo incluso.`,
    },
    precoSugerido: {
      label: `Preço ${unit.ofDefinite} sugerido`,
      ajuda:
        "O que você precisa cobrar para pagar todos os custos, os impostos e ainda ter a margem que você definiu.",
    },
    pontoDeEquilibrio: {
      label: "Ponto de equilíbrio",
      ajuda: `Abaixo desse valor, cada ${unit.singular} vendida dá prejuízo.`,
    },
    ocupacao: {
      label: "Taxa de ocupação",
      ajuda: `De cada 10 ${unit.plural} que sua equipe fica disponível, quantas são realmente vendidas. Quase nenhuma oficina chega perto de 10.`,
    },
    encargos: {
      label: "Encargos",
      ajuda: "O que se paga além do salário: FGTS, INSS, 13º, férias e benefícios.",
    },
    custosFixos: {
      label: "Custos fixos",
      ajuda: "Tudo que a oficina paga todo mês mesmo quando não entra carro.",
    },
    margem: {
      label: "Margem desejada",
      ajuda: "Quanto sobra depois de pagar tudo. É o que financia investimento e imprevisto.",
    },
    impostos: {
      label: "Impostos",
      ajuda: "O percentual do faturamento que vai para o Simples ou para o regime da sua oficina.",
    },
    produtivos: {
      label: capitalizar(produtivo.plural),
      ajuda: `Só quem vende ${unit.singular}. Balconista, gerente e quem não põe a mão no carro entram em custos fixos.`,
    },
  } as const;
}

export type Termos = ReturnType<typeof criarTermos>;

/**
 * Termos do glossário, com a explicação em linguagem de oficina.
 * Uma string por termo, reusada em tooltip, landing e memória de cálculo —
 * nunca reescrita por tela. É o princípio "Educativa" em
 * forma de string (07-copy.md).
 *
 * Os textos de `ajuda` são os de 07-copy.md ao pé da letra. Se um deles
 * for reescrito, reescrever no documento primeiro.
 *
 * ⚠️ Caso mecânica. Dentro de `(app)`, usar os termos do provider.
 */
export const TERMOS = criarTermos(LEXICO_PADRAO);

export const TAGLINE = `O custo real ${LEXICO_PADRAO.unit.ofDefinite} da sua oficina`;

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Porte da oficina — terceira dimensão da agregação do benchmark, junto
 * de região e segmento (docs/saas/09-benchmark.md).
 *
 * "Parecidas" sem porte compara uma oficina de 2 mecânicos com uma de
 * 15, e isso não ensina nada a nenhuma das duas.
 *
 * NÃO é coluna do banco. É sempre derivado da contagem de produtivos
 * ativos, nunca gravado — uma coluna própria desatualizaria assim que a
 * equipe mudasse (docs/geral/06-dados.md).
 */

export type Porte = "pequena" | "media" | "grande";

export const PORTES: readonly Porte[] = ["pequena", "media", "grande"];

export const PORTE_LABEL: Record<Porte, string> = {
  pequena: "Pequena",
  media: "Média",
  grande: "Grande",
};

/** Faixa de produtivos que define cada porte — para exibir junto do rótulo. */
export const PORTE_FAIXA_PRODUTIVOS: Record<Porte, string> = {
  pequena: "1–2 produtivos",
  media: "3–8 produtivos",
  grande: "9+ produtivos",
};

/** Média é o ICP de docs/geral/01-contexto.md: 3–8 produtivos. */
export function porteDeProdutivos(quantidadeProdutivos: number): Porte {
  if (quantidadeProdutivos <= 2) return "pequena";
  if (quantidadeProdutivos <= 8) return "media";
  return "grande";
}

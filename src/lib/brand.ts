/**
 * O ÚNICO lugar do projeto onde o nome da marca aparece como literal.
 * Ver docs/geral/05-marca.md e o manual em docs/geral/marca/aba-manual.
 *
 * O nome vem de "apurar": descobrir o custo real. Definição travada no
 * manual da marca — docs/geral/marca/apura-manual-da-marca.pdf.
 *
 * Trocar o nome = editar este objeto. Nada mais no código.
 * Fora do código, existe um checklist que os tokens não alcançam:
 *   - public/ (favicon, logo, og-image)
 *   - textos de e-mail transacional
 *   - domínio e DNS
 *
 * A tagline NÃO vive aqui de propósito: ela contém a unidade de
 * trabalho, que é token própria (WORK_UNIT). Ver src/lib/copy/common.ts.
 */
export const BRAND = {
  name: "Apura",
  legalOwner: "Nocobi",

  domain: "apura.com.br",

  /** Onde a calculadora gratuita já está no ar hoje. */
  calculatorDomain: "calculadoramaodeobra.nocobi.com",
} as const;

/** Parceria institucional. Ativo de credibilidade mais forte que existe hoje. */
export const PROGRAM = {
  accelerator: "UPLAB SENAI-SP",
  union: "SINDIREPA-SP",
} as const;

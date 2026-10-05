/**
 * Regiões de cobertura inicial.
 *
 * ⚠️ NÃO É DADO DE MERCADO. É a taxonomia pela qual o benchmark agrega
 * (docs/saas/09-benchmark.md) — uma lista de lugares, não de preços.
 * Nenhum valor de R$ pode entrar aqui.
 *
 * O recorte segue o ICP de docs/geral/01-contexto.md: oficina
 * independente de médio porte na Grande São Paulo e no ABC. As demais
 * cidades de SP entram porque a parceria com o SINDIREPA-SP alcança o
 * estado inteiro.
 *
 * "Outra" existe de propósito: obrigar o usuário a escolher uma cidade
 * errada para poder avançar contamina a base de agregação. Quem marca
 * "Outra" simplesmente não entra em nenhum recorte regional.
 */

export const REGIAO_NAO_INFORMADA = "";
export const REGIAO_OUTRA = "outra";

export const REGIOES = [
  { id: "sao-paulo", label: "São Paulo" },
  { id: "guarulhos", label: "Guarulhos" },
  { id: "osasco", label: "Osasco" },
  { id: "santo-andre", label: "Santo André" },
  { id: "sao-bernardo-do-campo", label: "São Bernardo do Campo" },
  { id: "sao-caetano-do-sul", label: "São Caetano do Sul" },
  { id: "diadema", label: "Diadema" },
  { id: "maua", label: "Mauá" },
  { id: "barueri", label: "Barueri" },
  { id: "campinas", label: "Campinas" },
  { id: "sorocaba", label: "Sorocaba" },
  { id: "santos", label: "Santos" },
  { id: "ribeirao-preto", label: "Ribeirão Preto" },
  { id: REGIAO_OUTRA, label: "Outra cidade" },
] as const;

export type RegiaoId = (typeof REGIOES)[number]["id"];

export function ehRegiaoAgregavel(id: string): boolean {
  return id !== REGIAO_NAO_INFORMADA && id !== REGIAO_OUTRA;
}

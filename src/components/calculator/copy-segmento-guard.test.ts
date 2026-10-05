import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Guarda do vazamento de segmento — a mesma ideia de `check-tokens.mjs`,
 * aplicada à copy em vez de à unidade.
 *
 * Todo componente em `src/components/calculator/` é compartilhado com o
 * herói da landing e vive DENTRO de `(app)` também, então precisa da
 * copy que muda por segmento (`useSegmento().copy`), nunca da copy
 * ESTÁTICA de mecânica exportada por nome de `lib/copy/calculadora.ts`.
 *
 * A Leva 4 encontrou cinco componentes que nunca tinham sido ligados ao
 * provider — CompositionBar, CalculationMemory, CustosFixosSecao,
 * OcupacaoField e ResultPanel. Numa conta de funilaria eles mostravam
 * "hora" no meio de uma tela que já dizia "UT". Este teste existe para
 * que o próximo componente não repita o mesmo erro sem que o build avise.
 *
 * A fábrica `criarCopyCalculadora` e o tipo `CopyCalculadora` continuam
 * liberados — é assim que `SegmentoProvider` monta a copy por segmento.
 */

const DIR = dirname(fileURLToPath(import.meta.url));

const EXPORTS_ESTATICOS = [
  "TITULO",
  "SUBTITULO",
  "SECOES",
  "CAMPOS",
  "COMPOSICAO_LABEL",
  "COMPOSICAO_AJUDA",
  "RESULTADO",
  "DIAGNOSTICO",
  "ACOES",
];

function arquivosTsx(): string[] {
  return readdirSync(DIR).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
}

/** Nomes importados de "@/lib/copy/calculadora" num arquivo, se houver. */
function nomesImportadosDaCopyEstatica(conteudo: string): string[] {
  const linhaDoImport = conteudo
    .split(/\r?\n/)
    .find((l) => l.includes('from "@/lib/copy/calculadora"'));
  if (!linhaDoImport) return [];

  const chaves = linhaDoImport.match(/\{([^}]*)\}/)?.[1] ?? "";
  return chaves
    .split(",")
    .map((n) => n.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0])
    .filter(Boolean);
}

describe("nenhum componente de src/components/calculator/ usa a copy estática de mecânica", () => {
  for (const arquivo of arquivosTsx()) {
    it(`${arquivo} não importa export estático de lib/copy/calculadora`, () => {
      const conteudo = readFileSync(join(DIR, arquivo), "utf8");
      const importados = nomesImportadosDaCopyEstatica(conteudo);
      const violacoes = importados.filter((n) => EXPORTS_ESTATICOS.includes(n));

      expect(
        violacoes,
        `${arquivo} importa ${violacoes.join(", ")} de "@/lib/copy/calculadora" — ` +
          "use useSegmento().copy, senão o texto não muda com o segmento.",
      ).toHaveLength(0);
    });
  }
});

import { describe, expect, it } from "vitest";
import { lexicoDoSegmento, unitDoSegmento } from "@/lib/pricing/segmento";
import { criarAssistente, type AjudaDeCampo } from "./assistente";
import { criarCopyCalculadora } from "./calculadora";

/**
 * O assistente é a peça que responde "onde eu acho esse número".
 *
 * O teste que importa aqui é o de COBERTURA: se alguém acrescentar um
 * campo à calculadora e esquecer o texto de ajuda, o usuário vê um
 * painel vazio justamente no campo novo — que é o mais provável de
 * confundir. Falhar no CI é melhor que descobrir em produção.
 */

function ajudas(segmento: "mecanica" | "funilaria") {
  return criarAssistente(lexicoDoSegmento(segmento)) as unknown as Record<
    string,
    AjudaDeCampo
  >;
}

describe("cobertura", () => {
  it("todo campo da calculadora tem ajuda no assistente", () => {
    const campos = Object.keys(criarCopyCalculadora().CAMPOS);
    const assistente = ajudas("mecanica");

    const semAjuda = campos.filter((c) => !assistente[c]);
    expect(semAjuda, `campos sem texto no assistente: ${semAjuda.join(", ")}`).toEqual([]);
  });

  it("os campos que só existem no modo guiado também têm ajuda", () => {
    const assistente = ajudas("mecanica");
    for (const campo of ["segmento", "cidade", "custosFixos"]) {
      expect(assistente[campo], `faltou ajuda para ${campo}`).toBeTruthy();
    }
  });

  it("nenhuma ajuda vem vazia", () => {
    for (const [campo, ajuda] of Object.entries(ajudas("mecanica"))) {
      expect(ajuda.ondeEncontrar.length, `${campo} sem "onde encontrar"`).toBeGreaterThan(20);
    }
  });
});

describe("segmento", () => {
  it("a ajuda fala a unidade do segmento", () => {
    const fun = ajudas("funilaria");
    const mec = ajudas("mecanica");

    expect(fun.ocupacao.comoEstimar).toContain(unitDoSegmento("funilaria").plural);
    expect(fun.ocupacao.comoEstimar).not.toContain(unitDoSegmento("mecanica").plural);
    expect(mec.ocupacao.comoEstimar).toContain(unitDoSegmento("mecanica").plural);
  });

  it("funilaria não chama o produtivo de mecânico", () => {
    const fun = ajudas("funilaria");
    const rotuloMecanica = lexicoDoSegmento("mecanica").produtivo.plural;
    expect(fun.quantidadeProdutivos.ondeEncontrar).not.toContain(rotuloMecanica);
  });
});

describe("regra 4 do CLAUDE.md — nada de dado de mercado", () => {
  /**
   * O salário é o único campo sem padrão, exatamente para não sugerir
   * referência de mercado. O assistente não pode desfazer isso dizendo
   * "o normal é R$ X".
   */
  it("nenhuma ajuda cita valor em reais", () => {
    for (const [campo, ajuda] of Object.entries(ajudas("mecanica"))) {
      const texto = Object.values(ajuda).join(" ");
      expect(texto, `${campo} cita valor em R$`).not.toMatch(/R\$\s*\d/);
    }
  });

  it("a ajuda do salário não sugere quanto pagar", () => {
    const t = Object.values(ajudas("mecanica").salarioMedio).join(" ").toLowerCase();
    for (const proibido of ["média do mercado", "normalmente é", "costuma ser", "gira em torno"]) {
      expect(t, `sugere referência: "${proibido}"`).not.toContain(proibido);
    }
  });
});

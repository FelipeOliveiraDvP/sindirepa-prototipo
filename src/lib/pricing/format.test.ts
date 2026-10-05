import { describe, expect, it } from "vitest";
import { unit } from "./config";
import {
  formatarDecimal,
  formatarInteiro,
  formatarMoeda,
  formatarPercentual,
  formatarUnidades,
} from "./format";

/** Regras de exibição de docs/geral/06-dados.md. */
describe("moeda", () => {
  it("milhar com ponto, decimal com vírgula, sempre 2 casas", () => {
    expect(formatarMoeda(1234.56)).toBe("R$ 1.234,56");
    expect(formatarMoeda(42.5)).toBe("R$ 42,50");
    expect(formatarMoeda(0)).toBe("R$ 0,00");
    expect(formatarMoeda(1_000_000)).toBe("R$ 1.000.000,00");
  });

  it("usa espaço comum, não espaço não-quebrável do ICU", () => {
    expect(formatarMoeda(10)).not.toMatch(/[  ]/);
  });

  it("valor negativo mantém o sinal — o comparativo depende disso", () => {
    expect(formatarMoeda(-18.4)).toContain("18,40");
    expect(formatarMoeda(-18.4)).toMatch(/^-/);
  });

  it("arredonda na exibição, não antes", () => {
    expect(formatarMoeda(42.502951)).toBe("R$ 42,50");
    expect(formatarMoeda(53.8012)).toBe("R$ 53,80");
  });
});

describe("percentual", () => {
  it("recebe fração e mostra 1 casa decimal", () => {
    expect(formatarPercentual(0.145)).toBe("14,5%");
    expect(formatarPercentual(0.7)).toBe("70,0%");
    expect(formatarPercentual(0.06)).toBe("6,0%");
  });
});

describe("unidades", () => {
  it("1 casa decimal com o rótulo vindo do token", () => {
    expect(formatarUnidades(2.5)).toBe(`2,5 ${unit.abbrev}`);
    expect(formatarUnidades(542.08)).toBe(`542,1 ${unit.abbrev}`);
  });

  /**
   * Guarda da abstração: se alguém trocar WORK_UNIT para "UT", este
   * teste continua passando sem edição. Se o dia chegar e ele exigir
   * edição, é porque um literal vazou.
   */
  it("não embute o rótulo da unidade", () => {
    expect(formatarUnidades(1)).toContain(unit.abbrev);
  });
});

describe("números sem moeda", () => {
  it("decimal e inteiro em pt-BR", () => {
    expect(formatarDecimal(774.4)).toBe("774,4");
    expect(formatarInteiro(22)).toBe("22");
    expect(formatarInteiro(1234)).toBe("1.234");
  });
});

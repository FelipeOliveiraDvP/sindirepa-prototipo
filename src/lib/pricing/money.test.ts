import { describe, expect, it } from "vitest";
import { somarReais, toCents, toReais } from "./money";

describe("soma de dinheiro", () => {
  /**
   * O motivo de money.ts existir. Sem ele, o total que o usuário
   * confere contra a planilha dele não fecha por causa de float.
   */
  it("não acumula erro de float", () => {
    expect(0.1 + 0.2).not.toBe(0.3); // o problema
    expect(somarReais([0.1, 0.2])).toBe(0.3); // a correção
  });

  it("soma uma lista de custos fixos sem sobra de centavo", () => {
    const custos = [1234.56, 89.9, 45.45, 1200.01, 333.33];
    expect(somarReais(custos)).toBe(2903.25);
  });

  it("lista vazia soma zero", () => {
    expect(somarReais([])).toBe(0);
  });

  it("converte reais e centavos nos dois sentidos", () => {
    expect(toCents(1234.56)).toBe(123456);
    expect(toReais(123456)).toBe(1234.56);
  });

  it("arredonda para o centavo mais próximo", () => {
    expect(toCents(10.004)).toBe(1000);
    expect(toCents(10.005)).toBe(1001);
  });
});

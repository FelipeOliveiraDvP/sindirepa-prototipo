import { describe, expect, it } from "vitest";
import { calcular } from "./calculate";
import { inputPadrao } from "./defaults";
import { memoriaDeCalculo } from "./explain";
import { formatarMoeda } from "./format";

/**
 * A memória de cálculo é o princípio "Transparente" na prática, não
 * polimento. Ordem e quantidade dos passos são contrato.
 */
/** Fixture de teste. O salário não tem padrão — ver defaults.ts. */
const SALARIO_FIXTURE = 3200;

function referencia() {
  const padrao = inputPadrao();
  return {
    ...padrao,
    produtivos: padrao.produtivos.map((p) => ({ ...p, salarioBruto: SALARIO_FIXTURE })),
  };
}

function memoria() {
  const entrada = referencia();
  const c = calcular(entrada);
  if (!c.ok) throw new Error("esperava cálculo válido");
  return { passos: memoriaDeCalculo(entrada, c.resultado), resultado: c.resultado };
}

describe("memória de cálculo", () => {
  it("traz exatamente os 7 passos de 06-dados.md", () => {
    expect(memoria().passos).toHaveLength(7);
  });

  it("os passos estão numerados de 1 a 7, na ordem", () => {
    expect(memoria().passos.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("todo passo tem título, conta e resultado", () => {
    for (const passo of memoria().passos) {
      expect(passo.titulo.length).toBeGreaterThan(0);
      expect(passo.conta.length).toBeGreaterThan(0);
      expect(passo.resultado.length).toBeGreaterThan(0);
    }
  });

  it("mostra os números do usuário, não a fórmula genérica", () => {
    const { passos } = memoria();
    expect(passos[0].conta).toContain("22 dias");
    expect(passos[0].conta).toContain("8,8");
    expect(passos[1].conta).toContain("70,0%");
  });

  it("o passo 6 fecha com o custo real do resultado", () => {
    const { passos, resultado } = memoria();
    expect(passos[5].resultado).toBe(formatarMoeda(resultado.custoRealUnidade));
  });

  it("o passo 7 fecha com o preço sugerido e mostra o divisor", () => {
    const { passos, resultado } = memoria();
    expect(passos[6].resultado).toBe(formatarMoeda(resultado.precoUnidadeSugerido));
    expect(passos[6].conta).toContain("79,0%");
  });

  /**
   * A memória existe para ser conferida. Se ela exibir um intermediário
   * arredondado, quem refizer a conta na mão chega a outro centavo e
   * conclui — com razão — que o número não fecha. Por isso a contagem de
   * unidades aparece com 2 casas na memória, e não com 1 como no resto
   * da interface.
   */
  it("o passo 6 mostra o divisor com precisão suficiente para refazer a conta", () => {
    const { passos, resultado } = memoria();
    expect(passos[5].conta).toContain("542,08");

    // Refaz a divisão usando só o que está escrito na tela.
    const [dividendo, divisor] = passos[5].conta.split("÷");
    const numeroDividendo = Number(
      dividendo.replace(/[R$\s.]/g, "").replace(",", "."),
    );
    const numeroDivisor = Number(divisor.replace(/[^\d,]/g, "").replace(",", "."));

    expect(formatarMoeda(numeroDividendo / numeroDivisor)).toBe(
      formatarMoeda(resultado.custoRealUnidade),
    );
  });

  it("nenhum passo vaza NaN, Infinity ou undefined no texto", () => {
    for (const passo of memoria().passos) {
      const texto = `${passo.titulo} ${passo.conta} ${passo.resultado} ${passo.porque ?? ""}`;
      expect(texto).not.toMatch(/NaN|Infinity|undefined|\[object/);
    }
  });

  it("concorda o singular quando há um só mecânico", () => {
    const r = referencia();
    const entrada = { ...r, produtivos: [r.produtivos[0]] };
    const c = calcular(entrada);
    if (!c.ok) throw new Error("esperava cálculo válido");
    const passos = memoriaDeCalculo(entrada, c.resultado);
    expect(passos[0].conta).toContain("1 mecânico");
    expect(passos[0].conta).not.toContain("1 mecânicos");
  });
});

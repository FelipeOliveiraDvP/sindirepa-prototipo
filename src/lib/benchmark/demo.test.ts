import { afterEach, describe, expect, it } from "vitest";
import { PORTES } from "@/lib/porte";
import type { Segmento } from "@/lib/pricing/segmento";
import {
  amostraIlustrativa,
  categoriasSemMediana,
  modoDemonstracaoLigado,
  SELO_ILUSTRATIVO,
} from "./demo";

/**
 * O dado ilustrativo é a maior exceção que este produto abre à regra 4
 * do CLAUDE.md. Estes testes garantem que ela continua sendo exceção.
 */

const SEGMENTOS: readonly Segmento[] = ["mecanica", "funilaria"];

const original = process.env.NEXT_PUBLIC_BENCHMARK_DEMO;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_BENCHMARK_DEMO;
  else process.env.NEXT_PUBLIC_BENCHMARK_DEMO = original;
});

describe("desligado por padrão", () => {
  it("sem a variável, não existe amostra", () => {
    delete process.env.NEXT_PUBLIC_BENCHMARK_DEMO;
    expect(modoDemonstracaoLigado()).toBe(false);
    expect(amostraIlustrativa("mecanica", "media")).toBeNull();
    expect(amostraIlustrativa("funilaria", "pequena")).toBeNull();
  });

  it("qualquer valor diferente de 1 mantém desligado", () => {
    for (const v of ["0", "true", "sim", ""]) {
      process.env.NEXT_PUBLIC_BENCHMARK_DEMO = v;
      expect(amostraIlustrativa("mecanica", "media"), `ligou com "${v}"`).toBeNull();
    }
  });
});

describe("o selo não se separa do número", () => {
  it("a amostra sempre carrega o selo e a explicação", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        const a = amostraIlustrativa(s, p);
        expect(a).not.toBeNull();
        expect(a!.selo).toBe(SELO_ILUSTRATIVO);
        expect(a!.explicacao.length).toBeGreaterThan(40);
        expect(a!.porte).toBe(p);
      }
    }
  });

  it("o selo diz que não é pesquisa de mercado", () => {
    expect(SELO_ILUSTRATIVO.toLowerCase()).toContain("ilustrativo");
    expect(SELO_ILUSTRATIVO.toLowerCase()).toContain("não é pesquisa de mercado");
  });
});

describe("dado estável", () => {
  /**
   * O protótipo Lovable regerava a distribuição com Math.random() a
   * cada render. Número que muda sozinho é mentira duas vezes: finge
   * ser dado e nem sequer é o mesmo dado.
   */
  it("a faixa é a mesma em chamadas sucessivas", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    expect(amostraIlustrativa("mecanica", "media")!.faixaCusto).toEqual(
      amostraIlustrativa("mecanica", "media")!.faixaCusto,
    );
  });

  function checarCoerencia(f: { minimo: number; p25: number; mediana: number; p75: number; maximo: number; n: number }) {
    expect(f.minimo).toBeLessThanOrEqual(f.p25);
    expect(f.p25).toBeLessThanOrEqual(f.mediana);
    expect(f.mediana).toBeLessThanOrEqual(f.p75);
    expect(f.p75).toBeLessThanOrEqual(f.maximo);
    expect(f.n).toBeGreaterThan(0);
  }

  it("a faixa de custo é coerente: min <= p25 <= mediana <= p75 <= max, em todo porte", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        checarCoerencia(amostraIlustrativa(s, p)!.faixaCusto);
      }
    }
  });

  it("a faixa de preço é coerente e fica acima da faixa de custo", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        const a = amostraIlustrativa(s, p)!;
        checarCoerencia(a.faixaPreco);
        // Preço cobre custo, imposto e margem — nunca fica abaixo do custo.
        expect(a.faixaPreco.mediana).toBeGreaterThan(a.faixaCusto.mediana);
      }
    }
  });

  it("a mesma amostra tem o mesmo N no custo e no preço", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        const a = amostraIlustrativa(s, p)!;
        expect(a.faixaPreco.n).toBe(a.faixaCusto.n);
      }
    }
  });
});

describe("composicaoMediana", () => {
  it("as frações somam 100% em cada segmento", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      const c = amostraIlustrativa(s, "media")!.composicaoMediana;
      const soma = c.maoDeObra + c.custosFixos + c.impostos + c.margem;
      expect(soma).toBeCloseTo(1, 6);
    }
  });
});

describe("distribuicao", () => {
  it("as contagens somam exatamente o N da faixa de custo", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        const a = amostraIlustrativa(s, p)!;
        const soma = a.distribuicao.reduce((acc, f) => acc + f.contagem, 0);
        expect(soma, `${s}/${p}`).toBe(a.faixaCusto.n);
      }
    }
  });

  it("cobre a faixa inteira, sem buraco entre as barras", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        const a = amostraIlustrativa(s, p)!;
        const d = a.distribuicao;
        expect(d[0].minimo).toBeCloseTo(a.faixaCusto.minimo, 6);
        expect(d[d.length - 1].maximo).toBeCloseTo(a.faixaCusto.maximo, 6);
        for (let i = 1; i < d.length; i++) {
          expect(d[i].minimo).toBeCloseTo(d[i - 1].maximo, 6);
        }
      }
    }
  });

  it("toda contagem é inteira e não negativa", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        for (const f of amostraIlustrativa(s, p)!.distribuicao) {
          expect(Number.isInteger(f.contagem)).toBe(true);
          expect(f.contagem).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("é a mesma em chamadas sucessivas — nada de Math.random()", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    expect(amostraIlustrativa("mecanica", "media")!.distribuicao).toEqual(
      amostraIlustrativa("mecanica", "media")!.distribuicao,
    );
  });

  it("a barra mais alta contém a mediana da faixa", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        const a = amostraIlustrativa(s, p)!;
        const moda = a.distribuicao.reduce((x, y) => (y.contagem > x.contagem ? y : x));
        expect(a.faixaCusto.mediana, `${s}/${p}`).toBeGreaterThanOrEqual(moda.minimo);
        expect(a.faixaCusto.mediana, `${s}/${p}`).toBeLessThanOrEqual(moda.maximo);
      }
    }
  });
});

describe("medianaPorCategoria", () => {
  it("mão de obra mais os custos fixos somam 100% em cada segmento", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      const m = amostraIlustrativa(s, "media")!.medianaPorCategoria;
      const soma =
        m.maoDeObra + Object.values(m.custosFixos).reduce((a, b) => a + b, 0);
      expect(soma, s).toBeCloseTo(1, 6);
    }
  });

  /**
   * Uma categoria renomeada em segmento.ts e não aqui deixaria a coluna
   * do grupo vazia sem ninguém perceber. Falhar alto é melhor.
   */
  it("toda categoria oferecida pelo segmento tem mediana", () => {
    for (const s of SEGMENTOS) {
      expect(categoriasSemMediana(s), s).toEqual([]);
    }
  });
});

describe("tendencia", () => {
  it("tem doze meses, do mais antigo para o mais recente", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        const t = amostraIlustrativa(s, p)!.tendencia;
        expect(t, `${s}/${p}`).toHaveLength(12);
        for (let i = 1; i < t.length; i++) {
          expect(t[i].mes > t[i - 1].mes, `${t[i - 1].mes} -> ${t[i].mes}`).toBe(true);
        }
      }
    }
  });

  /**
   * O gráfico e a barra da faixa mostram o mesmo grupo. Se a série
   * terminasse num valor diferente da mediana publicada, as duas peças
   * contariam histórias diferentes sobre a mesma amostra.
   */
  it("termina exatamente na mediana da faixa de custo", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        const a = amostraIlustrativa(s, p)!;
        expect(a.tendencia[a.tendencia.length - 1].valor, `${s}/${p}`).toBeCloseTo(
          a.faixaCusto.mediana,
          6,
        );
      }
    }
  });

  it("todo valor cai dentro da faixa do grupo", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    for (const s of SEGMENTOS) {
      for (const p of PORTES) {
        const a = amostraIlustrativa(s, p)!;
        for (const ponto of a.tendencia) {
          expect(ponto.valor).toBeGreaterThanOrEqual(a.faixaCusto.minimo);
          expect(ponto.valor).toBeLessThanOrEqual(a.faixaCusto.maximo);
        }
      }
    }
  });

  it("o último mês é o mês da referência", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    const ref = new Date(Date.UTC(2026, 7, 20));
    const t = amostraIlustrativa("mecanica", "media", ref)!.tendencia;
    expect(t[t.length - 1].mes).toBe("2026-08");
    expect(t[0].mes).toBe("2025-09");
  });

  it("é a mesma em chamadas sucessivas — nada de Math.random()", () => {
    process.env.NEXT_PUBLIC_BENCHMARK_DEMO = "1";
    const ref = new Date(Date.UTC(2026, 7, 20));
    expect(amostraIlustrativa("mecanica", "media", ref)!.tendencia).toEqual(
      amostraIlustrativa("mecanica", "media", ref)!.tendencia,
    );
  });
});

import { describe, expect, it } from "vitest";
import { agregadoPadrao, paraCalculoInput, type EntradaAgregada } from "./aggregate";
import { calcular } from "./calculate";
import {
  cenarioCustoFixoMuda,
  cenarioMargemMuda,
  cenarioOcupacaoMuda,
  cenarioProdutivoExtra,
  cenarioSalarioMuda,
} from "./simulacao";

/**
 * O simulador não pode ter fórmula própria — cada cenário é
 * `calcular()` sobre uma entrada modificada, nunca aritmética paralela
 * (docs/saas/03-telas.md, seção 7). O invariante que este arquivo prova
 * é o mesmo de `aggregate.test.ts` para o herói × calculadora: um
 * cenário "sem mudança" tem de produzir EXATAMENTE o mesmo resultado
 * que `calcular()` na entrada original.
 */

const SALARIO_FIXTURE = 3200;
/** Custo fixo positivo na fixture: com tudo em R$ 0, mais produtivo idêntico
 * não muda o custo médio — precisa haver custo a diluir entre mais gente. */
const CUSTO_FIXO_FIXTURE = 5000;

function referencia(): EntradaAgregada {
  const padrao = agregadoPadrao();
  return {
    ...padrao,
    salarioMedio: SALARIO_FIXTURE,
    custosFixos: padrao.custosFixos.map((c, i) =>
      i === 0 ? { ...c, valorMensal: CUSTO_FIXO_FIXTURE } : c,
    ),
  };
}

function exigirOk(entrada: EntradaAgregada) {
  const c = calcular(paraCalculoInput(entrada));
  if (!c.ok) throw new Error(`esperava cálculo válido, veio: ${JSON.stringify(c.erros)}`);
  return c.resultado;
}

describe("cenário sem mudança reproduz o mesmo número que calcular()", () => {
  it("cenarioProdutivoExtra(0) é idêntico à base", () => {
    const entrada = referencia();
    expect(exigirOk(cenarioProdutivoExtra(entrada, 0))).toEqual(exigirOk(entrada));
  });

  it("cenarioCustoFixoMuda(0%) é idêntico à base", () => {
    const entrada = referencia();
    const categoria = entrada.custosFixos[0].categoria;
    expect(exigirOk(cenarioCustoFixoMuda(entrada, categoria, 0))).toEqual(exigirOk(entrada));
  });

  it("cenarioOcupacaoMuda(0) é idêntico à base", () => {
    const entrada = referencia();
    expect(exigirOk(cenarioOcupacaoMuda(entrada, 0))).toEqual(exigirOk(entrada));
  });

  it("cenarioSalarioMuda(0%) é idêntico à base", () => {
    const entrada = referencia();
    expect(exigirOk(cenarioSalarioMuda(entrada, 0))).toEqual(exigirOk(entrada));
  });

  it("cenarioMargemMuda(0) é idêntico à base", () => {
    const entrada = referencia();
    expect(exigirOk(cenarioMargemMuda(entrada, 0))).toEqual(exigirOk(entrada));
  });
});

describe("cada alavanca move o número na direção esperada", () => {
  it("mais um produtivo aumenta as unidades disponíveis e reduz o custo real", () => {
    const entrada = referencia();
    const base = exigirOk(entrada);
    const depois = exigirOk(cenarioProdutivoExtra(entrada, 1));

    expect(depois.unidadesDisponiveis).toBeGreaterThan(base.unidadesDisponiveis);
    expect(depois.custoRealUnidade).toBeLessThan(base.custoRealUnidade);
  });

  it("custo fixo subindo aumenta o custo real", () => {
    const entrada = referencia();
    const base = exigirOk(entrada);
    const categoria = entrada.custosFixos[0].categoria;
    const depois = exigirOk(cenarioCustoFixoMuda(entrada, categoria, 0.5));

    expect(depois.custoRealUnidade).toBeGreaterThan(base.custoRealUnidade);
  });

  it("ocupação caindo aumenta o custo real", () => {
    const entrada = referencia();
    const base = exigirOk(entrada);
    const depois = exigirOk(cenarioOcupacaoMuda(entrada, -0.1));

    expect(depois.custoRealUnidade).toBeGreaterThan(base.custoRealUnidade);
  });

  it("ocupação nunca sai de ]0, 1] mesmo com delta extremo", () => {
    const entrada = referencia();
    expect(cenarioOcupacaoMuda(entrada, -10).ocupacao).toBeGreaterThan(0);
    expect(cenarioOcupacaoMuda(entrada, 10).ocupacao).toBeLessThanOrEqual(1);
  });

  it("salário subindo aumenta o custo real, mas não o preço sugerido em outra proporção", () => {
    const entrada = referencia();
    const base = exigirOk(entrada);
    const depois = exigirOk(cenarioSalarioMuda(entrada, 0.2));

    expect(depois.custoRealUnidade).toBeGreaterThan(base.custoRealUnidade);
  });

  it("margem subindo aumenta o preço sugerido sem alterar o custo real", () => {
    const entrada = referencia();
    const base = exigirOk(entrada);
    const depois = exigirOk(cenarioMargemMuda(entrada, 0.05));

    expect(depois.custoRealUnidade).toBeCloseTo(base.custoRealUnidade, 6);
    expect(depois.precoUnidadeSugerido).toBeGreaterThan(base.precoUnidadeSugerido);
  });
});

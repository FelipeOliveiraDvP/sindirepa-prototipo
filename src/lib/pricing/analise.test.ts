import { describe, expect, it } from "vitest";
import {
  custoDaOciosidade,
  maiorAlavanca,
  pesosPorCategoria,
  pontoDeEquilibrioEmCarros,
  pontoDeEquilibrioEmUnidades,
} from "./analise";
import { calcular } from "./calculate";
import { DEFAULTS, inputPadrao } from "./defaults";
import type { CalculoInput } from "./types";

/**
 * As análises do painel são leitura, nunca conta nova (docs/saas/03-telas.md,
 * seção 6). Estes testes protegem os dois invariantes que a leva pede:
 * os pesos por categoria somam 100%, e a ociosidade é zero em 100% de ocupação.
 */

const SALARIO_FIXTURE = 3200;

function referencia(): CalculoInput {
  const padrao = inputPadrao();
  return {
    ...padrao,
    produtivos: padrao.produtivos.map((p) => ({ ...p, salarioBruto: SALARIO_FIXTURE })),
  };
}

function exigirOk(entrada: CalculoInput) {
  const c = calcular(entrada);
  if (!c.ok) throw new Error(`esperava cálculo válido, veio: ${JSON.stringify(c.erros)}`);
  return c.resultado;
}

describe("pesosPorCategoria", () => {
  it("as frações somam 100%", () => {
    const entrada = referencia();
    const r = exigirOk(entrada);
    const pesos = pesosPorCategoria(
      r.custoMaoDeObra,
      "Mão de obra",
      entrada.custosFixos,
      r.unidadesProdutivas,
    );

    const soma = pesos.reduce((acc, p) => acc + p.fracaoDoCusto, 0);
    expect(soma).toBeCloseTo(1, 6);
  });

  it("ainda soma 100% com custos fixos zerados — só mão de obra pesa", () => {
    const entrada = referencia();
    const r = exigirOk(entrada);
    const pesos = pesosPorCategoria(r.custoMaoDeObra, "Mão de obra", [], r.unidadesProdutivas);

    expect(pesos).toHaveLength(1);
    expect(pesos[0].fracaoDoCusto).toBeCloseTo(1, 6);
  });

  it("categorias em R$ 0 não entram na lista", () => {
    const entrada = referencia();
    const r = exigirOk(entrada);
    const comZerada = [...entrada.custosFixos, { categoria: "Zerada", valorMensal: 0, ativo: true }];
    const pesos = pesosPorCategoria(r.custoMaoDeObra, "Mão de obra", comZerada, r.unidadesProdutivas);

    expect(pesos.some((p) => p.categoria === "Zerada")).toBe(false);
  });

  it("ordena da maior para a menor fração", () => {
    const entrada = referencia();
    const r = exigirOk(entrada);
    const pesos = pesosPorCategoria(
      r.custoMaoDeObra,
      "Mão de obra",
      entrada.custosFixos,
      r.unidadesProdutivas,
    );

    for (let i = 1; i < pesos.length; i++) {
      expect(pesos[i - 1].fracaoDoCusto).toBeGreaterThanOrEqual(pesos[i].fracaoDoCusto);
    }
  });
});

describe("maiorAlavanca", () => {
  it("aponta a categoria do topo da lista de pesos", () => {
    const entrada = referencia();
    const r = exigirOk(entrada);
    const pesos = pesosPorCategoria(
      r.custoMaoDeObra,
      "Mão de obra",
      entrada.custosFixos,
      r.unidadesProdutivas,
    );
    const alavanca = maiorAlavanca(pesos, r.custoRealUnidade);

    expect(alavanca?.categoria).toBe(pesos[0].categoria);
    expect(alavanca!.novoCustoRealUnidade).toBeLessThan(r.custoRealUnidade);
  });

  it("sem categorias, não há alavanca", () => {
    expect(maiorAlavanca([], 100)).toBeNull();
  });
});

describe("custoDaOciosidade", () => {
  it("é zero quando a ocupação é 100%", () => {
    const entrada = referencia();
    entrada.jornada.ocupacao = 1;
    const r = exigirOk(entrada);

    expect(custoDaOciosidade(r)).toBe(0);
  });

  it("é positivo quando há unidade disponível não vendida", () => {
    const entrada = referencia();
    entrada.jornada.ocupacao = DEFAULTS.ocupacao;
    const r = exigirOk(entrada);

    expect(custoDaOciosidade(r)).toBeGreaterThan(0);
  });
});

describe("pontoDeEquilibrioEmUnidades", () => {
  it("com preço de referência zero, não divide por zero", () => {
    expect(pontoDeEquilibrioEmUnidades(10000, 0.06, 0)).toBe(0);
  });

  it("vendendo exatamente esse tanto ao preço sugerido, a receita líquida cobre o custo total", () => {
    const entrada = referencia();
    const r = exigirOk(entrada);
    const unidades = pontoDeEquilibrioEmUnidades(
      r.custoTotalMensal,
      entrada.parametros.impostosSobreFaturamento,
      r.precoUnidadeSugerido,
    );
    const receitaLiquida =
      unidades * r.precoUnidadeSugerido * (1 - entrada.parametros.impostosSobreFaturamento);

    expect(receitaLiquida).toBeCloseTo(r.custoTotalMensal, 6);
  });
});

describe("pontoDeEquilibrioEmCarros", () => {
  it("sem a média informada, não existe leitura em carros", () => {
    expect(pontoDeEquilibrioEmCarros(1000, 0)).toBeNull();
  });

  it("média negativa também não produz número", () => {
    expect(pontoDeEquilibrioEmCarros(1000, -3)).toBeNull();
  });

  it("divide as unidades do equilíbrio pela média por carro", () => {
    expect(pontoDeEquilibrioEmCarros(380, 4)).toBe(95);
  });

  it("é consistente com o equilíbrio em unidades do mesmo cálculo", () => {
    const entrada = referencia();
    const r = exigirOk(entrada);
    const unidades = pontoDeEquilibrioEmUnidades(
      r.custoTotalMensal,
      entrada.parametros.impostosSobreFaturamento,
      r.precoUnidadeSugerido,
    );
    const unidadesPorCarro = 3.5;
    const carros = pontoDeEquilibrioEmCarros(unidades, unidadesPorCarro)!;

    // Atender esse tanto de carros consome exatamente as unidades do equilíbrio.
    expect(carros * unidadesPorCarro).toBeCloseTo(unidades, 6);
  });

  it("equilíbrio de zero unidade é zero carro, não ausência", () => {
    expect(pontoDeEquilibrioEmCarros(0, 4)).toBe(0);
  });
});

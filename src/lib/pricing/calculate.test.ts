import { describe, expect, it } from "vitest";
import { calcular } from "./calculate";
import { DEFAULTS, inputPadrao } from "./defaults";
import { formatarMoeda } from "./format";
import type { CalculoInput } from "./types";

/**
 * Casos-limite de docs/geral/06-dados.md, mais o cenário de referência.
 *
 * A lib vem antes da tela justamente para que estes testes existam
 * antes de qualquer pixel: se o cálculo estiver errado, a tela não
 * importa (docs/geral/02-produto.md).
 */

/**
 * `inputPadrao()` NÃO calcula: o salário não tem padrão, por decisão
 * registrada em defaults.ts. Os testes preenchem R$ 3.200 como FIXTURE —
 * número de teste, que nunca chega ao usuário e não é referência de
 * mercado. É o mesmo valor do placeholder de 07-copy.md, para que os
 * números conferidos contra a produção sejam comparáveis.
 */
const SALARIO_FIXTURE = 3200;

function referencia(): CalculoInput {
  const padrao = inputPadrao();
  return {
    ...padrao,
    produtivos: padrao.produtivos.map((p) => ({ ...p, salarioBruto: SALARIO_FIXTURE })),
  };
}

function input(over: Partial<CalculoInput> = {}): CalculoInput {
  return { ...referencia(), ...over };
}

function comJornada(over: Partial<CalculoInput["jornada"]>): CalculoInput {
  const r = referencia();
  return { ...r, jornada: { ...r.jornada, ...over } };
}

function comParametros(over: Partial<CalculoInput["parametros"]>): CalculoInput {
  const r = referencia();
  return { ...r, parametros: { ...r.parametros, ...over } };
}

function exigirOk(entrada: CalculoInput) {
  const c = calcular(entrada);
  if (!c.ok) throw new Error(`esperava cálculo válido, veio: ${JSON.stringify(c.erros)}`);
  return c.resultado;
}

describe("estado inicial da calculadora", () => {
  /**
   * Consequência deliberada de não inventar salário padrão. A tela abre
   * pedindo o salário em vez de mostrar R$ 0,00 — um zero pareceria um
   * cálculo e ensinaria a coisa errada.
   */
  it("os padrões sozinhos não calculam: falta o salário", () => {
    const c = calcular(inputPadrao());
    expect(c.ok).toBe(false);
    if (c.ok) return;
    expect(c.erros.map((e) => e.codigo)).toContain("sem_salario");
  });

  it("a mensagem pede o salário e aponta o campo", () => {
    const c = calcular(inputPadrao());
    if (c.ok) throw new Error("esperava erro");
    const erro = c.erros.find((e) => e.codigo === "sem_salario");
    expect(erro?.campo).toBe("salarioBruto");
    expect(erro?.mensagem).toMatch(/salário médio/);
  });

  it("informado o salário, calcula", () => {
    expect(calcular(referencia()).ok).toBe(true);
  });

  it("um mecânico sem salário numa equipe que tem salário não bloqueia", () => {
    const r = referencia();
    const comVagaAberta = {
      ...r,
      produtivos: r.produtivos.map((p, i) => (i === 0 ? { ...p, salarioBruto: 0 } : p)),
    };
    const c = calcular(comVagaAberta);
    expect(c.ok).toBe(true);
    // 3 de 4 com salário: o custo cai proporcionalmente.
    if (!c.ok) return;
    expect(c.resultado.custoMaoDeObra).toBeCloseTo(3 * SALARIO_FIXTURE * 1.8, 2);
  });
});

describe("cenário de referência", () => {
  /**
   * 4 mecânicos · R$ 3.200 · 80% encargos · 22 dias · 8,8 · 70% · 6% · 15%
   *
   * ⚠️ Estes números vêm da fórmula INFERIDA. Quando o Felipe validar
   * contra calculadoramaodeobra.nocobi.com, é este bloco que muda
   * primeiro — e ele é o diff que mostra o tamanho da divergência.
   */
  it("produz o resultado esperado", () => {
    const r = exigirOk(referencia());

    expect(r.unidadesDisponiveis).toBeCloseTo(774.4, 6); // 4 × 22 × 8,8
    expect(r.unidadesProdutivas).toBeCloseTo(542.08, 6); // × 70%
    expect(r.custoMaoDeObra).toBeCloseTo(23040, 2); // 4 × 3200 × 1,8
    expect(r.custoFixoTotal).toBe(0);
    expect(r.custoRealUnidade).toBeCloseTo(42.5, 2);
    expect(r.precoUnidadeSugerido).toBeCloseTo(53.8, 2);
    expect(r.pontoDeEquilibrio).toBeCloseTo(45.22, 2);
  });

  /**
   * Os três números como o usuário os vê.
   *
   * ⚠️ É ESTE o teste para conferir contra calculadoramaodeobra.nocobi.com:
   * abrir a calculadora em produção, digitar 4 mecânicos / R$ 3.200 /
   * 80% / 22 dias / 8,8 / 70% / 6% / 15% e sem custos fixos, e comparar
   * as três strings. Se divergir, a de produção vence — corrigir
   * 06-dados.md primeiro, depois calculate.ts, depois este teste.
   */
  it("exibe os valores que o Felipe vai conferir contra a produção", () => {
    const r = exigirOk(referencia());
    expect(formatarMoeda(r.custoRealUnidade)).toBe("R$ 42,50");
    expect(formatarMoeda(r.precoUnidadeSugerido)).toBe("R$ 53,80");
    expect(formatarMoeda(r.pontoDeEquilibrio)).toBe("R$ 45,22");
  });

  it("nenhum número do resultado é Infinity ou NaN", () => {
    const r = exigirOk(referencia());
    for (const [chave, valor] of Object.entries(r)) {
      if (typeof valor === "number") {
        expect(Number.isFinite(valor), `${chave} = ${valor}`).toBe(true);
      }
    }
  });
});

describe("passo 7 — markup divisor, não margem sobre custo", () => {
  it("divide por (1 − impostos − margem)", () => {
    const r = exigirOk(referencia());
    const divisor = 1 - DEFAULTS.impostosSobreFaturamento - DEFAULTS.margemDesejada;
    expect(r.precoUnidadeSugerido).toBeCloseTo(r.custoRealUnidade / divisor, 8);
  });

  /**
   * A diferença que justifica a escolha: markup divisor entrega a margem
   * sobre o PREÇO. Margem sobre custo entregaria menos, e o usuário
   * descobriria só no fim do mês.
   */
  it("a margem realizada sobre o preço é a margem pedida", () => {
    const r = exigirOk(referencia());
    const margemRealizada =
      (r.precoUnidadeSugerido -
        r.custoRealUnidade -
        r.precoUnidadeSugerido * DEFAULTS.impostosSobreFaturamento) /
      r.precoUnidadeSugerido;
    expect(margemRealizada).toBeCloseTo(DEFAULTS.margemDesejada, 8);
  });

  it("margem sobre custo daria um preço menor — não é o que fazemos", () => {
    const r = exigirOk(referencia());
    const margemSobreCusto = r.custoRealUnidade * (1 + DEFAULTS.margemDesejada);
    expect(r.precoUnidadeSugerido).toBeGreaterThan(margemSobreCusto);
  });
});

describe("composição do preço", () => {
  it("as quatro faixas somadas dão exatamente o preço sugerido", () => {
    const r = exigirOk(referencia());
    const soma = r.composicao.reduce((acc, f) => acc + f.valorPorUnidade, 0);
    expect(soma).toBeCloseTo(r.precoUnidadeSugerido, 8);
  });

  it("as frações somam 100%", () => {
    const r = exigirOk(referencia());
    const soma = r.composicao.reduce((acc, f) => acc + f.fracaoDoPreco, 0);
    expect(soma).toBeCloseTo(1, 8);
  });

  it("traz as quatro faixas na ordem da barra empilhada", () => {
    const r = exigirOk(referencia());
    expect(r.composicao.map((f) => f.id)).toEqual([
      "maoDeObra",
      "custosFixos",
      "impostos",
      "margem",
    ]);
  });
});

describe("casos-limite — bloqueiam o cálculo", () => {
  it("impostos + margem ≥ 100% não calcula e explica por quê", () => {
    const c = calcular(comParametros({ impostosSobreFaturamento: 0.5, margemDesejada: 0.5 }));
    expect(c.ok).toBe(false);
    if (c.ok) return;
    expect(c.erros.map((e) => e.codigo)).toContain("impostos_e_margem_acima_de_100");
    expect(c.erros[0].mensagem).toMatch(/mais de 100%/);
  });

  it("zero mecânicos não divide por zero", () => {
    const c = calcular(input({ produtivos: [] }));
    expect(c.ok).toBe(false);
    if (c.ok) return;
    expect(c.erros.map((e) => e.codigo)).toContain("sem_produtivos");
  });

  it("mecânicos todos inativos contam como zero mecânicos", () => {
    const r = referencia();
    const c = calcular(input({ produtivos: r.produtivos.map((p) => ({ ...p, ativo: false })) }));
    expect(c.ok).toBe(false);
  });

  it("ocupação zero não divide por zero", () => {
    const c = calcular(comJornada({ ocupacao: 0 }));
    expect(c.ok).toBe(false);
    if (c.ok) return;
    expect(c.erros.map((e) => e.codigo)).toContain("ocupacao_zero");
  });

  it("ocupação acima de 100% é bloqueada", () => {
    const c = calcular(comJornada({ ocupacao: 1.2 }));
    expect(c.ok).toBe(false);
    if (c.ok) return;
    const erro = c.erros.find((e) => e.codigo === "ocupacao_acima_de_100");
    expect(erro?.mensagem).toMatch(/não é possível vender mais/);
  });

  it("jornada zerada é bloqueada", () => {
    expect(calcular(comJornada({ diasUteisMes: 0 })).ok).toBe(false);
    expect(calcular(comJornada({ unidadesPorDia: 0 })).ok).toBe(false);
  });

  it("toda mensagem de erro aponta um campo", () => {
    const c = calcular(comJornada({ ocupacao: 0 }));
    if (c.ok) throw new Error("esperava erro");
    for (const erro of c.erros) expect(erro.campo).toBeTruthy();
  });

  /** 07-copy.md: sem a palavra "erro", sem "falha", sem culpar o usuário. */
  it("nenhuma mensagem usa a palavra erro ou falha", () => {
    const entradas = [
      inputPadrao(),
      comJornada({ ocupacao: 0 }),
      comJornada({ ocupacao: 2 }),
      input({ produtivos: [] }),
      comParametros({ impostosSobreFaturamento: 0.9, margemDesejada: 0.2 }),
    ];
    for (const entrada of entradas) {
      const c = calcular(entrada);
      if (c.ok) continue;
      for (const erro of c.erros) {
        expect(erro.mensagem.toLowerCase()).not.toMatch(/\berros?\b|\bfalha\b|\binválido\b/);
      }
    }
  });
});

describe("casos-limite — calculam, mas avisam", () => {
  it("custos fixos todos zerados calcula e sinaliza subestimação", () => {
    const r = exigirOk(referencia());
    expect(r.custoFixoTotal).toBe(0);
    expect(r.avisos.map((a) => a.codigo)).toContain("custos_fixos_zerados");
  });

  it("custos fixos informados não geram o aviso", () => {
    const r = referencia();
    const resultado = exigirOk({
      ...r,
      custosFixos: r.custosFixos.map((c, i) => (i === 0 ? { ...c, valorMensal: 8000 } : c)),
    });
    expect(resultado.avisos.map((a) => a.codigo)).not.toContain("custos_fixos_zerados");
  });

  it("resultado implausível calcula, avisa e aponta o campo", () => {
    const r = exigirOk(comJornada({ ocupacao: 0.01 }));
    const aviso = r.avisos.find((a) => a.codigo === "resultado_implausivel");
    expect(aviso).toBeDefined();
    expect(aviso?.campo).toBe("ocupacao");
    expect(aviso?.mensagem).toMatch(/ocupação/);
  });

  it("aponta o salário quando o exagero está lá", () => {
    const r = referencia();
    const resultado = exigirOk({
      ...r,
      produtivos: r.produtivos.map((p) => ({ ...p, salarioBruto: 320_000 })),
    });
    const aviso = resultado.avisos.find((a) => a.codigo === "resultado_implausivel");
    expect(aviso?.campo).toBe("salarioBruto");
  });
});

describe("comparativo com o preço atual", () => {
  it("preço atual zero é tratado como não informado", () => {
    const r = exigirOk(comParametros({ precoUnidadeAtual: 0 }));
    expect(r.comparativo).toBeNull();
  });

  it("preço atual ausente não gera comparativo", () => {
    const r = exigirOk(referencia());
    expect(r.comparativo).toBeNull();
  });

  it("calcula diferença, impacto mensal e margem real", () => {
    const r = exigirOk(comParametros({ precoUnidadeAtual: 40 }));
    const c = r.comparativo;
    expect(c).not.toBeNull();
    if (!c) return;

    expect(c.diferencaPorUnidade).toBeCloseTo(r.precoUnidadeSugerido - 40, 8);
    expect(c.impactoMensal).toBeCloseTo(c.diferencaPorUnidade * r.unidadesProdutivas, 8);
    // Cobrando 40 com custo de 42,50: a margem real é negativa.
    expect(c.margemRealAtual).toBeLessThan(0);
    expect(c.abaixoDoEquilibrio).toBe(true);
  });

  it("preço acima do equilíbrio não é sinalizado como prejuízo", () => {
    const r = exigirOk(comParametros({ precoUnidadeAtual: 120 }));
    expect(r.comparativo?.abaixoDoEquilibrio).toBe(false);
    expect(r.comparativo?.margemRealAtual).toBeGreaterThan(0);
    expect(r.comparativo?.diferencaPorUnidade).toBeLessThan(0);
  });
});

describe("ponto de equilíbrio", () => {
  it("cobre custo e imposto, sem margem", () => {
    const r = exigirOk(referencia());
    expect(r.pontoDeEquilibrio).toBeCloseTo(
      r.custoRealUnidade / (1 - DEFAULTS.impostosSobreFaturamento),
      8,
    );
  });

  it("fica entre o custo real e o preço sugerido", () => {
    const r = exigirOk(referencia());
    expect(r.pontoDeEquilibrio).toBeGreaterThan(r.custoRealUnidade);
    expect(r.pontoDeEquilibrio).toBeLessThan(r.precoUnidadeSugerido);
  });
});

describe("pureza", () => {
  it("mesma entrada, mesma saída", () => {
    const entrada = referencia();
    expect(calcular(entrada)).toEqual(calcular(entrada));
  });

  it("não muta a entrada", () => {
    const entrada = referencia();
    const antes = structuredClone(entrada);
    calcular(entrada);
    expect(entrada).toEqual(antes);
  });
});

describe("modelo de custo de mão de obra plugável", () => {
  it("comissao ainda não existe e falha alto, não em silêncio", () => {
    expect(() => calcular(referencia(), { laborCostModelId: "comissao" })).toThrow(/não implementado/);
  });
});

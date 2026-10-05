import { describe, expect, it } from "vitest";
import { agregadoPadrao, doHeroi, paraCalculoInput } from "./aggregate";
import { calcular } from "./calculate";
import { DEFAULTS } from "./defaults";

const SALARIO_FIXTURE = 3200;

describe("entrada agregada", () => {
  it("expande a quantidade em N produtivos com o salário médio", () => {
    const input = paraCalculoInput({
      ...agregadoPadrao(),
      quantidadeProdutivos: 3,
      salarioMedio: SALARIO_FIXTURE,
    });
    expect(input.produtivos).toHaveLength(3);
    expect(input.produtivos.every((p) => p.salarioBruto === SALARIO_FIXTURE)).toBe(true);
  });

  it("quantidade fracionária é truncada — não existe meio mecânico", () => {
    const input = paraCalculoInput({ ...agregadoPadrao(), quantidadeProdutivos: 3.9 });
    expect(input.produtivos).toHaveLength(3);
  });

  it("quantidade negativa vira zero, e o cálculo bloqueia com mensagem", () => {
    const input = paraCalculoInput({ ...agregadoPadrao(), quantidadeProdutivos: -2 });
    expect(input.produtivos).toHaveLength(0);
    const c = calcular(input);
    expect(c.ok).toBe(false);
  });

  it("o padrão agregado deixa só o salário em branco", () => {
    const p = agregadoPadrao();
    expect(p.salarioMedio).toBe(0);
    expect(p.quantidadeProdutivos).toBe(DEFAULTS.quantidadeProdutivos);
    expect(p.ocupacao).toBe(DEFAULTS.ocupacao);
    expect(p.diasUteisMes).toBe(DEFAULTS.diasUteisMes);
  });

  it("N × média equivale a somar salários individuais", () => {
    const agregado = paraCalculoInput({
      ...agregadoPadrao(),
      quantidadeProdutivos: 4,
      salarioMedio: SALARIO_FIXTURE,
    });
    const individual = {
      ...agregado,
      produtivos: [2800, 3000, 3400, 3600].map((salarioBruto) => ({
        salarioBruto,
        percentualEncargos: DEFAULTS.percentualEncargos,
        ativo: true,
      })),
    };

    const a = calcular(agregado);
    const b = calcular(individual);
    if (!a.ok || !b.ok) throw new Error("esperava cálculo válido");
    // média de 2800/3000/3400/3600 = 3200
    expect(a.resultado.custoMaoDeObra).toBeCloseTo(b.resultado.custoMaoDeObra, 2);
    expect(a.resultado.custoRealUnidade).toBeCloseTo(b.resultado.custoRealUnidade, 8);
  });
});

describe("entrada do herói da landing", () => {
  /**
   * A garantia que faz o funil funcionar: o número preliminar da landing
   * não pode mudar quando o usuário chega em /calculadora, senão a
   * ferramenta perde credibilidade no primeiro clique.
   */
  it("o número do herói é igual ao da calculadora com os mesmos 3 campos", () => {
    const doLanding = calcular(
      paraCalculoInput(
        doHeroi({ quantidadeProdutivos: 4, salarioMedio: SALARIO_FIXTURE, totalCustosFixos: 12000 }),
      ),
    );

    const naCalculadora = calcular(
      paraCalculoInput({
        ...agregadoPadrao(),
        quantidadeProdutivos: 4,
        salarioMedio: SALARIO_FIXTURE,
        custosFixos: [{ categoria: "Outros", valorMensal: 12000, ativo: true }],
      }),
    );

    if (!doLanding.ok || !naCalculadora.ok) throw new Error("esperava cálculo válido");
    expect(doLanding.resultado.custoRealUnidade).toBe(naCalculadora.resultado.custoRealUnidade);
    expect(doLanding.resultado.precoUnidadeSugerido).toBe(
      naCalculadora.resultado.precoUnidadeSugerido,
    );
  });

  it("herói sem salário não calcula — mesma regra da tela cheia", () => {
    const c = calcular(
      paraCalculoInput(
        doHeroi({ quantidadeProdutivos: 4, salarioMedio: 0, totalCustosFixos: 12000 }),
      ),
    );
    expect(c.ok).toBe(false);
    if (c.ok) return;
    expect(c.erros.map((e) => e.codigo)).toContain("sem_salario");
  });

  /**
   * O usuário digitou um total único na landing. Ao chegar na tela cheia
   * ele precisa (a) ver o mesmo número e (b) receber a lista de
   * categorias, que é o checklist que faz lembrar do custo esquecido.
   *
   * Leva 4.1: o total deixou de virar uma 13ª categoria sintética
   * ("Total informado na landing") e passou a somar em "Outros" — uma
   * categoria real, sem inventar linha nem apagar o valor do usuário.
   */
  it("preserva o total da landing dentro de 'Outros', sem 13ª categoria sintética", () => {
    const entrada = doHeroi({
      quantidadeProdutivos: 4,
      salarioMedio: SALARIO_FIXTURE,
      totalCustosFixos: 14500,
    });

    const outros = entrada.custosFixos.find((c) => c.categoria === "Outros");
    expect(outros?.valorMensal).toBe(14500);

    const categorias = entrada.custosFixos.map((c) => c.categoria);
    expect(categorias).toContain("Contador");
    expect(categorias).toContain("Aluguel");
    expect(categorias.filter((c) => c === "Total informado na landing")).toHaveLength(0);

    // Só "Outros" carrega o total da landing — nada de distribuir o
    // valor pelas demais categorias, que seria inventar dado que o
    // usuário não informou.
    const somaDasOutras = entrada.custosFixos
      .filter((c) => c.categoria !== "Outros")
      .reduce((acc, c) => acc + c.valorMensal, 0);
    expect(somaDasOutras).toBe(0);
  });

  it("herói com custos fixos informados não dispara o aviso de subestimação", () => {
    const c = calcular(
      paraCalculoInput(
        doHeroi({ quantidadeProdutivos: 4, salarioMedio: SALARIO_FIXTURE, totalCustosFixos: 12000 }),
      ),
    );
    if (!c.ok) throw new Error("esperava cálculo válido");
    expect(c.resultado.avisos.map((a) => a.codigo)).not.toContain("custos_fixos_zerados");
  });
});

import { describe, expect, it } from "vitest";
import { agregadoPadrao, paraCalculoInput, trocarSegmento } from "./aggregate";
import { calcular } from "./calculate";
import { UNIDADE_HORA, UNIDADE_UT } from "./config";
import { memoriaDeCalculo } from "./explain";
import {
  CATEGORIAS_CUSTO_FIXO_COMUNS,
  categoriasCustoFixo,
  custosFixosPadrao,
  lexicoDoSegmento,
  SEGMENTOS,
  unitDoSegmento,
} from "./segmento";
import type { CalculoInput } from "./types";
import { validar } from "./validate";

/**
 * O segmento governa unidade, categorias e rótulo do produtivo.
 * NUNCA a conta. O teste central deste arquivo é o de que trocar o
 * segmento não move nenhum número — se algum dia mover, é bug.
 *
 * Note que nenhum literal da unidade aparece aqui: as asserções
 * comparam contra os tokens. Escrever a palavra quebraria
 * scripts/check-tokens.mjs, e é exatamente o comportamento desejado.
 */

function entrada(): CalculoInput {
  return {
    produtivos: Array.from({ length: 4 }, () => ({
      salarioBruto: 3200,
      percentualEncargos: 0.8,
      ativo: true,
    })),
    custosFixos: [
      { categoria: "Aluguel", valorMensal: 6000, ativo: true },
      { categoria: "Energia", valorMensal: 1800, ativo: true },
    ],
    jornada: { diasUteisMes: 22, unidadesPorDia: 8.8, ocupacao: 0.7 },
    parametros: { impostosSobreFaturamento: 0.06, margemDesejada: 0.15 },
  };
}

describe("unidade por segmento", () => {
  it("mecânica opera na unidade padrão e funilaria em UT", () => {
    expect(SEGMENTOS.mecanica.unidade).toBe(UNIDADE_HORA);
    expect(SEGMENTOS.funilaria.unidade).toBe(UNIDADE_UT);
    expect(unitDoSegmento("funilaria").singular).not.toBe(
      unitDoSegmento("mecanica").singular,
    );
  });

  it("o rótulo do produtivo muda — funilaria não tem mecânico", () => {
    expect(lexicoDoSegmento("funilaria").produtivo.singular).not.toBe(
      lexicoDoSegmento("mecanica").produtivo.singular,
    );
  });
});

describe("categorias de custo fixo por segmento", () => {
  it("mecânica recebe só as comuns", () => {
    expect(categoriasCustoFixo("mecanica")).toEqual([...CATEGORIAS_CUSTO_FIXO_COMUNS]);
  });

  it("funilaria recebe as comuns mais as dela, sem perder nenhuma comum", () => {
    const cats = categoriasCustoFixo("funilaria");
    for (const comum of CATEGORIAS_CUSTO_FIXO_COMUNS) expect(cats).toContain(comum);
    expect(cats.length).toBeGreaterThan(CATEGORIAS_CUSTO_FIXO_COMUNS.length);
  });

  /** CLAUDE.md regra 4: nada que possa passar por dado de mercado. */
  it("toda categoria sugerida abre em R$ 0", () => {
    for (const segmento of ["mecanica", "funilaria"] as const) {
      for (const custo of custosFixosPadrao(segmento)) {
        expect(custo.valorMensal).toBe(0);
      }
    }
  });
});

describe("o segmento não altera a aritmética", () => {
  /**
   * O invariante que sustenta a afirmação de 06-dados.md: "a aritmética
   * dos 7 passos é idêntica nos dois segmentos". Mesma entrada numérica,
   * mesmo resultado — só o texto muda.
   */
  it("mesma entrada, mesmo resultado nos dois segmentos", () => {
    const mec = calcular(entrada(), { segmento: "mecanica" });
    const fun = calcular(entrada(), { segmento: "funilaria" });

    expect(mec.ok && fun.ok).toBe(true);
    if (!mec.ok || !fun.ok) return;

    expect(fun.resultado.custoRealUnidade).toBe(mec.resultado.custoRealUnidade);
    expect(fun.resultado.precoUnidadeSugerido).toBe(mec.resultado.precoUnidadeSugerido);
    expect(fun.resultado.pontoDeEquilibrio).toBe(mec.resultado.pontoDeEquilibrio);
    expect(fun.resultado.unidadesProdutivas).toBe(mec.resultado.unidadesProdutivas);
    expect(fun.resultado.custoTotalMensal).toBe(mec.resultado.custoTotalMensal);
    expect(fun.resultado.composicao).toEqual(mec.resultado.composicao);
  });

  it("omitir o segmento equivale a mecânica", () => {
    const semSegmento = calcular(entrada());
    const mec = calcular(entrada(), { segmento: "mecanica" });
    expect(semSegmento).toEqual(mec);
  });
});

describe("o segmento altera o texto", () => {
  it("a mensagem de bloqueio sai na unidade do segmento", () => {
    const semProdutivos = { ...entrada(), produtivos: [] };

    const mec = validar(semProdutivos, lexicoDoSegmento("mecanica"));
    const fun = validar(semProdutivos, lexicoDoSegmento("funilaria"));

    expect(mec[0].codigo).toBe(fun[0].codigo);
    expect(fun[0].mensagem).not.toBe(mec[0].mensagem);
    expect(fun[0].mensagem).toContain(unitDoSegmento("funilaria").ofDefinite);
  });

  it("a memória de cálculo de funilaria não fala a unidade da mecânica", () => {
    const c = calcular(entrada(), { segmento: "funilaria" });
    expect(c.ok).toBe(true);
    if (!c.ok) return;

    const texto = memoriaDeCalculo(entrada(), c.resultado, lexicoDoSegmento("funilaria"))
      .map((p) => `${p.titulo} ${p.conta} ${p.resultado} ${p.porque ?? ""}`)
      .join(" ")
      .toLowerCase();

    expect(texto).not.toContain(unitDoSegmento("mecanica").plural.toLowerCase());
    expect(texto).not.toContain(lexicoDoSegmento("mecanica").produtivo.plural.toLowerCase());
    expect(texto).toContain(unitDoSegmento("funilaria").plural.toLowerCase());
  });
});

describe("trocar de segmento", () => {
  it("não apaga valor que o usuário já digitou", () => {
    const base = agregadoPadrao("funilaria");
    const comTinta = {
      ...base,
      custosFixos: base.custosFixos.map((c) =>
        c.categoria === SEGMENTOS.funilaria.categoriasCustoFixoAdicionais[0]
          ? { ...c, valorMensal: 2400 }
          : c,
      ),
    };

    const depois = trocarSegmento(comTinta, "mecanica");
    const tinta = depois.custosFixos.find(
      (c) => c.categoria === SEGMENTOS.funilaria.categoriasCustoFixoAdicionais[0],
    );

    expect(depois.segmento).toBe("mecanica");
    expect(tinta?.valorMensal).toBe(2400);
  });

  it("remove as categorias do segmento antigo que ficaram zeradas", () => {
    const depois = trocarSegmento(agregadoPadrao("funilaria"), "mecanica");
    const categorias = depois.custosFixos.map((c) => c.categoria);

    for (const extra of SEGMENTOS.funilaria.categoriasCustoFixoAdicionais) {
      expect(categorias).not.toContain(extra);
    }
    for (const comum of CATEGORIAS_CUSTO_FIXO_COMUNS) {
      expect(categorias).toContain(comum);
    }
  });

  it("acrescenta as categorias do segmento novo em R$ 0", () => {
    const depois = trocarSegmento(agregadoPadrao("mecanica"), "funilaria");

    for (const extra of SEGMENTOS.funilaria.categoriasCustoFixoAdicionais) {
      expect(depois.custosFixos.find((c) => c.categoria === extra)?.valorMensal).toBe(0);
    }
  });

  it("trocar o segmento não muda o número, só a lista de categorias", () => {
    const antes = agregadoPadrao("mecanica");
    const preenchido = {
      ...antes,
      salarioMedio: 3200,
      custosFixos: antes.custosFixos.map((c) =>
        c.categoria === "Aluguel" ? { ...c, valorMensal: 6000 } : c,
      ),
    };

    const a = calcular(paraCalculoInput(preenchido), { segmento: "mecanica" });
    const depois = trocarSegmento(preenchido, "funilaria");
    const b = calcular(paraCalculoInput(depois), { segmento: "funilaria" });

    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(b.resultado.custoRealUnidade).toBe(a.resultado.custoRealUnidade);
  });

  it("trocar para o mesmo segmento devolve o objeto intacto", () => {
    const antes = agregadoPadrao("mecanica");
    expect(trocarSegmento(antes, "mecanica")).toBe(antes);
  });
});

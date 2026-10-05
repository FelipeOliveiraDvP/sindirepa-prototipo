import { BENCHMARK } from "@/lib/copy/painel";
import { formatarMoeda } from "@/lib/pricing/format";
import type { FaixaBenchmark as TipoFaixa } from "@/lib/benchmark/demo";

/**
 * Barra da faixa do grupo, com o marcador do valor da própria oficina.
 *
 * Extraída de `Benchmark.tsx` na Leva 4 para ser reusada pelo cartão-
 * resumo do painel e pela tela cheia de `/benchmark` — mesma peça
 * visual, dois valores diferentes (custo e preço).
 */
export function FaixaBenchmark({
  faixa,
  valor,
  sufixo,
}: {
  faixa: TipoFaixa;
  /** Valor da própria oficina, para posicionar o marcador. `null` quando não informado. */
  valor: number | null;
  sufixo: string;
}) {
  const posicao =
    valor === null
      ? null
      : Math.min(100, Math.max(0, ((valor - faixa.minimo) / (faixa.maximo - faixa.minimo)) * 100));

  return (
    <div className="mt-3">
      <div className="relative h-2 rounded-full bg-surface-alt">
        {/* Miolo da distribuição: do primeiro ao terceiro quartil. */}
        <div
          className="absolute h-2 rounded-full bg-border"
          style={{
            left: `${((faixa.p25 - faixa.minimo) / (faixa.maximo - faixa.minimo)) * 100}%`,
            right: `${100 - ((faixa.p75 - faixa.minimo) / (faixa.maximo - faixa.minimo)) * 100}%`,
          }}
        />
        {posicao !== null ? (
          <div
            className="absolute -top-1 h-4 w-1 rounded-full bg-petroleo"
            style={{ left: `calc(${posicao}% - 2px)` }}
            aria-hidden
          />
        ) : null}
      </div>

      <div className="mt-1.5 flex justify-between text-xs text-petroleo-suave">
        <span className="tabular">{formatarMoeda(faixa.minimo)}</span>
        <span className="tabular">
          {BENCHMARK.mediana} {formatarMoeda(faixa.mediana)}/{sufixo}
        </span>
        <span className="tabular">{formatarMoeda(faixa.maximo)}</span>
      </div>
    </div>
  );
}

/**
 * Posição, nunca recomendação. "Abaixo da mediana" é fato; "você pode
 * aumentar 15%" seria conselho de preço (09-benchmark.md).
 *
 * `assunto` existe porque a mesma peça posiciona custo e preço, e a
 * frase precisa nomear o número certo — dizer "seu preço" embaixo de um
 * custo é errado mesmo quando a posição está certa.
 */
export function posicaoNaFaixa(
  faixa: TipoFaixa,
  valor: number,
  assunto: "custo" | "preco" = "preco",
): string {
  const frases = assunto === "custo" ? BENCHMARK.posicaoCusto : BENCHMARK.posicao;

  return valor < faixa.p25
    ? frases.abaixoDoQuartil
    : valor < faixa.mediana
      ? frases.abaixoDaMediana
      : valor < faixa.p75
        ? frases.acimaDaMediana
        : frases.acimaDoQuartil;
}

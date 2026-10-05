"use client";

import Link from "next/link";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { amostraIlustrativa } from "@/lib/benchmark/demo";
import { BENCHMARK } from "@/lib/copy/painel";
import { PORTE_LABEL, porteDeProdutivos } from "@/lib/porte";
import { formatarMoeda } from "@/lib/pricing/format";
import { REGIOES } from "@/lib/regioes";
import { posicaoNaFaixa } from "./FaixaBenchmark";
import { TarjaIlustrativa } from "./TarjaIlustrativa";

/**
 * Cartão-resumo do painel — leva até `/benchmark`, não repete a
 * comparação inteira. A tela cheia voltou a ser página própria na
 * Leva 4 (docs/saas/03-telas.md, seção 5); antes ela vivia inteira
 * aqui dentro.
 *
 * Mesmo assim mostra UM número quando a amostra existe (a posição do
 * preço praticado), então carrega a própria tarja — a regra vale por
 * bloco, não por tela (docs/saas/09-benchmark.md).
 */
export function BenchmarkResumo({
  precoAtual,
  cidade,
  quantidadeProdutivos,
}: {
  /** O que a oficina cobra hoje. Sem ele não há o que posicionar. */
  precoAtual: number | null;
  cidade: string;
  quantidadeProdutivos: number;
}) {
  const { segmento } = useSegmento();
  const porte = porteDeProdutivos(quantidadeProdutivos);
  const amostra = amostraIlustrativa(segmento, porte);
  const nomeCidade = REGIOES.find((r) => r.id === cidade)?.label ?? null;

  return (
    <section className="card-metric">
      <h2 className="font-display text-lg font-semibold text-petroleo">{BENCHMARK.titulo}</h2>

      {!cidade ? (
        <p className="mt-3 text-sm text-petroleo-suave">{BENCHMARK.semCidade}</p>
      ) : !amostra ? (
        <div className="mt-3">
          <p className="text-base text-petroleo">{BENCHMARK.insuficiente.titulo}</p>
          <p className="mt-1 text-sm text-petroleo-suave">{BENCHMARK.insuficiente.texto}</p>
        </div>
      ) : (
        <div className="mt-3">
          <TarjaIlustrativa selo={amostra.selo} />
          <p className="mt-2 text-xs text-petroleo-suave">
            {BENCHMARK.recorte(nomeCidade ?? cidade, PORTE_LABEL[porte])}
          </p>

          {precoAtual !== null ? (
            <>
              <p className="mt-2 text-base text-petroleo">
                {posicaoNaFaixa(amostra.faixaPreco, precoAtual)}
              </p>
              <p className="text-sm text-petroleo-suave">
                Você: {formatarMoeda(precoAtual)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-petroleo-suave">{BENCHMARK.semPrecoAtual}</p>
          )}
        </div>
      )}

      <Link
        href="/benchmark"
        className="touch-target mt-3 inline-flex items-center rounded-button border border-border px-4 text-sm font-medium text-petroleo hover:bg-surface"
      >
        {BENCHMARK.resumo.cta}
      </Link>
    </section>
  );
}

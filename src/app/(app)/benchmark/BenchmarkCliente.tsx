"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { BarraComparativa } from "@/components/painel/BarraComparativa";
import { Distribuicao } from "@/components/painel/Distribuicao";
import { FaixaBenchmark, posicaoNaFaixa } from "@/components/painel/FaixaBenchmark";
import { Historico } from "@/components/painel/Historico";
import { TabelaCustos } from "@/components/painel/TabelaCustos";
import { TarjaIlustrativa } from "@/components/painel/TarjaIlustrativa";
import { amostraIlustrativa } from "@/lib/benchmark/demo";
import { BENCHMARK } from "@/lib/copy/painel";
import type { PontoDoHistorico } from "@/lib/data/configuracao";
import { PORTE_FAIXA_PRODUTIVOS, PORTE_LABEL, porteDeProdutivos } from "@/lib/porte";
import { pesosPorCategoria } from "@/lib/pricing/analise";
import { paraCalculoInput, type EntradaAgregada } from "@/lib/pricing/aggregate";
import { calcular } from "@/lib/pricing/calculate";
import { formatarMoeda } from "@/lib/pricing/format";
import { REGIOES } from "@/lib/regioes";

/**
 * `/benchmark` — página própria de novo na Leva 4.
 *
 * Compara a oficina INTEIRA contra oficinas parecidas: custo, preço E
 * composição — não só um preço contra uma faixa, que era o desenho até
 * a Leva 3 (docs/saas/09-benchmark.md).
 *
 * "Parecidas" = região × segmento × porte. Porte e recorte ficam
 * sempre visíveis: com amostra ilustrativa ou pequena, o usuário
 * precisa poder calibrar sozinho o quanto confiar no número.
 *
 * Cada bloco com dado do grupo carrega a própria tarja — não só o topo
 * da tela. Ver `TarjaIlustrativa`.
 *
 * ═══ CRESCEU NA LEVA 4.1 ═══
 * Distribuição, série temporal e tabela por tipo de custo vieram do
 * painel. O painel tinha virado uma segunda tela de análise; aqui elas
 * têm companhia que as explica — e a série, em especial, só significa
 * alguma coisa contra a referência do grupo (docs/saas/03-telas.md).
 *
 * Seis blocos não cabem numa coluna de 768px, então a tela passou a
 * usar grade de duas colunas em desktop. Arranjo, não regra: a cadeia
 * de guarda e as tarjas por bloco continuam idênticas.
 */
export function BenchmarkCliente({
  entrada,
  cidade,
  historico,
}: {
  entrada: EntradaAgregada;
  cidade: string;
  historico: PontoDoHistorico[];
}) {
  const { segmento, copy, unit } = useSegmento();
  const calculo = useMemo(
    () => calcular(paraCalculoInput(entrada), { segmento }),
    [entrada, segmento],
  );
  const r = calculo.ok ? calculo.resultado : null;

  const porte = porteDeProdutivos(entrada.quantidadeProdutivos);
  const amostra = amostraIlustrativa(segmento, porte);
  const nomeCidade = REGIOES.find((reg) => reg.id === cidade)?.label ?? cidade;
  const precoAtual = entrada.precoUnidadeAtual > 0 ? entrada.precoUnidadeAtual : null;

  /** Mesma leitura que o painel fazia — a tabela por categoria mora aqui agora. */
  const pesos = useMemo(
    () =>
      r
        ? pesosPorCategoria(
            r.custoMaoDeObra,
            copy.COMPOSICAO_LABEL.maoDeObra,
            entrada.custosFixos,
            r.unidadesProdutivas,
          )
        : [],
    [r, entrada.custosFixos, copy],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-petroleo">{BENCHMARK.titulo}</h1>
          {cidade ? (
            <p className="mt-2 text-sm text-petroleo-suave">
              {BENCHMARK.recorte(nomeCidade, PORTE_LABEL[porte])} ·{" "}
              {PORTE_FAIXA_PRODUTIVOS[porte]}
            </p>
          ) : null}
        </div>
        <Link
          href="/painel"
          className="touch-target inline-flex items-center rounded-button border border-border px-4 text-sm font-medium text-petroleo hover:bg-surface"
        >
          Voltar ao painel
        </Link>
      </div>

      {!r ? (
        <section className="card-metric mt-6">
          <h2 className="font-display text-lg font-semibold text-petroleo">
            {BENCHMARK.semCalculo.titulo}
          </h2>
          <p className="mt-2 text-sm text-petroleo-suave">{BENCHMARK.semCalculo.texto}</p>
          <Link
            href="/calculadora"
            className="touch-target mt-3 inline-flex items-center rounded-button bg-primary px-4 text-sm font-medium text-text-inverse hover:bg-primary-hover"
          >
            {BENCHMARK.semCalculo.acao}
          </Link>
        </section>
      ) : !cidade ? (
        <section className="card-metric mt-6">
          <p className="text-sm text-petroleo-suave">{BENCHMARK.semCidade}</p>
        </section>
      ) : !amostra ? (
        <section className="card-metric mt-6">
          <p className="text-xs text-petroleo-suave">
            {BENCHMARK.recorte(nomeCidade, PORTE_LABEL[porte])}
          </p>
          <p className="mt-2 text-base text-petroleo">{BENCHMARK.insuficiente.titulo}</p>
          <p className="mt-1 text-sm text-petroleo-suave">{BENCHMARK.insuficiente.texto}</p>
        </section>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          {/* Bloco 1 — custo real por unidade */}
          <section className="card-metric lg:col-span-6">
            <TarjaIlustrativa selo={amostra.selo} />
            <div className="mt-2 flex items-center gap-2">
              <span aria-hidden className="text-info">
                <IconeCusto />
              </span>
              <h2 className="font-display text-lg font-semibold text-petroleo">
                {BENCHMARK.custo.titulo}
              </h2>
            </div>
            <p className="text-sm text-petroleo-suave">{BENCHMARK.custo.ajuda}</p>
            <p className="mt-3 text-sm text-petroleo">
              Você: <span className="tabular font-medium">{formatarMoeda(r.custoRealUnidade)}</span>
            </p>
            <FaixaBenchmark faixa={amostra.faixaCusto} valor={r.custoRealUnidade} sufixo={unit.abbrev} />
            <p className="mt-2 text-base text-petroleo">
              {posicaoNaFaixa(amostra.faixaCusto, r.custoRealUnidade, "custo")}
            </p>
          </section>

          {/* Bloco 2 — preço praticado e sugerido */}
          <section className="card-metric lg:col-span-6">
            <TarjaIlustrativa selo={amostra.selo} />
            <div className="mt-2 flex items-center gap-2">
              <span aria-hidden className="text-info">
                <IconePreco />
              </span>
              <h2 className="font-display text-lg font-semibold text-petroleo">
                {BENCHMARK.preco.titulo}
              </h2>
            </div>
            <p className="text-sm text-petroleo-suave">{BENCHMARK.preco.ajuda}</p>

            {precoAtual === null ? (
              <p className="mt-3 text-sm text-petroleo-suave">{BENCHMARK.preco.semAtual}</p>
            ) : (
              <p className="mt-3 text-sm text-petroleo">
                Você cobra: <span className="tabular font-medium">{formatarMoeda(precoAtual)}</span>
              </p>
            )}
            <p className="text-sm text-petroleo">
              Preço sugerido:{" "}
              <span className="tabular font-medium">{formatarMoeda(r.precoUnidadeSugerido)}</span>
            </p>

            <FaixaBenchmark
              faixa={amostra.faixaPreco}
              valor={precoAtual ?? r.precoUnidadeSugerido}
              sufixo={unit.abbrev}
            />
            <p className="mt-2 text-base text-petroleo">
              {posicaoNaFaixa(amostra.faixaPreco, precoAtual ?? r.precoUnidadeSugerido)}
            </p>
          </section>

          {/* Bloco 3 — distribuição do grupo, com a faixa da oficina destacada */}
          <div className="lg:col-span-6">
            <Distribuicao
              amostra={amostra}
              valor={r.custoRealUnidade}
              recorte={BENCHMARK.recorte(nomeCidade, PORTE_LABEL[porte])}
              sufixo={unit.abbrev}
            />
          </div>

          {/* Bloco 4 — série temporal: a oficina contra o grupo */}
          <div className="lg:col-span-6">
            <Historico pontos={historico} amostra={amostra} />
          </div>

          {/*
            Bloco 5 — composição comparada, categoria a categoria.

            Largura cheia: cada linha são duas barras empilhadas com
            rótulo e percentual, e a meia largura espremia as barras a
            ponto de a diferença entre você e o grupo — que é o conteúdo
            — virar dois tracinhos quase iguais.
          */}
          <section className="card-metric lg:col-span-12">
            <TarjaIlustrativa selo={amostra.selo} />
            <div className="mt-2 flex items-center gap-2">
              <span aria-hidden className="text-info">
                <IconeComposicao />
              </span>
              <h2 className="font-display text-lg font-semibold text-petroleo">
                {BENCHMARK.composicao.titulo}
              </h2>
            </div>
            <p className="text-sm text-petroleo-suave">{BENCHMARK.composicao.ajuda}</p>

            <div className="mt-1 divide-y divide-border">
              {r.composicao.map((faixa) => (
                <BarraComparativa
                  key={faixa.id}
                  categoria={copy.COMPOSICAO_LABEL[faixa.id]}
                  fracaoSua={faixa.fracaoDoPreco}
                  fracaoGrupo={amostra.composicaoMediana[faixa.id]}
                  rotuloSua={BENCHMARK.composicao.rotuloSua}
                  rotuloGrupo={BENCHMARK.composicao.rotuloGrupo}
                />
              ))}
            </div>
          </section>

          {/*
            Bloco 6 — tabela por tipo de custo, linha a linha.

            Largura cheia pelo mesmo motivo, agravado: são seis colunas
            com `min-w-[30rem]`, então em meia largura a tabela rolava
            na horizontal em desktop — rolagem lateral para ler uma
            tabela é o tipo de atrito que o produto não pode ter.
          */}
          <div className="lg:col-span-12">
            <TabelaCustos
              pesos={pesos}
              rotuloMaoDeObra={copy.COMPOSICAO_LABEL.maoDeObra}
              unidadesProdutivas={r.unidadesProdutivas}
              amostra={amostra}
              sufixo={unit.abbrev}
            />
          </div>

          <p className="text-xs text-petroleo-suave lg:col-span-12">{BENCHMARK.rodape}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Ícones dos três blocos — SVG inline, mesmo padrão de
 * `Navegacao.tsx`. Coloridos com `info` (não usado em lugar nenhum do
 * app antes da Leva 4.1): acento neutro de "isto é um dado", distinto
 * de `success`/`danger`, que ficam reservados para bom/ruim sobre o
 * PRÓPRIO custo (nunca sobre posição de mercado).
 */
function IconeCusto() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="size-5">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
    </svg>
  );
}

function IconePreco() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="size-5">
      <path d="M12 3v18M8 6.5c0-1.7 1.5-3 4-3s4 1.3 4 2.7c0 3.6-8 1.7-8 5.3 0 1.6 1.8 2.9 4 2.9s4-1.3 4-3" strokeLinecap="round" />
    </svg>
  );
}

function IconeComposicao() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="size-5">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="12" height="4" rx="1" />
      <rect x="3" y="16" width="16" height="4" rx="1" />
    </svg>
  );
}

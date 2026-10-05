"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { CompositionBar } from "@/components/calculator/CompositionBar";
import { BenchmarkResumo } from "@/components/painel/BenchmarkResumo";
import { ANALISES, PAINEL } from "@/lib/copy/painel";
import {
  custoDaOciosidade,
  maiorAlavanca,
  pesosPorCategoria,
  pontoDeEquilibrioEmCarros,
  pontoDeEquilibrioEmUnidades,
} from "@/lib/pricing/analise";
import { paraCalculoInput, type EntradaAgregada } from "@/lib/pricing/aggregate";
import { calcular } from "@/lib/pricing/calculate";
import { formatarDecimal, formatarInteiro, formatarMoeda } from "@/lib/pricing/format";
import { definicaoDoSegmento } from "@/lib/pricing/segmento";
import { REGIOES } from "@/lib/regioes";

/**
 * Painel — resumo da própria oficina.
 *
 * ═══ O QUE NÃO MORA AQUI, E POR QUÊ (Leva 4.1) ═══
 * Histograma da região, tabela por tipo de custo e série temporal
 * saíram para `/benchmark`. A Leva 4 tinha empilhado tudo isso aqui e o
 * painel virou uma segunda tela de análise: quem entrava para conferir
 * o número do dia atravessava seis blocos até achá-lo.
 *
 * A regra passou a ser: o painel responde "como está minha oficina
 * agora". Comparação e evolução ao longo do tempo vivem em
 * `/benchmark` (docs/saas/03-telas.md, seção 6). A única menção a
 * comparação aqui é `BenchmarkResumo`, que é a porta e não a resposta.
 *
 * O cálculo é refeito a partir da configuração salva, com a MESMA lib
 * da calculadora. Não há um segundo caminho de cálculo: se o número do
 * painel divergisse do da calculadora, o produto perderia a única coisa
 * que ele promete.
 */
export function PainelCliente({
  entrada,
  cidade,
  nomeOficina,
}: {
  entrada: EntradaAgregada;
  cidade: string;
  nomeOficina: string | null;
}) {
  const { copy, unit, segmento } = useSegmento();
  const calculo = useMemo(
    () => calcular(paraCalculoInput(entrada), { segmento }),
    [entrada, segmento],
  );

  const r = calculo.ok ? calculo.resultado : null;

  /** Alimenta só a maior alavanca — a tabela por categoria mora em /benchmark. */
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
  const alavanca = useMemo(
    () => (r ? maiorAlavanca(pesos, r.custoRealUnidade) : null),
    [r, pesos],
  );
  const ociosidade = r ? custoDaOciosidade(r) : 0;

  const precoReferencia = r
    ? entrada.precoUnidadeAtual > 0
      ? entrada.precoUnidadeAtual
      : r.precoUnidadeSugerido
    : 0;

  const unidadesEquilibrio = useMemo(() => {
    if (!r) return 0;
    return pontoDeEquilibrioEmUnidades(
      r.custoTotalMensal,
      entrada.impostosSobreFaturamento,
      precoReferencia,
    );
  }, [r, entrada.impostosSobreFaturamento, precoReferencia]);

  const carrosEquilibrio = pontoDeEquilibrioEmCarros(
    unidadesEquilibrio,
    entrada.unidadesPorCarro,
  );

  /**
   * Linha de contexto do cabeçalho. Parte ausente some — cidade não
   * informada não vira "—" nem deixa separador solto.
   */
  const def = definicaoDoSegmento(segmento);
  const nomeCidade = REGIOES.find((reg) => reg.id === cidade)?.label ?? null;
  const identificacao = PAINEL.identificacao([
    nomeCidade,
    def.label,
    PAINEL.equipe(
      entrada.quantidadeProdutivos,
      entrada.quantidadeProdutivos === 1 ? def.produtivo.singular : def.produtivo.plural,
    ),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-petroleo-suave uppercase">
            {PAINEL.kicker}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-petroleo">
            {nomeOficina?.trim() || PAINEL.semNome}
          </h1>
          {identificacao ? (
            <p className="mt-1 text-sm text-petroleo-suave">{identificacao}</p>
          ) : null}
        </div>
        <Link
          href="/calculadora"
          className="touch-target inline-flex items-center rounded-button border border-border px-4 text-sm font-medium text-petroleo hover:bg-surface"
        >
          {PAINEL.atalhoCalculadora}
        </Link>
      </div>

      {!r ? (
        <section className="card-metric mt-6">
          <h2 className="font-display text-lg font-semibold text-petroleo">
            {PAINEL.semConfiguracao.titulo}
          </h2>
          <p className="mt-2 text-sm text-petroleo-suave">{PAINEL.semConfiguracao.texto}</p>
          <Link
            href="/calculadora"
            className="touch-target mt-3 inline-flex items-center rounded-button bg-primary px-4 text-sm font-medium text-text-inverse hover:bg-primary-hover"
          >
            {PAINEL.semConfiguracao.acao}
          </Link>
        </section>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          {/*
            Faixa de KPIs.
            ═══ POR QUE SUBGRID ═══
            Os quatro rótulos têm alturas diferentes, e cada tile sendo
            um bloco independente fazia os números começarem em alturas
            diferentes — o defeito que aparecia no print. Com subgrid,
            rótulo, valor e sublinha compartilham as MESMAS três faixas
            horizontais entre os quatro tiles, qualquer que seja o
            tamanho do texto. Onde subgrid não existir, o layout degrada
            para o de antes, não para pior.
          */}
          <section className="card-metric lg:col-span-12">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto] lg:gap-x-6">
              <Kpi
                label={copy.RESULTADO.custoReal.label}
                ajuda={copy.RESULTADO.custoReal.ajuda}
                divisoria
              >
                {/*
                  text-2xl e não text-4xl: 48px num tile de um quarto de
                  largura empurrava o "/UT" para uma terceira linha.
                  Continua sendo o maior número da tela.
                */}
                <p className="tabular font-display text-2xl font-bold whitespace-nowrap text-petroleo">
                  {formatarMoeda(r.custoRealUnidade)}
                  <span className="text-base font-normal text-petroleo-suave">
                    {" "}
                    /{unit.abbrev}
                  </span>
                </p>
              </Kpi>

              <Kpi
                label={copy.RESULTADO.precoSugerido.label}
                ajuda={copy.RESULTADO.precoSugerido.ajuda}
                divisoria
              >
                <p className="metric-value whitespace-nowrap text-petroleo">
                  {formatarMoeda(r.precoUnidadeSugerido)}
                </p>
              </Kpi>

              <Kpi
                label={copy.RESULTADO.pontoDeEquilibrio.label}
                ajuda={copy.RESULTADO.pontoDeEquilibrio.ajuda}
                nota={ANALISES.equilibrioEmReais.nota}
                divisoria
              >
                <p className="metric-value whitespace-nowrap text-petroleo">
                  {formatarMoeda(r.pontoDeEquilibrio)}
                </p>
              </Kpi>

              {/*
                Volume e valor do equilíbrio eram dois cartões dizendo
                "ponto de equilíbrio" com números diferentes. Aqui a
                leitura em carros é sublinha da leitura em unidades —
                mesma conta, duas escalas.
              */}
              <Kpi
                label={ANALISES.volumeDeEquilibrio.label}
                ajuda={ANALISES.volumeDeEquilibrio.ajuda}
                nota={
                  carrosEquilibrio === null ? (
                    <Link
                      href="/calculadora"
                      className="underline decoration-border underline-offset-2 hover:decoration-petroleo"
                    >
                      {ANALISES.equilibrioEmCarros.semMedia}
                    </Link>
                  ) : (
                    ANALISES.equilibrioEmCarros.carros(
                      formatarInteiro(Math.ceil(carrosEquilibrio)),
                    )
                  )
                }
              >
                <p className="metric-value whitespace-nowrap text-petroleo">
                  {formatarDecimal(unidadesEquilibrio)}
                  <span className="text-sm font-normal text-petroleo-suave"> {unit.plural}</span>
                </p>
              </Kpi>
            </div>
          </section>

          <section className="card-metric lg:col-span-8">
            <CompositionBar
              composicao={r.composicao}
              precoSugerido={r.precoUnidadeSugerido}
            />
          </section>

          <div className="grid gap-4 lg:col-span-4">
            {alavanca ? (
              <section className="card-metric border-l-4 border-l-info">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-info">
                    <IconeAlavanca />
                  </span>
                  <h2 className="font-display text-lg font-semibold text-petroleo">
                    {ANALISES.maiorAlavanca.titulo}
                  </h2>
                </div>
                <p className="mt-2 text-base text-petroleo">
                  {ANALISES.maiorAlavanca.descricao(alavanca.categoria)}
                </p>
                <p className="mt-1 text-sm text-petroleo-suave">
                  {ANALISES.maiorAlavanca.seCaisseDez(
                    formatarMoeda(alavanca.reducaoPorUnidade),
                    formatarMoeda(alavanca.novoCustoRealUnidade),
                  )}
                </p>
              </section>
            ) : null}

            <section className="card-metric">
              <KpiLabel
                label={ANALISES.ociosidade.titulo}
                ajuda={ANALISES.ociosidade.ajuda}
              />
              {ociosidade > 0 ? (
                <p className="tabular mt-1 font-display text-2xl font-bold text-petroleo">
                  {formatarMoeda(ociosidade)}
                  <span className="text-sm font-normal text-petroleo-suave"> por mês</span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-petroleo-suave">{ANALISES.ociosidade.zerada}</p>
              )}
            </section>
          </div>

          <div className="lg:col-span-12">
            <BenchmarkResumo
              precoAtual={entrada.precoUnidadeAtual > 0 ? entrada.precoUnidadeAtual : null}
              cidade={cidade}
              quantidadeProdutivos={entrada.quantidadeProdutivos}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Um tile da faixa de KPIs. Ocupa as três faixas do subgrid — rótulo,
 * valor, sublinha — para que os quatro fiquem alinhados entre si mesmo
 * com rótulos de alturas diferentes.
 *
 * A sublinha renderiza mesmo vazia: sem ela o tile ocuparia duas faixas
 * e o subgrid desalinharia justamente o que ele existe para alinhar.
 */
function Kpi({
  label,
  ajuda,
  nota,
  divisoria = false,
  children,
}: {
  label: string;
  ajuda: string;
  nota?: React.ReactNode;
  divisoria?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid gap-1 lg:row-span-3 lg:grid-rows-subgrid ${
        divisoria ? "lg:border-r lg:border-border lg:pr-6" : ""
      }`}
    >
      <KpiLabel label={label} ajuda={ajuda} />
      {children}
      <p className="text-xs text-petroleo-suave">{nota ?? ""}</p>
    </div>
  );
}

/**
 * Rótulo com "o que é isso?" revelável — o mesmo padrão de `Campo.tsx`,
 * adaptado para exibição (sem input): número calculado que não abre a
 * própria explicação quebra a regra derivada de CLAUDE.md.
 */
function KpiLabel({ label, ajuda }: { label: string; ajuda: string }) {
  const [aberta, setAberta] = useState(false);
  const idAjuda = useId();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="metric-label">{label}</p>
        <button
          type="button"
          onClick={() => setAberta((v) => !v)}
          aria-expanded={aberta}
          aria-controls={idAjuda}
          className="touch-target -mx-2 inline-flex items-center px-2 text-xs font-medium text-petroleo-suave underline decoration-border underline-offset-2 hover:text-petroleo"
        >
          {aberta ? "entendi" : "o que é isso?"}
        </button>
      </div>
      {aberta ? (
        <p id={idAjuda} className="mt-1 text-sm text-petroleo-suave">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}

/** Raio, para o card de "insight" se diferenciar dos cards de KPI plano. */
function IconeAlavanca() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
      className="size-5"
    >
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

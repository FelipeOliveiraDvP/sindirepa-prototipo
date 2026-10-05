"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { inputClasses } from "@/components/calculator/Campo";
import { CHAVE_RASCUNHO } from "@/components/calculator/useCalculadora";
import { corDoSentido } from "@/components/ui/ValorReativo";
import { SIMULADOR } from "@/lib/copy/simulador";
import { paraCalculoInput, type EntradaAgregada } from "@/lib/pricing/aggregate";
import { calcular } from "@/lib/pricing/calculate";
import { formatarMoeda } from "@/lib/pricing/format";
import {
  cenarioCustoFixoMuda,
  cenarioMargemMuda,
  cenarioOcupacaoMuda,
  cenarioProdutivoExtra,
  cenarioSalarioMuda,
} from "@/lib/pricing/simulacao";
import type { CalculoResultado } from "@/lib/pricing/types";

/**
 * `/e-se` — simulador. Nenhum dado externo, nenhuma fórmula nova: cada
 * cartão pede um cenário a `lib/pricing/simulacao.ts` e roda
 * `calcular()` sobre ele, exatamente como a calculadora
 * (docs/saas/03-telas.md, seção 7).
 *
 * Cada cartão é independente e compara contra a MESMA base — "sua
 * situação hoje" — nunca contra o cartão vizinho. É a forma mais clara
 * de responder "o que aconteceria se eu só mexesse nisto".
 *
 * Não salva. Cada cartão pode levar o cenário para a calculadora, que é
 * o único lugar onde um número se torna configuração de verdade.
 */
export function EseCliente({ entrada }: { entrada: EntradaAgregada }) {
  const { segmento, copy, unit } = useSegmento();
  const router = useRouter();

  const hoje = useMemo(() => calcular(paraCalculoInput(entrada), { segmento }), [entrada, segmento]);
  const base = hoje.ok ? hoje.resultado : null;

  function levarParaCalculadora(cenario: EntradaAgregada) {
    window.sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(cenario));
    router.push("/calculadora");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-12">
      <h1 className="font-display text-2xl font-bold text-petroleo">{SIMULADOR.titulo}</h1>
      <p className="mt-2 text-base text-petroleo-suave">{SIMULADOR.subtitulo}</p>

      {!base ? (
        <section className="card-metric mt-6">
          <h2 className="font-display text-lg font-semibold text-petroleo">
            {SIMULADOR.semConfiguracao.titulo}
          </h2>
          <p className="mt-2 text-sm text-petroleo-suave">{SIMULADOR.semConfiguracao.texto}</p>
          <Link
            href="/calculadora"
            className="touch-target mt-3 inline-flex items-center rounded-button bg-primary px-4 text-sm font-medium text-text-inverse hover:bg-primary-hover"
          >
            {SIMULADOR.semConfiguracao.acao}
          </Link>
        </section>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Fundo Creme, não branco: precisa ler como a BASE de comparação,
              não mais um cenário igual aos cinco de baixo. */}
          <section className="card-metric bg-surface-alt">
            <p className="metric-label">{SIMULADOR.hoje}</p>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-petroleo-suave">{copy.RESULTADO.custoReal.label}</p>
                <p className="metric-value mt-0.5 text-petroleo">{formatarMoeda(base.custoRealUnidade)}</p>
              </div>
              <div>
                <p className="text-xs text-petroleo-suave">{copy.RESULTADO.precoSugerido.label}</p>
                <p className="metric-value mt-0.5 text-petroleo">
                  {formatarMoeda(base.precoUnidadeSugerido)}
                </p>
              </div>
            </div>
          </section>

          <CartaoProdutivo entrada={entrada} segmento={segmento} base={base} unit={unit.plural} onLevar={levarParaCalculadora} />
          <CartaoCustoFixo entrada={entrada} segmento={segmento} base={base} onLevar={levarParaCalculadora} />
          <CartaoOcupacao entrada={entrada} segmento={segmento} base={base} onLevar={levarParaCalculadora} />
          <CartaoSalario entrada={entrada} segmento={segmento} base={base} onLevar={levarParaCalculadora} />
          <CartaoMargem entrada={entrada} segmento={segmento} base={base} onLevar={levarParaCalculadora} />
        </div>
      )}
    </div>
  );
}

type PropsCartao = {
  entrada: EntradaAgregada;
  segmento: EntradaAgregada["segmento"];
  base: CalculoResultado;
  onLevar: (cenario: EntradaAgregada) => void;
};

/**
 * Corpo comum a todo cartão: ícone + título, ajuda, controle (children),
 * e o resultado "depois" comparado com "hoje" — ou o aviso de cenário
 * bloqueado, quando o ajuste produz uma entrada inválida (06-dados.md,
 * casos-limite).
 *
 * ═══ COR DO CUSTO REAL — Leva 4.1 ═══
 * Custo maior é sempre pior: o "depois" e o delta do custo real ficam
 * verdes quando caem, vermelhos (`danger`, não o vermelho do CTA) quando
 * sobem — mesma tabela de `ValorReativo` (`corDoSentido`), aplicada aqui
 * como comparação estática, não flash ao vivo. O preço sugerido fica
 * neutro de propósito: ele sobe tanto por motivo bom (mais margem)
 * quanto neutro (mais custo repassado), e colori-lo exigiria saber o
 * motivo — que não é o caso aqui.
 *
 * O acento lateral do card usa a mesma cor: dá para bater o olho na
 * lista inteira e ver quais cenários ajudam sem ler nenhum número.
 */
function CartaoAlavanca({
  titulo,
  ajuda,
  icone,
  cenario,
  segmento,
  base,
  onLevar,
  children,
}: PropsCartao & {
  titulo: string;
  ajuda: string;
  icone: React.ReactNode;
  cenario: EntradaAgregada;
  children: React.ReactNode;
}) {
  const resultado = useMemo(
    () => calcular(paraCalculoInput(cenario), { segmento }),
    [cenario, segmento],
  );
  const depois = resultado.ok ? resultado.resultado : null;

  const deltaCusto = depois ? depois.custoRealUnidade - base.custoRealUnidade : 0;
  const semMudanca = Math.abs(deltaCusto) < 0.005;
  const corCusto = !depois || semMudanca ? "text-petroleo-suave" : corDoSentido(deltaCusto > 0 ? "subiu" : "desceu", "subir-ruim");
  const corAcento = !depois || semMudanca ? "border-l-border" : deltaCusto > 0 ? "border-l-danger" : "border-l-success";

  return (
    <section className={`card-metric border-l-4 ${corAcento}`}>
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-petroleo-suave">
          {icone}
        </span>
        <h2 className="font-display text-lg font-semibold text-petroleo">{titulo}</h2>
      </div>
      <p className="mt-1 text-sm text-petroleo-suave">{ajuda}</p>

      <div className="mt-3">{children}</div>

      {depois ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-3">
            <div>
              <p className="text-xs text-petroleo-suave">{SIMULADOR.depois} — custo real</p>
              <p className={`metric-value mt-0.5 ${corCusto}`}>{formatarMoeda(depois.custoRealUnidade)}</p>
              <p className={`text-xs ${corCusto}`}>
                {diferenca(depois.custoRealUnidade, base.custoRealUnidade)}
              </p>
            </div>
            <div>
              <p className="text-xs text-petroleo-suave">{SIMULADOR.depois} — preço sugerido</p>
              <p className="metric-value mt-0.5 text-petroleo">
                {formatarMoeda(depois.precoUnidadeSugerido)}
              </p>
              <p className="text-xs text-petroleo-suave">
                {diferenca(depois.precoUnidadeSugerido, base.precoUnidadeSugerido)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLevar(cenario)}
            className="touch-target mt-3 inline-flex items-center rounded-button border border-border px-4 text-sm font-medium text-petroleo hover:bg-surface"
          >
            {SIMULADOR.levarParaCalculadora}
          </button>
        </>
      ) : (
        <p className="mt-4 border-t border-border pt-3 text-sm text-petroleo-suave">
          {SIMULADOR.bloqueado}
        </p>
      )}
    </section>
  );
}

function diferenca(depois: number, hoje: number): string {
  const delta = depois - hoje;
  if (Math.abs(delta) < 0.005) return "sem variação";
  return `${delta > 0 ? "+" : "−"}${formatarMoeda(Math.abs(delta))} em relação a hoje`;
}

/** Slider de variação com sinal — cobre os cenários de "sobe ou desce". */
function ControleDelta({
  label,
  valor,
  onChange,
  min,
  max,
  formatarValor,
}: {
  label: string;
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  formatarValor: (v: number) => string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-petroleo">
          {label}
        </label>
        <output htmlFor={id} className="tabular text-sm font-medium text-petroleo">
          {formatarValor(valor)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-touch w-full accent-primary"
      />
    </div>
  );
}

function CartaoProdutivo({ entrada, segmento, base, unit, onLevar }: PropsCartao & { unit: string }) {
  const [extra, setExtra] = useState(1);
  const cenario = cenarioProdutivoExtra(entrada, extra);

  return (
    <CartaoAlavanca
      titulo={SIMULADOR.alavancas.produtivo.titulo}
      ajuda={SIMULADOR.alavancas.produtivo.ajuda}
      icone={<IconeProdutivo />}
      cenario={cenario}
      entrada={entrada}
      segmento={segmento}
      base={base}
      onLevar={onLevar}
    >
      <ControleDelta
        label={SIMULADOR.alavancas.produtivo.label}
        valor={extra}
        onChange={setExtra}
        min={-Math.min(3, entrada.quantidadeProdutivos)}
        max={10}
        formatarValor={(v) => `${v > 0 ? "+" : ""}${v} ${unit}`}
      />
    </CartaoAlavanca>
  );
}

function CartaoCustoFixo({ entrada, segmento, base, onLevar }: PropsCartao) {
  const categorias = entrada.custosFixos;
  const [categoria, setCategoria] = useState(categorias[0]?.categoria ?? "");
  const [percentual, setPercentual] = useState(10);

  if (categorias.length === 0) return null;

  const cenario = cenarioCustoFixoMuda(entrada, categoria, percentual / 100);

  return (
    <CartaoAlavanca
      titulo={SIMULADOR.alavancas.custoFixo.titulo}
      ajuda={SIMULADOR.alavancas.custoFixo.ajuda}
      icone={<IconeCustoFixo />}
      cenario={cenario}
      entrada={entrada}
      segmento={segmento}
      base={base}
      onLevar={onLevar}
    >
      <label className="text-sm font-medium text-petroleo">
        {SIMULADOR.alavancas.custoFixo.categoriaLabel}
      </label>
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className={`${inputClasses} mt-1.5`}
      >
        {categorias.map((c) => (
          <option key={c.categoria} value={c.categoria}>
            {c.categoria}
          </option>
        ))}
      </select>

      <div className="mt-3">
        <ControleDelta
          label={SIMULADOR.alavancas.custoFixo.percentualLabel}
          valor={percentual}
          onChange={setPercentual}
          min={0}
          max={100}
          formatarValor={(v) => `+${v}%`}
        />
      </div>
    </CartaoAlavanca>
  );
}

function CartaoOcupacao({ entrada, segmento, base, onLevar }: PropsCartao) {
  const [pontos, setPontos] = useState(-10);
  const cenario = cenarioOcupacaoMuda(entrada, pontos / 100);

  return (
    <CartaoAlavanca
      titulo={SIMULADOR.alavancas.ocupacao.titulo}
      ajuda={SIMULADOR.alavancas.ocupacao.ajuda}
      icone={<IconeOcupacao />}
      cenario={cenario}
      entrada={entrada}
      segmento={segmento}
      base={base}
      onLevar={onLevar}
    >
      <ControleDelta
        label={SIMULADOR.alavancas.ocupacao.label}
        valor={pontos}
        onChange={setPontos}
        min={-50}
        max={50}
        formatarValor={(v) => `${v > 0 ? "+" : ""}${v} pontos`}
      />
    </CartaoAlavanca>
  );
}

function CartaoSalario({ entrada, segmento, base, onLevar }: PropsCartao) {
  const [percentual, setPercentual] = useState(10);
  const cenario = cenarioSalarioMuda(entrada, percentual / 100);

  return (
    <CartaoAlavanca
      titulo={SIMULADOR.alavancas.salario.titulo}
      ajuda={SIMULADOR.alavancas.salario.ajuda}
      icone={<IconeSalario />}
      cenario={cenario}
      entrada={entrada}
      segmento={segmento}
      base={base}
      onLevar={onLevar}
    >
      <ControleDelta
        label={SIMULADOR.alavancas.salario.label}
        valor={percentual}
        onChange={setPercentual}
        min={-50}
        max={50}
        formatarValor={(v) => `${v > 0 ? "+" : ""}${v}%`}
      />
    </CartaoAlavanca>
  );
}

function CartaoMargem({ entrada, segmento, base, onLevar }: PropsCartao) {
  const [pontos, setPontos] = useState(5);
  const cenario = cenarioMargemMuda(entrada, pontos / 100);

  return (
    <CartaoAlavanca
      titulo={SIMULADOR.alavancas.margem.titulo}
      ajuda={SIMULADOR.alavancas.margem.ajuda}
      icone={<IconeMargem />}
      cenario={cenario}
      entrada={entrada}
      segmento={segmento}
      base={base}
      onLevar={onLevar}
    >
      <ControleDelta
        label={SIMULADOR.alavancas.margem.label}
        valor={pontos}
        onChange={setPontos}
        min={-15}
        max={15}
        formatarValor={(v) => `${v > 0 ? "+" : ""}${v} pontos`}
      />
    </CartaoAlavanca>
  );
}

/**
 * Ícones das alavancas — SVG inline, mesmo padrão de
 * `src/components/app/Navegacao.tsx`: `currentColor`, sem biblioteca.
 * Só para diferenciar os cinco cards de relance; nunca carregam
 * significado sozinhos (o título já diz tudo).
 */
function IconeProdutivo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="size-5">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6" strokeLinecap="round" />
    </svg>
  );
}

function IconeCustoFixo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="size-5">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" strokeLinecap="round" />
    </svg>
  );
}

function IconeOcupacao() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="size-5">
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 13 15 9.5M9.5 4h5" strokeLinecap="round" />
    </svg>
  );
}

function IconeSalario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="size-5">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
      <path d="M15.5 14.5h2" strokeLinecap="round" />
    </svg>
  );
}

function IconeMargem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="size-5">
      <circle cx="7.5" cy="7.5" r="2.25" />
      <circle cx="16.5" cy="16.5" r="2.25" />
      <path d="M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

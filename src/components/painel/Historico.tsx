"use client";

import { useSegmento } from "@/components/app/SegmentoProvider";
import { corDoSentido } from "@/components/ui/ValorReativo";
import type { AmostraIlustrativa } from "@/lib/benchmark/demo";
import { HISTORICO } from "@/lib/copy/painel";
import type { PontoDoHistorico } from "@/lib/data/configuracao";
import { formatarMoeda } from "@/lib/pricing/format";
import { TarjaIlustrativa } from "./TarjaIlustrativa";

/**
 * Como o custo da oficina mudou ao longo do tempo — e como o grupo se
 * moveu no mesmo período.
 *
 * ═══ POR QUE VIVE EM /benchmark, E NÃO NO PAINEL ═══
 * Leva 4.1. Evolução sem referência não diz o que importa: se o custo
 * subiu 6%, o dono precisa saber se foi a oficina dele ou o mercado
 * inteiro. A série própria é dado real; a do grupo é a referência que
 * dá sentido a ela. Com as duas na mesma tela, o painel voltou a ser
 * resumo (docs/saas/03-telas.md, seções 5 e 6).
 *
 * ═══ POR QUE ISTO É DADO REAL ═══
 * Cada ponto próprio é o resultado CONGELADO no momento em que o
 * usuário salvou — não um recálculo. `configuracoes_calculo` não aceita
 * UPDATE (migration 400), então a série é imutável por construção.
 *
 * ═══ POR QUE SVG À MÃO ═══
 * O projeto tem seis dependências. Uma biblioteca de gráficos para
 * desenhar duas linhas seria mais peso do que valor, e o público está
 * em 4G num celular mediano. Os rótulos dos eixos são HTML fora do SVG:
 * a área é esticada com `preserveAspectRatio="none"`, e texto dentro de
 * SVG esticado sai deformado.
 *
 * O gráfico NÃO é o conteúdo — o número e a variação são. Por isso ele
 * tem `aria-hidden` e a informação vive no texto.
 */
export function Historico({
  pontos,
  amostra,
}: {
  pontos: PontoDoHistorico[];
  /**
   * Só em modo demonstração. Acrescenta a curva do grupo. Sem ela o
   * cartão mostra apenas a série própria — comportamento de produção.
   */
  amostra?: AmostraIlustrativa | null;
}) {
  const { unit } = useSegmento();

  const grupo = amostra?.tendencia ?? null;

  // Sem série do grupo E sem histórico próprio suficiente, não há
  // gráfico nenhum a desenhar — só a orientação de salvar de novo.
  if (pontos.length < 2 && !grupo) {
    return (
      <section className="card-metric">
        <h2 className="font-display text-lg font-semibold text-petroleo">
          {HISTORICO.titulo}
        </h2>
        <p className="mt-2 text-sm text-petroleo-suave">{HISTORICO.poucasVersoes}</p>
      </section>
    );
  }

  const valores = pontos.map((p) => p.custoRealUnidade);
  const atual = valores.length > 0 ? valores[valores.length - 1] : null;
  const variacao =
    valores.length >= 2 ? valores[valores.length - 1] - valores[0] : null;

  // Custo maior é sempre pior (Leva 4.1) — mesma tabela de cor de
  // ValorReativo/corDoSentido. Sem variação real, fica neutro.
  const corTendencia =
    variacao === null || Math.abs(variacao) < 0.005
      ? "text-petroleo"
      : corDoSentido(variacao > 0 ? "subiu" : "desceu", "subir-ruim");

  // Movimento mais recente, distinto da variação total: com 3+ pontos o
  // total pode subir enquanto o último passo caiu.
  const tendenciaRecente =
    valores.length < 3
      ? null
      : valores[valores.length - 1] > valores[valores.length - 2]
        ? HISTORICO.tendencia.subiu
        : valores[valores.length - 1] < valores[valores.length - 2]
          ? HISTORICO.tendencia.caiu
          : HISTORICO.tendencia.estavel;

  /**
   * Janela de tempo. Com grupo, são os 12 meses dele — é o eixo que dá
   * sentido à comparação. Sem grupo, é o intervalo do próprio histórico.
   */
  const janela = grupo
    ? { inicio: inicioDoMes(grupo[0].mes), fim: fimDoMes(grupo[grupo.length - 1].mes) }
    : {
        inicio: new Date(pontos[0].criadoEm).getTime(),
        fim: new Date(pontos[pontos.length - 1].criadoEm).getTime(),
      };

  /**
   * Pontos próprios dentro da janela. Versão mais antiga que ela não é
   * plotada: esticar o eixo para acomodá-la achataria a curva do grupo,
   * e a comparação — que é o motivo do gráfico — perderia resolução.
   */
  const meus = pontos
    .map((p) => ({ t: new Date(p.criadoEm).getTime(), valor: p.custoRealUnidade }))
    .filter((p) => Number.isFinite(p.t) && p.t >= janela.inicio && p.t <= janela.fim);

  const dominio = [...valores, ...(grupo ? grupo.map((g) => g.valor) : [])];
  const bruto = { min: Math.min(...dominio), max: Math.max(...dominio) };
  const folga = (bruto.max - bruto.min || Math.max(bruto.max, 1)) * 0.12;
  const min = bruto.min - folga;
  const max = bruto.max + folga;

  /** Posição vertical em %, de baixo para cima. */
  const alturaDe = (v: number) => ((v - min) / (max - min)) * 100;
  /** Posição horizontal em %, da esquerda para a direita. */
  const larguraDe = (t: number) =>
    janela.fim === janela.inicio
      ? 100
      : ((t - janela.inicio) / (janela.fim - janela.inicio)) * 100;

  return (
    <section className="card-metric">
      {amostra ? <TarjaIlustrativa selo={amostra.selo} /> : null}

      <div
        className={`flex flex-wrap items-baseline justify-between gap-2 ${amostra ? "mt-3" : ""}`}
      >
        <h2 className="font-display text-lg font-semibold text-petroleo">
          {HISTORICO.titulo}
        </h2>
        <p className="text-sm text-petroleo-suave">{HISTORICO.versoes(pontos.length)}</p>
      </div>

      {/*
       * Cor + rótulo textual juntos (05-marca.md: nunca cor sozinha).
       * "a mais" já diz que piorou mesmo para quem não distingue cor.
       */}
      {variacao !== null ? (
        <p className="mt-3 text-base text-petroleo">
          <span className={`tabular font-medium ${corTendencia}`}>
            {formatarMoeda(Math.abs(variacao))}
          </span>{" "}
          {variacao >= 0 ? "a mais" : "a menos"} por {unit.singular} desde a primeira vez
          que você salvou.
        </p>
      ) : (
        <p className="mt-3 text-sm text-petroleo-suave">{HISTORICO.poucasVersoes}</p>
      )}

      {tendenciaRecente ? (
        <p className="mt-1 text-sm text-petroleo-suave">{tendenciaRecente}</p>
      ) : null}

      <div className="mt-4 flex gap-2">
        {/* Eixo Y: três marcas, o suficiente para dar escala sem virar tabela. */}
        <div
          aria-hidden
          className="tabular flex h-32 shrink-0 flex-col justify-between text-xs text-petroleo-suave"
        >
          <span>{formatarMoeda(max)}</span>
          <span>{formatarMoeda((max + min) / 2)}</span>
          <span>{formatarMoeda(min)}</span>
        </div>

        <div aria-hidden className="relative h-32 flex-1 border-l border-border">
          {[0, 50, 100].map((pct) => (
            <div
              key={pct}
              className="absolute inset-x-0 border-t border-border/60"
              style={{ bottom: `${pct}%` }}
            />
          ))}

          {/*
            "Você": referência horizontal no custo atual. É a leitura
            honesta mesmo quando existe uma versão salva só — que é o
            caso comum, e é exatamente a forma do print de referência.
          */}
          {atual !== null ? (
            <div
              className="absolute inset-x-0 border-t border-dashed border-petroleo"
              style={{ bottom: `${alturaDe(atual)}%` }}
            >
              <span className="absolute -top-4 right-0 bg-surface px-1 text-xs font-medium text-petroleo">
                {HISTORICO.rotuloVoce}
              </span>
            </div>
          ) : null}

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="presentation"
            className="absolute inset-0 h-full w-full"
          >
            {grupo ? (
              <polyline
                points={grupo
                  .map((g, i) => {
                    const x = (i / (grupo.length - 1)) * 100;
                    return `${x.toFixed(2)},${(100 - alturaDe(g.valor)).toFixed(2)}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="text-info"
              />
            ) : null}

            {meus.length >= 2 ? (
              <polyline
                points={meus
                  .map(
                    (m) =>
                      `${larguraDe(m.t).toFixed(2)},${(100 - alturaDe(m.valor)).toFixed(2)}`,
                  )
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className={corTendencia}
              />
            ) : null}
          </svg>

          {/*
            Pontos próprios como marcadores HTML: um círculo dentro de
            SVG esticado com preserveAspectRatio="none" vira elipse.
          */}
          {meus.map((m) => (
            <span
              key={m.t}
              className="absolute size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-petroleo"
              style={{ left: `${larguraDe(m.t)}%`, bottom: `${alturaDe(m.valor)}%` }}
            />
          ))}
        </div>
      </div>

      <div aria-hidden className="mt-1 flex justify-between text-xs text-petroleo-suave">
        <span className="tabular">
          {grupo ? mesAnoDeChave(grupo[0].mes) : mesAno(pontos[0].criadoEm)}
        </span>
        <span className="tabular">
          {grupo
            ? mesAnoDeChave(grupo[grupo.length - 1].mes)
            : mesAno(pontos[pontos.length - 1].criadoEm)}
        </span>
      </div>

      {grupo ? (
        <p className="mt-3 text-sm text-petroleo-suave">
          <span className="font-medium text-info">{HISTORICO.rotuloGrupo}</span>{" "}
          {HISTORICO.legendaGrupo}
        </p>
      ) : null}

      <p className="mt-2 text-xs text-petroleo-suave">
        {grupo ? HISTORICO.notaComGrupo : HISTORICO.nota}
      </p>
    </section>
  );
}

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** "AAAA-MM" para o timestamp do primeiro instante do mês. */
function inicioDoMes(chave: string): number {
  const [ano, mes] = chave.split("-").map(Number);
  return Date.UTC(ano, mes - 1, 1);
}

/** "AAAA-MM" para o timestamp do último instante do mês. */
function fimDoMes(chave: string): number {
  const [ano, mes] = chave.split("-").map(Number);
  return Date.UTC(ano, mes, 1) - 1;
}

/**
 * "mar/25". Montado à mão em vez de `Intl`: com `month: "short"` o pt-BR
 * devolve "mar. de 25", que é longo demais para rótulo de eixo a 375px.
 */
function mesAno(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
}

function mesAnoDeChave(chave: string): string {
  const [ano, mes] = chave.split("-").map(Number);
  return `${MESES[mes - 1]}/${String(ano).slice(-2)}`;
}

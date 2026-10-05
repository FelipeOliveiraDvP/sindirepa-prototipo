import type { AmostraIlustrativa } from "@/lib/benchmark/demo";
import { BENCHMARK, DISTRIBUICAO } from "@/lib/copy/painel";
import { formatarMoeda } from "@/lib/pricing/format";
import { posicaoNaFaixa } from "./FaixaBenchmark";
import { TarjaIlustrativa } from "./TarjaIlustrativa";

/**
 * Histograma do custo real das oficinas do mesmo recorte.
 *
 * ═══ POR QUE DIV E NÃO BIBLIOTECA ═══
 * Mesma decisão de `Historico.tsx`: o projeto tem seis dependências e o
 * público está em 4G num celular mediano. Oito barras de altura
 * percentual são a mesma técnica de `CompositionBar`, girada 90°.
 *
 * ═══ O GRÁFICO NÃO É O CONTEÚDO ═══
 * As barras têm `aria-hidden`; a informação vive na frase de posição
 * abaixo. E a barra do usuário não se distingue só por cor — carrega
 * rótulo textual (05-marca.md: cor nunca é o único sinal).
 *
 * ═══ SEM AMOSTRA, NENHUM NÚMERO ═══
 * `amostra` só é não-nula em modo demonstração. Em produção este card
 * mostra o estado de amostra insuficiente, que é honesto e é o que o
 * usuário real vê nos primeiros meses (docs/saas/09-benchmark.md).
 */
export function Distribuicao({
  amostra,
  valor,
  recorte,
  sufixo,
}: {
  amostra: AmostraIlustrativa | null;
  /** Custo real da própria oficina, para destacar a faixa dela. */
  valor: number;
  recorte: string | null;
  sufixo: string;
}) {
  if (!amostra) {
    return (
      <section className="card-metric">
        <h2 className="font-display text-lg font-semibold text-petroleo">
          {DISTRIBUICAO.titulo}
        </h2>
        {recorte ? <p className="mt-1 text-xs text-petroleo-suave">{recorte}</p> : null}
        <p className="mt-2 text-base text-petroleo">{BENCHMARK.insuficiente.titulo}</p>
        <p className="mt-1 text-sm text-petroleo-suave">{BENCHMARK.insuficiente.texto}</p>
      </section>
    );
  }

  const barras = amostra.distribuicao;
  const pico = Math.max(...barras.map((b) => b.contagem), 1);

  // A última barra inclui o teto: quem está exatamente no máximo cai
  // dentro do histograma, não fora dele.
  const indiceDoUsuario = barras.findIndex(
    (b, i) => valor >= b.minimo && (valor < b.maximo || i === barras.length - 1),
  );

  return (
    <section className="card-metric">
      <TarjaIlustrativa selo={amostra.selo} />

      <h2 className="mt-3 font-display text-lg font-semibold text-petroleo">
        {DISTRIBUICAO.titulo}
      </h2>
      {recorte ? <p className="mt-1 text-xs text-petroleo-suave">{recorte}</p> : null}
      <p className="mt-2 text-sm text-petroleo-suave">{DISTRIBUICAO.ajuda}</p>

      <div className="mt-4 overflow-x-auto">
        <div aria-hidden className="flex min-w-[20rem] items-end gap-1.5">
          {barras.map((b, i) => {
            const destaque = i === indiceDoUsuario;
            return (
              <div key={b.minimo} className="flex flex-1 flex-col items-center gap-1">
                <span className="tabular text-xs text-petroleo-suave">{b.contagem}</span>
                <div className="flex h-28 w-full items-end">
                  <div
                    className={`w-full rounded-t-sm ${destaque ? "bg-info" : "bg-border"}`}
                    style={{ height: `${Math.max((b.contagem / pico) * 100, 2)}%` }}
                  />
                </div>
                <span className="tabular text-center text-xs leading-tight text-petroleo-suave">
                  {Math.round(b.minimo)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/*
        Cor + rótulo, nunca cor sozinha. E a posição é FATO, nunca
        recomendação de preço — mesma restrição de FaixaBenchmark.
      */}
      {indiceDoUsuario >= 0 ? (
        <p className="mt-3 text-sm text-petroleo">
          <span className="font-medium text-info">{DISTRIBUICAO.suaFaixa}</span>{" "}
          <span className="tabular">
            {formatarMoeda(barras[indiceDoUsuario].minimo)} a{" "}
            {formatarMoeda(barras[indiceDoUsuario].maximo)}/{sufixo}
          </span>{" "}
          · {DISTRIBUICAO.oficinas(barras[indiceDoUsuario].contagem)}
        </p>
      ) : null}

      <p className="mt-1 text-sm text-petroleo-suave">{posicaoNaFaixa(amostra.faixaCusto, valor, "custo")}</p>
    </section>
  );
}

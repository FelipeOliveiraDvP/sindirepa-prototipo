"use client";

import { useSegmento } from "@/components/app/SegmentoProvider";
import { memoriaDeCalculo } from "@/lib/pricing/explain";
import { formatarMoeda, formatarPercentual } from "@/lib/pricing/format";
import type { Calculo, CalculoInput } from "@/lib/pricing/types";
import { CalculationMemory } from "./CalculationMemory";
import { CompositionBar } from "./CompositionBar";

/**
 * Painel de resultado. Hierarquia visual exata de 03-telas.md:
 *   1. custo real (número-herói)  2. preço sugerido  3. ponto de
 *   equilíbrio  4. comparativo  5. composição
 *
 * O painel NUNCA sai da vista: sticky em desktop, barra fixa no rodapé
 * em mobile. Ver o número mudar enquanto mexe nos campos é o mecanismo
 * de aprendizado da ferramenta.
 */
export function ResultPanel({
  calculo,
  entrada,
}: {
  calculo: Calculo;
  entrada: CalculoInput;
}) {
  const { copy } = useSegmento();

  if (!calculo.ok) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4 md:p-6">
        <p className="font-display text-lg font-semibold text-petroleo">
          {copy.RESULTADO.aguardando.titulo}
        </p>
        <p className="mt-1 text-sm text-petroleo-suave">{copy.RESULTADO.aguardando.ajuda}</p>

        <ul className="mt-3 space-y-2">
          {calculo.erros.map((erro) => (
            <li key={erro.codigo} className="text-sm text-petroleo">
              {erro.mensagem}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const r = calculo.resultado;
  const passos = memoriaDeCalculo(entrada, r);

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4 md:p-6">
      {/* 1. Número-herói */}
      <p className="text-sm text-petroleo-suave">{copy.RESULTADO.custoReal.label}</p>
      <p
        // A key troca só quando o valor EXIBIDO muda, então a animação
        // não replays a cada tecla que não altera o resultado.
        key={formatarMoeda(r.custoRealUnidade)}
        className="valor-mudou tabular font-display text-4xl font-bold text-petroleo"
      >
        {formatarMoeda(r.custoRealUnidade)}
      </p>
      <p className="mt-1 text-sm text-petroleo-suave">{copy.RESULTADO.custoReal.ajuda}</p>

      {/* 2. Preço sugerido */}
      <dl className="mt-5 space-y-3 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm font-medium text-petroleo">{copy.RESULTADO.precoSugerido.label}</dt>
          <dd
            key={`preco-${formatarMoeda(r.precoUnidadeSugerido)}`}
            className="valor-mudou tabular text-xl font-semibold text-petroleo"
          >
            {formatarMoeda(r.precoUnidadeSugerido)}
          </dd>
        </div>

        {/* 3. Ponto de equilíbrio — merece destaque próprio */}
        <div className="rounded-[var(--radius-button)] bg-surface-alt p-3">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-sm font-medium text-petroleo">
              {copy.RESULTADO.pontoDeEquilibrio.label}
            </dt>
            <dd className="tabular text-lg font-semibold text-petroleo">
              {formatarMoeda(r.pontoDeEquilibrio)}
            </dd>
          </div>
          <p className="mt-1 text-sm text-petroleo-suave">{copy.RESULTADO.pontoDeEquilibrio.ajuda}</p>
        </div>
      </dl>

      {/* 4. Comparativo */}
      {r.comparativo ? (
        <Comparativo
          diferenca={r.comparativo.diferencaPorUnidade}
          impactoMensal={r.comparativo.impactoMensal}
          margemReal={r.comparativo.margemRealAtual}
          abaixoDoEquilibrio={r.comparativo.abaixoDoEquilibrio}
        />
      ) : null}

      {/* 5. Composição + memória */}
      <CompositionBar composicao={r.composicao} precoSugerido={r.precoUnidadeSugerido} />
      <CalculationMemory passos={passos} />

      {r.avisos.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {r.avisos.map((aviso) => (
            <li key={aviso.codigo} className="flex gap-2 text-sm text-petroleo">
              {/* Ícone textual + rótulo: cor nunca é o único sinal. */}
              <span aria-hidden>⚠</span>
              <span>{aviso.mensagem}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Como dar má notícia (07-copy.md): fato, causa provável, próximo passo.
 * Sem alarme, sem dedo na cara — o número faz o trabalho.
 *
 * COR: prejuízo NÃO usa vermelho. 05-marca.md é explícito — vermelho de
 * marca só em CTA, e numa ferramenta financeira vermelho já significa
 * "perda", o que criaria ambiguidade com o CTA. Prejuízo aparece em
 * Carbono, com ícone e rótulo textual.
 */
function Comparativo({
  diferenca,
  impactoMensal,
  margemReal,
  abaixoDoEquilibrio,
}: {
  diferenca: number;
  impactoMensal: number;
  margemReal: number;
  abaixoDoEquilibrio: boolean;
}) {
  const { copy } = useSegmento();
  const cobraMenos = diferenca > 0;

  return (
    <section className="mt-5 border-t border-border pt-4">
      <p className="text-sm font-medium text-petroleo">
        {cobraMenos
          ? copy.DIAGNOSTICO.abaixoDoCusto(formatarMoeda(Math.abs(diferenca)))
          : copy.DIAGNOSTICO.acimaDoCusto(formatarMoeda(Math.abs(diferenca)))}
      </p>

      {abaixoDoEquilibrio ? (
        <>
          <p className="mt-2 flex gap-2 text-sm text-petroleo">
            <span aria-hidden>⚠</span>
            <span>{copy.DIAGNOSTICO.causaProvavel}</span>
          </p>
          <p className="mt-1 text-sm text-petroleo-suave">{copy.DIAGNOSTICO.proximoPasso}</p>
        </>
      ) : null}

      <dl className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-petroleo-suave">Impacto no mês</dt>
          <dd className="tabular text-sm font-medium text-petroleo">
            {formatarMoeda(Math.abs(impactoMensal))}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-petroleo-suave">Margem real no preço de hoje</dt>
          <dd className="tabular text-sm font-medium text-petroleo">
            {formatarPercentual(margemReal)}
            {margemReal < 0 ? <span className="ml-1 text-petroleo-suave">(prejuízo)</span> : null}
          </dd>
        </div>
      </dl>
    </section>
  );
}

/** Barra fixa de mobile: o resultado nunca sai da vista. */
export function ResultBarMobile({ calculo }: { calculo: Calculo }) {
  const { copy } = useSegmento();
  const valor = calculo.ok ? formatarMoeda(calculo.resultado.custoRealUnidade) : "—";

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Só o rótulo: ele já contém a unidade, e somar `unit.per` aqui
          produzia "Custo real da hora · por hora". */}
      <span className="text-xs text-text-inverse/80">{copy.RESULTADO.custoReal.label}</span>
      <span key={valor} className="valor-mudou tabular font-display text-xl font-bold">
        {valor}
      </span>
    </div>
  );
}

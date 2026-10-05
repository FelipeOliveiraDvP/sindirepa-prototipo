"use client";

import { useSegmento } from "@/components/app/SegmentoProvider";
import { track } from "@/lib/analytics/track";
import type { PassoMemoria } from "@/lib/pricing/explain";

/**
 * A memória de cálculo. Elemento assinatura do produto, não polimento.
 *
 * Regra derivada de CLAUDE.md: nenhum número aparece na interface sem
 * que o usuário consiga abrir e ver de onde veio. Este componente é o
 * "abrir".
 *
 * Fechada por padrão para não competir com o número-herói, mas o rótulo
 * é uma pergunta que o usuário já tem na cabeça — "como isso foi
 * calculado" — e não um "detalhes" genérico.
 */
export function CalculationMemory({ passos }: { passos: PassoMemoria[] }) {
  const { copy } = useSegmento();
  return (
    <details
      className="group mt-6 border-t border-border pt-2"
      onToggle={(e) => {
        if (e.currentTarget.open) track({ nome: "calc_memoria_aberta" });
      }}
    >
      <summary className="touch-target flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-petroleo underline decoration-border underline-offset-4">
        <span aria-hidden className="text-petroleo-suave transition-transform group-open:rotate-180">
          ▾
        </span>
        <span className="group-open:hidden">{copy.RESULTADO.verMemoria}</span>
        <span className="hidden group-open:inline">{copy.RESULTADO.esconderMemoria}</span>
      </summary>

      <ol className="mt-3 space-y-3">
        {passos.map((passo) => (
          <li key={passo.numero} className="flex gap-3">
            <span
              aria-hidden
              className="tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-petroleo-suave"
            >
              {passo.numero}
            </span>

            <div className="min-w-0">
              <p className="text-sm font-medium text-petroleo">{passo.titulo}</p>
              <p className="tabular mt-0.5 text-sm break-words text-petroleo-suave">{passo.conta}</p>
              <p className="tabular mt-0.5 text-sm font-medium text-petroleo">= {passo.resultado}</p>
              {passo.porque ? (
                <p className="mt-1 text-sm text-petroleo-suave">{passo.porque}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}

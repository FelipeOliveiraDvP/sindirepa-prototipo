"use client";

import { useId } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { useAssistente } from "./Assistente";
import { formatarPercentual } from "@/lib/pricing/format";

/**
 * A taxa de ocupação tem tratamento próprio por um motivo medido: é o
 * campo que o usuário menos entende e o que mais muda o resultado
 * (03-telas.md). Slider em vez de digitação, explicação sempre visível
 * em vez de escondida, e o valor grande ao lado para o usuário ver o que
 * está fazendo.
 *
 * INSTRUMENTAÇÃO DE ABANDONO: não precisa de evento novo.
 * `calc_campo_alterado` já carrega o nome do campo, e a hipótese do
 * produto é que a ocupação seja o último campo alterado antes da
 * desistência. O sinal sai da análise da sequência de eventos, não de um
 * evento dedicado — que registraria a mesma coisa duas vezes.
 *
 * ⚠️ FALTA A FAIXA DE REFERÊNCIA. 03-telas.md pede "faixa típica de
 * referência", mas isso é dado de mercado e CLAUDE.md proíbe inventar
 * número que possa passar por real. A referência legítima vem da
 * agregação de `configuracoes_calculo` quando houver volume. Até lá,
 * fica a afirmação qualitativa de 07-copy.md, que é verdadeira sem
 * precisar de número.
 *
 * ═══ ASSISTENTE (Leva 3) ═══
 * Este é o campo com o texto mais longo em lib/copy/assistente.ts, e
 * não por acaso: ninguém sabe a própria ocupação de cabeça, então o
 * assistente ensina a ESTIMAR em vez de só definir o termo.
 */
export function OcupacaoField({
  fracao,
  onChange,
  onInteragir,
}: {
  fracao: number;
  onChange: (fracao: number) => void;
  onInteragir?: () => void;
}) {
  const id = useId();
  const idAjuda = useId();
  const percentual = Math.round(fracao * 100);
  const { ativar } = useAssistente();
  const { copy, unit } = useSegmento();

  return (
    <div
      className="scroll-mt-44 py-4 md:scroll-mt-0"
      data-assistente-zona
      onFocusCapture={() => ativar("ocupacao")}
    >
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-petroleo">
          {copy.CAMPOS.ocupacao.label}
        </label>
        <output htmlFor={id} className="tabular text-lg font-medium text-petroleo">
          {formatarPercentual(fracao)}
        </output>
      </div>

      {/* Explicação inline, não escondida atrás de botão: é o campo que
          o usuário menos entende, então a ajuda não pode custar um toque. */}
      <p id={idAjuda} className="mt-1 text-sm text-petroleo-suave">
        {copy.CAMPOS.ocupacao.ajuda}
      </p>

      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={percentual}
        aria-describedby={idAjuda}
        aria-valuetext={formatarPercentual(fracao)}
        onChange={(e) => {
          onChange(Number(e.target.value) / 100);
          onInteragir?.();
        }}
        className="mt-3 h-touch w-full accent-primary"
      />

      <div className="flex justify-between text-xs text-petroleo-suave">
        <span>0%</span>
        <span>
          {/* Afirmação qualitativa — nenhum número de mercado envolvido. */}
          nenhuma oficina vende todas as {unit.plural} disponíveis
        </span>
        <span>100%</span>
      </div>

    </div>
  );
}

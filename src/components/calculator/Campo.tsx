"use client";

import { useId, useState } from "react";
import { useAssistente } from "./Assistente";

/**
 * Envelope de campo: label acima, ajuda revelável, erro abaixo.
 *
 * DESVIO DELIBERADO DE 03-telas.md — o documento pede "tooltip". Tooltip
 * é hover, e hover não existe em celular. Como o caso de uso primário é
 * o dono de oficina em pé no balcão, a explicação virou um botão de 44px
 * que revela o texto inline. Mesma informação, alcançável com o polegar,
 * e legível por leitor de tela — que com tooltip fica de fora.
 *
 * Sem biblioteca de ícone: o rótulo é texto ("o que é isso?"), que diz
 * mais que um "?" e evita o clichê visual que 05-marca.md proíbe.
 *
 * ═══ ASSISTENTE (Leva 3, painel único desde a 4.2) ═══
 * Passando `campo`, o envelope avisa o assistente quando recebe foco —
 * via `onFocusCapture`, que pega o foco do input de dentro sem exigir
 * mudança em fields.tsx. Quem mostra o conteúdo é sempre um painel
 * único (coluna sticky no desktop, painel fixo no topo no mobile) — não
 * mais um cartão por campo, então o envelope só precisa avisar quando é
 * focado e quando deixa de ser (via `data-assistente-zona`, lido pelo
 * listener central em `AssistenteProvider`).
 *
 * "o que é isso?" responde O QUE O CAMPO É. O assistente responde ONDE
 * ACHAR O NÚMERO. São perguntas diferentes e convivem.
 */
export function Campo({
  label,
  ajuda,
  erro,
  children,
  htmlFor,
  campo,
}: {
  label: string;
  ajuda?: string;
  erro?: string;
  children: React.ReactNode;
  /** Id do controle. Passe quando o filho não for um input simples. */
  htmlFor?: string;
  /** Chave em lib/copy/assistente.ts. Sem ela, o campo não tem assistente. */
  campo?: string;
}) {
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const { ativar } = useAssistente();
  const idAjuda = useId();
  const idErro = useId();

  return (
    <div
      className="scroll-mt-44 py-4 md:scroll-mt-0"
      data-assistente-zona
      onFocusCapture={campo ? () => ativar(campo) : undefined}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        {/* Label SEMPRE visível acima do campo — nunca placeholder como label */}
        <label htmlFor={htmlFor} className="text-sm font-medium text-petroleo">
          {label}
        </label>

        {ajuda ? (
          <button
            type="button"
            onClick={() => setAjudaAberta((v) => !v)}
            aria-expanded={ajudaAberta}
            aria-controls={idAjuda}
            // touch-target garante os 44px. O -mx-2 compensa o padding
            // para o texto continuar alinhado com a borda do campo.
            className="touch-target -mx-2 inline-flex items-center px-2 text-xs font-medium text-petroleo-suave underline decoration-border underline-offset-2 hover:text-petroleo"
          >
            {ajudaAberta ? "entendi" : "o que é isso?"}
          </button>
        ) : null}
      </div>

      {ajudaAberta && ajuda ? (
        <p id={idAjuda} className="mt-1 mb-2 text-sm text-petroleo-suave">
          {ajuda}
        </p>
      ) : null}

      <div className="mt-1.5">{children}</div>

      {/*
       * Erro com role="alert" para leitor de tela anunciar sem
       * roubar o foco do campo que o usuário está preenchendo.
       */}
      {erro ? (
        <p id={idErro} role="alert" className="mt-1.5 text-sm text-danger">
          {erro}
        </p>
      ) : null}

    </div>
  );
}

/** Classe base dos inputs. Altura de 44px é piso, não sugestão. */
export const inputClasses =
  "touch-target w-full rounded-[var(--radius-button)] border border-border bg-surface px-3 py-2.5 text-base text-petroleo placeholder:text-petroleo-suave/70";

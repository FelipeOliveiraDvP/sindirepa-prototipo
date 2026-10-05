"use client";

/**
 * Seção colapsável das entradas. Aberta por padrão (03-telas.md).
 *
 * Usa <details>/<summary> nativo em vez de estado em React: já vem
 * acessível por teclado, anunciado por leitor de tela, e funciona antes
 * do JS hidratar. Numa página que precisa ser interativa rápido em 4G,
 * o elemento nativo é a escolha mais barata que existe.
 */
export function Secao({
  titulo,
  descricao,
  children,
  abertaPorPadrao = true,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
  abertaPorPadrao?: boolean;
}) {
  return (
    <details
      open={abertaPorPadrao}
      className="group rounded-[var(--radius-card)] border border-border bg-surface"
    >
      <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 md:px-6">
        <span>
          <span className="font-display text-lg font-semibold text-petroleo">{titulo}</span>
          {descricao ? (
            <span className="mt-0.5 block text-sm text-petroleo-suave">{descricao}</span>
          ) : null}
        </span>
        <span
          aria-hidden
          className="shrink-0 text-petroleo-suave transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>

      <div className="border-t border-border px-4 pb-2 md:px-6">{children}</div>
    </details>
  );
}

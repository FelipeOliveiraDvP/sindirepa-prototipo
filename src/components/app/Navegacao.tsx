"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS, NAV } from "@/lib/copy/app";

/**
 * Navegação do produto. Barra inferior no mobile, coluna lateral no
 * desktop. Sem hambúrguer, sem menu escondido (03-telas.md).
 *
 * O usuário está em pé, no balcão, com a mão suja. Todo alvo tem 44px
 * (`--spacing-touch`) e nenhum fluxo exige duas mãos.
 *
 * A navegação NÃO renderiza com menos de dois destinos disponíveis:
 * uma barra com um item só é chrome puro, e chrome é espaço que o
 * resultado do cálculo não está ocupando.
 */

type IconeProps = { className?: string };

/**
 * SVG inline em vez de biblioteca de ícones: são três ícones, e o
 * projeto tem quatro dependências. `currentColor` também evita hex
 * fora de globals.css, que quebraria check-tokens.
 */
const ICONES: Record<string, (props: IconeProps) => React.ReactElement> = {
  "/painel": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className={className}>
      <path d="M3 17l5-5 4 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 21h18" strokeLinecap="round" />
    </svg>
  ),
  "/calculadora": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" strokeLinecap="round" />
    </svg>
  ),
  "/oficina": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className={className}>
      <path d="M3 21V9l9-6 9 6v12" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" strokeLinejoin="round" />
    </svg>
  ),
  "/benchmark": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className={className}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
    </svg>
  ),
  "/e-se": ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className={className}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.4.3.7.8.7 1.3V16h5.6v-.8c0-.5.3-1 .7-1.3A6 6 0 0 0 12 3Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function useDestinos() {
  const pathname = usePathname();
  const disponiveis = DESTINOS.filter((d) => d.disponivel);

  return {
    destinos: disponiveis,
    /** Prefixo, não igualdade: /oficina/equipe mantém "Oficina" ativo. */
    ehAtivo: (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    mostrar: disponiveis.length > 1,
  };
}

export function NavegacaoLateral() {
  const { destinos, ehAtivo, mostrar } = useDestinos();
  if (!mostrar) return null;

  return (
    <nav
      aria-label={NAV.rotulo}
      className="hidden shrink-0 border-r border-border bg-surface md:block md:w-56"
    >
      <ul className="sticky top-0 flex flex-col gap-1 p-3">
        {destinos.map((destino) => {
          const Icone = ICONES[destino.href];
          const ativo = ehAtivo(destino.href);
          return (
            <li key={destino.href}>
              <Link
                href={destino.href}
                aria-current={ativo ? "page" : undefined}
                className={`touch-target flex items-center gap-3 rounded-button px-3 py-2 text-sm transition-colors ${
                  ativo
                    ? "bg-surface-alt font-semibold text-primary"
                    : "text-text-muted hover:bg-surface-alt hover:text-text"
                }`}
              >
                {Icone ? <Icone className="size-5 shrink-0" /> : null}
                {destino.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function NavegacaoInferior() {
  const { destinos, ehAtivo, mostrar } = useDestinos();
  if (!mostrar) return null;

  return (
    <>
      {/* Reserva a altura da barra fixa para o conteúdo não terminar
          embaixo dela. Fica junto da barra de propósito: quem renderiza
          o obstáculo renderiza a compensação. */}
      <div aria-hidden className="h-16 md:hidden" />
      <nav
        aria-label={NAV.rotulo}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex">
          {destinos.map((destino) => {
            const Icone = ICONES[destino.href];
            const ativo = ehAtivo(destino.href);
            return (
              <li key={destino.href} className="flex-1">
                <Link
                  href={destino.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`touch-target flex flex-col items-center justify-center gap-1 px-1 py-2 text-xs transition-colors ${
                    ativo ? "font-semibold text-primary" : "text-text-muted"
                  }`}
                >
                  {Icone ? <Icone className="size-5" /> : null}
                  {destino.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

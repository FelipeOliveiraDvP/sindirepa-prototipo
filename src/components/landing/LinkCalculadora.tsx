"use client";

import Link from "next/link";
import type { Origem } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * Link para a calculadora, instrumentado.
 *
 * Existe porque a landing tem dois CTAs — herói e fechamento — e a
 * pergunta central é quantos visitantes atravessam para a calculadora,
 * e por qual das duas portas.
 *
 * É um wrapper de `<Link>` e nada mais: mantém o prefetch e a navegação
 * client-side do Next, e o custo de hidratação é de um handler. As
 * seções em volta continuam sendo HTML puro.
 */
export function LinkCalculadora({
  origem,
  className,
  children,
}: {
  origem: Origem;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href="/calculadora"
      className={className}
      onClick={() => track({ nome: "cta_calculadora_clicado", origem })}
    >
      {children}
    </Link>
  );
}

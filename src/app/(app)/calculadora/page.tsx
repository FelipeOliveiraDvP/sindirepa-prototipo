import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Calculadora } from "@/components/calculator/Calculadora";
import { SUBTITULO, TITULO } from "@/lib/copy/calculadora";
import { usuarioAtual } from "@/lib/data/supabase-server";

export const metadata: Metadata = {
  title: TITULO,
  description: SUBTITULO,
  // Exige conta: não faz sentido no índice de busca.
  robots: { index: false, follow: false },
};

/**
 * /calculadora — EXIGE CONTA desde a Leva 3.
 *
 * Reversão consciente do "sem login obrigatório" das levas anteriores;
 * o registro está em CLAUDE.md e em docs/saas/03-telas.md.
 *
 * O que continua aberto é a prévia de três campos no herói da landing.
 * Ela é a única prova de valor antes de pedir algo — sem ela, a landing
 * só promete.
 *
 * Manda para /criar-conta, não /entrar: quem chega aqui sem sessão é,
 * na esmagadora maioria, alguém que nunca teve conta. Quem já tem tem o
 * link de entrar dentro do cadastro, a um toque.
 */
export default async function CalculadoraPage() {
  if (!(await usuarioAtual())) redirect("/criar-conta");

  return <Calculadora />;
}

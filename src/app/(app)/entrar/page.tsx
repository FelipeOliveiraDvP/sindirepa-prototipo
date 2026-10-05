import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ENTRAR } from "@/lib/copy/conta";
import { usuarioAtual } from "@/lib/data/supabase-server";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = {
  title: ENTRAR.titulo,
  description: ENTRAR.subtitulo,
  // Tela de conta não rankeia e não deve aparecer em busca.
  robots: { index: false, follow: false },
};

export default async function EntrarPage() {
  // Quem já tem sessão não tem o que fazer aqui.
  if (await usuarioAtual()) redirect("/calculadora");

  return (
    <div className="mx-auto max-w-sm px-4 py-10 md:py-16">
      <h1 className="font-display text-2xl font-bold text-petroleo">{ENTRAR.titulo}</h1>
      <p className="mt-2 mb-6 text-base text-petroleo-suave">{ENTRAR.subtitulo}</p>
      <FormularioEntrar />
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CRIAR_CONTA } from "@/lib/copy/conta";
import { usuarioAtual } from "@/lib/data/supabase-server";
import { FormularioCriarConta } from "./FormularioCriarConta";

export const metadata: Metadata = {
  title: CRIAR_CONTA.titulo,
  description: CRIAR_CONTA.subtitulo,
  robots: { index: false, follow: false },
};

export default async function CriarContaPage() {
  if (await usuarioAtual()) redirect("/calculadora");

  return (
    <div className="mx-auto max-w-sm px-4 py-10 md:py-16">
      <h1 className="font-display text-2xl font-bold text-petroleo">{CRIAR_CONTA.titulo}</h1>
      <p className="mt-2 mb-6 text-base text-petroleo-suave">{CRIAR_CONTA.subtitulo}</p>
      <FormularioCriarConta />
    </div>
  );
}

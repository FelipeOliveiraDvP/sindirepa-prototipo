import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BENCHMARK } from "@/lib/copy/painel";
import { carregarConfiguracao, carregarHistorico } from "@/lib/data/configuracao";
import { criarClienteDeServidor } from "@/lib/data/supabase-server";
import { agregadoPadrao } from "@/lib/pricing/aggregate";
import { ehSegmento, SEGMENTO_PADRAO } from "@/lib/pricing/segmento";
import { BenchmarkCliente } from "./BenchmarkCliente";

export const metadata: Metadata = {
  title: BENCHMARK.titulo,
  robots: { index: false, follow: false },
};

/**
 * /benchmark — página própria de novo na Leva 4.
 *
 * Na Leva 3 isto tinha virado um bloco dentro de `/painel`; cresceu
 * grande demais para caber ali sem esmagar o resto da tela
 * (docs/saas/03-telas.md, seção 5).
 *
 * Mesmo padrão de `/painel`: cliente de SESSÃO, então RLS decide o que
 * aparece — nunca service role numa rota que um usuário logado visita.
 */
export default async function BenchmarkPage() {
  const db = await criarClienteDeServidor();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) redirect("/entrar");

  const { data: vinculo } = await db
    .from("usuarios")
    .select("oficina_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!vinculo?.oficina_id) redirect("/calculadora");

  const { data: oficina } = await db
    .from("oficinas")
    .select("cidade, segmento")
    .eq("id", vinculo.oficina_id)
    .maybeSingle();

  const segmento = ehSegmento(oficina?.segmento) ? oficina.segmento : SEGMENTO_PADRAO;
  const salva = await carregarConfiguracao(db, vinculo.oficina_id);
  // A série temporal veio do painel na Leva 4.1: evolução só significa
  // alguma coisa contra a referência do grupo, que mora aqui.
  const historico = await carregarHistorico(db, vinculo.oficina_id);

  return (
    <BenchmarkCliente
      entrada={salva?.entrada ?? agregadoPadrao(segmento)}
      cidade={oficina?.cidade ?? ""}
      historico={historico}
    />
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SIMULADOR } from "@/lib/copy/simulador";
import { carregarConfiguracao } from "@/lib/data/configuracao";
import { criarClienteDeServidor } from "@/lib/data/supabase-server";
import { agregadoPadrao } from "@/lib/pricing/aggregate";
import { ehSegmento, SEGMENTO_PADRAO } from "@/lib/pricing/segmento";
import { EseCliente } from "./EseCliente";

export const metadata: Metadata = {
  title: SIMULADOR.titulo,
  description: SIMULADOR.subtitulo,
  robots: { index: false, follow: false },
};

/**
 * /e-se — simulador. Mesmo padrão de /painel e /benchmark: cliente de
 * SESSÃO, RLS decide o que aparece.
 *
 * Não depende de nenhum dado externo — só da configuração que a própria
 * oficina já salvou (docs/saas/03-telas.md, seção 7).
 */
export default async function EsePage() {
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
    .select("segmento")
    .eq("id", vinculo.oficina_id)
    .maybeSingle();

  const segmento = ehSegmento(oficina?.segmento) ? oficina.segmento : SEGMENTO_PADRAO;
  const salva = await carregarConfiguracao(db, vinculo.oficina_id);

  return <EseCliente entrada={salva?.entrada ?? agregadoPadrao(segmento)} />;
}

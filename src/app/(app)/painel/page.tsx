import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PAINEL } from "@/lib/copy/painel";
import { carregarConfiguracao } from "@/lib/data/configuracao";
import { criarClienteDeServidor } from "@/lib/data/supabase-server";
import { agregadoPadrao } from "@/lib/pricing/aggregate";
import { ehSegmento, SEGMENTO_PADRAO } from "@/lib/pricing/segmento";
import { PainelCliente } from "./PainelCliente";

export const metadata: Metadata = {
  title: PAINEL.titulo,
  description: PAINEL.subtitulo,
  robots: { index: false, follow: false },
};

/**
 * /painel — destino de quem entra logado.
 *
 * Toda leitura usa o cliente de SESSÃO, então as policies de RLS
 * decidem o que aparece. Se uma policy estiver errada, a página falha
 * em vez de mostrar dado de outra oficina.
 */
export default async function PainelPage() {
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
    .select("nome, cidade, segmento")
    .eq("id", vinculo.oficina_id)
    .maybeSingle();

  const segmento = ehSegmento(oficina?.segmento) ? oficina.segmento : SEGMENTO_PADRAO;
  const salva = await carregarConfiguracao(db, vinculo.oficina_id);

  return (
    <PainelCliente
      entrada={salva?.entrada ?? agregadoPadrao(segmento)}
      cidade={oficina?.cidade ?? ""}
      nomeOficina={oficina?.nome ?? null}
    />
  );
}

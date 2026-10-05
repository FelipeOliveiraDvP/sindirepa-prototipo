import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OFICINA } from "@/lib/copy/conta";
import { carregarConfiguracao } from "@/lib/data/configuracao";
import { criarClienteDeServidor } from "@/lib/data/supabase-server";
import { agregadoPadrao } from "@/lib/pricing/aggregate";
import { ehSegmento, SEGMENTO_PADRAO } from "@/lib/pricing/segmento";
import { OficinaCliente } from "./OficinaCliente";

export const metadata: Metadata = {
  title: OFICINA.titulo,
  description: OFICINA.subtitulo,
  robots: { index: false, follow: false },
};

/**
 * Configuração da oficina. Exige sessão.
 *
 * A leitura usa o cliente de SESSÃO, então as policies de RLS decidem o
 * que aparece. Se a policy estiver errada, a página falha em vez de
 * mostrar dado de outra oficina.
 */
export default async function OficinaPage() {
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
    .select("nome, cnpj, cidade, segmento")
    .eq("id", vinculo.oficina_id)
    .maybeSingle();

  const segmento = ehSegmento(oficina?.segmento) ? oficina.segmento : SEGMENTO_PADRAO;
  const salva = await carregarConfiguracao(db, vinculo.oficina_id);

  // Sem configuração salva ainda: abre nos padrões, nunca em zeros.
  // Mostrar R$ 0,00 parece um cálculo e ensina a coisa errada.
  const inicial = salva?.entrada ?? agregadoPadrao(segmento);

  return (
    <OficinaCliente
      inicial={inicial}
      dadosOficina={{
        nome: oficina?.nome ?? "",
        cnpj: oficina?.cnpj ?? "",
        cidade: oficina?.cidade ?? "",
      }}
    />
  );
}

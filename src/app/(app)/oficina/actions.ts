"use server";

import { revalidatePath } from "next/cache";
import { salvarConfiguracao } from "@/lib/data/configuracao";
import { criarClienteDeServidor } from "@/lib/data/supabase-server";
import type { EntradaAgregada } from "@/lib/pricing/aggregate";
import { ehSegmento } from "@/lib/pricing/segmento";

/**
 * Salva a configuração da oficina.
 *
 * A oficina NÃO vem do cliente: sai do vínculo do usuário logado. Aceitar
 * um `oficinaId` do formulário deixaria alguém tentar escrever na oficina
 * alheia — o RLS barraria, mas depender de uma única linha de defesa é o
 * mesmo que não ter defesa.
 */
export type ResultadoSalvar = { ok: true } | { ok: false; motivo: string };

export type DadosOficinaEntrada = { nome: string; cnpj: string; cidade: string };

export async function salvar(
  entrada: EntradaAgregada,
  dados?: DadosOficinaEntrada,
): Promise<ResultadoSalvar> {
  if (!entrada || !ehSegmento(entrada.segmento)) {
    return { ok: false, motivo: "entrada_invalida" };
  }

  const db = await criarClienteDeServidor();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) return { ok: false, motivo: "sem_sessao" };

  const { data: vinculo } = await db
    .from("usuarios")
    .select("oficina_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!vinculo?.oficina_id) return { ok: false, motivo: "sem_oficina" };

  try {
    if (dados) {
      const { error } = await db
        .from("oficinas")
        .update({
          nome: dados.nome.trim() || "Minha oficina",
          cnpj: dados.cnpj.trim() || null,
          cidade: dados.cidade.trim() || null,
        })
        .eq("id", vinculo.oficina_id);
      if (error) throw new Error(error.message);
    }

    await salvarConfiguracao(db, vinculo.oficina_id, entrada);
  } catch (erro) {
    console.error("[salvar-configuracao]", erro instanceof Error ? erro.message : erro);
    return { ok: false, motivo: "falha_gravacao" };
  }

  revalidatePath("/oficina");
  revalidatePath("/calculadora");
  return { ok: true };
}

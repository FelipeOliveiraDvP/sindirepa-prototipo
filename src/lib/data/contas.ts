import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Segmento } from "@/lib/pricing/segmento";
import { ArmazenamentoIndisponivelError } from "./erros";
import { supabase } from "./supabase";

/**
 * Criação de conta: usuário de autenticação + oficina + vínculo.
 *
 * ═══ POR QUE ISTO USA SERVICE ROLE ═══
 * `oficinas` não tem policy de INSERT (migration 400), de propósito: se
 * o cliente pudesse criar oficina solta, a base encheria de registro sem
 * dono. As três escritas abaixo são uma transação lógica — usuário,
 * oficina e vínculo — e precisam acontecer juntas ou não acontecer.
 *
 * A partir daqui, toda leitura e escrita do usuário passa pelo cliente
 * de sessão (supabase-server.ts) e pelas policies. A service role só
 * aparece neste nascimento.
 */

export type NovaConta = {
  nome: string;
  email: string;
  senha: string;
  nomeOficina: string;
  cidade: string;
  segmento: Segmento;
};

export class EmailJaCadastradoError extends Error {
  constructor() {
    super("E-mail já cadastrado.");
    this.name = "EmailJaCadastradoError";
  }
}

/** Cliente admin. Separado do `supabase` compartilhado por precisar da API de auth. */
function admin() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ArmazenamentoIndisponivelError();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function criarConta(dados: NovaConta): Promise<{ usuarioId: string; oficinaId: string }> {
  const db = admin();

  // 1. Identidade. A senha nunca passa por tabela nossa — fica inteira
  //    no schema auth do Supabase, com o hash que ele gerencia.
  const { data: criado, error: erroAuth } = await db.auth.admin.createUser({
    email: dados.email,
    password: dados.senha,
    email_confirm: true,
    user_metadata: { nome: dados.nome },
  });

  if (erroAuth) {
    if (/already|registered|exists/i.test(erroAuth.message)) throw new EmailJaCadastradoError();
    throw new Error(`Falha ao criar usuário: ${erroAuth.message}`);
  }

  const usuarioId = criado.user.id;

  // 2. Oficina.
  const { data: oficina, error: erroOficina } = await db
    .from("oficinas")
    .insert({
      nome: dados.nomeOficina,
      cidade: dados.cidade || null,
      segmento: dados.segmento,
    })
    .select("id")
    .single();

  if (erroOficina || !oficina) {
    // Sem a oficina, o usuário de auth é órfão: não consegue ler nada
    // (toda policy passa por oficina_do_usuario) e bloqueia o e-mail
    // para uma nova tentativa. Desfaz.
    await db.auth.admin.deleteUser(usuarioId);
    throw new Error(`Falha ao criar oficina: ${erroOficina?.message}`);
  }

  // 3. Vínculo.
  const { error: erroVinculo } = await db.from("usuarios").insert({
    id: usuarioId,
    oficina_id: oficina.id,
    nome: dados.nome,
    papel: "dono",
  });

  if (erroVinculo) {
    await db.from("oficinas").delete().eq("id", oficina.id);
    await db.auth.admin.deleteUser(usuarioId);
    throw new Error(`Falha ao vincular usuário à oficina: ${erroVinculo.message}`);
  }

  return { usuarioId, oficinaId: oficina.id };
}

/** Oficina do usuário logado. Usa a service role só para leitura de vínculo. */
export async function oficinaDoUsuario(usuarioId: string): Promise<string | null> {
  if (!supabase) throw new ArmazenamentoIndisponivelError();

  const { data } = await supabase
    .from("usuarios")
    .select("oficina_id")
    .eq("id", usuarioId)
    .maybeSingle();

  return data?.oficina_id ?? null;
}

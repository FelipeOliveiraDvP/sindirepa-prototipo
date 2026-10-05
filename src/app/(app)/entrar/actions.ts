"use server";

import { redirect } from "next/navigation";
import { criarClienteDeServidor } from "@/lib/data/supabase-server";
import type { EstadoEntrar } from "./estado";

/**
 * Login por e-mail e senha. Sem login social (03-telas.md).
 *
 * ⚠️ A mensagem de erro NÃO distingue "e-mail não existe" de "senha
 * errada". Distinguir entrega ao atacante uma lista de e-mails
 * cadastrados, e não ajuda o usuário legítimo — que erra os dois com a
 * mesma frequência.
 *
 * ⚠️ Nada aqui loga e-mail nem senha, nem em caso de falha.
 */
export async function entrar(
  _anterior: EstadoEntrar,
  formData: FormData,
): Promise<EstadoEntrar> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) return { estado: "erro_credenciais" };

  try {
    const supabase = await criarClienteDeServidor();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return { estado: "erro_credenciais" };
  } catch (erro) {
    console.error("[entrar]", erro instanceof Error ? erro.message : erro);
    return { estado: "erro_envio" };
  }

  // Fora do try: redirect() sinaliza por exceção, e engoli-la no catch
  // transformaria um login bem-sucedido em "erro de envio".
  //
  // Quem ENTRA já tem configuração salva e quer ver os números — vai
  // para o painel. Quem acabou de CRIAR conta ainda tem campo em
  // branco, e o cadastro manda para a calculadora.
  redirect("/painel");
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteDeServidor();
  await supabase.auth.signOut();
  redirect("/");
}

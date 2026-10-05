"use server";

import { criarConta, EmailJaCadastradoError } from "@/lib/data/contas";
import { criarClienteDeServidor } from "@/lib/data/supabase-server";
import { ehSegmento, SEGMENTO_PADRAO } from "@/lib/pricing/segmento";
import { SENHA_MINIMA, type EstadoCriarConta } from "./estado";

/**
 * Criação de conta. Pede o mínimo: nome, e-mail, senha, nome da oficina
 * e cidade (03-telas.md).
 *
 * O SEGMENTO NÃO É PERGUNTADO AQUI. O usuário já escolheu no modo
 * guiado, e ele viaja num campo oculto. Perguntar duas vezes a mesma
 * coisa é o tipo de atrito que faz o dono de oficina desistir — cada
 * campo a mais é uma oficina a menos usando.
 *
 * ⚠️ Nenhum log carrega e-mail ou senha.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registrarConta(
  _anterior: EstadoCriarConta,
  formData: FormData,
): Promise<EstadoCriarConta> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const nomeOficina = String(formData.get("nomeOficina") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const segmentoBruto = String(formData.get("segmento") ?? "");
  const segmento = ehSegmento(segmentoBruto) ? segmentoBruto : SEGMENTO_PADRAO;

  // Revalidado no servidor: a checagem do cliente é conveniência, não
  // garantia — o formulário é postável sem JS.
  if (!nome) return { estado: "erro_nome" };
  if (!EMAIL.test(email)) return { estado: "erro_email" };
  if (senha.length < SENHA_MINIMA) return { estado: "erro_senha" };
  if (!nomeOficina) return { estado: "erro_oficina" };

  try {
    await criarConta({ nome, email, senha, nomeOficina, cidade, segmento });
  } catch (erro) {
    if (erro instanceof EmailJaCadastradoError) return { estado: "erro_email_usado" };
    console.error("[criar-conta]", erro instanceof Error ? erro.message : erro);
    return { estado: "erro_envio" };
  }

  // Já cria a sessão: mandar o usuário para a tela de login logo depois
  // de ele digitar a senha é atrito puro.
  try {
    const supabase = await criarClienteDeServidor();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      // Conta existe, sessão não. Recuperável pelo login.
      console.error("[criar-conta] sessão não iniciada:", error.message);
      return { estado: "erro_envio" };
    }
  } catch (erro) {
    console.error("[criar-conta]", erro instanceof Error ? erro.message : erro);
    return { estado: "erro_envio" };
  }

  // Sem redirect aqui: quem redireciona é o cliente, DEPOIS de migrar o
  // rascunho da calculadora para a conta. Redirecionar do servidor
  // perderia o que o usuário preencheu — e fazer o cara digitar duas
  // vezes é perder o cara (03-telas.md).
  return { estado: "ok" };
}

"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase do navegador.
 *
 * Usa a chave PÚBLICA (anon/publishable), que é feita para isso: ela
 * respeita RLS, e sozinha não lê nada — a migration 300 revogou os
 * grants de `anon`, e a 400 só concede a `authenticated` dentro da
 * própria oficina.
 *
 * Existe para o formulário de login: a troca de e-mail e senha por
 * sessão acontece aqui e os cookies são gravados pelo próprio SDK.
 */
export function criarClienteDeNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

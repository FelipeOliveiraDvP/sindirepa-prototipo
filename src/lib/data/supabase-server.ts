import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente Supabase do lado do servidor, ligado à sessão do usuário.
 *
 * ═══ POR QUE ESTE NÃO É O supabase.ts ═══
 * `supabase.ts` usa a service role: ignora RLS e serve para gravação
 * anônima e administrativa. ESTE usa a chave pública e carrega a sessão
 * do usuário, então TUDO que ele lê ou escreve passa pelas policies de
 * RLS da migration 400.
 *
 * A distinção é a espinha da segurança do produto: dado de oficina é
 * lido com a identidade de quem pediu, nunca com privilégio total. Se
 * uma policy estiver errada, este cliente falha — e falhar é o
 * comportamento certo. Usar a service role para ler dado de usuário
 * transformaria qualquer bug de aplicação em vazamento entre oficinas.
 *
 * Não leva `server-only` porque `next/headers` já é exclusivo de
 * servidor: importar em componente de cliente falha por si.
 */
export async function criarClienteDeServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component não pode escrever cookie. O middleware já
            // renovou a sessão nesta requisição, então ignorar aqui é
            // seguro — é o padrão recomendado pelo @supabase/ssr.
          }
        },
      },
    },
  );
}

/** Usuário da sessão, ou null. Nunca lança: rota pública também chama. */
export async function usuarioAtual() {
  const supabase = await criarClienteDeServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

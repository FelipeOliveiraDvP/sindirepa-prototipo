import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessão do Supabase a cada navegação.
 *
 * ⚠️ CHAMA-SE `proxy`, NÃO `middleware`. O Next 16 renomeou a convenção
 * (node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md); a
 * funcionalidade é a mesma, mas `middleware.ts` emite aviso de
 * depreciação e vai sair. É exatamente o tipo de quebra que CLAUDE.md
 * manda conferir no guia local antes de escrever código de framework.
 *
 * POR QUE PRECISA EXISTIR: o token de acesso expira em uma hora. Sem
 * renovação no servidor, o usuário é deslogado no meio do uso — e o
 * público daqui está com a mão suja, em pé no balcão. Ser jogado para
 * fora do cadastro no meio do preenchimento é motivo para abandonar a
 * ferramenta e não voltar.
 *
 * ⚠️ NÃO tem redirecionamento de rota aqui. A proteção de acesso é do
 * RLS e das checagens de página; middleware que decide autorização vira
 * a única linha de defesa, e uma linha de defesa é nenhuma.
 */
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          resposta = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  /**
   * getUser() valida o token contra o servidor do Supabase. getSession()
   * só lê o cookie e confia nele — não serve para decisão de acesso.
   *
   * A própria doc do Next avisa que proxy não é solução de autorização:
   * ele renova sessão e nada mais. Quem autoriza é o RLS no banco e a
   * checagem em cada página.
   */
  await supabase.auth.getUser();

  return resposta;
}

export const config = {
  matcher: [
    /**
     * Tudo, menos estático e imagem.
     *
     * A landing (`/`) é SSG e não tem sessão, mas passar por aqui não
     * a torna dinâmica: o middleware só renova cookie, não altera o
     * corpo da resposta.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

/**
 * ⚠️ BARREIRA DE BUILD, NÃO COMENTÁRIO.
 *
 * `server-only` faz o build FALHAR se este módulo entrar na árvore
 * de import de qualquer componente de cliente. A service role dá
 * acesso total ao banco e ignora RLS — um import errado, feito por
 * distração daqui a seis meses, vazaria o banco inteiro.
 *
 * Disciplina não sobrevive a prazo. Erro de compilação sobrevive.
 */
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase de servidor.
 *
 * Isolado aqui porque trocar de banco não pode tocar em componente
 * (CLAUDE.md). Quem consome dados fala com os módulos de src/lib/data/,
 * nunca com este arquivo direto.
 *
 * As variáveis NÃO têm prefixo NEXT_PUBLIC_ de propósito: a service role
 * ignora RLS e não pode vazar para o bundle do navegador. Sem o prefixo,
 * o Next não as inclui na build do cliente, e qualquer import acidental
 * deste módulo em componente de cliente quebra na hora, que é o
 * comportamento desejado.
 */

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Normaliza a URL do projeto.
 *
 * POR QUE ISTO EXISTE: o painel do Supabase mostra tanto a Project URL
 * quanto o endpoint REST (`.../rest/v1/`), e colar o segundo é um erro
 * fácil — o `supabase-js` acrescenta `/rest/v1` por conta própria, e o
 * resultado vira `/rest/v1/rest/v1`. A mensagem que volta é "Invalid
 * path specified in request URL", que não aponta para a causa.
 *
 * Aconteceu na configuração deste projeto. Custou uma rodada de
 * diagnóstico, e em produção custaria uma gravação perdida em silêncio,
 * porque o registro de cálculo anônimo é fire-and-forget de propósito.
 */
function normalizarUrl(bruta: string | undefined): string | undefined {
  if (!bruta) return undefined;
  return bruta.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
}

const url = normalizarUrl(process.env.SUPABASE_URL);

/**
 * `null` quando o ambiente não está configurado.
 *
 * Devolver null em vez de lançar na importação é o que mantém `next
 * build` e `npm run dev` funcionando sem credencial — a landing é
 * estática e não depende do banco para renderizar. Quem escreve decide o
 * que fazer com a ausência, e a decisão está em leads.ts: erro visível,
 * nunca sucesso silencioso.
 */
export const supabase: SupabaseClient | null =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        // Sem sessão: este cliente é de servidor e não representa usuário.
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

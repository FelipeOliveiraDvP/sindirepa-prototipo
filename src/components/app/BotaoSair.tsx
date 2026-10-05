"use client";

import { sair } from "@/app/(app)/entrar/actions";
import { CHAVE_RASCUNHO } from "@/components/calculator/useCalculadora";
import { OFICINA } from "@/lib/copy/conta";

/**
 * Sair — e limpar o rascunho local.
 *
 * `useCalculadora` deliberadamente NÃO apaga `calc:draft` depois de
 * usá-lo: quem volta da landing precisa achar os números de novo. O
 * comentário lá diz "quem limpa é o logout", e este é o logout.
 *
 * Sem isso, os números de uma oficina ficariam no sessionStorage para a
 * próxima pessoa que usasse o mesmo navegador — o caso real do balcão
 * compartilhado.
 */
export function BotaoSair() {
  return (
    <form
      action={sair}
      onSubmit={() => {
        try {
          window.sessionStorage.removeItem(CHAVE_RASCUNHO);
        } catch {
          // storage bloqueado: não há rascunho para limpar
        }
      }}
    >
      <button
        type="submit"
        className="touch-target rounded-button px-3 text-sm text-petroleo-suave hover:text-petroleo"
      >
        {OFICINA.sair}
      </button>
    </form>
  );
}

"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Guarda se o usuário já passou pelo modo guiado.
 *
 * ═══ POR QUE O PADRÃO É A TELA COMPLETA ═══
 * O snapshot do servidor diz "já viu", ou seja, o HTML entregue é
 * sempre a tela completa. Duas razões:
 *
 * 1. É o fallback correto sem JavaScript. A tela completa contém todos
 *    os campos e calcula; o modo guiado depende de estado no cliente.
 *    Entregar o wizard no HTML deixaria quem está num 4G ruim com meia
 *    ferramenta.
 * 2. Errar para "completa" mostra a ferramenta inteira por um instante.
 *    Errar para "guiado" esconderia campos de quem já sabe usar.
 *
 * A troca acontece na hidratação, num único re-render.
 */

const CHAVE = "calc:guiado-concluido";

const ouvintes = new Set<() => void>();

function inscrever(notificar: () => void) {
  ouvintes.add(notificar);
  return () => {
    ouvintes.delete(notificar);
  };
}

function jaViuNoNavegador(): boolean {
  try {
    return window.localStorage.getItem(CHAVE) === "1";
  } catch {
    // Storage bloqueado: trata como já visto. Repetir o wizard a cada
    // visita seria pior que nunca mostrá-lo.
    return true;
  }
}

function gravar(valor: boolean) {
  try {
    if (valor) window.localStorage.setItem(CHAVE, "1");
    else window.localStorage.removeItem(CHAVE);
  } catch {
    // Vale para esta sessão mesmo sem persistir.
  }
  ouvintes.forEach((notificar) => notificar());
}

export type ModoCalculadora = "guiado" | "completo";

export function useModoCalculadora() {
  const jaViu = useSyncExternalStore(
    inscrever,
    jaViuNoNavegador,
    () => true,
  );

  const concluirGuiado = useCallback(() => gravar(true), []);
  const refazerGuiado = useCallback(() => gravar(false), []);

  return {
    modo: (jaViu ? "completo" : "guiado") satisfies ModoCalculadora as ModoCalculadora,
    concluirGuiado,
    refazerGuiado,
  };
}

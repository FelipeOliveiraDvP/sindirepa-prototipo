"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { criarCopyCalculadora, type CopyCalculadora } from "@/lib/copy/calculadora";
import { criarTermos, type Termos } from "@/lib/copy/common";
import type { UnitLabel } from "@/lib/pricing/config";
import {
  definicaoDoSegmento,
  ehSegmento,
  lexicoDoSegmento,
  SEGMENTO_PADRAO,
  type DefinicaoSegmento,
  type Lexico,
  type Segmento,
} from "@/lib/pricing/segmento";

/**
 * O segmento da oficina, disponível para todo o grupo `(app)`.
 *
 * POR QUE EXISTE: até a Leva 1, a unidade de trabalho era constante de
 * módulo, resolvida em tempo de import. Com funilaria ativa isso não se
 * sustenta — ela opera em UT, mecânica em hora (docs/geral/01-contexto.md).
 *
 * As landings continuam estáticas: são SSG, não têm usuário e portanto
 * não têm segmento. Só o produto é dinâmico.
 *
 * ⚠️ Este provider NÃO calcula nada. Ele resolve vocabulário. A
 * aritmética é idêntica nos dois segmentos e vive em lib/pricing.
 */

const CHAVE_SEGMENTO = "calc:segmento";

/**
 * O segmento vive no localStorage, que é estado externo ao React — daí
 * `useSyncExternalStore` em vez de ler num efeito e chamar setState.
 * Ler no efeito causaria render em cascata e divergiria do HTML do
 * servidor; esta API existe exatamente para esse caso e ainda entrega
 * sincronia entre abas de graça.
 */
const ouvintes = new Set<() => void>();

function inscrever(notificar: () => void) {
  ouvintes.add(notificar);
  // Trocar o segmento numa aba precisa refletir nas outras: o
  // vocabulário da tela inteira depende dele.
  window.addEventListener("storage", notificar);
  return () => {
    ouvintes.delete(notificar);
    window.removeEventListener("storage", notificar);
  };
}

function lerDoNavegador(): Segmento | null {
  try {
    const salvo = window.localStorage.getItem(CHAVE_SEGMENTO);
    return ehSegmento(salvo) ? salvo : null;
  } catch {
    // Storage bloqueado. Segmento errado é inconveniente — nunca motivo
    // para derrubar a calculadora.
    return null;
  }
}

function gravarNoNavegador(segmento: Segmento) {
  try {
    window.localStorage.setItem(CHAVE_SEGMENTO, segmento);
  } catch {
    // A escolha continua valendo para esta sessão, só não persiste.
  }
  ouvintes.forEach((notificar) => notificar());
}

type ContextoSegmento = {
  segmento: Segmento;
  definirSegmento: (segmento: Segmento) => void;
  definicao: DefinicaoSegmento;
  lexico: Lexico;
  unit: UnitLabel;
  copy: CopyCalculadora;
  termos: Termos;
};

const Contexto = createContext<ContextoSegmento | null>(null);

export function SegmentoProvider({
  children,
  /**
   * Valor do servidor. Hoje é sempre o padrão; na Fase 4 passa a vir da
   * configuração da conta, e aí o usuário logado não vê o vocabulário
   * de mecânica piscar antes do dele.
   */
  inicial = SEGMENTO_PADRAO,
}: Readonly<{ children: React.ReactNode; inicial?: Segmento }>) {
  const segmento = useSyncExternalStore(
    inscrever,
    () => lerDoNavegador() ?? inicial,
    () => inicial,
  );

  const definirSegmento = useCallback((novo: Segmento) => {
    gravarNoNavegador(novo);
  }, []);

  const valor = useMemo<ContextoSegmento>(() => {
    const lexico = lexicoDoSegmento(segmento);
    return {
      segmento,
      definirSegmento,
      definicao: definicaoDoSegmento(segmento),
      lexico,
      unit: lexico.unit,
      copy: criarCopyCalculadora(lexico),
      termos: criarTermos(lexico),
    };
  }, [segmento, definirSegmento]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSegmento(): ContextoSegmento {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error("useSegmento precisa estar dentro de <SegmentoProvider>.");
  }
  return ctx;
}

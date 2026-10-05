"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { criarAssistente, ASSISTENTE_UI, type AjudaDeCampo } from "@/lib/copy/assistente";

/**
 * Assistente de campo.
 *
 * Responde "onde eu acho esse número" — a pergunta que trava o dono de
 * oficina. O "o que é isso?" de Campo.tsx responde outra coisa: o que o
 * campo significa. Os dois convivem.
 *
 * ═══ DOIS ARRANJOS, UM CONTEÚDO ═══
 *   desktop: coluna sticky ao lado, acompanha a rolagem
 *   mobile:  painel único, fixo no topo da viewport, SEM exigir toque
 *
 * Em 375px não existe "ao lado", e esconder atrás de um toque derrota o
 * propósito: quem mais precisa de ajuda é justamente quem menos explora
 * a interface. No mobile é um painel só (`AssistenteFixoMobile`, montado
 * uma vez em `(app)/layout.tsx`) — não um cartão por campo: assim ele
 * acompanha a rolagem em vez de sumir com o campo que o disparou, e cada
 * campo pode ter seu próprio texto sem multiplicar cartões na tela.
 *
 * ═══ COMO O CAMPO ATIVO É DETECTADO E LARGADO ═══
 * `Campo.tsx` põe `onFocusCapture` no envelope. Focar o input de dentro
 * — por toque, clique ou Tab — borbulha até lá e chama `ativar(campo)`.
 * Nenhuma mudança em fields.tsx foi necessária, e funciona igual para
 * teclado e para dedo.
 *
 * Sair do campo (tocar fora, focar outro elemento que não seja campo nem
 * painel do assistente) limpa `ativo` — ver o listener de `focusout` em
 * `AssistenteProvider`. Todo campo e todo painel do assistente carrega
 * `data-assistente-zona`; é o que diferencia "saiu para outro campo" (não
 * limpa) de "saiu da área do assistente" (limpa).
 */

type ContextoAssistente = {
  ativo: string | null;
  ativar: (campo: string) => void;
};

const Contexto = createContext<ContextoAssistente | null>(null);

export function AssistenteProvider({ children }: { children: React.ReactNode }) {
  const [ativo, setAtivo] = useState<string | null>(null);
  const ativar = useCallback((campo: string) => setAtivo(campo), []);
  const valor = useMemo(() => ({ ativo, ativar }), [ativo, ativar]);

  /**
   * Fecha o assistente quando o foco sai de todo campo e de todo painel
   * do assistente — sem isso `ativo` fica preso no último campo tocado
   * para sempre. `focusout` (ao contrário de `blur`) borbulha, então um
   * único listener no documento cobre qualquer campo da tela.
   *
   * O `setTimeout` é necessário: no momento do `focusout`, o navegador
   * ainda não decidiu o próximo `document.activeElement` (pode ser outro
   * campo, um botão dentro do próprio painel, ou nada). Espera o foco
   * assentar e só então decide se o novo elemento está "dentro" de algum
   * campo ou painel (marcado com `data-assistente-zona`).
   */
  useEffect(() => {
    function aoPerderFoco() {
      window.setTimeout(() => {
        const el = document.activeElement;
        if (!(el instanceof HTMLElement) || !el.closest("[data-assistente-zona]")) {
          setAtivo(null);
        }
      }, 0);
    }
    document.addEventListener("focusout", aoPerderFoco, true);
    return () => document.removeEventListener("focusout", aoPerderFoco, true);
  }, []);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Fora do provider devolve um objeto inerte: o assistente é opcional. */
export function useAssistente(): ContextoAssistente {
  return useContext(Contexto) ?? { ativo: null, ativar: () => {} };
}

/** Ajuda do campo, já no vocabulário do segmento. */
export function useAjudaDoCampo(campo: string | null): AjudaDeCampo | null {
  const { lexico } = useSegmento();
  const assistente = useMemo(() => criarAssistente(lexico), [lexico]);
  if (!campo) return null;
  return (assistente as Record<string, AjudaDeCampo>)[campo] ?? null;
}

/**
 * ═══ VISUAL — Leva 4.1 ═══
 * Até então, os dois cartões usavam a mesma borda/fundo neutros de
 * qualquer outro card da tela — "ninguém prestava atenção" (Felipe).
 * Ganham um acento lateral (`border-l-4 border-l-info`, o mesmo azul
 * neutro introduzido para elementos informativos) e um rótulo com
 * ícone no topo, para se identificarem como um elemento à parte — sem
 * usar `success`/`danger`/`primary`, que agora carregam outros
 * significados (Leva 4.1, `docs/geral/05-marca.md`).
 */

/** Coluna do desktop. Escondida no mobile — lá o cartão vive junto do campo. */
export function AssistenteLateral() {
  const { ativo } = useAssistente();
  const ajuda = useAjudaDoCampo(ativo);

  return (
    <aside
      aria-live="polite"
      data-assistente-zona
      className="hidden md:sticky md:top-6 md:block"
    >
      <div className="rounded-card border border-border border-l-4 border-l-info bg-surface p-4">
        <RotuloAssistente />
        {ajuda ? (
          <ConteudoDaAjuda ajuda={ajuda} />
        ) : (
          <p className="mt-2 text-sm text-petroleo-suave">{ASSISTENTE_UI.ocioso}</p>
        )}
      </div>
    </aside>
  );
}

/**
 * Painel do mobile. Um único, montado uma vez em `(app)/layout.tsx`, fixo
 * no topo da viewport — não um card por campo (era o padrão até a Leva
 * 4.2). Some por completo (`null`) enquanto nada está em foco: ao
 * contrário da coluna do desktop, aqui não faz sentido ocupar o topo da
 * tela com um estado ocioso.
 *
 * Fixo no topo, não no rodapé: o rodapé já tem duas barras fixas
 * (resultado + navegação), e o teclado do celular come a parte de baixo
 * da tela — no topo, o painel continua visível com o teclado aberto.
 */
export function AssistenteFixoMobile() {
  const { ativo } = useAssistente();
  const ajuda = useAjudaDoCampo(ativo);
  if (!ajuda) return null;

  return (
    <div
      aria-live="polite"
      data-assistente-zona
      className="fixed inset-x-0 top-0 z-30 max-h-[38vh] overflow-y-auto border-b border-border border-l-4 border-l-info bg-surface-alt p-3 shadow-sm md:hidden"
    >
      <RotuloAssistente compacto />
      <ConteudoDaAjuda ajuda={ajuda} compacto />
    </div>
  );
}

/**
 * Rótulo + ícone, comum aos dois arranjos. Sem ele o card mobile nem
 * dizia "Assistente" — ia direto para o conteúdo, e é o mobile que o
 * ICP mais usa (CLAUDE.md: "usa celular muito mais que desktop").
 */
function RotuloAssistente({ compacto = false }: { compacto?: boolean }) {
  return (
    <p
      className={`flex items-center gap-1.5 font-display text-sm font-semibold text-info ${
        compacto ? "" : "mb-0.5"
      }`}
    >
      <IconeAssistente />
      {ASSISTENTE_UI.titulo}
    </p>
  );
}

function IconeAssistente() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="size-4 shrink-0">
      <path d="M4 5h16v11H8l-4 4V5Z" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M8 9h8M8 12.5h5" strokeLinecap="round" />
    </svg>
  );
}

function ConteudoDaAjuda({
  ajuda,
  compacto = false,
}: {
  ajuda: AjudaDeCampo;
  compacto?: boolean;
}) {
  return (
    <div className={compacto ? "space-y-2" : "mt-3 space-y-3"}>
      <Bloco titulo={ASSISTENTE_UI.ondeEncontrar} texto={ajuda.ondeEncontrar} />

      {ajuda.perguntarAoContador ? (
        <PerguntaAoContador texto={ajuda.perguntarAoContador} />
      ) : null}

      {ajuda.comoEstimar ? (
        <Bloco titulo={ASSISTENTE_UI.comoEstimar} texto={ajuda.comoEstimar} />
      ) : null}

      {ajuda.cuidado ? (
        <Bloco titulo={ASSISTENTE_UI.cuidado} texto={ajuda.cuidado} alerta />
      ) : null}
    </div>
  );
}

function Bloco({
  titulo,
  texto,
  alerta = false,
}: {
  titulo: string;
  texto: string;
  alerta?: boolean;
}) {
  return (
    <div>
      {/*
       * "Cuidado" leva ícone além da cor. 05-marca.md: nunca cor sozinha
       * para transmitir estado. E o token de aviso é o Âmbar, não o
       * Vermelho Sinal — vermelho aqui significaria prejuízo.
       */}
      <p
        className={`text-xs font-semibold tracking-wide uppercase ${
          alerta ? "text-warning" : "text-petroleo-suave"
        }`}
      >
        {alerta ? <span aria-hidden>⚠ </span> : null}
        {titulo}
      </p>
      <p className="mt-0.5 text-sm text-petroleo">{texto}</p>
    </div>
  );
}

/**
 * A pergunta pronta para o contador.
 *
 * Copiável de propósito: o usuário está no balcão, e mandar a frase por
 * WhatsApp é o passo real que destrava o campo. Escrever a pergunta por
 * ele é mais útil que explicar o conceito.
 */
function PerguntaAoContador({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o texto continua na
      // tela para o usuário copiar à mão. Nunca falhar barulhento.
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-petroleo-suave uppercase">
        {ASSISTENTE_UI.perguntarAoContador}
      </p>
      <p className="mt-0.5 border-l-2 border-border pl-2 text-sm text-petroleo italic">
        “{texto}”
      </p>
      <button
        type="button"
        onClick={copiar}
        className="touch-target -mx-2 inline-flex items-center px-2 text-xs font-medium text-petroleo-suave underline decoration-border underline-offset-2 hover:text-petroleo"
      >
        {copiado ? ASSISTENTE_UI.copiado : ASSISTENTE_UI.copiar}
      </button>
    </div>
  );
}

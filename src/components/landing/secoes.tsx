import Image from "next/image";
import { LinkCalculadora } from "./LinkCalculadora";
import {
  DORES,
  FAQ,
  FECHAMENTO,
  MODULOS,
  PARA_QUEM,
  PROVA,
  TRANSPARENCIA,
} from "@/lib/copy/landing";

/**
 * Seções estáticas da landing. Server components — nada aqui hidrata.
 *
 * A única ilha da página é o CTA instrumentado (LinkCalculadora). Todo o
 * resto é HTML puro, porque o público está em 4G num celular mediano:
 * cada kilobyte de JS nestas seções sairia do orçamento de quem está no
 * balcão esperando para começar.
 */

/**
 * Prova social. Vem cedo porque é o ativo de credibilidade mais forte
 * que existe hoje.
 *
 * Os logos oficiais dos parceiros — chegam de arquivos fornecidos, e
 * só as margens brancas foram recortadas: além disso nenhuma das duas
 * marcas é mexida (cor, proporção, composição), porque marca de
 * terceiro usada de forma incorreta é problema jurídico.
 */
export function Prova() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-xs uppercase tracking-wide text-petroleo-suave">{PROVA.titulo}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Image
            src="/parceiros/uplab.jpg"
            alt="UPLAB SENAI-SP"
            width={148}
            height={20}
            className="h-5 w-auto md:h-6"
          />
          <Image
            src="/parceiros/sindirepa.jpg"
            alt="SINDIREPA-SP"
            width={124}
            height={33}
            className="h-5 w-auto md:h-6"
          />
        </div>

        <p className="mt-3 max-w-2xl text-base text-petroleo">{PROVA.texto}</p>
      </div>
    </section>
  );
}

export function Dores() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:py-20">
      <h2 className="font-display text-xl font-semibold text-petroleo md:text-2xl">
        {DORES.titulo}
      </h2>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
        {DORES.blocos.map((bloco) => (
          <div key={bloco.titulo}>
            <h3 className="text-base font-semibold text-petroleo">{bloco.titulo}</h3>
            <p className="mt-1.5 text-base text-petroleo-suave">{bloco.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Modulos() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <h2 className="font-display text-xl font-semibold text-petroleo md:text-2xl">
          {MODULOS.titulo}
        </h2>

        <dl className="mt-6 grid gap-6 md:grid-cols-3 md:gap-8">
          {MODULOS.itens.map((item) => (
            <div key={item.titulo}>
              <dt className="text-base font-semibold text-petroleo">{item.titulo}</dt>
              <dd className="mt-1.5 text-base text-petroleo-suave">{item.texto}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Transparencia() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:py-20">
      <h2 className="font-display text-xl font-semibold text-petroleo md:text-2xl">
        {TRANSPARENCIA.titulo}
      </h2>
      <p className="mt-3 max-w-2xl text-base text-petroleo-suave">{TRANSPARENCIA.texto}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        {TRANSPARENCIA.principios.map((principio) => (
          <div
            key={principio.titulo}
            className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <dt className="text-base font-semibold text-petroleo">{principio.titulo}</dt>
            <dd className="mt-1.5 text-sm text-petroleo-suave">{principio.texto}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ParaQuem() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <h2 className="font-display text-xl font-semibold text-petroleo md:text-2xl">
          {PARA_QUEM.titulo}
        </h2>

        <dl className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
          {PARA_QUEM.itens.map((item) => (
            <div key={item.titulo}>
              <dt className="text-base font-semibold text-petroleo">{item.titulo}</dt>
              <dd className="mt-1.5 text-base text-petroleo-suave">{item.texto}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * Conteúdo aceito pelo FAQ. O JSON-LD FAQPage é gerado da mesma fonte
 * (FAQPAGE_JSONLD) — dado estruturado que discorda da página é penalizado.
 */
export function Faq({ conteudo = FAQ }: { conteudo?: typeof FAQ }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 md:py-24">
      <h2 className="font-display text-xl font-semibold text-petroleo md:text-2xl">
        {conteudo.titulo}
      </h2>

      <div className="mt-6 divide-y divide-border border-y border-border">
        {conteudo.perguntas.map((item) => (
          <details key={item.pergunta} className="group">
            <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-base font-medium text-petroleo">
              {item.pergunta}
              <span
                aria-hidden
                className="shrink-0 text-petroleo-suave transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <p className="pb-4 text-base text-petroleo-suave">{item.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Fechamento: volta para a calculadora. Um CTA, um só. */
export function Fechamento() {
  return (
    <section className="border-t border-border bg-petroleo">
      <div className="mx-auto max-w-3xl px-4 py-12 text-center md:py-20">
        <h2 className="font-display text-xl font-semibold text-text-inverse md:text-2xl">
          {FECHAMENTO.titulo}
        </h2>
        <p className="mt-2 text-base text-text-inverse/80">{FECHAMENTO.texto}</p>

        <LinkCalculadora
          origem="landing_home"
          className="touch-target mt-6 inline-flex items-center rounded-[var(--radius-button)] bg-primary px-6 font-medium text-text-inverse hover:bg-primary-hover"
        >
          {FECHAMENTO.cta}
        </LinkCalculadora>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { LinkCalculadora } from "@/components/landing/LinkCalculadora";
import {
  Dores,
  Faq,
  Fechamento,
  Modulos,
  ParaQuem,
  Prova,
  Transparencia,
} from "@/components/landing/secoes";
import { BRAND } from "@/lib/brand";
import { FAQPAGE_JSONLD, HEROI, TERMOS_DE_BUSCA } from "@/lib/copy/landing";

/**
 * ÚNICA landing: apresentação do produto, decidida pelo Felipe (a
 * calculadora-página e a institucional anteriores foram fundidas e
 * refeitas). Spec da peça no plano desta leva.
 *
 * Estática (SSG): é a página indexável. Server components, com o CTA
 * como única ilha hidratada.
 *
 * Herói LIMPO por decisão — sem prévia de campos, com o logo vertical
 * grande no lugar da imagem da ferramenta (que ainda não existe). O
 * objetivo da página é apresentar o produto; a conversão é a travessia
 * para a calculadora, cabe no primeiro clique.
 *
 * NÃO ADICIONAR AQUI: pop-up de saída, contador de urgência, vídeo de
 * fundo, biblioteca de animação, parallax, ilustração 3D, ícone de
 * chave inglesa ou engrenagem, foto de banco de imagem, depoimento
 * inventado, número de mercado inventado. O público desconfia de
 * software que promete demais, e o produto depende dessa confiança.
 */

/** Metadata derivada de BRAND e da copy, nunca literal. */
export const metadata: Metadata = {
  title: HEROI.titulo,
  description: HEROI.subtitulo,
  keywords: [...TERMOS_DE_BUSCA],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${BRAND.name} — ${HEROI.titulo}`,
    description: HEROI.subtitulo,
    url: "/",
    images: [{ url: "/branding/og.png" }],
  },
};

export default function Landing() {
  return (
    <>
      {/* HERÓI: logo vertical grande (versão colorida, uso de "capas" do manual),
          título, uma linha, CTA, nota de honestidade */}
      <section className="mx-auto max-w-5xl px-4 py-14 md:py-24">
        <div className="max-w-3xl">
          <Image
            src="/branding/logo-vertical.png"
            alt={BRAND.name}
            width={180}
            height={180}
            priority
            className="h-auto w-[140px] md:w-[180px]"
          />
          <h1 className="mt-4 font-display text-2xl leading-tight font-bold text-petroleo md:text-[2.5rem]">
            {HEROI.titulo}
          </h1>
          <p className="mt-3 text-base text-petroleo-suave md:text-lg">{HEROI.subtitulo}</p>

          <LinkCalculadora
            origem="landing_home"
            className="touch-target mt-6 inline-flex items-center rounded-[var(--radius-button)] bg-primary px-6 font-medium text-text-inverse hover:bg-primary-hover"
          >
            {HEROI.cta}
          </LinkCalculadora>

          <p className="mt-3 text-sm text-petroleo-suave">{HEROI.nota}</p>
        </div>
      </section>

      <Prova />
      <Dores />
      <Modulos />
      <Transparencia />
      <ParaQuem />
      <Faq />

      {/*
       * Fechamento: banda Petróleo fechando no mesmo argumento do
       * herói, com o segundo CTA instrumentado da página.
       */}
      <Fechamento />

      {/*
       * FAQPage estruturado. Gerado da MESMA fonte que renderiza o FAQ
       * visível — dado estruturado que discorda do conteúdo da página é
       * penalizado, e manter duas listas garantiria divergência.
       */}
      <script
        type="application/ld+json"
        // dangerouslySetInnerHTML é o mecanismo previsto para JSON-LD. O
        // conteúdo vem de constante tipada nossa, sem entrada de usuário.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQPAGE_JSONLD) }}
      />
    </>
  );
}

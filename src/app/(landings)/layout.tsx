import Image from "next/image";
import Link from "next/link";
import { BRAND, PROGRAM } from "@/lib/brand";
import { RODAPE } from "@/lib/copy/landing";

/**
 * Chrome das landings. Navegação mínima de propósito.
 *
 * O header segue só com o logo: a landing não tem saída além do CTA, e
 * um link no chrome compartilhado abriria rota de fuga na página cuja
 * métrica é a travessia para a calculadora.
 *
 * Logo horizontal, o uso do manual para cabeçalhos. Mínimo de 120px de
 * largura e área de proteção respeitada (05-marca.md). Altura
 * explícita para não haver deslocamento de layout.
 */
export default function LandingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
          <Link href="/" className="touch-target -mx-2 inline-flex items-center px-2">
            <Image
              src="/branding/logo-horizontal.png"
              alt={BRAND.name}
              width={148}
              height={38}
              priority
              className="h-auto w-[148px]"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-text-muted">
          <p>
            Uma iniciativa {BRAND.legalOwner} em parceria com {PROGRAM.accelerator} e{" "}
            {PROGRAM.union}.
          </p>
          {/* LGPD: aviso de privacidade e uso de dados visível na
              landing é requisito (04-landing.md). */}
          <p className="mt-2">{RODAPE.privacidade}</p>
        </div>
      </footer>
    </div>
  );
}

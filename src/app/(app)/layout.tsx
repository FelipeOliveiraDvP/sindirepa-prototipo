import Link from "next/link";
import { NavegacaoInferior, NavegacaoLateral } from "@/components/app/Navegacao";
import { BotaoSair } from "@/components/app/BotaoSair";
import { AssistenteFixoMobile, AssistenteProvider } from "@/components/calculator/Assistente";
import { SegmentoProvider } from "@/components/app/SegmentoProvider";
import { BRAND } from "@/lib/brand";
import { NAV } from "@/lib/copy/app";
import { ENTRAR } from "@/lib/copy/conta";
import { usuarioAtual } from "@/lib/data/supabase-server";

/**
 * Chrome do produto.
 *
 * A navegação se esconde sozinha enquanto houver menos de dois destinos
 * disponíveis (ver DESTINOS em lib/copy/app.ts). Com /oficina no ar ela
 * aparece — 03-telas.md: duas telas não justificavam estrutura, três
 * justificam.
 *
 * `SegmentoProvider` envolve tudo porque a unidade de trabalho de cada
 * número da tela depende do segmento da oficina — mecânica opera em
 * hora, funilaria em UT (docs/geral/01-contexto.md).
 *
 * O seletor de segmento NÃO fica no header: ele vive no passo 1 do modo
 * guiado e na aba "Oficina" da configuração, sempre junto da lista de
 * custos que ele altera. Solto no chrome, trocaria o vocabulário da tela
 * sem trocar as categorias, e o usuário veria uma tela meio funilaria,
 * meio mecânica.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const usuario = await usuarioAtual();
  return (
    <SegmentoProvider>
      <AssistenteProvider>
      <AssistenteFixoMobile />
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/"
              aria-label={NAV.irParaInicio}
              className="touch-target -mx-2 inline-flex items-center px-2 font-display text-lg font-bold text-petroleo"
            >
              {BRAND.name}
            </Link>

            {usuario ? (
              <BotaoSair />
            ) : (
              <Link
                href="/entrar"
                className="touch-target inline-flex items-center rounded-button px-3 text-sm text-petroleo-suave hover:text-petroleo"
              >
                {ENTRAR.acao}
              </Link>
            )}
          </div>
        </header>

        <div className="flex w-full flex-1">
          <NavegacaoLateral />
          <main className="mx-auto min-w-0 w-full max-w-6xl flex-1">{children}</main>
        </div>

        <NavegacaoInferior />
      </div>
      </AssistenteProvider>
    </SegmentoProvider>
  );
}

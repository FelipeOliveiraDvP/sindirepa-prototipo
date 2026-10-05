"use client";

import { useState } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { track } from "@/lib/analytics/track";
import { formatarMoeda, formatarPercentual } from "@/lib/pricing/format";
import type { FaixaComposicao } from "@/lib/pricing/types";

/**
 * O elemento assinatura do produto: a composição do preço aberta,
 * item a item.
 *
 * Onde outros produtos escondem a conta, este a expõe como peça de
 * design. É a tradução visual direta do princípio "Transparente", e
 * 03-telas.md é explícito: não cortar por espaço.
 *
 * COR — 05-marca.md restringe o Vermelho Sinal a CTA e ao ponto do
 * símbolo, então a barra usa a rampa neutra Carbono → Grafite → Border,
 * com a margem em `success`. Além de respeitar a regra, é o que faz a
 * peça parecer instrumento de medição em vez de dashboard de startup.
 *
 * ACESSIBILIDADE — cor nunca é o único sinal: cada faixa aparece também
 * como linha com rótulo e valor. Quem não distingue os tons lê a mesma
 * informação, e o leitor de tela recebe a lista, não a barra.
 */

const COR_DA_FAIXA: Record<FaixaComposicao["id"], string> = {
  maoDeObra: "bg-petroleo",
  custosFixos: "bg-petroleo-suave",
  impostos: "bg-border",
  margem: "bg-success",
};

export function CompositionBar({
  composicao,
  precoSugerido,
}: {
  composicao: FaixaComposicao[];
  precoSugerido: number;
}) {
  const { copy } = useSegmento();
  const [faixaAberta, setFaixaAberta] = useState<FaixaComposicao["id"] | null>(null);

  function alternar(faixa: FaixaComposicao) {
    const abrindo = faixaAberta !== faixa.id;
    setFaixaAberta(abrindo ? faixa.id : null);
    if (abrindo) track({ nome: "calc_composicao_aberta", faixa: faixa.id });
  }

  return (
    <section aria-labelledby="composicao-titulo" className="mt-6">
      <h3 id="composicao-titulo" className="text-sm font-semibold text-petroleo">
        {copy.RESULTADO.verComposicao}
      </h3>

      {/* A barra é ilustração do que a lista abaixo já diz em texto. */}
      <div
        aria-hidden
        className="mt-2 flex h-3 w-full overflow-hidden rounded-full border border-border"
      >
        {composicao.map((faixa) => (
          <div
            key={faixa.id}
            className={COR_DA_FAIXA[faixa.id]}
            style={{ width: `${faixa.fracaoDoPreco * 100}%` }}
          />
        ))}
      </div>

      <ul className="mt-2 divide-y divide-border">
        {composicao.map((faixa) => {
          const aberta = faixaAberta === faixa.id;
          return (
            <li key={faixa.id}>
              <button
                type="button"
                onClick={() => alternar(faixa)}
                aria-expanded={aberta}
                className="touch-target flex w-full items-center justify-between gap-3 py-2 text-left"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={`size-3 shrink-0 rounded-sm border border-border ${COR_DA_FAIXA[faixa.id]}`}
                  />
                  <span className="truncate text-sm text-petroleo">
                    {copy.COMPOSICAO_LABEL[faixa.id]}
                  </span>
                </span>

                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="text-xs text-petroleo-suave">
                    {formatarPercentual(faixa.fracaoDoPreco)}
                  </span>
                  <span className="tabular text-sm font-medium text-petroleo">
                    {formatarMoeda(faixa.valorPorUnidade)}
                  </span>
                </span>
              </button>

              {aberta ? (
                <p className="pb-3 text-sm text-petroleo-suave">{copy.COMPOSICAO_AJUDA[faixa.id]}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-2 flex items-baseline justify-between border-t border-petroleo pt-2">
        <span className="text-sm font-semibold text-petroleo">{copy.RESULTADO.precoSugerido.label}</span>
        <span className="tabular text-sm font-semibold text-petroleo">
          {formatarMoeda(precoSugerido)}
        </span>
      </p>
    </section>
  );
}

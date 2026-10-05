/**
 * Barra pareada — você × mediana do grupo, categoria a categoria.
 *
 * Substitui, na Leva 4.1, a lista de frases que o bloco "composição
 * comparada" de `/benchmark` usava. Mesma paleta neutra de
 * `CompositionBar.tsx` (`carbono`/`grafite`/`border`) — nunca vermelho
 * ou verde aqui: é comparação de mercado, não avaliação de bom/ruim
 * (docs/saas/09-benchmark.md, "não recomenda preço").
 */
export function BarraComparativa({
  categoria,
  fracaoSua,
  fracaoGrupo,
  rotuloSua,
  rotuloGrupo,
}: {
  categoria: string;
  /** Fração (0–1) do preço. */
  fracaoSua: number;
  fracaoGrupo: number;
  rotuloSua: string;
  rotuloGrupo: string;
}) {
  // Teto comum: a maior das duas frações define 100% da largura visual,
  // para as duas barras ficarem comparáveis na mesma régua.
  const teto = Math.max(fracaoSua, fracaoGrupo, 0.01);

  return (
    <div className="py-2.5">
      <p className="text-sm text-petroleo">{categoria}</p>

      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-10 shrink-0 text-xs text-petroleo-suave">{rotuloSua}</span>
        <div className="h-2 flex-1 rounded-full bg-surface-alt">
          <div
            className="h-2 rounded-full bg-petroleo"
            style={{ width: `${(fracaoSua / teto) * 100}%` }}
          />
        </div>
        <span className="tabular w-12 shrink-0 text-right text-xs font-medium text-petroleo">
          {formatarFracao(fracaoSua)}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <span className="w-10 shrink-0 text-xs text-petroleo-suave">{rotuloGrupo}</span>
        {/* bg-petroleo-suave, não bg-border: border em cima de surface-alt tem
            contraste baixo demais para ler como barra (achado na revisão
            visual da Leva 4.1). */}
        <div className="h-2 flex-1 rounded-full bg-surface-alt">
          <div
            className="h-2 rounded-full bg-petroleo-suave"
            style={{ width: `${(fracaoGrupo / teto) * 100}%` }}
          />
        </div>
        <span className="tabular w-12 shrink-0 text-right text-xs text-petroleo-suave">
          {formatarFracao(fracaoGrupo)}
        </span>
      </div>
    </div>
  );
}

function formatarFracao(fracao: number): string {
  return `${Math.round(fracao * 100)}%`;
}

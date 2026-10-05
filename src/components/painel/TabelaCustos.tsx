import type { AmostraIlustrativa } from "@/lib/benchmark/demo";
import { TABELA_CUSTOS } from "@/lib/copy/painel";
import type { PesoCategoria } from "@/lib/pricing/analise";
import { formatarMoeda, formatarPercentual } from "@/lib/pricing/format";
import { TarjaIlustrativa } from "./TarjaIlustrativa";

/**
 * Detalhamento do custo por categoria — e, em modo demonstração, contra
 * a mediana do grupo.
 *
 * ═══ DUAS FORMAS, UM COMPONENTE ═══
 * Sem amostra, as colunas do grupo não são renderizadas e a tabela vira
 * o detalhamento próprio. Isso é deliberado: o detalhamento é útil
 * sozinho, e um card vazio em produção seria pior que uma tabela mais
 * curta (o painel já tinha espaço em branco demais).
 *
 * ═══ POR QUE A DIFERENÇA NÃO É VERMELHA NEM VERDE ═══
 * docs/geral/05-marca.md: colorir posição de mercado como bom/ruim vira
 * conselho, e 09-benchmark.md proíbe o produto recomendar. Gastar mais
 * que o grupo em aluguel pode ser ponto melhor; gastar menos em seguro
 * pode ser exposição. A cor `danger`/`success` continua valendo só para
 * o custo da PRÓPRIA oficina piorar ou melhorar entre versões — que é o
 * que `Historico` faz.
 */
export function TabelaCustos({
  pesos,
  rotuloMaoDeObra,
  unidadesProdutivas,
  amostra,
  sufixo,
}: {
  pesos: PesoCategoria[];
  /** O mesmo rótulo usado para montar `pesos` — é como a linha de mão de obra é reconhecida. */
  rotuloMaoDeObra: string;
  unidadesProdutivas: number;
  amostra: AmostraIlustrativa | null;
  sufixo: string;
}) {
  if (pesos.length === 0) return null;

  const totalPorUnidade = pesos.reduce((acc, p) => acc + p.valorPorUnidade, 0);

  /**
   * Valor do grupo em R$ por unidade: a mediana de custo do recorte,
   * repartida pelo peso mediano da categoria. Ancorar na mediana que já
   * existe evita um segundo conjunto de números que divergiria dela.
   */
  function valorDoGrupo(categoria: string): number | null {
    if (!amostra) return null;
    const fracao =
      categoria === rotuloMaoDeObra
        ? amostra.medianaPorCategoria.maoDeObra
        : amostra.medianaPorCategoria.custosFixos[categoria];
    if (fracao === undefined) return null;
    return amostra.faixaCusto.mediana * fracao;
  }

  return (
    <section className="card-metric">
      {amostra ? <TarjaIlustrativa selo={amostra.selo} /> : null}

      <h2 className={`font-display text-lg font-semibold text-petroleo ${amostra ? "mt-3" : ""}`}>
        {TABELA_CUSTOS.titulo}
      </h2>
      <p className="mt-1 text-sm text-petroleo-suave">{TABELA_CUSTOS.ajuda}</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-petroleo-suave">
              <th scope="col" className="py-2 pr-3 font-medium">
                {TABELA_CUSTOS.colunas.categoria}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                {TABELA_CUSTOS.colunas.porMes}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                {TABELA_CUSTOS.colunas.porUnidade}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                {TABELA_CUSTOS.colunas.peso}
              </th>
              {amostra ? (
                <>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    {TABELA_CUSTOS.colunas.grupo}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    {TABELA_CUSTOS.colunas.diferenca}
                  </th>
                </>
              ) : null}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {pesos.map((peso) => {
              const grupo = valorDoGrupo(peso.categoria);
              const diferenca =
                grupo !== null && grupo > 0 ? peso.valorPorUnidade / grupo - 1 : null;

              return (
                <tr key={peso.categoria}>
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-petroleo">
                    {peso.categoria}
                  </th>
                  <td className="tabular py-2 pr-3 text-right text-petroleo">
                    {formatarMoeda(peso.valorPorUnidade * unidadesProdutivas)}
                  </td>
                  <td className="tabular py-2 pr-3 text-right text-petroleo">
                    {formatarMoeda(peso.valorPorUnidade)}
                  </td>
                  <td className="tabular py-2 pr-3 text-right text-petroleo-suave">
                    {formatarPercentual(peso.fracaoDoCusto)}
                  </td>
                  {amostra ? (
                    <>
                      <td className="tabular py-2 pr-3 text-right text-petroleo-suave">
                        {grupo === null
                          ? TABELA_CUSTOS.semDadoDoGrupo
                          : formatarMoeda(grupo)}
                      </td>
                      {/*
                        Neutro de propósito — ver o cabeçalho do arquivo.
                        O sinal e a seta carregam a direção sem cor.
                      */}
                      <td className="tabular py-2 text-right text-petroleo">
                        {diferenca === null ? (
                          TABELA_CUSTOS.semDadoDoGrupo
                        ) : (
                          <>
                            <span aria-hidden>{diferenca >= 0 ? "↑ " : "↓ "}</span>
                            {diferenca >= 0 ? "+" : "−"}
                            {formatarPercentual(Math.abs(diferenca))}
                          </>
                        )}
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="border-t border-border font-medium">
              <th scope="row" className="py-2 pr-3 text-left text-petroleo">
                {TABELA_CUSTOS.total}
              </th>
              <td className="tabular py-2 pr-3 text-right text-petroleo">
                {formatarMoeda(totalPorUnidade * unidadesProdutivas)}
              </td>
              <td className="tabular py-2 pr-3 text-right text-petroleo">
                {formatarMoeda(totalPorUnidade)}/{sufixo}
              </td>
              <td className="tabular py-2 pr-3 text-right text-petroleo-suave">
                {formatarPercentual(1)}
              </td>
              {amostra ? (
                <>
                  <td className="tabular py-2 pr-3 text-right text-petroleo-suave">
                    {formatarMoeda(amostra.faixaCusto.mediana)}
                  </td>
                  <td />
                </>
              ) : null}
            </tr>
          </tfoot>
        </table>
      </div>

      {amostra ? (
        <p className="mt-3 text-xs text-petroleo-suave">{TABELA_CUSTOS.rodapeComparacao}</p>
      ) : null}
    </section>
  );
}

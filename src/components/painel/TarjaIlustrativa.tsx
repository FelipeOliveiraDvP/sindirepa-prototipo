/**
 * A tarja do dado ilustrativo — endurecida na Leva 4.
 *
 * Até a Leva 3, uma linha no topo da tela bastava porque só um bloco
 * mostrava número do grupo. Com `/benchmark` mostrando faixa de custo,
 * faixa de preço E composição comparada, uma tarja só no topo vira
 * papel de parede que ninguém lê depois do primeiro bloco — por isso
 * CADA bloco com dado do grupo renderiza a própria tarja
 * (docs/saas/09-benchmark.md, "Modo demonstração").
 *
 * Não tem prop para desligar. Não é opcional em nenhum bloco que passe
 * `selo` de `amostraIlustrativa()`.
 */
export function TarjaIlustrativa({ selo }: { selo: string }) {
  return (
    <p className="rounded-button border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold tracking-wide text-warning uppercase">
      <span aria-hidden>⚠ </span>
      {selo}
    </p>
  );
}

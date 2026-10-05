"use client";

import { useState, useTransition } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import {
  CamposComercial,
  CamposCustosFixos,
  CamposEquipe,
  CamposJornada,
} from "@/components/calculator/secoesCalculadora";
import { useCalculadora } from "@/components/calculator/useCalculadora";
import { ValorReativo } from "@/components/ui/ValorReativo";
import { track } from "@/lib/analytics/track";
import { OFICINA } from "@/lib/copy/conta";
import type { EntradaAgregada } from "@/lib/pricing/aggregate";
import { formatarMoeda } from "@/lib/pricing/format";
import { salvar } from "./actions";
import { DadosDaOficina, type DadosOficina } from "./DadosDaOficina";

/**
 * Configuração da oficina — quatro abas (03-telas.md).
 *
 * MESMA PEDAGOGIA DA CALCULADORA: o custo da unidade fica visível o
 * tempo todo e reage a cada campo. Configuração que não mostra
 * consequência vira formulário burocrático, e formulário burocrático é
 * abandonado.
 *
 * Reaproveita exatamente os componentes de campo da calculadora. Não
 * existe um segundo formulário para os mesmos números.
 */

const ABAS = ["oficina", "equipe", "custosFixos", "parametros"] as const;
type Aba = (typeof ABAS)[number];

export function OficinaCliente({
  inicial,
  dadosOficina,
}: {
  inicial: EntradaAgregada;
  dadosOficina: DadosOficina;
}) {
  const { copy, unit } = useSegmento();
  // Fonte de verdade é o banco: nada de rascunho anônimo aqui.
  const calc = useCalculadora("oficina", { inicial, lerRascunho: false });

  const [aba, setAba] = useState<Aba>("oficina");
  const [dados, setDados] = useState<DadosOficina>(dadosOficina);
  const [salvando, iniciarSalvamento] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  /**
   * Custo no momento em que a tela abriu — a régua do "impacto".
   * Congelado no primeiro render: se acompanhasse a edição, a diferença
   * seria sempre zero e a informação não existiria.
   */
  const [custoSalvo] = useState(() =>
    calc.calculo.ok ? calc.calculo.resultado.custoRealUnidade : null,
  );

  const custoAtual = calc.calculo.ok ? calc.calculo.resultado.custoRealUnidade : null;
  const diferenca = custoAtual !== null && custoSalvo !== null ? custoAtual - custoSalvo : null;

  function aoSalvar() {
    setAviso(null);
    iniciarSalvamento(async () => {
      const r = await salvar(calc.entrada, { ...dados, cidade: calc.perfil.cidade || dados.cidade });
      if (r.ok) {
        track({ nome: "config_salva" });
        setAviso(OFICINA.salvo);
      } else {
        setAviso(OFICINA.erroSalvar);
      }
    });
  }

  const rotulos: Record<Aba, string> = {
    oficina: OFICINA.abas.oficina,
    equipe: OFICINA.abas.equipe,
    custosFixos: OFICINA.abas.custosFixos,
    parametros: OFICINA.abas.parametros,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-12">
      <h1 className="font-display text-2xl font-bold text-petroleo">{OFICINA.titulo}</h1>
      <p className="mt-2 text-base text-petroleo-suave">{OFICINA.subtitulo}</p>

      {/* O número acompanha a edição — é a mesma pedagogia da calculadora. */}
      <div className="card-metric mt-6">
        <p className="metric-label">{copy.RESULTADO.custoReal.label}</p>
        {custoAtual === null ? (
          <p className="mt-1 text-sm text-petroleo-suave">{copy.RESULTADO.aguardando.ajuda}</p>
        ) : (
          <>
            <ValorReativo
              valor={custoAtual}
              formatar={formatarMoeda}
              sentido="subir-ruim"
              sufixo={` /${unit.abbrev}`}
              className="metric-value mt-1 text-petroleo"
            />
            <p className="mt-1 text-sm text-petroleo-suave">
              {diferenca === null || Math.abs(diferenca) < 0.005
                ? OFICINA.semAlteracao
                : `${OFICINA.impacto}: ${diferenca > 0 ? "+" : "−"}${formatarMoeda(
                    Math.abs(diferenca),
                  )} por ${unit.singular} em relação ao que está salvo.`}
            </p>
          </>
        )}
      </div>

      <div role="tablist" aria-label={OFICINA.titulo} className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {ABAS.map((id) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={`touch-target -mb-px border-b-2 px-3 text-sm transition-colors ${
              aba === id
                ? "border-primary font-semibold text-petroleo"
                : "border-transparent text-petroleo-suave hover:text-petroleo"
            }`}
          >
            {rotulos[id]}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-1">
        {aba === "oficina" ? (
          <DadosDaOficina valor={dados} onChange={setDados} calc={calc} />
        ) : null}
        {aba === "equipe" ? <CamposEquipe calc={calc} /> : null}
        {aba === "custosFixos" ? <CamposCustosFixos calc={calc} /> : null}
        {aba === "parametros" ? (
          <>
            <CamposJornada calc={calc} />
            <CamposComercial calc={calc} />
          </>
        ) : null}
      </div>

      <div className="mt-8 flex items-center gap-4 border-t border-border pt-4">
        <button
          type="button"
          onClick={aoSalvar}
          disabled={salvando}
          className="touch-target rounded-button bg-primary px-6 text-sm font-medium text-text-inverse hover:bg-primary-hover disabled:opacity-60"
        >
          {salvando ? OFICINA.salvando : OFICINA.salvar}
        </button>
        {aviso ? (
          <p role="status" className="text-sm text-petroleo-suave">
            {aviso}
          </p>
        ) : null}
      </div>
    </div>
  );
}

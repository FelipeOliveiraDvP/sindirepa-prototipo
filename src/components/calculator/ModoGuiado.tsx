"use client";

import { useState } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { AssistenteLateral } from "./Assistente";
import { ValorReativo } from "@/components/ui/ValorReativo";
import { GUIADO, PRIVACIDADE } from "@/lib/copy/app";
import { formatarMoeda } from "@/lib/pricing/format";
import {
  CamposComercial,
  CamposCustosFixos,
  CamposEquipe,
  CamposJornada,
  CamposSegmento,
} from "./secoesCalculadora";
import type { EstadoCalculadora } from "./useCalculadora";

/**
 * Modo guiado — a primeira visita à calculadora.
 *
 * POR QUE EXISTE: a tela única é melhor para quem já entendeu e quer
 * simular, e é intimidante para quem abre pela primeira vez e nunca fez
 * essa conta na vida. A ameaça número um do produto é resistência à
 * adoção (CLAUDE.md), e a primeira tela precisa ser vencível.
 *
 * O QUE ELE NÃO É: um formulário paralelo. Os passos renderizam
 * exatamente os componentes de secoesCalculadora.tsx que a tela única
 * usa, sobre o mesmo estado. Não existe caminho para os dois modos
 * divergirem num número.
 *
 * REGRAS (03-telas.md):
 *   - resultado parcial aparece assim que fica calculável e acompanha
 *     até o fim; adiar tudo para uma tela final joga fora o mecanismo
 *     pedagógico do produto
 *   - voltar não perde nada
 *   - nenhum passo é obrigatório além do salário; quem quiser pular
 *     chega ao resultado
 *   - a saída para a tela completa fica visível o tempo todo
 */
export function ModoGuiado({
  calc,
  onConcluir,
}: {
  calc: EstadoCalculadora;
  onConcluir: () => void;
}) {
  const { copy } = useSegmento();
  const [passo, setPasso] = useState(0);

  const passos = [
    {
      id: "oficina",
      ...copy.SECOES.oficina,
      campos: <CamposSegmento calc={calc} />,
    },
    {
      id: "equipe",
      ...copy.SECOES.equipe,
      campos: <CamposEquipe calc={calc} />,
    },
    {
      id: "jornada",
      ...copy.SECOES.jornada,
      campos: <CamposJornada calc={calc} />,
    },
    {
      id: "custosFixos",
      ...copy.SECOES.custosFixos,
      campos: <CamposCustosFixos calc={calc} />,
    },
    {
      id: "comercial",
      ...copy.SECOES.comercial,
      campos: <CamposComercial calc={calc} />,
    },
  ];

  const atual = passos[passo];
  const ultimo = passo === passos.length - 1;

  function avancar() {
    calc.registrarPasso(atual.id);
    if (ultimo) {
      onConcluir();
      return;
    }
    setPasso((p) => p + 1);
  }

  function pular() {
    calc.registrarPulo(atual.id);
    onConcluir();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-12">
      <div className="md:grid md:grid-cols-[1fr_300px] md:items-start md:gap-8">
      <div>
      <Trilha total={passos.length} atual={passo} titulos={passos.map((p) => p.titulo)} />

      <div className="mt-6">
        <h1 className="font-display text-2xl font-bold text-petroleo">{atual.titulo}</h1>
        <p className="mt-2 text-base text-petroleo-suave">{atual.descricao}</p>

        {/* key força a animação de entrada e devolve o scroll ao topo
            do bloco a cada troca de passo. */}
        <div key={atual.id} className="mt-6">
          {atual.campos}
        </div>
      </div>

      <ResultadoParcial calc={calc} />

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          {passo > 0 ? (
            <button
              type="button"
              onClick={() => setPasso((p) => p - 1)}
              className="touch-target rounded-button px-4 text-sm font-medium text-petroleo hover:bg-surface"
            >
              {GUIADO.voltar}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={avancar}
          className="touch-target rounded-button bg-primary px-6 text-sm font-medium text-text-inverse hover:bg-primary-hover"
        >
          {ultimo ? GUIADO.concluir : GUIADO.proximo}
        </button>
      </div>

      <button
        type="button"
        onClick={pular}
        className="touch-target mt-2 w-full text-sm text-petroleo-suave underline underline-offset-4 hover:text-petroleo"
      >
        {GUIADO.pular}
      </button>

      <p className="mt-4 text-xs text-petroleo-suave">{PRIVACIDADE.calculoAnonimo}</p>
      </div>

      <div className="md:pt-16">
        <AssistenteLateral />
      </div>
      </div>
    </div>
  );
}

/**
 * Trilha de passos. Estado nunca por cor sozinha: o passo concluído
 * carrega um símbolo e o atual é anunciado por aria-current.
 */
function Trilha({
  total,
  atual,
  titulos,
}: {
  total: number;
  atual: number;
  titulos: string[];
}) {
  return (
    <div>
      <ol className="flex items-center gap-2" aria-label={GUIADO.passoDe(atual + 1, total)}>
        {Array.from({ length: total }, (_, i) => {
          const estado = i === atual ? "atual" : i < atual ? "concluido" : "pendente";
          return (
            <li key={i} className="flex flex-1 items-center gap-2">
              <span
                className="step-indicator shrink-0"
                data-estado={estado}
                aria-current={estado === "atual" ? "step" : undefined}
              >
                <span aria-hidden>{estado === "concluido" ? "✓" : i + 1}</span>
                <span className="sr-only">
                  {titulos[i]}
                  {estado === "concluido" ? " — concluído" : ""}
                </span>
              </span>
              {i < total - 1 ? (
                <span
                  aria-hidden
                  className={`h-px flex-1 ${i < atual ? "bg-primary" : "bg-border"}`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-sm text-petroleo-suave">{GUIADO.passoDe(atual + 1, total)}</p>
    </div>
  );
}

/**
 * O número aparece assim que existe, e não no fim. É o mecanismo que
 * ensina: o usuário precisa ver o custo reagir ao campo que ele mexeu.
 */
function ResultadoParcial({ calc }: { calc: EstadoCalculadora }) {
  const { copy } = useSegmento();
  if (!calc.calculo.ok) return null;

  return (
    <div className="mt-6 rounded-card border border-border bg-surface p-4">
      <p className="metric-label">{GUIADO.parcial}</p>
      <p className="mt-1 flex items-baseline justify-between gap-3">
        <span className="text-sm text-petroleo">{copy.RESULTADO.custoReal.label}</span>
        <ValorReativo
          valor={calc.calculo.resultado.custoRealUnidade}
          formatar={formatarMoeda}
          sentido="subir-ruim"
          className="metric-value text-petroleo"
        />
      </p>
    </div>
  );
}

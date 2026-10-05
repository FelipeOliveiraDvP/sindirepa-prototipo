"use client";

import { useId } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { SEGMENTO, SEGMENTO_DESCRICAO } from "@/lib/copy/app";
import { SEGMENTOS, SEGMENTOS_DISPONIVEIS } from "@/lib/pricing/segmento";
import { REGIOES } from "@/lib/regioes";
import { useAssistente } from "./Assistente";
import { Campo, inputClasses } from "./Campo";
import { CustosFixosSecao } from "./CustosFixosSecao";
import { CurrencyField, NumberField, PercentField } from "./fields";
import { OcupacaoField } from "./OcupacaoField";
import type { EstadoCalculadora } from "./useCalculadora";

/**
 * Os campos da calculadora, agrupados por assunto.
 *
 * POR QUE VIVEM AQUI, e não dentro da tela: a tela única e o modo
 * guiado renderizam EXATAMENTE estes componentes, só que em arranjos
 * diferentes — um empilha tudo, o outro mostra um grupo por vez.
 *
 * É o que sustenta a promessa de 03-telas.md: os dois modos, com os
 * mesmos dados, produzem o mesmo número. Se cada modo tivesse seu
 * próprio formulário, a divergência seria questão de tempo.
 */

type Props = { calc: EstadoCalculadora };

/**
 * Segmento e cidade. Existe só no modo guiado — é o único passo que
 * acrescenta campo em relação à Leva 1.
 *
 * Justifica-se porque o segmento governa a unidade e as categorias de
 * custo de toda a tela seguinte, e a cidade é o que destrava o
 * benchmark. Perguntar depois obrigaria a refazer a lista de custos.
 */
export function CamposSegmento({ calc }: Props) {
  const idCidade = useId();
  const { ativar } = useAssistente();

  return (
    <>
      {/* Não passa pelo envelope Campo (não é um input simples), então o
          assistente é ligado à mão — mesmo padrão de OcupacaoField.tsx. */}
      <fieldset
        className="scroll-mt-44 pb-4 md:scroll-mt-0"
        data-assistente-zona
        onFocusCapture={() => ativar("segmento")}
      >
        <legend className="pb-1 text-base font-medium text-petroleo">
          {SEGMENTO.label}
        </legend>
        <p className="pb-3 text-sm text-petroleo-suave">{SEGMENTO.ajuda}</p>

        <div className="grid gap-2 sm:grid-cols-2">
          {SEGMENTOS_DISPONIVEIS.map((id) => {
            const def = SEGMENTOS[id];
            const ativoSegmento = calc.segmento === id;
            return (
              <label
                key={id}
                className={`flex cursor-pointer flex-col gap-1 rounded-card border p-3 transition-colors ${
                  ativoSegmento
                    ? "border-primary bg-surface"
                    : "border-border bg-surface hover:border-petroleo-suave"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="segmento"
                    value={id}
                    checked={ativoSegmento}
                    onChange={() => calc.alterarSegmento(id)}
                    className="size-4 accent-[var(--color-primary)]"
                  />
                  <span className="font-medium text-petroleo">{def.label}</span>
                </span>
                <span className="pl-6 text-sm text-petroleo-suave">
                  {SEGMENTO_DESCRICAO[id]}
                </span>
              </label>
            );
          })}
        </div>


      </fieldset>

      <Campo
        label="Cidade da oficina"
        ajuda="Usada só para comparar com oficinas da mesma região. Nunca aparece para outro usuário."
        htmlFor={idCidade}
        campo="cidade"
      >
        <select
          id={idCidade}
          value={calc.perfil.cidade}
          onChange={(e) => calc.alterarCidade(e.target.value)}
          className={inputClasses}
        >
          <option value="">Selecione a cidade</option>
          {REGIOES.map((r) => (
            <option key={r.id || "outra"} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </Campo>
    </>
  );
}

export function CamposEquipe({ calc }: Props) {
  const { copy } = useSegmento();
  const { entrada, alterar, marcarTocado, erroDoCampo } = calc;

  return (
    <>
      <NumberField
        label={copy.CAMPOS.quantidadeProdutivos.label}
        ajuda={copy.CAMPOS.quantidadeProdutivos.ajuda}
        exemplo={copy.CAMPOS.quantidadeProdutivos.exemplo}
        valor={entrada.quantidadeProdutivos}
        campo="quantidadeProdutivos"
        onChange={(v) => alterar("quantidadeProdutivos", v)}
        onBlur={() => marcarTocado("produtivos")}
        erro={erroDoCampo("produtivos")}
      />

      {/* O único campo sem padrão, e por isso o que recebe o foco. */}
      <CurrencyField
        label={copy.CAMPOS.salarioMedio.label}
        ajuda={copy.CAMPOS.salarioMedio.ajuda}
        exemplo={copy.CAMPOS.salarioMedio.exemplo}
        valor={entrada.salarioMedio}
        campo="salarioMedio"
        vazioQuandoZero
        focoInicialEmDesktop
        onChange={(v) => alterar("salarioMedio", v)}
        onBlur={() => marcarTocado("salarioBruto")}
        erro={erroDoCampo("salarioBruto")}
      />

      <PercentField
        label={copy.CAMPOS.percentualEncargos.label}
        ajuda={copy.CAMPOS.percentualEncargos.ajuda}
        exemplo={copy.CAMPOS.percentualEncargos.exemplo}
        fracao={entrada.percentualEncargos}
        campo="percentualEncargos"
        onChange={(v) => alterar("percentualEncargos", v)}
      />
    </>
  );
}

export function CamposJornada({ calc }: Props) {
  const { copy } = useSegmento();
  const { entrada, alterar, marcarTocado, erroDoCampo } = calc;

  return (
    <>
      <div className="md:grid md:grid-cols-2 md:gap-x-6">
        <NumberField
          label={copy.CAMPOS.diasUteisMes.label}
          ajuda={copy.CAMPOS.diasUteisMes.ajuda}
          exemplo={copy.CAMPOS.diasUteisMes.exemplo}
          valor={entrada.diasUteisMes}
        campo="diasUteisMes"
          onChange={(v) => alterar("diasUteisMes", v)}
          onBlur={() => marcarTocado("diasUteisMes")}
          erro={erroDoCampo("diasUteisMes")}
        />
        <NumberField
          label={copy.CAMPOS.unidadesPorDia.label}
          ajuda={copy.CAMPOS.unidadesPorDia.ajuda}
          exemplo={copy.CAMPOS.unidadesPorDia.exemplo}
          valor={entrada.unidadesPorDia}
        campo="unidadesPorDia"
          decimais={1}
          onChange={(v) => alterar("unidadesPorDia", v)}
          onBlur={() => marcarTocado("unidadesPorDia")}
          erro={erroDoCampo("unidadesPorDia")}
        />

        {/*
          Opcional: só destrava a leitura do equilíbrio em carros no
          painel. Não entra em paraCalculoInput e não bloqueia nada —
          por isso não tem erroDoCampo.
        */}
        <NumberField
          label={copy.CAMPOS.unidadesPorCarro.label}
          ajuda={copy.CAMPOS.unidadesPorCarro.ajuda}
          exemplo={copy.CAMPOS.unidadesPorCarro.exemplo}
          valor={entrada.unidadesPorCarro}
          campo="unidadesPorCarro"
          decimais={1}
          onChange={(v) => alterar("unidadesPorCarro", v)}
          onBlur={() => marcarTocado("unidadesPorCarro")}
        />
      </div>

      <OcupacaoField
        fracao={entrada.ocupacao}
        onChange={(v) => alterar("ocupacao", v)}
        onInteragir={() => marcarTocado("ocupacao")}
      />
      {erroDoCampo("ocupacao") ? (
        <p role="alert" className="pb-3 text-sm text-danger">
          {erroDoCampo("ocupacao")}
        </p>
      ) : null}
    </>
  );
}

export function CamposCustosFixos({ calc }: Props) {
  return (
    <CustosFixosSecao
      custosFixos={calc.entrada.custosFixos}
      onChange={(v) => calc.alterar("custosFixos", v)}
    />
  );
}

export function CamposComercial({ calc }: Props) {
  const { copy } = useSegmento();
  const { entrada, alterar, marcarTocado, erroDoCampo } = calc;

  return (
    <>
      <div className="md:grid md:grid-cols-2 md:gap-x-6">
        <PercentField
          label={copy.CAMPOS.impostosSobreFaturamento.label}
          ajuda={copy.CAMPOS.impostosSobreFaturamento.ajuda}
          exemplo={copy.CAMPOS.impostosSobreFaturamento.exemplo}
          fracao={entrada.impostosSobreFaturamento}
        campo="impostosSobreFaturamento"
          onChange={(v) => alterar("impostosSobreFaturamento", v)}
          onBlur={() => marcarTocado("margemDesejada")}
        />
        <PercentField
          label={copy.CAMPOS.margemDesejada.label}
          ajuda={copy.CAMPOS.margemDesejada.ajuda}
          exemplo={copy.CAMPOS.margemDesejada.exemplo}
          fracao={entrada.margemDesejada}
        campo="margemDesejada"
          onChange={(v) => alterar("margemDesejada", v)}
          onBlur={() => marcarTocado("margemDesejada")}
          erro={erroDoCampo("margemDesejada")}
        />
      </div>

      <CurrencyField
        label={copy.CAMPOS.precoUnidadeAtual.label}
        ajuda={copy.CAMPOS.precoUnidadeAtual.ajuda}
        exemplo={copy.CAMPOS.precoUnidadeAtual.exemplo}
        valor={entrada.precoUnidadeAtual}
        campo="precoUnidadeAtual"
        vazioQuandoZero
        onChange={(v) => alterar("precoUnidadeAtual", v)}
      />
    </>
  );
}

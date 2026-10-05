"use client";

import { useId } from "react";
import { Campo, inputClasses } from "@/components/calculator/Campo";
import { CamposSegmento } from "@/components/calculator/secoesCalculadora";
import type { useCalculadora } from "@/components/calculator/useCalculadora";
import { OFICINA } from "@/lib/copy/conta";

export type DadosOficina = {
  nome: string;
  cnpj: string;
  cidade: string;
};

/**
 * Aba "Oficina": identidade do negócio.
 *
 * O SEGMENTO MORA AQUI, e não numa configuração escondida: ele decide a
 * unidade de trabalho e as categorias de custo de todas as outras abas.
 * Quem precisa corrigir "marquei mecânica mas sou funilaria" tem de
 * achar o controle sem procurar.
 *
 * Reusa `CamposSegmento` — o mesmo componente do passo 1 do modo guiado.
 */
export function DadosDaOficina({
  valor,
  onChange,
  calc,
}: {
  valor: DadosOficina;
  onChange: (dados: DadosOficina) => void;
  calc: ReturnType<typeof useCalculadora>;
}) {
  const idNome = useId();
  const idCnpj = useId();

  return (
    <>
      <Campo label={OFICINA.nomeOficina} htmlFor={idNome}>
        <input
          id={idNome}
          value={valor.nome}
          onChange={(e) => onChange({ ...valor, nome: e.target.value })}
          className={inputClasses}
        />
      </Campo>

      <Campo label={OFICINA.cnpj} htmlFor={idCnpj}>
        <input
          id={idCnpj}
          value={valor.cnpj}
          inputMode="numeric"
          maxLength={18}
          placeholder={OFICINA.exemploCnpj}
          onChange={(e) => onChange({ ...valor, cnpj: mascararCnpj(e.target.value) })}
          className={`${inputClasses} tabular`}
        />
      </Campo>

      {/* Segmento e cidade: os mesmos campos do passo 1 do guiado. */}
      <CamposSegmento calc={calc} />
    </>
  );
}

/**
 * Máscara visual de CNPJ. NÃO valida dígito verificador de propósito:
 * o campo é opcional e serve para o usuário se reconhecer no cadastro.
 * Reprovar um CNPJ correto por bug de validação custa mais do que
 * aceitar um número mal digitado que ninguém vai consultar nesta leva.
 */
function mascararCnpj(bruto: string): string {
  const d = bruto.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatarMoeda } from "@/lib/pricing/format";
import { Campo, inputClasses } from "./Campo";

/**
 * Foco inicial só onde ele ajuda.
 *
 * 04-landing.md pede "primeiro campo já em foco". Em desktop isso é
 * ótimo. Em celular, forçar foco abre o teclado virtual, que ocupa
 * metade da tela e empurra o resultado para fora — o oposto exato do
 * que o requisito quer, que é o usuário ver o número reagir.
 *
 * `(pointer: fine)` distingue mouse de dedo melhor que largura de tela:
 * um tablet com teclado tem tela grande e dedo, e um laptop pequeno tem
 * tela estreita e mouse.
 */
function useFocoEmPonteiroFino(ativo: boolean) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ativo) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    ref.current?.focus();
  }, [ativo]);

  return ref;
}

/**
 * Campos numéricos da calculadora.
 *
 * Regras transversais de 03-telas.md e 06-dados.md:
 *   - label sempre visível acima; placeholder só com exemplo real
 *   - teclado numérico no celular
 *   - validação no blur, NUNCA a cada tecla — o cálculo é que é reativo,
 *     a mensagem de erro não. Corrigir alguém enquanto ele digita é a
 *     forma mais rápida de fazer a pessoa desistir do formulário.
 */

type BaseProps = {
  label: string;
  ajuda?: string;
  exemplo?: string;
  erro?: string;
  onBlur?: () => void;
  /** Chave em lib/copy/assistente.ts. Repassada ao envelope Campo. */
  campo?: string;
};

/**
 * Moeda com máscara de centavos: o usuário digita só dígitos e a vírgula
 * se posiciona sozinha. Digitar "320000" resulta em R$ 3.200,00.
 *
 * DESVIO DE 06-dados.md, que pede inputMode="decimal": com máscara de
 * centavos o separador é inserido automaticamente, então oferecer a
 * tecla de vírgula só para descartá-la confunde. inputMode="numeric"
 * entrega o teclado de dígitos, que é o que a máscara espera.
 */
export function CurrencyField({
  valor,
  onChange,
  vazioQuandoZero = false,
  focoInicialEmDesktop = false,
  label,
  ajuda,
  exemplo,
  erro,
  onBlur,
  campo,
}: BaseProps & {
  valor: number;
  onChange: (valor: number) => void;
  /** Para o salário, que abre em branco. Custo fixo mostra R$ 0,00. */
  vazioQuandoZero?: boolean;
  /** Foca na montagem, mas só onde há mouse. Ver useFocoEmPonteiroFino. */
  focoInicialEmDesktop?: boolean;
}) {
  const id = useId();
  const vazio = vazioQuandoZero && valor === 0;
  const ref = useFocoEmPonteiroFino(focoInicialEmDesktop);

  return (
    <Campo
      label={label}
      ajuda={ajuda}
      erro={erro}
      htmlFor={id}
      campo={campo}
    >
      <input
        id={id}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={vazio ? "" : formatarMoeda(valor)}
        placeholder={exemplo}
        onBlur={onBlur}
        onChange={(e) => {
          const digitos = e.target.value.replace(/\D/g, "");
          onChange(digitos === "" ? 0 : Number(digitos) / 100);
        }}
        className={`${inputClasses} tabular`}
        aria-invalid={erro ? true : undefined}
      />
    </Campo>
  );
}

/**
 * Percentual. O estado guarda fração (0,80); o campo mostra 80.
 * Converter na borda, nunca no meio do cálculo (06-dados.md).
 */
export function PercentField({
  fracao,
  onChange,
  label,
  ajuda,
  exemplo,
  erro,
  onBlur,
  campo,
}: BaseProps & {
  fracao: number;
  onChange: (fracao: number) => void;
}) {
  const id = useId();
  const [rascunho, setRascunho] = useState<string | null>(null);

  // Enquanto o usuário digita, respeita o texto dele (inclusive "8," a
  // meio caminho). Ao sair do campo, volta a espelhar a fração.
  const exibido = rascunho ?? formatarPercentualEditavel(fracao);

  return (
    <Campo
      label={label}
      ajuda={ajuda}
      erro={erro}
      htmlFor={id}
      campo={campo}
    >
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={exibido}
          placeholder={exemplo}
          onChange={(e) => {
            const texto = e.target.value.replace(/[^\d,.]/g, "");
            setRascunho(texto);
            const numero = Number(texto.replace(",", "."));
            if (Number.isFinite(numero)) onChange(numero / 100);
          }}
          onBlur={() => {
            setRascunho(null);
            onBlur?.();
          }}
          className={`${inputClasses} tabular pr-9`}
          aria-invalid={erro ? true : undefined}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-base text-petroleo-suave"
        >
          %
        </span>
      </div>
    </Campo>
  );
}

/** Inteiro ou decimal simples — quantidade de mecânicos, dias, unidades por dia. */
export function NumberField({
  valor,
  onChange,
  decimais = 0,
  min = 0,
  label,
  ajuda,
  exemplo,
  erro,
  onBlur,
  campo,
}: BaseProps & {
  valor: number;
  onChange: (valor: number) => void;
  decimais?: number;
  min?: number;
}) {
  const id = useId();
  const [rascunho, setRascunho] = useState<string | null>(null);
  const exibido = rascunho ?? (decimais > 0 ? String(valor).replace(".", ",") : String(valor));

  return (
    <Campo
      label={label}
      ajuda={ajuda}
      erro={erro}
      htmlFor={id}
      campo={campo}
    >
      <input
        id={id}
        type="text"
        inputMode={decimais > 0 ? "decimal" : "numeric"}
        value={exibido}
        placeholder={exemplo}
        onChange={(e) => {
          const texto = e.target.value.replace(decimais > 0 ? /[^\d,.]/g : /\D/g, "");
          setRascunho(texto);
          const numero = Number(texto.replace(",", "."));
          if (Number.isFinite(numero) && numero >= min) onChange(numero);
        }}
        onBlur={() => {
          setRascunho(null);
          onBlur?.();
        }}
        className={`${inputClasses} tabular`}
        aria-invalid={erro ? true : undefined}
      />
    </Campo>
  );
}

/** 0,145 → "14,5" — sem o símbolo, que é sufixo visual do campo. */
function formatarPercentualEditavel(fracao: number): string {
  const valor = fracao * 100;
  const arredondado = Math.round(valor * 10) / 10;
  return String(arredondado).replace(".", ",");
}

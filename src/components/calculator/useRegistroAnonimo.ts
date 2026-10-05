"use client";

import { useEffect, useRef } from "react";
import { guardarCalculoAnonimo } from "@/app/(app)/calculadora/actions";
import type { Origem } from "@/lib/analytics/events";
import type { Calculo } from "@/lib/pricing/types";
import type { Segmento } from "@/lib/pricing/segmento";

/**
 * Persiste o cálculo anônimo que alimenta o benchmark.
 *
 * ═══ POR QUE ESPERAR O RESULTADO ASSENTAR ═══
 * O cálculo é reativo: ele muda a cada tecla. Gravar a cada mudança
 * inundaria o banco de rascunhos e enviesaria a mediana da região com
 * cálculos meio preenchidos. Espera-se um intervalo de silêncio, e o
 * que vai para a base é o número que o usuário parou de mexer.
 *
 * ═══ POR QUE UMA SESSÃO É UM REGISTRO ═══
 * `unique (sessao)` no banco, upsert aqui. Quem mexe nos sliders dez
 * vezes conta UMA na amostra — é a regra de N de 09-benchmark.md. Sem
 * isso, o usuário mais curioso pesa dez vezes mais que o mais decidido.
 *
 * ⚠️ Nada disso identifica ninguém: vão só os números do cálculo, o
 * segmento e a região. Sem e-mail, sem nome, sem CNPJ.
 */

const CHAVE_SESSAO = "calc:sessao";
const SILENCIO_MS = 4000;

function idDaSessao(): string {
  try {
    const existente = window.sessionStorage.getItem(CHAVE_SESSAO);
    if (existente) return existente;

    const novo = crypto.randomUUID();
    window.sessionStorage.setItem(CHAVE_SESSAO, novo);
    return novo;
  } catch {
    // Storage bloqueado: um id efêmero por montagem ainda é melhor que
    // não gravar. O upsert perde a dedupe, e é um custo aceitável.
    return crypto.randomUUID();
  }
}

export function useRegistroAnonimo({
  calculo,
  segmento,
  regiao,
  origem,
}: {
  calculo: Calculo;
  segmento: Segmento;
  regiao: string;
  origem: Origem;
}) {
  const ultimoEnviado = useRef<string | null>(null);

  useEffect(() => {
    if (!calculo.ok) return;

    const r = calculo.resultado;
    const payload = {
      segmento,
      regiao,
      origem,
      custoRealUnidade: r.custoRealUnidade,
      precoUnidadeSugerido: r.precoUnidadeSugerido,
      pontoDeEquilibrio: r.pontoDeEquilibrio,
      unidadesProdutivas: r.unidadesProdutivas,
      ocupacao: r.unidadesProdutivas / (r.unidadesDisponiveis || 1),
      custoTotalMensal: r.custoTotalMensal,
    };

    const assinatura = JSON.stringify(payload);
    if (assinatura === ultimoEnviado.current) return;

    const timer = window.setTimeout(() => {
      ultimoEnviado.current = assinatura;
      // Fire and forget: a calculadora não espera, não mostra estado de
      // carregamento e não quebra se isto falhar.
      void guardarCalculoAnonimo({ sessao: idDaSessao(), ...payload }).catch(() => {});
    }, SILENCIO_MS);

    return () => window.clearTimeout(timer);
  }, [calculo, segmento, regiao, origem]);
}

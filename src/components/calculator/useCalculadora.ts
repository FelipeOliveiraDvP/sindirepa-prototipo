"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { track } from "@/lib/analytics/track";
import type { Origem } from "@/lib/analytics/events";
import {
  agregadoPadrao,
  paraCalculoInput,
  trocarSegmento,
  type EntradaAgregada,
} from "@/lib/pricing/aggregate";
import { calcular } from "@/lib/pricing/calculate";
import type { Segmento } from "@/lib/pricing/segmento";
import { REGIAO_NAO_INFORMADA } from "@/lib/regioes";

/** Chave do rascunho vindo do herói da landing. */
export const CHAVE_RASCUNHO = "calc:draft";

/** Dados da oficina que não entram na conta, mas definem o recorte do benchmark. */
export type PerfilOficina = {
  /** Id de lib/regioes.ts. Vazio = não informado. */
  cidade: string;
};

/**
 * Estado da calculadora + instrumentação.
 *
 * O cálculo é DERIVADO, nunca guardado em estado: `calcular` é pura e
 * roda a cada render sem custo relevante. Guardar o resultado abriria a
 * porta para ele ficar dessincronizado da entrada — que é o único bug
 * que uma calculadora não pode ter.
 *
 * INSTRUMENTAÇÃO — cada evento dispara UMA vez:
 *   calc_iniciada         na primeira interação
 *   calc_campo_alterado   na primeira vez que cada campo é mexido
 *   calc_resultado_visto  na primeira vez que existe resultado válido
 *   calc_passo_concluido  a cada passo vencido no modo guiado
 *
 * Disparar `calc_campo_alterado` a cada tecla inundaria o funil sem
 * acrescentar informação. O que a hipótese do produto precisa é da
 * SEQUÊNCIA de campos tocados, para achar onde o usuário para — e para
 * isso um evento por campo basta.
 */
export type OpcoesCalculadora = {
  /** Configuração vinda do banco. Quando presente, substitui os padrões. */
  inicial?: EntradaAgregada;
  /**
   * Ler o rascunho da landing. `false` em /oficina, onde a fonte de
   * verdade é o banco — puxar sessionStorage lá sobrescreveria a
   * configuração salva com o que sobrou de uma simulação anônima.
   */
  lerRascunho?: boolean;
};

export function useCalculadora(origem: Origem, opcoes: OpcoesCalculadora = {}) {
  const { inicial, lerRascunho = true } = opcoes;
  const { segmento, definirSegmento } = useSegmento();

  const [entrada, setEntrada] = useState<EntradaAgregada>(
    () => inicial ?? agregadoPadrao(segmento),
  );
  const [perfil, setPerfil] = useState<PerfilOficina>({ cidade: REGIAO_NAO_INFORMADA });
  const [tocados, setTocados] = useState<ReadonlySet<string>>(new Set());

  const jaIniciou = useRef(false);
  const jaViuResultado = useRef(false);
  const camposInstrumentados = useRef<Set<string>>(new Set());

  /**
   * Reconcilia a lista de custos fixos quando o segmento muda por fora —
   * usuário que já escolheu funilaria numa visita anterior chega aqui
   * com o segmento vindo do storage, e a lista precisa acompanhar.
   *
   * Ajuste de estado durante o render é o padrão documentado do React
   * para isso, e é melhor que um efeito: evita um render com a tela
   * mostrando categoria de mecânica e vocabulário de funilaria.
   */
  const [segmentoAnterior, setSegmentoAnterior] = useState<Segmento>(segmento);
  if (segmento !== segmentoAnterior) {
    setSegmentoAnterior(segmento);
    setEntrada((atual) => trocarSegmento(atual, segmento));
  }

  const calculoInput = useMemo(() => paraCalculoInput(entrada), [entrada]);
  const calculo = useMemo(
    () => calcular(calculoInput, { segmento }),
    [calculoInput, segmento],
  );

  /**
   * Recupera o rascunho do herói da landing, se houver.
   *
   * POR QUE sessionStorage e não query string: são os números do negócio
   * do usuário. Em query string eles vazam para URL, referrer e log de
   * analytics — e é o tipo de dado que o aviso de LGPD promete não
   * espalhar.
   *
   * POR QUE em efeito, com a regra desabilitada: o storage é sistema
   * externo, e ler dele na montagem é o caso que a própria regra
   * descreve como legítimo — ela só não consegue distinguir "ler uma vez
   * de fonte externa" de "derivar estado de props". As alternativas são
   * piores: inicializador preguiçoso quebra a hidratação (servidor não
   * tem storage), e desligar o SSR do formulário inteiro custa tempo até
   * o primeiro campo interativo, que é A métrica de performance daqui.
   *
   * O custo real é um render extra na montagem, e só quando existe
   * rascunho.
   */
  useEffect(() => {
    if (!lerRascunho) return;

    const bruto = window.sessionStorage.getItem(CHAVE_RASCUNHO);
    if (!bruto) return;

    try {
      const rascunho = JSON.parse(bruto) as Partial<EntradaAgregada>;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ver justificativa acima
      setEntrada((atual) => ({ ...atual, ...rascunho, segmento: atual.segmento }));
      // Não limpa a chave: se o usuário voltar para a landing e vier de
      // novo, o valor dele continua lá. Quem limpa é o logout.
    } catch {
      window.sessionStorage.removeItem(CHAVE_RASCUNHO);
    }
  }, [lerRascunho]);

  const marcarInicio = useCallback(() => {
    if (jaIniciou.current) return;
    jaIniciou.current = true;
    track({ nome: "calc_iniciada", origem });
  }, [origem]);

  const instrumentarCampo = useCallback(
    (campo: string) => {
      if (camposInstrumentados.current.has(campo)) return;
      camposInstrumentados.current.add(campo);
      track({ nome: "calc_campo_alterado", campo, origem });
    },
    [origem],
  );

  const alterar = useCallback(
    <K extends keyof EntradaAgregada>(campo: K, valor: EntradaAgregada[K]) => {
      marcarInicio();
      instrumentarCampo(campo);
      setEntrada((atual) => ({ ...atual, [campo]: valor }));
    },
    [marcarInicio, instrumentarCampo],
  );

  /**
   * Troca o segmento. Move duas coisas ao mesmo tempo, de propósito: o
   * vocabulário (provider, que persiste) e as categorias de custo
   * (entrada). Separar as duas é o que produziria a tela meio funilaria,
   * meio mecânica.
   */
  const alterarSegmento = useCallback(
    (novo: Segmento) => {
      marcarInicio();
      instrumentarCampo("segmento");
      definirSegmento(novo);
    },
    [marcarInicio, instrumentarCampo, definirSegmento],
  );

  const alterarCidade = useCallback(
    (cidade: string) => {
      marcarInicio();
      instrumentarCampo("cidade");
      setPerfil((atual) => ({ ...atual, cidade }));
    },
    [marcarInicio, instrumentarCampo],
  );

  /** Marca o campo como visitado — habilita a mensagem de erro dele. */
  const marcarTocado = useCallback((campo: string) => {
    setTocados((atual) => (atual.has(campo) ? atual : new Set(atual).add(campo)));
  }, []);

  const registrarPasso = useCallback(
    (passo: string) => track({ nome: "calc_passo_concluido", passo, origem }),
    [origem],
  );

  const registrarPulo = useCallback(
    (passo: string) => track({ nome: "calc_modo_guiado_pulado", passo, origem }),
    [origem],
  );

  useEffect(() => {
    if (calculo.ok && !jaViuResultado.current) {
      jaViuResultado.current = true;
      track({ nome: "calc_resultado_visto", origem });
    }
  }, [calculo.ok, origem]);

  /**
   * Erro de um campo específico, exibido só depois do blur.
   * Validação no blur, nunca a cada tecla (03-telas.md).
   */
  const erroDoCampo = useCallback(
    (campo: string): string | undefined => {
      if (calculo.ok || !tocados.has(campo)) return undefined;
      return calculo.erros.find((e) => e.campo === campo)?.mensagem;
    },
    [calculo, tocados],
  );

  return {
    entrada,
    perfil,
    segmento,
    calculo,
    calculoInput,
    alterar,
    alterarSegmento,
    alterarCidade,
    marcarTocado,
    erroDoCampo,
    registrarPasso,
    registrarPulo,
  };
}

export type EstadoCalculadora = ReturnType<typeof useCalculadora>;

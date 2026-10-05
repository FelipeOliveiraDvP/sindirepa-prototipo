"use client";

import { useState, useTransition } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { salvar } from "@/app/(app)/oficina/actions";
import { track } from "@/lib/analytics/track";
import { GUIADO, PRIVACIDADE } from "@/lib/copy/app";
import { OFICINA } from "@/lib/copy/conta";
import { AssistenteLateral } from "./Assistente";
import { ModoGuiado } from "./ModoGuiado";
import { ResultBarMobile, ResultPanel } from "./ResultPanel";
import {
  CamposComercial,
  CamposCustosFixos,
  CamposEquipe,
  CamposJornada,
  CamposSegmento,
} from "./secoesCalculadora";
import { Secao } from "./Secao";
import { useCalculadora, type EstadoCalculadora } from "./useCalculadora";
import { useModoCalculadora } from "./useModoCalculadora";
import { useRegistroAnonimo } from "./useRegistroAnonimo";

/**
 * A tela mais importante do produto (03-telas.md).
 *
 * DOIS MODOS, UM CÁLCULO
 *   primeira visita → guiado, um assunto por vez
 *   depois          → tela completa, tudo aberto, resultado sempre à vista
 *
 * Os dois rodam sobre o MESMO `useCalculadora` e renderizam os MESMOS
 * componentes de campo. O estado não é recriado na transição: quem
 * preencheu no guiado encontra tudo preenchido na tela completa.
 *
 * LAYOUT DA TELA COMPLETA
 *   desktop: duas colunas — entradas à esquerda, resultado à direita, sticky
 *   mobile:  empilhado, com o resultado numa barra fixa no rodapé que
 *            expande ao toque
 *
 * O resultado nunca sai da vista. Não é preferência de layout: é o
 * mecanismo de aprendizado da ferramenta. O usuário precisa ver o número
 * mudar enquanto mexe nos campos.
 *
 * Sem login. Sem botão "Calcular" — o cálculo é reativo.
 */
export function Calculadora() {
  const calc = useCalculadora("calculadora");
  const { modo, concluirGuiado, refazerGuiado } = useModoCalculadora();

  // Alimenta a base do benchmark. Vive aqui, e não dentro de um dos
  // modos, para que o registro aconteça igual nos dois caminhos.
  useRegistroAnonimo({
    calculo: calc.calculo,
    segmento: calc.segmento,
    regiao: calc.perfil.cidade,
    origem: "calculadora",
  });

  if (modo === "guiado") {
    return <ModoGuiado calc={calc} onConcluir={concluirGuiado} />;
  }

  return <TelaCompleta calc={calc} onRefazerGuiado={refazerGuiado} />;
}

function TelaCompleta({
  calc,
  onRefazerGuiado,
}: {
  calc: EstadoCalculadora;
  onRefazerGuiado: () => void;
}) {
  const { copy } = useSegmento();
  const [painelMobileAberto, setPainelMobileAberto] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-12">
      <h1 className="font-display text-2xl font-bold text-petroleo">{copy.TITULO}</h1>
      <p className="mt-2 text-base text-petroleo-suave">{copy.SUBTITULO}</p>

      <div className="mt-6 gap-8 md:grid md:grid-cols-[1fr_380px] md:items-start">
        {/* ENTRADAS */}
        <div className="space-y-4 pb-64 md:pb-0">
          {/* Espelha o passo 1 do guiado. Os dois modos têm exatamente
              as mesmas cinco seções — é o que impede de divergirem. */}
          <Secao
            titulo={copy.SECOES.oficina.titulo}
            descricao={copy.SECOES.oficina.descricao}
          >
            <CamposSegmento calc={calc} />
          </Secao>

          <Secao titulo={copy.SECOES.equipe.titulo} descricao={copy.SECOES.equipe.descricao}>
            <CamposEquipe calc={calc} />
          </Secao>

          <Secao
            titulo={copy.SECOES.jornada.titulo}
            descricao={copy.SECOES.jornada.descricao}
          >
            <CamposJornada calc={calc} />
          </Secao>

          <CamposCustosFixos calc={calc} />

          <Secao
            titulo={copy.SECOES.comercial.titulo}
            descricao={copy.SECOES.comercial.descricao}
          >
            <CamposComercial calc={calc} />
          </Secao>

          <button
            type="button"
            onClick={onRefazerGuiado}
            className="touch-target text-sm text-petroleo-suave underline underline-offset-4 hover:text-petroleo"
          >
            {GUIADO.refazer}
          </button>

          <p className="text-xs text-petroleo-suave">{PRIVACIDADE.calculoAnonimo}</p>
        </div>

        {/* ASSISTENTE E RESULTADO — desktop, sticky */}
        {/* Resultado e assistente dividem a coluna da direita. Uma
            terceira coluna espremeria as três coisas.
            ═══ ORDEM INVERTIDA NA LEVA 4.1 ═══
            O resultado ficava no topo, "porque é onde o olho volta".
            Só que quem está preenchendo ainda não tem resultado para
            olhar — tem uma dúvida sobre onde achar o número. O
            assistente sobe; o resultado continua visível logo abaixo,
            e sticky, então nenhuma das duas some ao rolar. */}
        <aside className="hidden md:sticky md:top-6 md:block">
          <AssistenteLateral />
          <div className="mt-4">
            <ResultPanel calculo={calc.calculo} entrada={calc.calculoInput} />
          </div>
          <DepoisDoResultado calc={calc} />
        </aside>
      </div>

      {/*
       * RESULTADO — mobile, barra fixa que expande.
       *
       * Fica ACIMA da barra de navegação, não em bottom-0: as duas são
       * fixas no rodapé, e a nav (z-50) cobria o resultado (z-10) —
       * justamente o elemento que nunca pode sair da vista. O bug
       * nasceu quando a navegação passou a aparecer, com o segundo
       * destino, e foi o check:e2e que o encontrou.
       *
       * O deslocamento acompanha a área segura do aparelho, igual à nav.
       */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 md:hidden">
        {painelMobileAberto ? (
          <div className="max-h-[70vh] overflow-y-auto border-t border-border bg-surface-alt p-4">
            <ResultPanel calculo={calc.calculo} entrada={calc.calculoInput} />
            <DepoisDoResultado calc={calc} />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setPainelMobileAberto((v) => !v)}
          aria-expanded={painelMobileAberto}
          className="touch-target w-full bg-petroleo px-4 py-3 text-left text-text-inverse"
        >
          <ResultBarMobile calculo={calc.calculo} />
          <span className="mt-0.5 block text-xs text-text-inverse/70">
            {painelMobileAberto ? "toque para fechar" : "toque para ver a composição"}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * O que fazer depois do resultado.
 *
 * ═══ POR QUE O BOTÃO DE SALVAR VIVE AQUI ═══
 * A calculadora exige conta (Leva 3), então quem está nesta tela SEMPRE
 * tem sessão. Sem este botão, o usuário preenchia tudo e não tinha como
 * guardar: teria que redigitar em /oficina, que carrega do banco e
 * ignora o que está na tela.
 *
 * Isso foi encontrado pelo `check:e2e`, não por leitura de código — o
 * painel abria sem números porque nada chegava ao banco.
 *
 * Discreto e não bloqueante (03-telas.md): aparece DEPOIS do resultado,
 * nunca antes.
 *
 * ⬜ Adiante: envio por e-mail e PDF, com consentimento LGPD explícito
 * antes de persistir o e-mail.
 */
function DepoisDoResultado({ calc }: { calc: EstadoCalculadora }) {
  const { copy } = useSegmento();
  const [salvando, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  const podeSalvar = calc.calculo.ok;

  function aoSalvar() {
    setAviso(null);
    iniciar(async () => {
      const r = await salvar(calc.entrada, undefined);
      if (r.ok) {
        track({ nome: "config_salva" });
        setAviso(OFICINA.salvo);
      } else {
        setAviso(OFICINA.erroSalvar);
      }
    });
  }

  return (
    <div className="mt-4 rounded-card border border-border bg-surface p-4">
      <p className="text-sm text-petroleo-suave">Guarde esse cálculo para voltar depois.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={aoSalvar}
          disabled={salvando || !podeSalvar}
          className="touch-target rounded-button bg-primary px-4 text-sm font-medium text-text-inverse hover:bg-primary-hover disabled:opacity-50"
        >
          {salvando ? OFICINA.salvando : copy.ACOES.salvarConfiguracao}
        </button>
        <button
          type="button"
          disabled
          className="touch-target rounded-button border border-border px-4 text-sm font-medium text-petroleo disabled:opacity-50"
        >
          {copy.ACOES.receberPorEmail}
        </button>
      </div>
      {aviso ? (
        <p role="status" className="mt-2 text-sm text-petroleo-suave">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}

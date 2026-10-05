"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Valor numérico que sinaliza a DIREÇÃO da mudança por alguns segundos.
 *
 * POR QUE EXISTE: ver o número mudar é o mecanismo pedagógico do produto
 * (02-produto.md), mas "mudou" não é a informação toda — o usuário
 * precisa saber se o que ele acabou de mexer encareceu ou baratearam a
 * unidade. A seta responde isso sem exigir que ele memorize o valor
 * anterior.
 *
 * ═══ REGRA DO VERMELHO — revisada (05-marca.md) ═══
 * Até a Leva 4, movimento ruim usava Carbono porque vermelho de marca
 * colidiria com "prejuízo". Decisão do Felipe reverteu isso: o padrão
 * do setor (verde sobe, vermelho desce) é lido de relance, e manter o
 * número neutro obrigava a ler o texto para saber se piorou. Custo
 * maior é sempre pior — fica vermelho; custo/margem melhor fica verde.
 *
 * O vermelho aqui é o token `danger` (#C63122), não o Vermelho Sinal
 * dos botões (#E23B2E) — mesma leitura de "ruim", sem competir com CTA.
 *
 * Vale só para métricas sobre o PRÓPRIO custo/margem da oficina. Nunca
 * para posição de mercado (`/benchmark`): dizer que o preço está "abaixo
 * da mediana" é fato de posicionamento, não avaliação de bom/ruim —
 * colorir isso viraria conselho de preço, que `docs/saas/09-benchmark.md`
 * proíbe.
 *
 * A direção nunca é comunicada só por cor — sempre há o glifo da seta
 * mais um texto para leitor de tela. Requisito de acessibilidade
 * (05-marca.md).
 */

export type Sentido =
  /** Subir é bom: unidades disponíveis, margem. */
  | "subir-bom"
  /** Subir é ruim: custo, ponto de equilíbrio. */
  | "subir-ruim"
  /** Sem juízo de valor: preço sugerido. */
  | "neutro";

/**
 * A mesma decisão de cor usada aqui, exportada para o comparativo
 * estático "antes → depois" do `/e-se` — que não flasheia (não é um
 * valor ao vivo), mas precisa da MESMA tabela bom/ruim/neutro, para as
 * duas telas nunca divergirem sobre o que é "verde" e o que é "vermelho".
 */
export function corDoSentido(
  direcao: "subiu" | "desceu",
  sentido: Sentido,
): "text-success" | "text-danger" | "text-petroleo-suave" {
  if (sentido === "neutro") return "text-petroleo-suave";
  const bom = (direcao === "subiu") === (sentido === "subir-bom");
  return bom ? "text-success" : "text-danger";
}

const DURACAO_MS = 1500;

export function ValorReativo({
  valor,
  formatar,
  sentido = "neutro",
  sufixo,
  className = "",
}: {
  valor: number;
  formatar: (valor: number) => string;
  sentido?: Sentido;
  sufixo?: string;
  className?: string;
}) {
  const anterior = useRef(valor);
  const [direcao, setDirecao] = useState<"subiu" | "desceu" | null>(null);

  useEffect(() => {
    const antes = anterior.current;
    anterior.current = valor;

    // Sair de zero é o primeiro cálculo aparecendo, não uma variação.
    // Sinalizar "subiu" aí ensinaria a coisa errada.
    if (antes === valor || antes === 0) return;

    setDirecao(valor > antes ? "subiu" : "desceu");
    const t = window.setTimeout(() => setDirecao(null), DURACAO_MS);
    return () => window.clearTimeout(t);
  }, [valor]);

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span key={valor} className="valor-mudou">
        {formatar(valor)}
        {sufixo}
      </span>
      {direcao ? <Seta direcao={direcao} sentido={sentido} /> : null}
    </span>
  );
}

function Seta({
  direcao,
  sentido,
}: {
  direcao: "subiu" | "desceu";
  sentido: Sentido;
}) {
  const cor = corDoSentido(direcao, sentido);

  return (
    <span className={`text-sm ${cor}`}>
      <span aria-hidden>{direcao === "subiu" ? "↑" : "↓"}</span>
      <span className="sr-only">{direcao === "subiu" ? "subiu" : "desceu"}</span>
    </span>
  );
}

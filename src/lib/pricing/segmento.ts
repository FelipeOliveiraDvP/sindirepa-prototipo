import {
  UNIDADE_HORA,
  UNIDADE_UT,
  WORK_UNIT_LABEL,
  type UnitLabel,
  type WorkUnit,
} from "./config";
import type { CustoFixo } from "./types";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  SEGMENTO DA OFICINA — mecânica e funilaria
 * ═══════════════════════════════════════════════════════════════════
 *
 * A decisão de segmento foi fechada com SENAI e SINDIREPA: as duas.
 * Registro em docs/geral/01-contexto.md.
 *
 * O segmento governa TRÊS coisas e NENHUMA CONTA:
 *   1. a unidade de trabalho (hora × UT)
 *   2. as categorias de custo fixo oferecidas
 *   3. as funções produtivas e como o produtivo é chamado na copy
 *
 * A aritmética dos 7 passos de calculate.ts é idêntica nos dois. Se
 * alguma mudança aqui alterar um número, é bug — existe teste para isso.
 *
 * ELÉTRICA NÃO É SEGMENTO. O protótipo Lovable oferecia a opção, mas
 * oficina elétrica usa a mesma unidade e a mesma estrutura de custo da
 * mecânica; separar criaria uma terceira configuração sem diferença de
 * comportamento. Entra como função de produtivo dentro de mecânica.
 */

export type Segmento = "mecanica" | "funilaria";

/**
 * Como chamar quem vende unidade de trabalho, neste segmento.
 *
 * Existe porque "mecânico" estava hardcoded em validate.ts e explain.ts
 * — correto em mecânica, errado em funilaria. "produtivo" é o termo do
 * setor para quem põe a mão no carro, e está no glossário aprovado de
 * docs/geral/07-copy.md ("mecânico / produtivo"). O mesmo glossário
 * proíbe "colaborador", "técnico" e "profissional".
 */
export type RotuloProdutivo = {
  singular: string;
  plural: string;
};

/**
 * Unidade + rótulo do produtivo. É o que validate.ts e explain.ts
 * precisam para escrever mensagem sem literal de segmento.
 */
export type Lexico = {
  unit: UnitLabel;
  produtivo: RotuloProdutivo;
};

export type DefinicaoSegmento = {
  id: Segmento;
  label: string;
  unidade: WorkUnit;
  produtivo: RotuloProdutivo;
  /** Oferecidas no cadastro de equipe. Lista aberta — o usuário pode digitar outra. */
  funcoesProdutivas: readonly string[];
  /** Categorias específicas, somadas às comuns. Todas entram em R$ 0. */
  categoriasCustoFixoAdicionais: readonly string[];
};

/**
 * Categorias comuns aos dois segmentos — 06-dados.md.
 * Lista aberta e sugerida, todas em R$ 0.
 */
export const CATEGORIAS_CUSTO_FIXO_COMUNS = [
  "Aluguel",
  "Energia",
  "Água",
  "Internet e telefone",
  "Contador",
  "Software de gestão",
  "Seguros",
  "Salários administrativos + encargos",
  "Pró-labore",
  "Manutenção e ferramental",
  "Marketing",
  "Outros",
] as const;

export const SEGMENTOS: Record<Segmento, DefinicaoSegmento> = {
  mecanica: {
    id: "mecanica",
    label: "Mecânica",
    unidade: UNIDADE_HORA,
    produtivo: { singular: "mecânico", plural: "mecânicos" },
    funcoesProdutivas: ["Mecânico", "Eletricista", "Auxiliar"],
    categoriasCustoFixoAdicionais: [],
  },
  funilaria: {
    id: "funilaria",
    label: "Funilaria e pintura",
    unidade: UNIDADE_UT,
    produtivo: { singular: "produtivo", plural: "produtivos" },
    funcoesProdutivas: ["Funileiro", "Pintor", "Preparador", "Auxiliar"],
    /**
     * ⚠️ Tinta e material de pintura são consumo POR SERVIÇO, não custo
     * fixo. Entram como média mensal, e o rótulo diz isso — a fórmula
     * divide custo total por unidades produtivas, então a média mensal
     * se comporta corretamente. O que não pode é o rótulo mentir sobre
     * a natureza do custo (06-dados.md).
     */
    categoriasCustoFixoAdicionais: [
      "Tinta e vernizes (média mensal)",
      "Material de pintura — lixa, massa, fita (média mensal)",
      "Cabine de pintura — energia, gás e manutenção",
      "EPI e filtros",
      "Descarte de resíduos",
    ],
  },
};

/** Mecânica é o padrão: é o segmento das landings e do ICP descrito no 01-contexto. */
export const SEGMENTO_PADRAO: Segmento = "mecanica";

export const SEGMENTOS_DISPONIVEIS: readonly Segmento[] = ["mecanica", "funilaria"];

export function definicaoDoSegmento(segmento: Segmento = SEGMENTO_PADRAO): DefinicaoSegmento {
  return SEGMENTOS[segmento] ?? SEGMENTOS[SEGMENTO_PADRAO];
}

export function unitDoSegmento(segmento: Segmento = SEGMENTO_PADRAO): UnitLabel {
  return WORK_UNIT_LABEL[definicaoDoSegmento(segmento).unidade];
}

export function lexicoDoSegmento(segmento: Segmento = SEGMENTO_PADRAO): Lexico {
  const def = definicaoDoSegmento(segmento);
  return { unit: WORK_UNIT_LABEL[def.unidade], produtivo: def.produtivo };
}

/** Léxico das landings e default de retrocompatibilidade da lib. */
export const LEXICO_PADRAO: Lexico = lexicoDoSegmento(SEGMENTO_PADRAO);

/** Comuns + específicas do segmento, nesta ordem. */
export function categoriasCustoFixo(segmento: Segmento = SEGMENTO_PADRAO): readonly string[] {
  return [
    ...CATEGORIAS_CUSTO_FIXO_COMUNS,
    ...definicaoDoSegmento(segmento).categoriasCustoFixoAdicionais,
  ];
}

/**
 * Categorias sugeridas do segmento, todas em R$ 0.
 *
 * Nunca preencher com valor: número que o usuário não digitou pode
 * passar por referência de mercado, e CLAUDE.md proíbe.
 */
export function custosFixosPadrao(segmento: Segmento = SEGMENTO_PADRAO): CustoFixo[] {
  return categoriasCustoFixo(segmento).map((categoria) => ({
    categoria,
    valorMensal: 0,
    ativo: true,
  }));
}

export function ehSegmento(valor: unknown): valor is Segmento {
  return typeof valor === "string" && valor in SEGMENTOS;
}

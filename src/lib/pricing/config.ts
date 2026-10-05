/**
 * Unidade de trabalho como token, nunca como literal.
 * Abstração obrigatória #2 — docs/geral/06-dados.md.
 *
 * POR QUE: oficina mecânica vende hora; funilaria e pintura vendem UT,
 * e a decisão de segmento está em aberto (docs/geral/01-contexto.md).
 * Se o literal "hora" vazar para label, copy ou nome de campo, atender
 * colisão vira reescrita textual em dezenas de arquivos.
 *
 * Este é o ÚNICO arquivo autorizado a conter o literal da unidade.
 * scripts/check-tokens.mjs falha o build se ele aparecer em outro lugar.
 */

export type WorkUnit = "hora" | "UT";

/**
 * Os literais da unidade, isolados aqui para que nenhum outro arquivo
 * precise escrevê-los. `segmento.ts` importa estes — escrever o literal
 * lá quebraria check-tokens.
 */
export const UNIDADE_HORA: WorkUnit = "hora";
export const UNIDADE_UT: WorkUnit = "UT";

/**
 * Unidade estática, usada onde não há usuário e portanto não há
 * segmento: as landings (SSG, de aquisição, falam para mecânica).
 *
 * Dentro de `(app)` a unidade vem do segmento do usuário — ver
 * `unitDoSegmento` em segmento.ts. Mecânica opera em hora, funilaria
 * em UT (docs/geral/01-contexto.md).
 */
export const WORK_UNIT: WorkUnit = UNIDADE_HORA;

/**
 * As formas flexionadas são explícitas, não derivadas por concatenação.
 * Copy em pt-BR precisa de contração ("da hora", não "de a hora") e
 * montar isso com template string quebra na primeira unidade de gênero
 * masculino que aparecer.
 */
export const WORK_UNIT_LABEL = {
  hora: {
    singular: "hora",
    plural: "horas",
    /** Sufixo curto para valor em destaque: "R$ 71,40 /h" */
    abbrev: "h",
    /** Com artigo definido: "a hora custa..." */
    definite: "a hora",
    /** Com preposição contraída: "o custo real da hora" */
    ofDefinite: "da hora",
    /** Por unidade: "R$ 18,40 por hora" */
    per: "por hora",
  },
  UT: {
    singular: "UT",
    plural: "UTs",
    abbrev: "UT",
    definite: "a UT",
    ofDefinite: "da UT",
    per: "por UT",
  },
} as const satisfies Record<WorkUnit, UnitLabel>;

export type UnitLabel = {
  singular: string;
  plural: string;
  abbrev: string;
  definite: string;
  ofDefinite: string;
  per: string;
};

/**
 * Rótulos da unidade estática. Ponto de entrada da copy das landings
 * e padrão de retrocompatibilidade da lib.
 *
 * ⚠️ Não usar dentro de `(app)`: lá a unidade depende do segmento.
 */
export const unit = WORK_UNIT_LABEL[WORK_UNIT];

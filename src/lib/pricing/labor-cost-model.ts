import { somarReais } from "./money";
import type { Produtivo } from "./types";

/**
 * Modelo de custo de mão de obra plugável.
 * Abstração obrigatória #1 — docs/geral/06-dados.md.
 *
 * POR QUE EXISTE AGORA, com uma só implementação: em oficina mecânica
 * o mecânico é salário fixo + encargos; em funilaria, funileiro e
 * pintor costumam trabalhar por comissão, e o custo migra de fixo para
 * variável. A decisão de segmento está aberta
 * (docs/geral/01-contexto.md) e a interface custa quase nada hoje.
 */

export type LaborCostInput = {
  produtivos: Produtivo[];
  /** Só modelos variáveis usam. Ver o aviso sobre `comissao` abaixo. */
  faturamentoMensal?: number;
};

export type LaborCostModelId = "salario_fixo" | "comissao";

export interface LaborCostModel {
  readonly id: LaborCostModelId;
  monthlyLaborCost(input: LaborCostInput): number;
}

export function produtivosAtivos(produtivos: Produtivo[]): Produtivo[] {
  return produtivos.filter((p) => p.ativo !== false);
}

/**
 * Σ (salarioBruto × (1 + percentualEncargos)) dos produtivos ativos.
 * Único modelo implementado na Leva 1.
 */
export const salarioFixoModel: LaborCostModel = {
  id: "salario_fixo",
  monthlyLaborCost({ produtivos }) {
    return somarReais(
      produtivosAtivos(produtivos).map((p) => p.salarioBruto * (1 + p.percentualEncargos)),
    );
  },
};

/**
 * ⚠️ AVISO PARA QUEM FOR IMPLEMENTAR `comissao` — NÃO É TROCAR UMA LINHA.
 *
 * Comissão é percentual do serviço. Então:
 *   custo de mão de obra → depende do faturamento
 *   faturamento          → depende do preço
 *   preço                → depende do custo
 *
 * O cálculo vira CIRCULAR. Vai exigir resolução iterativa (ponto fixo)
 * ou reformulação algébrica isolando o preço. Registrado em
 * 06-dados.md para não virar surpresa, e repetido aqui porque é aqui
 * que a pessoa vai chegar.
 */
export const MODELOS: Partial<Record<LaborCostModelId, LaborCostModel>> = {
  salario_fixo: salarioFixoModel,
};

export function getLaborCostModel(id: LaborCostModelId = "salario_fixo"): LaborCostModel {
  const model = MODELOS[id];
  if (!model) {
    throw new Error(
      `Modelo de custo de mão de obra "${id}" não implementado nesta leva. ` +
        `Ver o aviso sobre cálculo circular em src/lib/pricing/labor-cost-model.ts.`,
    );
  }
  return model;
}

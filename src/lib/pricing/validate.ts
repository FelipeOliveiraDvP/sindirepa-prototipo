import { TETO_SANIDADE_UNIDADE } from "./defaults";
import { produtivosAtivos } from "./labor-cost-model";
import { LEXICO_PADRAO, type Lexico } from "./segmento";
import type { Aviso, CalculoInput, CalculoResultado, ErroValidacao } from "./types";

/**
 * Casos-limite de docs/geral/06-dados.md.
 *
 * Duas categorias, e a diferença importa:
 *   ERRO  bloqueia o cálculo. Existe para nunca renderizar Infinity nem
 *         divisão por zero na tela.
 *   AVISO calcula normalmente e sinaliza. O usuário não é impedido de
 *         nada — só informado.
 *
 * Tom das mensagens: [o que aconteceu] + [como resolver]. Sem a palavra
 * "erro", sem "falha inesperada", e nunca culpando o usuário
 * (docs/geral/07-copy.md).
 *
 * `lexico` traz a unidade e o rótulo do produtivo do segmento. O padrão
 * é mecânica, para que chamador antigo continue correto — em funilaria
 * as mesmas mensagens saem em UT e falam "produtivo", não "mecânico".
 */
export function validar(
  input: CalculoInput,
  lexico: Lexico = LEXICO_PADRAO,
): ErroValidacao[] {
  const { unit, produtivo } = lexico;
  const erros: ErroValidacao[] = [];
  const { jornada, parametros } = input;
  const ativos = produtivosAtivos(input.produtivos);

  if (ativos.length === 0) {
    erros.push({
      codigo: "sem_produtivos",
      campo: "produtivos",
      mensagem: `Informe pelo menos um ${produtivo.singular} para calcular o custo ${unit.ofDefinite}.`,
    });
  }

  /**
   * O salário não tem padrão (ver a exceção em defaults.ts), então a
   * calculadora abre sem poder calcular. Bloquear é melhor que devolver
   * R$ 0,00: um zero na tela parece um cálculo e ensina a coisa errada.
   *
   * Só bloqueia quando NENHUM ativo tem salário. Um produtivo específico
   * com salário em branco numa equipe de quatro apenas contribui zero —
   * a oficina pode estar com uma vaga aberta.
   */
  if (ativos.length > 0 && ativos.every((p) => p.salarioBruto <= 0)) {
    erros.push({
      codigo: "sem_salario",
      campo: "salarioBruto",
      mensagem: `Informe o salário médio dos seus ${produtivo.plural} para calcular o custo ${unit.ofDefinite}.`,
    });
  }

  if (jornada.ocupacao <= 0) {
    erros.push({
      codigo: "ocupacao_zero",
      campo: "ocupacao",
      mensagem: `Com ocupação em zero, nenhuma ${unit.singular} é vendida e não há como dividir o custo. Informe a ocupação real da sua equipe.`,
    });
  }

  if (jornada.ocupacao > 1) {
    erros.push({
      codigo: "ocupacao_acima_de_100",
      campo: "ocupacao",
      mensagem: `A taxa de ocupação não pode passar de 100% — não é possível vender mais ${unit.plural} do que a equipe tem disponível.`,
    });
  }

  if (jornada.diasUteisMes <= 0 || jornada.unidadesPorDia <= 0) {
    erros.push({
      codigo: "jornada_invalida",
      campo: jornada.diasUteisMes <= 0 ? "diasUteisMes" : "unidadesPorDia",
      mensagem: `Informe quantos dias a oficina abre por mês e quantas ${unit.plural} a equipe trabalha por dia.`,
    });
  }

  if (parametros.impostosSobreFaturamento + parametros.margemDesejada >= 1) {
    erros.push({
      codigo: "impostos_e_margem_acima_de_100",
      campo: "margemDesejada",
      mensagem:
        "Impostos e margem somam mais de 100%. Reduza um dos dois para o cálculo funcionar.",
    });
  }

  return erros;
}

/**
 * Avisos que dependem do resultado. Não bloqueiam.
 *
 * O aviso de implausibilidade tem de APONTAR O CAMPO — avisar "algo
 * parece errado" sem dizer o quê deixa o usuário travado, e travar o
 * usuário é o risco número um do produto (CLAUDE.md).
 */
export function avisosDoResultado(
  input: CalculoInput,
  resultado: CalculoResultado,
  lexico: Lexico = LEXICO_PADRAO,
): Aviso[] {
  const { unit } = lexico;
  const avisos: Aviso[] = [];

  const totalCustosFixos = input.custosFixos
    .filter((c) => c.ativo !== false)
    .reduce((acc, c) => acc + c.valorMensal, 0);

  if (totalCustosFixos === 0) {
    avisos.push({
      codigo: "custos_fixos_zerados",
      campo: "custosFixos",
      mensagem:
        "Sem custos fixos informados, o resultado fica abaixo do custo real. Some aluguel, energia, contador e o que a oficina paga todo mês.",
    });
  }

  if (resultado.custoRealUnidade > TETO_SANIDADE_UNIDADE) {
    avisos.push({
      codigo: "resultado_implausivel",
      campo: campoMaisProvavel(input),
      mensagem: `O resultado ficou muito acima do esperado para uma ${unit.singular}. Confira se ${descricaoDoCampo(campoMaisProvavel(input))} está no valor certo.`,
    });
  }

  return avisos;
}

/**
 * Heurística de qual campo provavelmente foi digitado errado.
 * Ordem de suspeita: ocupação muito baixa infla o custo mais rápido que
 * qualquer outro campo, depois salário com um zero a mais.
 */
function campoMaisProvavel(input: CalculoInput): string {
  if (input.jornada.ocupacao < 0.2) return "ocupacao";

  const ativos = produtivosAtivos(input.produtivos);
  const maiorSalario = Math.max(0, ...ativos.map((p) => p.salarioBruto));
  if (maiorSalario > 50_000) return "salarioBruto";

  return "custosFixos";
}

function descricaoDoCampo(campo: string): string {
  switch (campo) {
    case "ocupacao":
      return "a taxa de ocupação";
    case "salarioBruto":
      return "o salário informado";
    default:
      return "o total de custos fixos";
  }
}

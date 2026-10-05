/**
 * Modelo de dados do cálculo. docs/geral/06-dados.md.
 *
 * NOMENCLATURA — por que `unidadesPorDia` e não `horasPorDia`:
 * o próprio 06-dados.md tokenizou metade do vocabulário
 * (`custoRealUnidade`, `precoUnidadeSugerido`) mas deixou `horasPorDia`
 * e `unidadesDisponiveis` convivendo. A regra de CLAUDE.md é explícita
 * — nada de literal da unidade em "copy, label ou nome de campo" — então
 * o esquema aqui segue a regra, não o exemplo. Um campo chamado
 * `horasPorDia` seria a primeira coisa a reescrever no dia em que
 * funilaria entrar.
 *
 * Percentuais são fração (0,80 = 80%), nunca 0–100. Converter na borda
 * da interface, jamais no meio do cálculo.
 */

/** Quem vende unidade de trabalho. Não inclui balconista, gerente nem dono que não põe a mão. */
export type Produtivo = {
  id?: string;
  nome?: string;
  /**
   * R$/mês, salário bruto.
   * 0 significa "não informado" — ninguém paga R$ 0, então não há
   * ambiguidade. Não tem padrão: ver a exceção em defaults.ts.
   */
  salarioBruto: number;
  /** Fração. 0,80 = 80%. Cobre 13º, férias + 1/3, FGTS, INSS e benefícios. */
  percentualEncargos: number;
  ativo?: boolean;
};

export type CustoFixo = {
  id?: string;
  categoria: string;
  descricao?: string;
  /** R$/mês. */
  valorMensal: number;
  ativo?: boolean;
};

export type Jornada = {
  diasUteisMes: number;
  /** Unidades de trabalho disponíveis por dia, por produtivo. */
  unidadesPorDia: number;
  /** Fração. Unidades vendidas ÷ unidades disponíveis. */
  ocupacao: number;
};

export type ParametrosComerciais = {
  /** Fração do faturamento. */
  impostosSobreFaturamento: number;
  /** Fração sobre o preço de venda — markup divisor, não margem sobre custo. */
  margemDesejada: number;
  /** O que a oficina cobra hoje. Opcional; 0 é tratado como não informado. */
  precoUnidadeAtual?: number;
};

export type CalculoInput = {
  produtivos: Produtivo[];
  custosFixos: CustoFixo[];
  jornada: Jornada;
  parametros: ParametrosComerciais;
};

/**
 * Uma faixa da barra de composição do preço.
 *
 * Sem `label`: rótulo é copy, e copy vive em src/lib/copy/. A lib
 * devolve o `id` e a interface traduz. Assim a lib continua sem
 * nenhuma decisão de texto — exceto a memória de cálculo, que é
 * narrativa da própria fórmula e mora junto dela em explain.ts.
 */
export type FaixaComposicao = {
  id: "maoDeObra" | "custosFixos" | "impostos" | "margem";
  /** R$ por unidade de trabalho. */
  valorPorUnidade: number;
  /** Fração do preço sugerido, para a largura da faixa. */
  fracaoDoPreco: number;
};

export type Comparativo = {
  /** Positivo = o sugerido está acima do que a oficina cobra hoje. */
  diferencaPorUnidade: number;
  impactoMensal: number;
  /** Fração. Pode ser negativa — aí a oficina opera no prejuízo. */
  margemRealAtual: number;
  /** true quando o preço atual está abaixo do ponto de equilíbrio. */
  abaixoDoEquilibrio: boolean;
};

export type Aviso = {
  /** Identificador estável, para instrumentação. */
  codigo: "custos_fixos_zerados" | "resultado_implausivel";
  mensagem: string;
  /** Campo a apontar na interface. Requisito: avisar E dizer qual campo. */
  campo?: string;
};

export type ErroValidacao = {
  codigo:
    | "sem_produtivos"
    | "sem_salario"
    | "ocupacao_zero"
    | "ocupacao_acima_de_100"
    | "impostos_e_margem_acima_de_100"
    | "jornada_invalida";
  mensagem: string;
  campo: string;
};

export type CalculoResultado = {
  unidadesDisponiveis: number;
  unidadesProdutivas: number;
  custoMaoDeObra: number;
  custoFixoTotal: number;
  custoTotalMensal: number;
  custoRealUnidade: number;
  precoUnidadeSugerido: number;
  pontoDeEquilibrio: number;
  composicao: FaixaComposicao[];
  comparativo: Comparativo | null;
  avisos: Aviso[];
};

/** Cálculo bloqueado por entrada impossível. Nunca renderizar Infinity. */
export type CalculoInvalido = {
  ok: false;
  erros: ErroValidacao[];
};

export type CalculoValido = {
  ok: true;
  resultado: CalculoResultado;
};

export type Calculo = CalculoValido | CalculoInvalido;

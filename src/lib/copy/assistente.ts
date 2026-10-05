import { LEXICO_PADRAO, type Lexico } from "@/lib/pricing/segmento";

/**
 * Assistente de campo — onde encontrar cada número.
 *
 * ⚙️ A WORDING DESTE ARQUIVO VEM DE `docs/geral/07-copy.md`, seção
 * "Assistente de campo" — mesma convenção de `calculate.ts` apontar
 * para `06-dados.md`. Se o Felipe quiser mudar uma frase, edita lá
 * primeiro; este arquivo é sincronizado depois para bater exatamente.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 * `Campo.tsx` já tem o "o que é isso?", que responde **o que o campo
 * significa**. Não é onde o dono de oficina trava. Ele trava em **onde
 * eu acho esse número**: em qual papel, em qual conta, em qual pergunta
 * para o contador.
 *
 * É o princípio "Educativa" levado a sério — guiar no cálculo correto,
 * não só nomear os campos.
 *
 * ═══ REGRA 4 DO CLAUDE.md VALE AQUI DENTRO ═══
 * Nenhuma faixa de mercado. Explicar um PADRÃO que o produto já
 * preenche (encargos em 80%, ocupação em 70%, impostos em 6%) é
 * legítimo: o número está em `docs/geral/06-dados.md` e já está na
 * tela. Sugerir "salário típico de mecânico" NÃO é — seria inventar
 * referência de mercado, e o salário é justamente o único campo que
 * abre em branco por essa razão.
 *
 * ═══ TOM ═══
 * `docs/geral/07-copy.md`: consultor técnico que respeita o dono de
 * oficina. Ele entende de carro melhor que você; você entende de conta
 * melhor que ele. Nunca condescendente — ele não é ingênuo, ele nunca
 * teve o dado.
 */

export type AjudaDeCampo = {
  /** Em que papel, conta ou sistema o número está. */
  ondeEncontrar: string;
  /** Frase pronta para copiar e mandar ao contador. Sem aspas no texto. */
  perguntarAoContador?: string;
  /** Como chegar num número razoável quando não existe documento. */
  comoEstimar?: string;
  /** Erro comum que distorce o resultado. */
  cuidado?: string;
};

export function criarAssistente({ unit, produtivo }: Lexico) {
  return {
    segmento: {
      ondeEncontrar:
        "É o tipo de serviço que a sua oficina vende. Mecânica cobra por tempo de serviço; funilaria e pintura trabalham em UT e costumam negociar com seguradora.",
      cuidado:
        "Se você faz os dois, escolha o que responde pela maior parte do faturamento. Dá para trocar depois sem perder o que já preencheu.",
    },

    cidade: {
      ondeEncontrar: "A cidade onde a oficina atende.",
      comoEstimar:
        "Serve só para comparar você com oficinas da mesma região. Se a sua não estiver na lista, marque Outra — o cálculo funciona igual.",
    },

    quantidadeProdutivos: {
      ondeEncontrar: `Conte quem põe a mão no carro: ${produtivo.plural} e auxiliares que executam serviço.`,
      cuidado:
        "Balconista, gerente, recepção e você, se não estiver na bancada, NÃO entram aqui — eles entram em custos fixos, na linha de salários administrativos. Contá-los aqui divide o custo por gente que não vende serviço, e o resultado sai barato demais.",
    },

    salarioMedio: {
      ondeEncontrar:
        "Na folha de pagamento, ou no holerite. Some o salário bruto dos que você contou acima e divida pela quantidade.",
      perguntarAoContador:
        "Qual é o salário bruto médio dos meus funcionários de produção?",
      cuidado:
        "Use o salário BRUTO, sem encargos — eles entram no campo seguinte. Somar os dois aqui conta o encargo duas vezes.",
    },

    percentualEncargos: {
      ondeEncontrar:
        "Com o contador. É quanto você paga além do salário: FGTS, INSS, 13º, férias com o terço, e benefícios como vale-transporte e alimentação.",
      perguntarAoContador:
        "Qual é o meu percentual de encargos sobre a folha de pagamento?",
      comoEstimar:
        "Se ele não responder de imediato, deixe como está: o campo já vem com uma referência conservadora para CLT. Oficina no Simples costuma ficar mais baixo.",
    },

    diasUteisMes: {
      ondeEncontrar:
        "Quantos dias a oficina abre num mês normal. Conte sábado se você atende aos sábados.",
      cuidado: "É dia de porta aberta, não dia de calendário.",
    },

    unidadesPorDia: {
      ondeEncontrar: `Quantas ${unit.plural} cada ${produtivo.singular} fica à disposição por dia — do horário de entrada ao de saída, menos o almoço.`,
      cuidado:
        "Não é quanto ele produz, é quanto ele está lá. O quanto vira serviço vendido é o campo seguinte, e é lá que a diferença aparece.",
    },

    /**
     * Opcional, e é o único campo que não muda nenhum número do cálculo
     * — só destrava a leitura do equilíbrio em carros, no painel. Por
     * isso o texto diz logo que dá para pular.
     */
    unidadesPorCarro: {
      ondeEncontrar: `Olhe as últimas ordens de serviço que você fechou e veja quanto de mão de obra cada uma levou, em média. Se você não tem esse número à mão, pule — nada mais na tela depende dele.`,
      cuidado: `Conte só o trabalho, não a peça. E use o carro típico do seu dia a dia, não a revisão grande que aparece uma vez por mês.`,
    },

    /**
     * O campo mais difícil da tela e o que mais muda o resultado. A
     * hipótese do produto é que é aqui que o usuário desiste — por isso
     * ele ganha o texto mais longo e uma forma concreta de estimar.
     */
    ocupacao: {
      ondeEncontrar:
        "Esse número quase nenhuma oficina tem anotado, e não tem problema — dá para estimar bem.",
      comoEstimar: `Pense na semana passada. De todas as ${unit.plural} em que sua equipe ficou na oficina, quantas você conseguiu efetivamente cobrar de um cliente? O resto foi espera de peça, orçamento que não fechou, retrabalho, organização, carro parado no box aguardando aprovação. Se der 7 de 10, sua ocupação é 70%.`,
      cuidado:
        "Quem coloca 100% está dizendo que nunca houve um minuto ocioso no mês inteiro. Isso não existe, e o resultado sai barato demais — é o erro que mais faz oficina cobrar abaixo do custo.",
    },

    /**
     * Fallback: categoria sem entrada própria abaixo (inclui "Outros" e
     * qualquer categoria futura sem texto específico ainda).
     */
    custosFixos: {
      ondeEncontrar:
        "Tudo que a oficina paga todo mês mesmo sem entrar carro nenhum. Um jeito rápido: abra o extrato bancário do mês passado e percorra os débitos.",
      perguntarAoContador:
        "Pode me mandar a relação das despesas fixas mensais da oficina?",
      cuidado:
        "Não esqueça o seu pró-labore. Muitos donos deixam de fora o próprio salário, e aí o cálculo mostra um custo menor do que a realidade — a oficina parece dar lucro enquanto o dono trabalha de graça.",
    },

    /**
     * Uma entrada por categoria da lista de custos fixos — em vez do
     * texto genérico acima repetido doze vezes. `campoCustoFixo()`
     * mapeia o literal exato de `CATEGORIAS_CUSTO_FIXO_COMUNS` /
     * `categoriasCustoFixoAdicionais` (segmento.ts) para a chave aqui.
     */
    custoFixoAluguel: {
      ondeEncontrar:
        "No contrato de locação ou no boleto/recibo que você paga todo mês pelo imóvel.",
      cuidado:
        "Se o imóvel é seu, ainda assim conte um aluguel — pelo valor que você cobraria de outro inquilino. Não contar é subestimar o custo real da oficina.",
    },

    custoFixoEnergia: {
      ondeEncontrar:
        "Na conta de luz dos últimos meses. Tire uma média de 2 ou 3 meses — o consumo varia com o uso de compressor, elevador e iluminação.",
    },

    custoFixoAgua: {
      ondeEncontrar: "Na conta de água/saneamento dos últimos meses.",
    },

    custoFixoInternetTelefone: {
      ondeEncontrar:
        "Nas faturas da operadora de internet e do telefone (fixo ou celular) da oficina.",
    },

    custoFixoContador: {
      ondeEncontrar: "No boleto mensal de honorários do escritório de contabilidade.",
    },

    custoFixoSoftwareGestao: {
      ondeEncontrar:
        "Na fatura de assinatura do sistema que você usa para orçamento, ordem de serviço ou financeiro.",
    },

    custoFixoSeguros: {
      ondeEncontrar:
        "Na apólice ou no boleto do seguro da oficina — prédio, responsabilidade civil, ou frota, se tiver.",
    },

    custoFixoSalariosAdministrativos: {
      ondeEncontrar:
        "Folha de quem NÃO põe a mão no carro: recepção, financeiro, gerência. Some salário bruto + encargos dessas pessoas.",
      cuidado:
        "Quem está na bancada entra em outro lugar, lá atrás, na contagem de mecânicos/produtivos. Contar a mesma pessoa aqui e lá infla o custo.",
    },

    custoFixoProLabore: {
      ondeEncontrar:
        "O que você retira todo mês da empresa pelo seu trabalho de dono — diferente de lucro. Se hoje você não define um valor fixo, este é o momento de arbitrar um.",
      cuidado:
        "Não deixe zerado. Sem pró-labore, o cálculo mostra um custo menor que o real — a oficina parece dar lucro enquanto você trabalha de graça.",
    },

    custoFixoManutencaoFerramental: {
      ondeEncontrar:
        "Gastos recorrentes com manutenção de equipamento (elevador, compressor, alinhamento) e reposição de ferramentas. Use a média dos últimos meses, não o mês em que comprou algo caro.",
    },

    custoFixoMarketing: {
      ondeEncontrar:
        "O que você gasta com anúncios (Google, Instagram, panfletos) e mensalidade de plataformas de indicação ou avaliação, se tiver.",
    },

    custoFixoTintaVernizes: {
      ondeEncontrar:
        "Consumo médio mensal de tinta e verniz, não o valor de uma compra isolada. Pegue as últimas notas do fornecedor e calcule a média.",
      cuidado:
        "Isto é insumo por serviço, não custo fixo de verdade — entra aqui como média porque o cálculo divide o total pelas unidades produzidas no mês.",
    },

    custoFixoMaterialPintura: {
      ondeEncontrar:
        "Gasto médio mensal com lixa, massa e fita — olhe as notas dos últimos meses do fornecedor de material de pintura.",
    },

    custoFixoCabinePintura: {
      ondeEncontrar:
        "Soma do consumo extra de energia e gás da cabine (se for medido separado) mais a manutenção preventiva do equipamento.",
    },

    custoFixoEpiFiltros: {
      ondeEncontrar:
        "Compra recorrente de máscara, luva, óculos de proteção e filtro da cabine — nas notas do fornecedor de segurança.",
    },

    custoFixoDescarteResiduos: {
      ondeEncontrar:
        "No contrato ou nota da empresa que recolhe os resíduos (tinta, solvente, estopa contaminada) — descarte é obrigação legal, não opcional.",
    },

    impostosSobreFaturamento: {
      ondeEncontrar:
        "É o percentual do faturamento que vai para o seu regime tributário. Está na guia do Simples, ou com o contador.",
      perguntarAoContador:
        "Qual é o meu percentual efetivo de imposto sobre o faturamento de serviços?",
      comoEstimar:
        "Se não souber agora, deixe o valor que já está preenchido: é a faixa inicial do Simples Nacional para serviços.",
    },

    margemDesejada: {
      ondeEncontrar:
        "Este é o único campo que não está em papel nenhum: é uma decisão sua.",
      comoEstimar:
        "É o que sobra depois de pagar todos os custos e os impostos. Serve para investir em ferramenta, aguentar mês fraco e remunerar o risco de ter um negócio. Comece pelo valor preenchido e mexa para ver o efeito.",
    },

    precoUnidadeAtual: {
      ondeEncontrar: `O que você cobra hoje ${unit.per} de mão de obra. Olhe uma ordem de serviço recente e divida o valor da mão de obra pelas ${unit.plural} cobradas.`,
      comoEstimar:
        "É opcional. Se informar, a tela mostra a diferença entre o que você cobra e o que o cálculo indica, e o impacto disso no mês.",
    },
  } as const satisfies Record<string, AjudaDeCampo>;
}

export type Assistente = ReturnType<typeof criarAssistente>;
export type CampoAssistido = keyof Assistente;

/** Caso mecânica. Dentro de `(app)`, usar o do provider de segmento. */
export const ASSISTENTE = criarAssistente(LEXICO_PADRAO);

/**
 * Categoria de custo fixo (literal exato de `segmento.ts`) → chave da
 * entrada específica acima. "Outros" e qualquer categoria futura sem
 * entrada própria caem no fallback genérico `custosFixos`.
 */
const CAMPO_CUSTO_FIXO: Record<string, string> = {
  Aluguel: "custoFixoAluguel",
  Energia: "custoFixoEnergia",
  Água: "custoFixoAgua",
  "Internet e telefone": "custoFixoInternetTelefone",
  Contador: "custoFixoContador",
  "Software de gestão": "custoFixoSoftwareGestao",
  Seguros: "custoFixoSeguros",
  "Salários administrativos + encargos": "custoFixoSalariosAdministrativos",
  "Pró-labore": "custoFixoProLabore",
  "Manutenção e ferramental": "custoFixoManutencaoFerramental",
  Marketing: "custoFixoMarketing",
  "Tinta e vernizes (média mensal)": "custoFixoTintaVernizes",
  "Material de pintura — lixa, massa, fita (média mensal)": "custoFixoMaterialPintura",
  "Cabine de pintura — energia, gás e manutenção": "custoFixoCabinePintura",
  "EPI e filtros": "custoFixoEpiFiltros",
  "Descarte de resíduos": "custoFixoDescarteResiduos",
};

export function campoCustoFixo(categoria: string): string {
  return CAMPO_CUSTO_FIXO[categoria] ?? "custosFixos";
}

export const ASSISTENTE_UI = {
  titulo: "Onde encontrar esse número",
  ondeEncontrar: "Onde encontrar",
  perguntarAoContador: "Pergunte ao seu contador",
  comoEstimar: "Se você não souber",
  cuidado: "Cuidado",
  copiar: "Copiar pergunta",
  copiado: "Copiado",
  /** Estado inicial, antes de o usuário tocar em qualquer campo. */
  ocioso: "Toque num campo e eu explico onde achar o número.",
} as const;

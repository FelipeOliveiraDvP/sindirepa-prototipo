/**
 * Eventos de funil. Lista mínima definida em CLAUDE.md.
 *
 * POR QUE DESDE O PRIMEIRO COMMIT: sem isso não existe evidência do que
 * funciona nem argumento sobre o funil mais adiante. Ligar
 * instrumentação depois significa perder a linha de base — e a primeira
 * leva é justamente a que estabelece a linha de base.
 */

export type Origem = "landing_home" | "calculadora" | "oficina";

/**
 * `calc_campo_alterado` importa mais do que parece: mostra qual campo
 * trava o usuário. A hipótese registrada é que seja a taxa de ocupação,
 * e é essa hipótese que a Leva 1 existe para testar.
 */
export type EventoFunil =
  | { nome: "calc_iniciada"; origem: Origem }
  | { nome: "calc_campo_alterado"; campo: string; origem: Origem }
  | { nome: "calc_resultado_visto"; origem: Origem }
  /**
   * Passo concluído no modo guiado. O wizard existe para vencer
   * resistência à adoção; sem abandono por passo não há como saber se
   * ele funcionou. A hipótese é que a taxa de ocupação seja onde o
   * usuário trava — este evento é o que confirma ou derruba isso.
   */
  | { nome: "calc_passo_concluido"; passo: string; origem: Origem }
  | { nome: "calc_modo_guiado_pulado"; passo: string; origem: Origem }
  | { nome: "calc_composicao_aberta"; faixa?: string }
  | { nome: "calc_memoria_aberta" }
  | { nome: "calc_bloqueada"; motivo: string; origem: Origem }
  | { nome: "conta_criada" }
  | { nome: "config_salva" }
  /**
   * A landing única tem dois CTAs instrumentados — herói e fechamento.
   * A pergunta central é quantos visitantes atravessam para a
   * calculadora, e de qual das duas portas.
   */
  | { nome: "cta_calculadora_clicado"; origem: Origem };

export type NomeEvento = EventoFunil["nome"];

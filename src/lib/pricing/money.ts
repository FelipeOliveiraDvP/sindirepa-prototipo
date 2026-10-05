/**
 * Soma de dinheiro em centavos inteiros.
 *
 * POR QUE: 06-dados.md manda somar em centavos inteiros para não
 * acumular erro de float. Uma lista de 12 custos fixos somada em
 * ponto flutuante produz coisas como 12345.669999999998, e o número
 * que o usuário confere contra a planilha dele passa a não fechar.
 *
 * Regra que acompanha: arredondar SÓ na exibição, jamais no cálculo
 * intermediário. Por isso a divisão (custo ÷ unidades) acontece em
 * reais, com float mesmo — ali não há acúmulo, e arredondar antes
 * distorceria o resultado.
 */

/** R$ → centavos. Arredonda para o centavo mais próximo. */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Centavos → R$. */
export function toReais(cents: number): number {
  return cents / 100;
}

/**
 * Soma valores em reais sem acumular erro de float.
 * Converte cada parcela para centavos, soma como inteiro, e volta.
 */
export function somarReais(valores: readonly number[]): number {
  const totalCents = valores.reduce((acc, valor) => acc + toCents(valor), 0);
  return toReais(totalCents);
}

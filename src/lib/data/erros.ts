/**
 * Erros de operação da camada de dados.
 *
 * Antes moravam em leads.ts; a lista de espera saiu do produto, o
 * registro de lead saiu com ela, e o erro ficou — quem usa é a leitura
 * e a escrita de configuracao/calculo/conta, não a captura de contato.
 */

/** Ambiente sem credencial de banco. Erro de operação, não do usuário. */
export class ArmazenamentoIndisponivelError extends Error {
  constructor() {
    super("Supabase não configurado: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.");
    this.name = "ArmazenamentoIndisponivelError";
  }
}

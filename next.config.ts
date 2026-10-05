import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * O Next 16 injeta um bloco de instruções dentro do CLAUDE.md a cada
   * `next dev`, e o readiciona quando removido. Aqui o CLAUDE.md é o
   * documento curado do projeto — contexto de negócio, escopo da Leva 1,
   * princípios do produto — e não um arquivo gerado.
   *
   * A informação útil do bloco (esta versão do Next tem quebras em
   * relação ao conhecimento treinado; a referência fica em
   * node_modules/next/dist/docs/) está registrada na seção Stack do
   * CLAUDE.md, escrita por nós e sob controle de versão nossa.
   */
  agentRules: false,
};

export default nextConfig;

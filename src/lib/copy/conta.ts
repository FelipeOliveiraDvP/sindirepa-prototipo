/**
 * Copy de conta e configuração. pt-BR, tom de docs/geral/07-copy.md.
 *
 * A conta é meio, não fim: ela existe só para o usuário voltar e achar
 * a configuração dele. Nada aqui pode soar como cadastro obrigatório —
 * a calculadora funciona inteira sem login, e prometer o contrário
 * queima a confiança que o produto depende.
 */

export const ENTRAR = {
  titulo: "Entrar",
  subtitulo: "Para voltar à configuração da sua oficina.",
  email: "E-mail",
  senha: "Senha",
  exemploEmail: "ex: voce@suaoficina.com.br",
  acao: "Entrar",
  enviando: "Entrando…",
  semConta: "Ainda não tem conta?",
  criarConta: "Criar conta",
  erroCredenciais: "E-mail ou senha não conferem. Confira e tente de novo.",
  erroEnvio: "Não foi possível entrar. Verifique a conexão e tente de novo.",
} as const;

export const CRIAR_CONTA = {
  titulo: "Criar conta",
  subtitulo: "Para guardar sua configuração e voltar depois. Leva um minuto.",

  nome: "Seu nome",
  exemploNome: "ex: João da Silva",
  email: "E-mail",
  exemploEmail: "ex: voce@suaoficina.com.br",
  senha: "Senha",
  ajudaSenha: "Pelo menos 8 caracteres.",
  nomeOficina: "Nome da oficina",
  exemploOficina: "ex: Auto Center São Jorge",
  cidade: "Cidade",

  acao: "Criar conta",
  enviando: "Criando…",
  jaTemConta: "Já tem conta?",
  entrar: "Entrar",

  /** O que o usuário ganha. Fato, sem promessa. */
  migracao: "O que você preencheu na calculadora vai junto.",

  erroNome: "Informe seu nome.",
  erroEmail: "Confira o e-mail: falta o @ ou o domínio.",
  erroSenha: "A senha precisa de pelo menos 8 caracteres.",
  erroOficina: "Informe o nome da oficina.",
  erroEmailUsado: "Esse e-mail já tem conta. Entre em vez de criar.",
  erroEnvio: "Não foi possível criar a conta. Verifique a conexão e tente de novo.",
} as const;

export const OFICINA = {
  titulo: "Configuração da oficina",
  subtitulo: "Os números que alimentam o cálculo. Toda mudança já aparece no resultado.",

  abas: {
    oficina: "Oficina",
    equipe: "Equipe",
    custosFixos: "Custos fixos",
    parametros: "Parâmetros",
  },

  nomeOficina: "Nome da oficina",
  cnpj: "CNPJ",
  exemploCnpj: "ex: 12.345.678/0001-90",
  cidade: "Cidade",

  salvar: "Salvar configuração",
  salvando: "Salvando…",
  salvo: "Configuração salva.",
  erroSalvar: "Não foi possível salvar. Verifique a conexão e tente de novo.",

  /** Pedagogia da calculadora aplicada à configuração (03-telas.md). */
  impacto: "Impacto no custo",
  semAlteracao: "Nada mudou desde o último salvamento.",

  sair: "Sair",
} as const;

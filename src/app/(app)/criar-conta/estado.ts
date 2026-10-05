export type EstadoCriarConta =
  | { estado: "inicial" }
  | { estado: "ok" }
  | {
      estado:
        | "erro_nome"
        | "erro_email"
        | "erro_senha"
        | "erro_oficina"
        | "erro_email_usado"
        | "erro_envio";
    };

export const ESTADO_INICIAL: EstadoCriarConta = { estado: "inicial" };

/** Mínimo do Supabase é 6; 8 é o piso que este produto assume. */
export const SENHA_MINIMA = 8;

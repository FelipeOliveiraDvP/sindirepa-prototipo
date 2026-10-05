export type EstadoEntrar =
  | { estado: "inicial" }
  | { estado: "erro_credenciais" }
  | { estado: "erro_envio" };

export const ESTADO_INICIAL: EstadoEntrar = { estado: "inicial" };

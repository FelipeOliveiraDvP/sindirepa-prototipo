"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { Campo, inputClasses } from "@/components/calculator/Campo";
import { ENTRAR } from "@/lib/copy/conta";
import { entrar } from "./actions";
import { ESTADO_INICIAL } from "./estado";

const MENSAGENS: Record<string, string> = {
  erro_credenciais: ENTRAR.erroCredenciais,
  erro_envio: ENTRAR.erroEnvio,
};

export function FormularioEntrar() {
  const [estado, acao, enviando] = useActionState(entrar, ESTADO_INICIAL);
  const idEmail = useId();
  const idSenha = useId();
  const erro = MENSAGENS[estado.estado];

  return (
    <form action={acao} className="space-y-4">
      <Campo label={ENTRAR.email} htmlFor={idEmail}>
        <input
          id={idEmail}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={ENTRAR.exemploEmail}
          className={inputClasses}
        />
      </Campo>

      <Campo label={ENTRAR.senha} htmlFor={idSenha}>
        <input
          id={idSenha}
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className={inputClasses}
        />
      </Campo>

      {erro ? (
        <p role="alert" className="text-sm text-danger">
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="touch-target w-full rounded-button bg-primary px-4 font-medium text-text-inverse hover:bg-primary-hover disabled:opacity-60"
      >
        {enviando ? ENTRAR.enviando : ENTRAR.acao}
      </button>

      <p className="text-center text-sm text-petroleo-suave">
        {ENTRAR.semConta}{" "}
        <Link href="/criar-conta" className="text-primary underline underline-offset-4">
          {ENTRAR.criarConta}
        </Link>
      </p>
    </form>
  );
}

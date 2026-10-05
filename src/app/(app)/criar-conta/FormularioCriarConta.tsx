"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef } from "react";
import { useSegmento } from "@/components/app/SegmentoProvider";
import { Campo, inputClasses } from "@/components/calculator/Campo";
import { CHAVE_RASCUNHO } from "@/components/calculator/useCalculadora";
import { track } from "@/lib/analytics/track";
import { CRIAR_CONTA } from "@/lib/copy/conta";
import { agregadoPadrao, type EntradaAgregada } from "@/lib/pricing/aggregate";
import { REGIOES } from "@/lib/regioes";
import { salvar } from "../oficina/actions";
import { registrarConta } from "./actions";
import { ESTADO_INICIAL, SENHA_MINIMA } from "./estado";

const MENSAGENS: Record<string, string> = {
  erro_nome: CRIAR_CONTA.erroNome,
  erro_email: CRIAR_CONTA.erroEmail,
  erro_senha: CRIAR_CONTA.erroSenha,
  erro_oficina: CRIAR_CONTA.erroOficina,
  erro_email_usado: CRIAR_CONTA.erroEmailUsado,
  erro_envio: CRIAR_CONTA.erroEnvio,
};

/**
 * Cadastro + migração do rascunho.
 *
 * O QUE O USUÁRIO PREENCHEU NA CALCULADORA VAI JUNTO. 03-telas.md é
 * explícito: "fazer o cara digitar duas vezes é perder o cara". Por
 * isso o redirecionamento acontece aqui, no cliente, depois de a
 * configuração ser salva — e não no servidor, logo após criar a conta.
 */
export function FormularioCriarConta() {
  const [estado, acao, enviando] = useActionState(registrarConta, ESTADO_INICIAL);
  const { segmento } = useSegmento();
  const router = useRouter();
  const migrou = useRef(false);

  const idNome = useId();
  const idEmail = useId();
  const idSenha = useId();
  const idOficina = useId();
  const idCidade = useId();

  const erro = MENSAGENS[estado.estado];

  useEffect(() => {
    if (estado.estado !== "ok" || migrou.current) return;
    migrou.current = true;

    (async () => {
      track({ nome: "conta_criada" });

      const entrada = lerRascunho(segmento);
      if (entrada) {
        const r = await salvar(entrada);
        if (r.ok) {
          track({ nome: "config_salva" });
          // Só limpa DEPOIS de a gravação confirmar. Limpar antes
          // perderia o trabalho do usuário se a rede caísse no meio.
          try {
            window.sessionStorage.removeItem(CHAVE_RASCUNHO);
          } catch {
            // storage bloqueado — a configuração já está salva
          }
        }
      }

      router.replace("/calculadora");
    })();
  }, [estado.estado, segmento, router]);

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="segmento" value={segmento} />

      <Campo label={CRIAR_CONTA.nome} htmlFor={idNome}>
        <input id={idNome} name="nome" required autoComplete="name"
          placeholder={CRIAR_CONTA.exemploNome} className={inputClasses} />
      </Campo>

      <Campo label={CRIAR_CONTA.email} htmlFor={idEmail}>
        <input id={idEmail} name="email" type="email" required autoComplete="email"
          placeholder={CRIAR_CONTA.exemploEmail} className={inputClasses} />
      </Campo>

      <Campo label={CRIAR_CONTA.senha} ajuda={CRIAR_CONTA.ajudaSenha} htmlFor={idSenha}>
        <input id={idSenha} name="senha" type="password" required
          minLength={SENHA_MINIMA} autoComplete="new-password" className={inputClasses} />
      </Campo>

      <Campo label={CRIAR_CONTA.nomeOficina} htmlFor={idOficina}>
        <input id={idOficina} name="nomeOficina" required
          placeholder={CRIAR_CONTA.exemploOficina} className={inputClasses} />
      </Campo>

      <Campo label={CRIAR_CONTA.cidade} htmlFor={idCidade}>
        <select id={idCidade} name="cidade" defaultValue="" className={inputClasses}>
          <option value="">Selecione a cidade</option>
          {REGIOES.map((r) => (
            <option key={r.id || "outra"} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </Campo>

      {erro ? (
        <p role="alert" className="text-sm text-danger">
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando || estado.estado === "ok"}
        className="touch-target w-full rounded-button bg-primary px-4 font-medium text-text-inverse hover:bg-primary-hover disabled:opacity-60"
      >
        {enviando || estado.estado === "ok" ? CRIAR_CONTA.enviando : CRIAR_CONTA.acao}
      </button>

      <p className="text-center text-sm text-petroleo-suave">{CRIAR_CONTA.migracao}</p>

      <p className="text-center text-sm text-petroleo-suave">
        {CRIAR_CONTA.jaTemConta}{" "}
        <Link href="/entrar" className="text-primary underline underline-offset-4">
          {CRIAR_CONTA.entrar}
        </Link>
      </p>
    </form>
  );
}

/** Rascunho da calculadora, completado com os padrões do segmento. */
function lerRascunho(segmento: EntradaAgregada["segmento"]): EntradaAgregada | null {
  try {
    const bruto = window.sessionStorage.getItem(CHAVE_RASCUNHO);
    if (!bruto) return null;
    const rascunho = JSON.parse(bruto) as Partial<EntradaAgregada>;
    return { ...agregadoPadrao(segmento), ...rascunho, segmento };
  } catch {
    return null;
  }
}

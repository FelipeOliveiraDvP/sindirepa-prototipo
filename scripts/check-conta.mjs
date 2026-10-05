#!/usr/bin/env node
/**
 * Aceitação das tabelas de conta — com foco em ISOLAMENTO ENTRE OFICINAS.
 *
 * O teste central cria DUAS oficinas e verifica que uma não enxerga a
 * outra. É a falha que mais dói num produto multiempresa: vazar o custo
 * e a margem de uma oficina para a concorrente da esquina destrói o
 * produto de uma vez, e nenhum teste unitário pega isso — só uma
 * consulta real, autenticada, contra as policies.
 *
 * Uso:  npm run check:conta
 *
 * Cria usuários de teste com e-mail @exemplo.invalid e apaga tudo no
 * fim, inclusive em caso de falha.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error("check-conta: preencha SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_ANON_KEY em .env.local");
  process.exit(2);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const resultados = [];
const ok = (n, d = "") => resultados.push({ ok: true, nome: n, detalhe: d });
const falha = (n, d) => resultados.push({ ok: false, nome: n, detalhe: d });

const MARCA = crypto.randomUUID().slice(0, 8);
const SENHA = `Teste-${crypto.randomUUID()}`;
const criados = { usuarios: [], oficinas: [] };

async function criarOficinaComDono(rotulo) {
  const email = `verificacao-${MARCA}-${rotulo}@exemplo.invalid`;

  const { data: u, error: eu } = await admin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
  });
  if (eu) throw new Error(`criar usuário ${rotulo}: ${eu.message}`);
  criados.usuarios.push(u.user.id);

  const { data: of, error: eo } = await admin
    .from("oficinas")
    .insert({ nome: `Oficina ${rotulo} ${MARCA}`, cidade: "sao-paulo", segmento: "mecanica" })
    .select("id")
    .single();
  if (eo) throw new Error(`criar oficina ${rotulo}: ${eo.message}`);
  criados.oficinas.push(of.id);

  const { error: ev } = await admin
    .from("usuarios")
    .insert({ id: u.user.id, oficina_id: of.id, nome: `Dono ${rotulo}`, papel: "dono" });
  if (ev) throw new Error(`vincular ${rotulo}: ${ev.message}`);

  // Um custo fixo com valor reconhecível — é o que a outra oficina NÃO pode ver.
  const { error: ec } = await admin.from("custos_fixos").insert({
    oficina_id: of.id,
    categoria: "Aluguel",
    valor_mensal: rotulo === "a" ? 1111 : 2222,
  });
  if (ec) throw new Error(`custo fixo ${rotulo}: ${ec.message}`);

  return { email, oficinaId: of.id, usuarioId: u.user.id };
}

/** Cliente autenticado como o usuário — passa pelas policies, como o navegador. */
async function comoUsuario(email) {
  const c = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password: SENHA });
  if (error) throw new Error(`login: ${error.message}`);
  return c;
}

try {
  // ── Preflight ────────────────────────────────────────────────────
  {
    const { error } = await admin.from("oficinas").select("id").limit(1);
    if (error) {
      console.error("check-conta: as tabelas de conta não respondem.\n");
      console.error(`  Erro: ${error.message}`);
      console.error(
        "\n  Aplique supabase/migrations/20260819000400_conta.sql\n" +
          "  no SQL Editor do painel e rode de novo.",
      );
      process.exit(2);
    }
  }

  const a = await criarOficinaComDono("a");
  const b = await criarOficinaComDono("b");
  ok("duas oficinas de teste criadas");

  const clienteA = await comoUsuario(a.email);
  ok("login com a chave pública funciona");

  // ── ⚠️ O TESTE QUE IMPORTA ────────────────────────────────────────
  {
    const { data } = await clienteA.from("oficinas").select("id, nome");
    const ids = (data ?? []).map((o) => o.id);
    if (ids.length === 1 && ids[0] === a.oficinaId) {
      ok("oficina A enxerga só a si mesma", "1 linha, a própria");
    } else {
      falha(
        "oficina A enxerga só a si mesma",
        `❌ devolveu ${ids.length} linha(s)${ids.includes(b.oficinaId) ? " — INCLUINDO A OFICINA B" : ""}`,
      );
    }
  }

  {
    const { data } = await clienteA.from("custos_fixos").select("valor_mensal");
    const valores = (data ?? []).map((c) => Number(c.valor_mensal));
    if (valores.includes(2222)) {
      falha("custos fixos não vazam entre oficinas", "❌ A leu o custo da oficina B");
    } else if (valores.includes(1111)) {
      ok("custos fixos não vazam entre oficinas", "A vê o próprio, não o da B");
    } else {
      falha("custos fixos não vazam entre oficinas", `INCONCLUSIVO — A não viu nem o próprio custo (${valores.length} linha(s))`);
    }
  }

  // Escrita cruzada: tentar plantar custo na oficina alheia.
  {
    const { error } = await clienteA
      .from("custos_fixos")
      .insert({ oficina_id: b.oficinaId, categoria: "Invasão", valor_mensal: 9999 });
    if (error) ok("A não consegue escrever na oficina B", error.message.slice(0, 60));
    else falha("A não consegue escrever na oficina B", "❌ ESCREVEU na oficina alheia");
  }

  // ── Versionamento imposto pelo banco ─────────────────────────────
  const configBase = {
    oficina_id: a.oficinaId,
    work_unit: "hora",
    dias_uteis_mes: 22,
    unidades_por_dia: 8.8,
    ocupacao: 0.7,
    impostos_sobre_faturamento: 0.06,
    margem_desejada: 0.15,
  };

  {
    const { error } = await clienteA.from("configuracoes_calculo").insert(configBase);
    if (error) falha("usuário salva configuração", error.message);
    else ok("usuário salva configuração");
  }
  {
    const { error } = await clienteA
      .from("configuracoes_calculo")
      .insert({ ...configBase, margem_desejada: 0.2 });
    if (error) falha("segunda versão é aceita", error.message);
    else ok("segunda versão é aceita", "histórico preservado");
  }
  {
    const { data } = await clienteA
      .from("configuracoes_calculo")
      .select("id")
      .eq("oficina_id", a.oficinaId);
    if ((data?.length ?? 0) >= 2) ok("as duas versões coexistem", `${data.length} versões`);
    else falha("as duas versões coexistem", `só ${data?.length ?? 0}`);
  }
  {
    // Sem policy de UPDATE: a promessa "nunca sobrescrever" é do banco.
    const { data, error } = await clienteA
      .from("configuracoes_calculo")
      .update({ margem_desejada: 0.99 })
      .eq("oficina_id", a.oficinaId)
      .select();
    if (error || (data?.length ?? 0) === 0) {
      ok("configuração não pode ser sobrescrita", "sem policy de UPDATE");
    } else {
      falha("configuração não pode ser sobrescrita", "❌ UPDATE passou — o histórico não é garantido");
    }
  }
  {
    const { error } = await clienteA
      .from("configuracoes_calculo")
      .insert({ ...configBase, impostos_sobre_faturamento: 0.6, margem_desejada: 0.5 });
    if (error) ok("banco rejeita impostos + margem >= 100%", "divisor_positivo");
    else falha("banco rejeita impostos + margem >= 100%", "❌ aceitou configuração que estoura o cálculo");
  }

  // ── Deslogado não lê nada ────────────────────────────────────────
  {
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    let exposta = null;
    for (const t of ["oficinas", "usuarios", "produtivos", "custos_fixos", "configuracoes_calculo"]) {
      const { data, error } = await anon.from(t).select("*").limit(1);
      if (!error && (data?.length ?? 0) > 0) exposta = t;
    }
    if (exposta) falha("visitante deslogado não lê nada", `❌ leu de ${exposta}`);
    else ok("visitante deslogado não lê nada");
  }
} catch (erro) {
  falha("execução", erro instanceof Error ? erro.message : String(erro));
} finally {
  // Limpeza — roda mesmo se algo acima explodiu.
  for (const id of criados.usuarios) await admin.auth.admin.deleteUser(id).catch(() => {});
  for (const id of criados.oficinas) await admin.from("oficinas").delete().eq("id", id);
}

console.log("");
for (const r of resultados) {
  console.log(`  ${r.ok ? "✅" : "❌"} ${r.nome}`);
  if (r.detalhe) console.log(`     ${r.detalhe}`);
}
console.log("");

const falhas = resultados.filter((r) => !r.ok);
if (falhas.length === 0) {
  console.log("check-conta: isolamento entre oficinas confirmado, versionamento garantido pelo banco.");
  process.exit(0);
}
console.error(`check-conta: ${falhas.length} verificação(ões) falharam.`);
process.exit(1);

#!/usr/bin/env node
/**
 * Aceitação do banco — roda contra o Supabase real.
 *
 * Não é teste unitário: as migrations podem estar sintaticamente certas
 * e o banco ainda estar inseguro (RLS desligado, grant sobrando, check
 * constraint que não pega). Isto verifica o COMPORTAMENTO.
 *
 * O teste que mais importa é o 3: prova que a chave anônima — a que
 * roda no navegador de qualquer visitante — não consegue ler nem
 * escrever. Se esse falhar, pare tudo.
 *
 * Uso:
 *   npm run check:supabase
 *
 * Precisa de .env.local com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 * SUPABASE_ANON_KEY é opcional, mas sem ela o teste de RLS é pulado —
 * que é justamente o que você quer confirmar.
 *
 * Escreve e apaga linhas de verificação, com marca própria. Não toca em
 * dado real.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.error(
    "check-supabase: faltam SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Copie .env.example para .env.local e preencha com os valores do painel\n" +
      "(Project Settings → API). Rode com: npm run check:supabase",
  );
  process.exit(2);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * PREFLIGHT — antes de qualquer asserção.
 *
 * Sem isto, um erro de configuração passa por aprovação: os testes da
 * chave anônima consideram "não consegui ler" como sucesso, e uma URL
 * errada faz TODA leitura falhar. O resultado seria um relatório verde
 * afirmando que o RLS protege, quando na verdade nada foi testado.
 *
 * Aprender isso custou um falso positivo. A checagem fica.
 */
{
  const { error } = await admin.from("calculos_anonimos").select("sessao").limit(1);
  if (error) {
    console.error("check-supabase: não consegui falar com o banco.\n");
    console.error(`  Erro: ${error.message}`);
    if (/invalid path/i.test(error.message)) {
      console.error(
        "\n  Causa provável: SUPABASE_URL com caminho extra.\n" +
          "  Use a Project URL pura — https://SEU-REF.supabase.co — sem /rest/v1.\n" +
          "  O supabase-js acrescenta o caminho sozinho.",
      );
    } else if (/relation .* does not exist|schema cache/i.test(error.message)) {
      console.error("\n  Causa provável: as migrations de supabase/migrations/ não foram aplicadas.");
    } else if (/JWT|api key|Invalid API key/i.test(error.message)) {
      console.error("\n  Causa provável: SUPABASE_SERVICE_ROLE_KEY incorreta.");
    }
    process.exit(2);
  }
}

const MARCA = `verificacao-${crypto.randomUUID()}`;
const resultados = [];

function ok(nome, detalhe = "") {
  resultados.push({ ok: true, nome, detalhe });
}
function falha(nome, detalhe) {
  resultados.push({ ok: false, nome, detalhe });
}

const calculoValido = () => ({
  sessao: MARCA,
  segmento: "mecanica",
  regiao: "sao-paulo",
  origem: "calculadora",
  custo_real_unidade: 71.4,
  preco_sugerido: 90.38,
  ponto_equilibrio: 75.96,
  unidades_produtivas: 542.08,
  ocupacao: 0.7,
  custo_total_mensal: 38705.5,
});

// ── 1. As tabelas existem e a service role escreve ──────────────────
{
  const { error } = await admin.from("calculos_anonimos").insert(calculoValido());
  if (error) falha("service role grava em calculos_anonimos", error.message);
  else ok("service role grava em calculos_anonimos");
}
{
  const { error } = await admin
    .from("leads")
    .insert({ email: `${MARCA}@exemplo.invalid`, origem: "calculadora", consentimento: true });
  if (error) falha("service role grava em leads", error.message);
  else ok("service role grava em leads");
}

// ── 2. unique(sessao): uma sessão é um registro ──────────────────────
{
  const { error } = await admin.from("calculos_anonimos").insert(calculoValido());
  if (error) ok("unique(sessao) rejeita duplicata", "uma sessão = um registro na amostra");
  else falha(
    "unique(sessao) rejeita duplicata",
    "SEGUNDA linha aceita para a mesma sessão. Quem mexer nos sliders dez " +
      "vezes vai pesar dez vezes na mediana da região.",
  );
}
{
  const { error } = await admin
    .from("calculos_anonimos")
    .upsert(
      { ...calculoValido(), custo_real_unidade: 72.5 },
      { onConflict: "sessao" },
    );
  if (error) falha("upsert por sessao atualiza", error.message);
  else ok("upsert por sessao atualiza", "vale o cálculo mais maduro, não o rascunho");
}

// ── 3. ⚠️ O TESTE QUE IMPORTA: a chave do navegador não passa ────────
if (!anonKey) {
  falha(
    "RLS bloqueia a chave anônima",
    "PULADO — sem SUPABASE_ANON_KEY não dá para provar. Acrescente ao " +
      ".env.local e rode de novo: é o teste que garante que o banco não " +
      "está aberto para qualquer visitante.",
  );
} else {
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const tabela of ["calculos_anonimos", "leads"]) {
    const { data, error } = await anon.from(tabela).select("*").limit(1);

    // Há uma linha de verificação gravada AGORA, então "zero linhas" só
    // pode ser o RLS filtrando. Bloqueio legítimo tem duas assinaturas:
    //   - erro de permissão (o REVOKE da migration 300 agindo)
    //   - zero linhas sem erro (RLS sem policy, filtro silencioso)
    // Qualquer OUTRO erro é inconclusivo e não pode contar como aprovação.
    const negadoPorPermissao =
      !!error && (error.code === "42501" || /permission denied/i.test(error.message));
    const filtradoPeloRls = !error && (data?.length ?? 0) === 0;

    if (negadoPorPermissao || filtradoPeloRls) {
      ok(
        `chave anônima NÃO lê ${tabela}`,
        negadoPorPermissao ? "permissão negada (REVOKE)" : "RLS filtrou todas as linhas",
      );
    } else if (error) {
      falha(
        `chave anônima NÃO lê ${tabela}`,
        `INCONCLUSIVO — a requisição falhou por outro motivo: ${error.message}`,
      );
    } else {
      falha(
        `chave anônima NÃO lê ${tabela}`,
        `❌ LEU ${data.length} linha(s). A tabela está exposta ao navegador. ` +
          "Confirme RLS ligado e os REVOKE da migration 300.",
      );
    }
  }

  const { error: erroEscrita } = await anon
    .from("leads")
    .insert({ email: "invasor@exemplo.invalid", origem: "calculadora", consentimento: false });
  const escritaNegada =
    !!erroEscrita &&
    (erroEscrita.code === "42501" ||
      /permission denied|row-level security/i.test(erroEscrita.message));
  if (escritaNegada) ok("chave anônima NÃO escreve em leads", erroEscrita.message);
  else if (erroEscrita)
    falha(
      "chave anônima NÃO escreve em leads",
      `INCONCLUSIVO — falhou por outro motivo: ${erroEscrita.message}`,
    );
  else falha(
    "chave anônima NÃO escreve em leads",
    "❌ ESCREVEU. Qualquer visitante pode poluir a base de leads.",
  );
}

// ── 4. Os check constraints realmente pegam ─────────────────────────
{
  const { error } = await admin
    .from("calculos_anonimos")
    .insert({ ...calculoValido(), sessao: `${MARCA}-neg`, custo_real_unidade: -10 });
  if (error) ok("check rejeita custo negativo");
  else falha("check rejeita custo negativo", "custo negativo aceito — contamina a mediana");
}
{
  const { error } = await admin
    .from("calculos_anonimos")
    .insert({ ...calculoValido(), sessao: `${MARCA}-ocup`, ocupacao: 1.5 });
  if (error) ok("check rejeita ocupação acima de 100%");
  else falha("check rejeita ocupação acima de 100%", "não é possível vender mais do que se tem");
}
{
  const { error } = await admin
    .from("calculos_anonimos")
    .insert({ ...calculoValido(), sessao: `${MARCA}-seg`, segmento: "eletrica" });
  if (error) ok("check rejeita segmento inexistente", "só mecanica e funilaria");
  else falha("check rejeita segmento inexistente", "aceitou 'eletrica', que não é segmento");
}

// ── 5. Limpeza ──────────────────────────────────────────────────────
await admin.from("calculos_anonimos").delete().like("sessao", `${MARCA}%`);
await admin.from("leads").delete().like("email", `${MARCA}%`);
await admin.from("leads").delete().eq("email", "invasor@exemplo.invalid");

{
  const { data } = await admin
    .from("calculos_anonimos")
    .select("sessao")
    .like("sessao", `${MARCA}%`);
  if ((data?.length ?? 0) === 0) ok("linhas de verificação removidas");
  else falha("linhas de verificação removidas", `sobraram ${data.length} — apague à mão`);
}

// ── Relatório ───────────────────────────────────────────────────────
const falhas = resultados.filter((r) => !r.ok);

console.log("");
for (const r of resultados) {
  console.log(`  ${r.ok ? "✅" : "❌"} ${r.nome}`);
  if (r.detalhe) console.log(`     ${r.detalhe}`);
}
console.log("");

if (falhas.length === 0) {
  console.log("check-supabase: banco pronto — escrita pela service role, leitura negada ao navegador.");
  process.exit(0);
}

console.error(`check-supabase: ${falhas.length} verificação(ões) falharam.`);
process.exit(1);

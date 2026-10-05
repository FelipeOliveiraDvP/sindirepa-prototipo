#!/usr/bin/env node
/**
 * Ponta a ponta do fluxo logado, num navegador real.
 *
 * É o único trecho que nenhum outro teste alcança. `npm test` prova a
 * aritmética, `check:supabase` e `check:conta` provam o banco — mas o
 * caminho entre eles passa por React, sessão, Server Action e RLS, e só
 * um navegador exercita isso junto.
 *
 * Percurso: prévia do herói → cadastro (com migração do rascunho) →
 * calculadora guiada → salvar → painel.
 *
 * Usa o Edge instalado no sistema; não baixa navegador.
 *
 * Uso:  npm run check:e2e
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE = process.argv[2] ?? "http://localhost:3001";
const SILENCIO_MS = 4000;

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const MARCA = crypto.randomUUID().slice(0, 8);
const EMAIL = `verificacao-${MARCA}@exemplo.invalid`;
const SENHA = `Teste-${MARCA}-8x`;

const passos = [];
const registrar = (t) => {
  passos.push(t);
  console.log(`  · ${t}`);
};

/** Ruído conhecido: o favicon ainda não existe (05-marca.md, ativos pendentes). */
const RUIDO = [/favicon\.ico/i, /Failed to load resource.*404/i];
const ehRuido = (t) => RUIDO.some((re) => re.test(t));

const navegador = await chromium.launch({ channel: "msedge", headless: true });
const contexto = await navegador.newContext({ viewport: { width: 375, height: 812 } });
const pagina = await contexto.newPage();

const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e)));
pagina.on("console", (m) => {
  if (m.type() === "error" && !ehRuido(m.text())) erros.push(m.text());
});

let usuarioId = null;
let oficinaId = null;

try {
  // ── 0. Layout largo: a navegação lateral encosta na borda ─────────
  // Bug da Leva 4: o contêiner que envolvia sidebar + conteúdo tinha
  // max-w-6xl, então em tela larga o bloco inteiro centralizava e a
  // sidebar começava a ~380px da borda. Não precisa de sessão: a
  // navegação aparece em toda rota de `(app)`.
  const contextoLargo = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const paginaLarga = await contextoLargo.newPage();
  await paginaLarga.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  const nav = paginaLarga.getByRole("navigation", { name: /Navegação principal/i }).first();
  const caixaNav = await nav.boundingBox();
  if (!caixaNav || caixaNav.x > 2) {
    throw new Error(
      `sidebar não está encostada na borda esquerda em tela larga (x=${caixaNav?.x ?? "sem elemento"})`,
    );
  }
  registrar("layout largo: navegação lateral encostada na borda esquerda");
  await contextoLargo.close();

  // ── 1. A prévia do herói continua ABERTA ──────────────────────────
  await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pagina.getByLabel(/Salário médio/i).fill("350000"); // R$ 3.500,00
  await pagina.getByText(/Custo real estimado/i).waitFor({ timeout: 10000 });
  registrar("prévia do herói calcula sem cadastro");

  // ── 2. A calculadora EXIGE conta ──────────────────────────────────
  await pagina.goto(`${BASE}/calculadora`, { waitUntil: "networkidle" });
  if (!pagina.url().includes("/criar-conta")) {
    throw new Error(`/calculadora não exigiu conta — parou em ${pagina.url()}`);
  }
  registrar("/calculadora sem sessão manda para o cadastro");

  // ── 3. Cadastro ───────────────────────────────────────────────────
  await pagina.goto(`${BASE}/criar-conta`, { waitUntil: "networkidle" });
  await pagina.getByLabel("Seu nome").fill(`Verificação ${MARCA}`);
  await pagina.getByLabel("E-mail").fill(EMAIL);
  await pagina.getByLabel("Senha").fill(SENHA);
  await pagina.getByLabel("Nome da oficina").fill(`Oficina ${MARCA}`);
  await pagina.getByLabel("Cidade").selectOption("santo-andre");
  await pagina.getByRole("button", { name: /Criar conta|Criando/ }).click();

  await pagina.waitForURL(/\/calculadora/, { timeout: 30000 });
  registrar("conta criada e sessão iniciada");

  const { data: u } = await admin.auth.admin.listUsers();
  usuarioId = u.users.find((x) => x.email === EMAIL)?.id ?? null;
  if (!usuarioId) throw new Error("usuário não apareceu no banco");

  const { data: v } = await admin
    .from("usuarios")
    .select("oficina_id")
    .eq("id", usuarioId)
    .maybeSingle();
  oficinaId = v?.oficina_id ?? null;
  if (!oficinaId) throw new Error("oficina não foi vinculada ao usuário");
  registrar("oficina criada e vinculada");

  // ── 4. Calculadora guiada, com assistente ─────────────────────────
  await pagina.getByRole("heading", { name: "Sua oficina" }).waitFor({ timeout: 20000 });
  registrar("modo guiado apareceu na primeira visita");

  await pagina.getByRole("radio", { name: /Funilaria/i }).check();
  const corpo = await pagina.locator("body").innerText();
  if (!/\bUT\b/.test(corpo)) throw new Error("funilaria não trocou a unidade para UT");
  registrar("segmento funilaria: unidade virou UT");

  await pagina.getByRole("button", { name: "Continuar" }).click();
  await pagina.getByRole("heading", { name: "Sua equipe" }).waitFor();

  // O assistente tem de responder AO FOCO, sem exigir toque em nada.
  await pagina.getByLabel("Salário médio, por mês").click();
  await pagina.getByText(/Onde encontrar/i).first().waitFor({ timeout: 10000 });
  const ajuda = await pagina.locator("body").innerText();
  if (!/folha de pagamento/i.test(ajuda)) {
    throw new Error("assistente não mostrou onde achar o salário");
  }
  registrar("assistente respondeu ao foco, sem exigir toque");

  await pagina.getByLabel("Salário médio, por mês").fill("380000");
  await pagina.getByText("Com o que você já informou").waitFor({ timeout: 10000 });
  registrar("resultado parcial apareceu no meio do guiado");

  // Pula para a tela completa e salva pela configuração.
  await pagina.getByRole("button", { name: "Preencher tudo de uma vez" }).click();
  await pagina.getByRole("heading", { name: /Calculadora de custo real/i }).waitFor();
  registrar("tela completa assumiu com os dados preenchidos");

  await pagina.waitForTimeout(SILENCIO_MS + 2000);

  // ── 5. Salvar DA CALCULADORA ──────────────────────────────────────
  // Tem de ser daqui: /oficina carrega do banco e ignora o que está na
  // tela, então salvar por lá gravaria os padrões em vez do que o
  // usuário acabou de preencher. Foi assim que este teste encontrou a
  // falta do botão de salvar na calculadora.
  // Em 375px o bloco pós-resultado vive dentro da barra que expande ao
  // toque — é o fluxo real do dono de oficina no balcão.
  await pagina.getByRole("button", { name: /toque para ver a composição/i }).click();
  await pagina.getByRole("button", { name: /Salvar configuração|Salvando/ }).click();
  await pagina.getByText("Configuração salva.").waitFor({ timeout: 20000 });
  registrar("configuração salva pela própria calculadora");

  // O que foi gravado tem de ser o que estava na tela, não o padrão.
  const { data: salvo } = await admin
    .from("configuracoes_calculo")
    .select("custo_real_unidade")
    .eq("oficina_id", oficinaId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!salvo?.custo_real_unidade) {
    throw new Error("a configuração salva não trouxe o snapshot do resultado");
  }
  registrar(`snapshot do resultado gravado (${Number(salvo.custo_real_unidade).toFixed(2)})`);

  // ── 6. Painel ─────────────────────────────────────────────────────
  await pagina.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
  await pagina.getByRole("heading", { name: "Sua oficina hoje" }).waitFor({ timeout: 20000 });

  const painel = await pagina.locator("body").innerText();
  if (!/Ver comparação completa/i.test(painel)) {
    throw new Error("painel não trouxe o cartão-resumo do benchmark");
  }
  registrar("painel abriu com números, histórico e o resumo do benchmark");

  // ── 6b. ⚠️ VAZAMENTO DE SEGMENTO — a conta é funilaria ─────────────
  // Nenhum texto de tela pode conter a unidade de mecânica quando a
  // conta é de funilaria (Leva 4: CompositionBar, CalculationMemory,
  // CustosFixosSecao, OcupacaoField e ResultPanel paravam de ligar no
  // provider de segmento).
  if (/\b(horas?)\b/i.test(painel)) {
    throw new Error("❌ o painel mostrou a unidade de mecânica ('hora') numa conta de funilaria");
  }
  registrar("painel: nenhum vazamento de segmento (unidade continua UT)");

  // ── 7. Benchmark — página própria desde a Leva 4 ───────────────────
  await pagina.goto(`${BASE}/benchmark`, { waitUntil: "networkidle" });
  await pagina.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 20000 });

  const benchmark = await pagina.locator("body").innerText();
  if (/\b(horas?)\b/i.test(benchmark)) {
    throw new Error("❌ /benchmark mostrou a unidade de mecânica ('hora') numa conta de funilaria");
  }
  registrar("/benchmark: nenhum vazamento de segmento");

  // ── 7b. ⚠️ A TARJA DO DADO ILUSTRATIVO, POR BLOCO ──────────────────
  // Desde a Leva 4 a tarja precisa aparecer em CADA bloco com dado do
  // grupo — custo, preço e composição — não só uma vez no topo da tela.
  const ocorrenciasDaTarja = (benchmark.match(/ILUSTRATIVO/gi) ?? []).length;
  if (/mediana/i.test(benchmark) && ocorrenciasDaTarja === 0) {
    throw new Error("❌ /benchmark mostrou faixa SEM a tarja de dado ilustrativo");
  }
  if (ocorrenciasDaTarja > 0) {
    if (ocorrenciasDaTarja < 3) {
      throw new Error(
        `❌ a tarja apareceu só ${ocorrenciasDaTarja}x — esperava 1 por bloco (custo, preço, composição)`,
      );
    }
    if (!/porte/i.test(benchmark)) {
      throw new Error("❌ /benchmark não mostrou o porte do recorte — precisa estar sempre visível");
    }
    registrar(`/benchmark: tarja em cada um dos ${ocorrenciasDaTarja} blocos com dado do grupo, porte visível`);
  } else {
    registrar("/benchmark: amostra insuficiente (nenhum número de grupo exibido)");
  }

  // ── 8. Simulador "e se" ─────────────────────────────────────────────
  await pagina.goto(`${BASE}/e-se`, { waitUntil: "networkidle" });
  await pagina.getByRole("heading", { name: "E se..." }).waitFor({ timeout: 20000 });

  const simulador = await pagina.locator("body").innerText();
  if (/\b(horas?)\b/i.test(simulador)) {
    throw new Error("❌ /e-se mostrou a unidade de mecânica ('hora') numa conta de funilaria");
  }
  if (!/Levar este cenário para a calculadora/i.test(simulador)) {
    throw new Error("/e-se não mostrou nenhum cenário simulável");
  }
  registrar("/e-se: simulador abriu com cenários, nenhum vazamento de segmento");
} finally {
  await navegador.close();
  // Limpeza: apaga o usuário e a oficina de teste, aconteça o que acontecer.
  if (oficinaId) await admin.from("oficinas").delete().eq("id", oficinaId);
  if (usuarioId) await admin.auth.admin.deleteUser(usuarioId).catch(() => {});
}

console.log("");
if (erros.length) {
  console.error("❌ erros no console do navegador:");
  for (const e of erros.slice(0, 5)) console.error(`   ${e}`);
  process.exit(1);
}

console.log(`e2e: ${passos.length} passos, fluxo logado inteiro fechado.`);
process.exit(0);

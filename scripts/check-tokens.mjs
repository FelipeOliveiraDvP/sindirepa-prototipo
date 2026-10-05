#!/usr/bin/env node
/**
 * Guarda das abstrações obrigatórias.
 *
 * Dois itens da "Definição de pronto" (docs/geral/02-produto.md) são
 * verificáveis por máquina, e é bom que sejam: sem esta guarda, o nome
 * da marca e a unidade de trabalho vazam em duas semanas e trocá-los
 * vira "uma caçada por 40 arquivos" — exatamente o que CLAUDE.md
 * quer evitar.
 *
 *   1. Literal do nome da marca  → só em src/lib/brand.ts
 *   2. Literal da unidade         → só em src/lib/pricing/config.ts
 *   3. Hex de cor                 → só em src/app/globals.css
 *   4. Promessa de margem         → em lugar nenhum
 *   5. Segredo commitável         → em lugar nenhum (varre o REPO inteiro)
 *
 * Escape: uma linha com o comentário `token-ok` é ignorada. Use quando
 * houver motivo real e deixe o motivo escrito junto.
 *
 * ⚠️ A regra 5 NÃO aceita escape e NÃO ignora comentário. Chave vazada
 * dentro de comentário é chave vazada.
 *
 * Roda no pretest, então `npm test` já o executa.
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SCAN_DIR = join(ROOT, "src");
const EXTENSIONS = [".ts", ".tsx", ".css", ".js", ".jsx", ".mjs"];

/** Caminhos relativos a src/, com separador normalizado para "/". */
const RULES = [
  {
    id: "marca",
    // O valor não é escrito aqui: sai de brand.ts, senão este arquivo
    // se torna o segundo lugar com o literal e a guarda vira o vazamento.
    pattern: brandNamePattern(),
    allow: ["lib/brand.ts"],
    message: (v) =>
      `literal do nome da marca (${v}). Importe BRAND de "@/lib/brand" — o nome troca num só arquivo.`,
  },
  {
    id: "unidade",
    // 1) palavra isolada — pega copy e label: "sua hora", "as horas"
    // 2) prefixo de identificador — pega nome de campo: horasPorDia, horaAtual.
    //    Sem flag `i` na segunda: o lookahead [A-Z] depende de case.
    //
    // LIMITE CONHECIDO: a unidade no MEIO de um identificador
    // (custoHoraReal) escapa. Pegar isso exigiria casar sem \b, o que
    // gera falso positivo em "melhora" e "embora". A forma de prefixo
    // cobre o caso real de nome de campo de domínio.
    pattern: [/\b(horas?)\b/gi, /\bhoras?(?=[A-Z])/g],
    allow: ["lib/pricing/config.ts"],
    message: (v) =>
      `literal da unidade de trabalho ("${v}"). Use \`unit\` de "@/lib/pricing/config" — mecânica opera em hora e funilaria em UT — a unidade vem do segmento.`,
  },
  {
    id: "cor",
    pattern: /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi,
    allow: ["app/globals.css"],
    message: (v) =>
      `hex de cor (${v}) fora do design system. Use um token da paleta — ver docs/geral/05-marca.md.`,
  },
  {
    /**
     * Restrição de posicionamento.
     *
     * Nenhuma superfície pública pode prometer aumento de margem. O tema
     * é confiança do consumidor, e o público desconfia de quem promete
     * demais — truque de conversão queima a credibilidade de que o
     * produto inteiro depende. O enquadramento é transparência e
     * profissionalização, e o ganho econômico é consequência de
     * precificar certo, nunca a manchete
     * (CLAUDE.md, docs/landings/04-landing.md).
     *
     * É a única regra aqui que não é técnica. Está automatizada porque
     * "não negociável" que depende de alguém lembrar não é garantia — e
     * porque quem escrever a próxima landing pode não conhecer a regra.
     */
    id: "posicionamento",
    pattern: [
      /aumente\s+(sua|a)\s+margem/gi,
      /cobre\s+o\s+que\s+voc[êe]\s+merece/gi,
      /pare\s+de\s+perder\s+dinheiro/gi,
      /dobre\s+(seu|o)\s+lucro/gi,
      /maximiz\w*\s+(sua|a)\s+margem/gi,
      /lucre\s+mais/gi,
    ],
    allow: [],
    message: (v) =>
      `"${v}" promete ganho de margem, e nenhuma superfície pública pode — ver a tabela de copy em CLAUDE.md. Reenquadre em transparência: "saiba quanto custa de verdade", "preço com base em cálculo, não em achismo", "descubra seu ponto de equilíbrio".`,
  },
];

/**
 * Lê o nome da marca de brand.ts em vez de repeti-lo aqui.
 * Se brand.ts mudar de forma, a guarda falha alto em vez de passar calada.
 */
function brandNamePattern() {
  const brandFile = join(ROOT, "src", "lib", "brand.ts");
  const source = readFileSync(brandFile, "utf8");
  const match = source.match(/name:\s*"([^"]+)"/);
  if (!match) {
    console.error(
      'check-tokens: não achei `name: "..."` em src/lib/brand.ts. ' +
        "A guarda do nome da marca não pode rodar — corrija brand.ts ou o script.",
    );
    process.exit(2);
  }
  return new RegExp(escapeRegExp(match[1]), "gi");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      yield* walk(full);
      continue;
    }
    if (EXTENSIONS.some((ext) => entry.endsWith(ext))) yield full;
  }
}

/**
 * Marca quais linhas do arquivo são comentário.
 *
 * Explicar POR QUE a unidade é token exige escrever "hora" na
 * explicação, então comentário precisa passar. O risco que importa é o
 * literal chegar ao usuário, e isso vive em código.
 *
 * Rastreia bloco `/* *\/` entre linhas, e não só o início da linha: um
 * comentário JSX de várias linhas tem as linhas do meio começando com
 * texto comum, e o heurístico anterior as tratava como código.
 *
 * Não é um parser: `/*` dentro de string literal confunde. É aceitável —
 * o efeito seria deixar de reportar uma linha, e a guarda existe para
 * pegar o descuido comum, não para ser à prova de adversário.
 */
function marcarComentarios(lines) {
  const ehComentario = new Array(lines.length).fill(false);
  let dentroDeBloco = false;

  lines.forEach((line, i) => {
    const t = line.trim();

    if (dentroDeBloco) {
      ehComentario[i] = true;
      if (t.includes("*/")) dentroDeBloco = false;
      return;
    }

    if (t.startsWith("//")) {
      ehComentario[i] = true;
      return;
    }

    const abre = t.indexOf("/*");
    if (abre !== -1) {
      // Só conta como linha de comentário se o comentário começa a linha.
      // `const x = 1; /* nota */` ainda tem código para checar.
      ehComentario[i] = abre === 0 || t.startsWith("{/*");
      if (!t.includes("*/", abre + 2)) dentroDeBloco = true;
    }
  });

  return ehComentario;
}

const findings = [];

for (const file of walk(SCAN_DIR)) {
  const relToSrc = relative(SCAN_DIR, file).split(sep).join("/");
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const ehComentario = marcarComentarios(lines);

  for (const rule of RULES) {
    if (rule.allow.includes(relToSrc)) continue;

    const patterns = Array.isArray(rule.pattern) ? rule.pattern : [rule.pattern];

    lines.forEach((line, i) => {
      if (ehComentario[i] || line.includes("token-ok")) return;
      // Um mesmo trecho pode casar em mais de um padrão da mesma regra
      // (horasPorDia casa como palavra e como prefixo). Reporta uma vez.
      const seen = new Set();
      for (const pattern of patterns) {
        for (const m of line.matchAll(pattern)) {
          if (seen.has(m.index)) continue;
          seen.add(m.index);
          findings.push({
            file: `src/${relToSrc}`,
            line: i + 1,
            rule: rule.id,
            text: rule.message(m[0]),
            snippet: line.trim(),
          });
        }
      }
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════
 *  REGRA 5 — SEGREDO COMMITÁVEL
 * ═══════════════════════════════════════════════════════════════════
 *
 * Varre o que o git REALMENTE levaria num commit: rastreados + novos
 * ainda não ignorados. É o escopo certo — chave só faz dano quando sai
 * da máquina, e `.gitignore` é a fronteira disso.
 *
 * Diferente das outras regras, esta:
 *   - varre o repositório inteiro, não só src/
 *   - NÃO ignora comentário
 *   - NÃO aceita `token-ok`
 *
 * A service role do Supabase ignora RLS e dá acesso total ao banco.
 * Vazar uma é evento irreversível: o histórico do git é público assim
 * que alguém clona, e rotacionar depois não desfaz a cópia.
 */
const PADROES_DE_SEGREDO = [
  {
    id: "jwt",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g,
    o_que: "JSON Web Token (formato das chaves anon e service_role do Supabase)",
  },
  { id: "sb_secret", re: /\bsb_secret_[A-Za-z0-9]{15,}/g, o_que: "chave secreta do Supabase" },
  { id: "sb_token", re: /\bsbp_[a-f0-9]{40}\b/g, o_que: "token de acesso pessoal do Supabase" },
  {
    id: "url_projeto",
    re: /https:\/\/[a-z]{20}\.supabase\.co/g,
    o_que: "URL de projeto Supabase real (deve vir de variável de ambiente)",
  },
  {
    id: "atribuicao",
    re: /(?:SERVICE_ROLE_KEY|SECRET_KEY|API_KEY|PASSWORD)\s*[:=]\s*["']?[A-Za-z0-9._~+\/-]{20,}/g,
    o_que: "segredo atribuído em literal",
  },
  { id: "aws", re: /\bAKIA[0-9A-Z]{16}\b/g, o_que: "access key da AWS" },
  {
    id: "chave_privada",
    re: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/g,
    o_que: "bloco de chave privada",
  },
];

/**
 * MODO DEMONSTRACAO DO BENCHMARK — a terceira trava.
 *
 * As outras duas vivem no codigo: o selo vem junto do dado, e o
 * componente nao renderiza numero sem a tarja. Esta impede que a
 * variavel seja LIGADA num arquivo versionado — ou seja, que o modo
 * demonstracao va parar em producao porque alguem comitou o .env
 * errado ou deixou um default no next.config.
 *
 * Declarar em .env.example e LER no codigo e legitimo; atribuir "1"
 * num arquivo versionado, nao. Ver docs/saas/09-benchmark.md.
 */
const DEMO_LIGADA = new RegExp(
  "NEXT_PUBLIC_BENCHMARK_DEMO" + String.raw`\s*[:=]\s*["']?1`,
  "g",
);
const DEMO_PERMITIDO = new Set([
  // Le a variavel; nao a liga.
  "lib/benchmark/demo.ts",
  // Liga e desliga em memoria para testar o proprio comportamento da
  // flag, e restaura no afterEach. E escopo de processo, nao
  // configuracao de deploy — que e o que esta regra protege.
  "lib/benchmark/demo.test.ts",
]);

/** Arquivo de ambiente que escapou do .gitignore é violação por si só. */
const ENV_PERMITIDO = /^\.env\.example$/;

function arquivosQueOGitLevaria() {
  try {
    return execSync("git ls-files --cached --others --exclude-standard", {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    // Fora de um repositório git. Não é motivo para falhar o build.
    console.warn("check-tokens: git indisponível — varredura de segredos pulada.");
    return null;
  }
}

const arquivos = arquivosQueOGitLevaria();

if (arquivos) {
  for (const rel of arquivos) {
    const base = rel.split("/").pop() ?? rel;

    if (base.startsWith(".env") && !ENV_PERMITIDO.test(base)) {
      findings.push({
        file: rel,
        line: 0,
        rule: "segredo",
        text: `arquivo de ambiente "${base}" entraria no commit. Só .env.example é versionável — confira o .gitignore.`,
        snippet: "(arquivo inteiro)",
      });
      continue;
    }

    let conteudo;
    try {
      conteudo = readFileSync(join(ROOT, rel), "utf8");
    } catch {
      continue; // binário, link quebrado, arquivo removido entre o ls e o read
    }
    if (conteudo.includes("\u0000")) continue; // binario (NUL)

    if (!DEMO_PERMITIDO.has(rel.replace(/^src\//, ""))) {
      // Linha comentada NAO liga nada — diferente da regra de segredo,
      // onde chave comentada continua sendo chave vazada. Aqui o que
      // importa e a variavel ATIVA, e `# VAR=1` num .env.example e
      // documentacao de como ligar, nao a ligacao.
      const ativas = conteudo
        .split(/\r?\n/)
        .filter((l) => {
          const t = l.trim();
          return !t.startsWith("#") && !t.startsWith("//") && !t.startsWith("*");
        })
        .join(" ");

      for (let n = ativas.match(DEMO_LIGADA)?.length ?? 0; n > 0; n--) {
        findings.push({
          file: rel,
          line: 0,
          rule: "benchmark-demo",
          text:
            "NEXT_PUBLIC_BENCHMARK_DEMO ligada em arquivo versionado. O modo " +
            "demonstracao mostra numero ilustrativo; ligado em producao ele " +
            "vira dado de mercado falso. Ligue so no .env.local. " +
            "Ver docs/saas/09-benchmark.md.",
          snippet: "(modo demonstracao)",
        });
      }
    }

    conteudo.split(/\r?\n/).forEach((linha, i) => {
      for (const { id, re, o_que } of PADROES_DE_SEGREDO) {
        for (const m of linha.matchAll(re)) {
          findings.push({
            file: rel,
            line: i + 1,
            rule: "segredo",
            text: `${o_que}. NÃO commite. Mova para .env.local e leia via process.env. [${id}]`,
            // Nunca ecoa o segredo inteiro no log de CI.
            snippet: `${m[0].slice(0, 12)}… (${m[0].length} caracteres, ocultado)`,
          });
        }
      }
    });
  }
}

if (findings.length === 0) {
  console.log(
    "check-tokens: ok — marca, unidade e cores tokenizadas; nenhuma promessa " +
      "de margem; nenhum segredo commitável.",
  );
  process.exit(0);
}

console.error(`check-tokens: ${findings.length} violação(ões).\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.rule}]`);
  console.error(`    ${f.text}`);
  console.error(`    > ${f.snippet}\n`);
}
console.error("Escape para caso legítimo: comentar a linha com `token-ok` e o motivo.");
process.exit(1);

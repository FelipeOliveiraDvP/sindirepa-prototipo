# 08 — Landing institucional do produto

Rota `/produto`. Segunda peça de aquisição, ao lado de `docs/landings/04-landing.md`.

Estava parada no escopo original da Leva 1, com a razão registrada de que "o argumento central depende da decisão de segmento". Foi liberada por decisão do Felipe, com a restrição que dissolve o bloqueio: **copy neutra entre mecânica e funilaria**. A peça vale nos dois cenários, e é esse o critério que qualificou o resto da Leva 1.

---

## Objetivo

Explicar o produto e capturar interesse. Diferente de `04-landing.md`, que tem objetivo único, esta página tem **dois caminhos de conversão medidos**:

1. Entrada na lista de espera — `lead_email_capturado` com `origem: "landing_produto"`
2. Travessia para a calculadora — `cta_calculadora_clicado`

O segundo importa tanto quanto o primeiro: quem atravessa para a calculadora experimenta o produto, e é o único caminho que entrega valor hoje.

---

## As três restrições

### 1. Neutra entre segmentos

Fala de "oficina" e "mão de obra". Toda menção à unidade de trabalho passa por `unit` (`src/lib/pricing/config.ts`). Nenhuma frase pressupõe salário fixo, mecânico como produtivo único, ou hora como unidade.

Se o segmento for decidido para funilaria, esta copy continua de pé.

### 2. Módulos futuros aparecem como visão de produto

Decisão do Felipe: os módulos parados (orçamento, benchmark regional, apontamento) são descritos em tempo presente, sem selo de "em breve".

**Três coisas seguram a honestidade disso, e nenhuma é opcional:**

| Mecanismo | Onde |
|---|---|
| Uma banda diz sem atenuante o que já está no ar | `CALCULADORA_DISPONIVEL`, a única seção com CTA de uso imediato |
| O CTA principal é lista de espera, não "criar conta" | Uma lista de espera comunica por si só que o produto não está todo aberto |
| Nenhuma data de lançamento, em lugar nenhum | `01-contexto.md`: a parceria proíbe prometer prazo ou capacidade em material público |

Mexer em uma exige revisar as outras duas. Se o CTA virar "criar conta", a seção de módulos precisa ser revista junto.

### 3. Descrever não é implementar

A página fala dos módulos parados. Não constrói casca de nenhum deles — casca vira dívida (`02-produto.md`).

---

## Estrutura

| # | Seção | Papel |
|---|---|---|
| 1 | Herói | Título, uma linha do que é, dois CTAs (lista de espera por âncora, calculadora), nota de que a calculadora já está no ar |
| 2 | Prova | SENAI-SP + SINDIREPA-SP. Componente compartilhado com a landing da calculadora |
| 3 | Onde a conta da oficina se perde | 4 dores. Situação de negócio, não a matemática — essa é o "Por que a maioria erra" da outra landing |
| 4 | Do custo ao preço, e de volta | O ciclo de `01-contexto.md` em 4 passos ordenados |
| 5 | O que a plataforma faz | 5 módulos |
| 6 | Comece pela calculadora | A banda de honestidade. Único CTA de uso imediato |
| 7 | Nenhum número sem a conta atrás | Transparência + os 5 princípios de `CLAUDE.md` |
| 8 | Para quem é | ICP e o esclarecimento de que não substitui o ERP |
| 9 | FAQ | 6 perguntas. Gera o JSON-LD `FAQPage` da mesma fonte |
| 10 | Lista de espera | Formulário com consentimento explícito. A ilha principal |

Ritmo visual idêntico ao de `04-landing.md`: bandas alternadas, `py-12 md:py-20`, `max-w-5xl`.

---

## Regras

**Vale tudo de `04-landing.md`,** e as mesmas coisas ficam de fora: pop-up de saída, contador de urgência, vídeo de fundo, biblioteca de animação, parallax, ilustração 3D, ícone de chave inglesa ou engrenagem, foto de banco de imagem.

Acrescenta-se:

- **Sem depoimento inventado e sem número de mercado inventado.** Nem preço, nem quantidade de oficinas, nem percentual de economia. O produto se vende como "baseado em dados"; um número inventado que vaze destrói exatamente a credibilidade que ele promete.
- **Sem data de lançamento.** O FAQ responde com o critério de liberação ("testados com oficinas reais antes de abrir"), que é informação verdadeira e útil.
- **Tabela de posicionamento de `CLAUDE.md`** — nada de promessa de margem. `scripts/check-tokens.mjs` derruba o build, mas a regra vem antes da guarda.
- **Sem link no header.** A landing da calculadora não pode ganhar rota de fuga. O caminho de volta é um link no rodapé.

---

## Lista de espera

Server Action em `src/app/(landings)/produto/actions.ts` → `registrarLead()` em `src/lib/data/leads.ts` → tabela `public.leads` no Supabase.

- Consentimento explícito por checkbox, gravado no mesmo registro do e-mail.
- Validação de e-mail frouxa de propósito: cada rejeição indevida é um lead perdido, e o risco maior do produto é resistência à adoção.
- Reenvio do mesmo e-mail é sucesso idempotente (`unique (email, origem)`), não erro.
- **Sem credencial de banco, a página mostra erro — nunca sucesso falso.** Prometer "você está na lista" para quem não ficou é pior que pedir para tentar de novo, ainda mais numa página com a marca dos parceiros.
- Funciona sem JS: `<form>` postando para a Action, com toda validação refeita no servidor.
- ⚠️ LGPD: o evento de funil registra que houve captura, nunca o e-mail. O log de erro também não.

---

## SEO

- Metadata derivada de `BRAND` e da copy, nunca literal.
- Canonical `/produto`.
- JSON-LD `FAQPage`, gerado do mesmo array que renderiza o FAQ visível.
- Termos de busca em `TERMOS_DE_BUSCA_PRODUTO` — intenção diferente da outra landing: lá a pessoa procura a conta, aqui procura a ferramenta.
- `src/app/sitemap.ts` lista `/` e `/produto`. `/calculadora` fica fora do índice: é produto, não peça de aquisição.

---

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/lib/copy/institucional.ts` | Toda a copy |
| `src/app/(landings)/produto/page.tsx` | Composição, metadata, JSON-LD |
| `src/app/(landings)/produto/actions.ts` | Server Action da lista de espera |
| `src/components/landing/secoesProduto.tsx` | Seções estáticas |
| `src/components/landing/ListaDeEspera.tsx` | Ilha do formulário |
| `src/components/landing/LinkCalculadora.tsx` | CTA instrumentado, usado em três pontos |
| `src/lib/data/leads.ts`, `src/lib/data/supabase.ts` | Persistência |

Compartilhado com a landing da calculadora: `<Prova />` e `<Faq />` de `src/components/landing/secoes.tsx` — o `<Faq />` recebe o conteúdo por prop e continua com o FAQ da calculadora por padrão.

---

## Variáveis de ambiente

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Sem prefixo `NEXT_PUBLIC_` de propósito: a service role ignora RLS e não pode entrar no bundle do navegador.

```sql
create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  origem        text not null,
  consentimento boolean not null default false,
  criado_em     timestamptz not null default now(),
  unique (email, origem)
);
alter table public.leads enable row level security;
-- Sem policy: só a service role escreve, via Server Action.
```

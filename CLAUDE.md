# CLAUDE.md

Contexto permanente do projeto. Leia antes de escrever qualquer código.

---

## O que é

Plataforma de **inteligência de precificação de mão de obra para oficinas automotivas independentes** no Brasil. Não é um ERP. Não substitui o sistema de gestão da oficina — se conecta a ele.

Produto da **Nocobi** (consultoria de dados e automação, Campinas/SP), selecionado na Chamada de Aceleração para Gestão em Oficinas Automotivas do **UPLAB SENAI-SP** com o **SINDIREPA-SP**.

**Nome da marca:** usar sempre o token `BRAND.name`. Valor atual: **Apura**, virou a marca do produto (manual da marca em `docs/geral/marca/apura-manual-da-marca.pdf`). Ver `docs/geral/05-marca.md`. Trocar o nome deve ser um edit em um arquivo de config, nunca uma caçada por 40 arquivos.

---

## ⚠️ ESCOPO ATUAL: LEVA 3

A Leva 1 (landing `/`, calculadora `/calculadora`, landing institucional `/produto`) está entregue ou em curso.

**A decisão de segmento foi fechada com SENAI e SINDIREPA: mecânica e funilaria, as duas.** Isso liberou o que estava parado por causa dela. Registro em `docs/geral/01-contexto.md`.

A **Leva 2** entregou: segmento (mecânica/funilaria), calculadora guiada, conta e configuração da oficina.

**A Leva 3 tem quatro entregas:**

1. **Conta obrigatória** para usar a ferramenta — ver a reversão abaixo
2. **Assistente de campo** — ensina *onde encontrar* cada número, não só o que ele é
3. **Painel** (`/painel`) — números do momento e evolução do próprio custo
4. **Redesign acolhedor**, dentro das regras de `docs/geral/05-marca.md`

### ⚠️ REVERSÃO CONSCIENTE: a calculadora deixou de ser aberta

Até a Leva 2, "sem login obrigatório" era regra em quatro documentos e na copy da landing. **Decisão do Felipe na Leva 3: a ferramenta exige conta.** Continua gratuita.

O que permanece aberto: a **prévia de três campos do herói da landing**. Ela é a única prova de valor antes de pedir algo, e sem ela a landing só promete.

Duas consequências que acompanham a decisão, e que não podem ser esquecidas:

- **A copy mudou junto.** Havia promessa de "sem cadastro" no herói, no FAQ e no institucional — e o FAQ vira JSON-LD indexado pelo Google. O enquadramento novo é honesto: gratuito, pede conta, e diz para que serve a conta. Nunca fingir que ela é opcional.
- **A fonte do benchmark mudou.** Ver abaixo.

**Elétrica não é segmento.** Opera com a mesma unidade e a mesma estrutura de custo da mecânica; entra como função de produtivo, não como configuração separada.

### A regra que não pode ser afrouxada no benchmark

A fonte do benchmark é **`configuracoes_calculo` × `oficinas`**, agregada por região e segmento — o que os donos de oficina salvam na conta. Ela **nasce vazia**.

Mudou na Leva 3: com conta obrigatória, `CalculoAnonimo` passou a registrar só a prévia de três campos do herói, que é preliminar demais para entrar numa mediana. A amostra ficou menor e melhor — oficina real, uma por conta, com histórico.

**Abaixo do N mínimo por região e por segmento, nenhuma faixa de mercado é renderizada.** A tela diz que a amostra ainda é pequena. Nunca preenche o vazio com estimativa, mock não rotulado ou número "de referência".

Isso não é preciosismo: o produto se vende como "baseado em dados", e um número inventado que vaze destrói exatamente a credibilidade que ele promete. O protótipo Lovable gerava a distribuição com `Math.random()` a cada render — é o exemplo do que não fazer.

**Existe um modo demonstração, e ele é travado.** Para demonstrar a tela antes de haver amostra, há dado ilustrativo — com tarja permanente que o componente não renderiza sem, variável de ambiente que não existe em produção, e guarda no `check-tokens`. Detalhe em `docs/saas/09-benchmark.md`. **Nunca afrouxar as três travas.** O risco não é enganar o Felipe: é um print numa reunião do SINDIREPA.

**Não construir nesta leva, mesmo que pareça natural:**

- ❌ Gerador de orçamento / tempário
- ❌ Apontamento de tempo e produtividade
- ❌ Integração com ERP
- ❌ Ordem de serviço, estoque, peças, nota fiscal, financeiro
- ❌ Cronômetro/timer
- ❌ Login social, gamificação, chat
- ❌ `LaborCostModel` de comissão — torna o cálculo circular; funilaria entra com salário fixo

Se uma tarefa parecer exigir algo dessa lista, **pare e pergunte**.

A landing institucional descreve módulos parados como visão de produto, em tempo presente. Três mecanismos seguram a honestidade disso — banda que diz o que já está no ar, CTA de lista de espera em vez de "criar conta", e nenhuma data de lançamento. Detalhe em `docs/landings/08-landing-produto.md`. **Descrever um módulo não autoriza construí-lo.**

---

## Duas abstrações obrigatórias — agora em uso

Foram criadas na Leva 1 para preservar a opção de atender funilaria. **A opção foi exercida.** Elas deixaram de ser seguro e viraram infraestrutura. Detalhe técnico em `docs/geral/06-dados.md`.

**1. Modelo de custo de mão de obra plugável.**
Em oficina mecânica, mecânico é salário fixo + encargos. Em funilaria, funileiro e pintor frequentemente trabalham por comissão — o custo vira variável. A lib expõe `LaborCostModel`; **só `salario_fixo` existe, nos dois segmentos.**

Comissão continua fora, e o motivo é técnico, não de prioridade: o custo passa a depender do faturamento, que depende do preço, que depende do custo. **O cálculo vira circular** e exige resolução iterativa. Não é trocar uma linha.

**2. Unidade de trabalho como token, não como literal.**
Nunca escrever a unidade fixa em copy, label ou nome de campo. **Mecânica opera em hora; funilaria em UT.**

O que muda na Leva 2: a unidade deixa de ser constante de módulo e passa a ser **derivada do segmento**. `unit` resolvido em tempo de import só continua valendo nas landings, que são SSG e falam para mecânica. Dentro de `(app)`, a unidade vem do contexto do segmento.

---

## Quem usa

**ICP:** dono de oficina independente de médio porte (3–8 mecânicos), Grande São Paulo e ABC.

- 35–55 anos, formação técnica, não formação em gestão
- Usa celular muito mais que desktop — frequentemente **em pé, no balcão, com a mão suja**
- Já usa um ERP de oficina (Ultracar, WorkMotor, Mecanie) e não quer outro
- Precifica no achismo ou copiando o concorrente da esquina
- Desconfia de software que promete demais
- **Não vai ler tutorial. Não vai assistir onboarding. Não vai preencher 30 campos.**

**Mobile-first não é preferência, é o caso de uso primário.** Alvos de toque ≥ 44px. Nenhum fluxo que exija duas mãos.

**Ameaça principal do produto é resistência à adoção, não complexidade técnica.** Cada campo a mais no formulário é uma oficina a menos usando. Ler toda decisão de UX sob essa lente.

---

## Os 5 princípios do produto (não negociáveis)

A solução se avalia contra estes cinco adjetivos:

| Princípio | O que significa na tela |
|---|---|
| **Educativa** | Guia o usuário no cálculo correto. Explica *por que* o número é aquele. |
| **Intuitiva** | Processo simples e óbvio. Zero jargão contábil sem tradução. |
| **Transparente** | Mostra a composição do preço aberta, item a item. Nunca caixa-preta. |
| **Baseada em dados** | Usa informação real e indicadores, não estimativa genérica. |
| **Parametrizável** | O usuário ajusta o simulador com os dados dele. |

**Regra derivada:** nenhum número aparece na interface sem que o usuário consiga abrir e ver de onde veio. É o diferencial do produto, não polimento — todo concorrente esconde a conta.

---

## Posicionamento — e a restrição que vem junto

Internamente, o valor é "a oficina para de perder dinheiro por precificar errado".

**Publicamente — site, landing, qualquer material com a marca dos parceiros — o enquadramento é transparência e profissionalização, não maximização de margem.** O tema é confiança do consumidor, e o público desconfia de quem promete demais.

| ❌ Não escrever | ✅ Escrever |
|---|---|
| "Aumente sua margem em 30%" | "Saiba quanto custa de verdade a sua hora" |
| "Cobre o que você merece" | "Preço com base em cálculo, não em achismo" |
| "Pare de perder dinheiro" | "Descubra seu ponto de equilíbrio" |
| "Dobre seu lucro" | "Mostre ao cliente como o preço é formado" |

O ganho econômico é consequência de precificar certo — nunca a promessa da manchete.

---

## Stack

Decidida com o Felipe. Lovable foi descartado — a suposição anterior de Vite existia para manter compatibilidade com ele e não se aplica mais.

- **Next.js 16 (App Router)** + TypeScript strict
- **Tailwind v4** — config CSS-first. Não existe `tailwind.config.ts`: os tokens vivem em `@theme`, dentro de `src/app/globals.css`
- Supabase (auth + dados)
- Vitest para a lib de cálculo

⚠️ **Next 16 tem quebras em relação ao que os modelos têm treinado.** Antes de escrever código de framework, conferir o guia em `node_modules/next/dist/docs/`. A geração automática de instruções do Next está desligada (`agentRules: false` em `next.config.ts`) para que ele não escreva dentro deste arquivo.

**Um único app, com dois route groups** — o grupo não aparece na URL:

- `src/app/(landings)/` — peças de aquisição. Estáticas (SSG), porque precisam rankear. Só ilhas hidratam. Hoje são duas: `/` (calculadora) e `/produto` (institucional).
- `src/app/(app)/` — o produto. Client-side, sem SEO. Na Leva 2 cresce para `/calculadora`, `/oficina`, `/benchmark` e as telas de conta, e ganha o provider de segmento — é dele que sai a unidade de trabalho.

`/` não tem navegação no header, de propósito: o objetivo único dela é fazer o dono de oficina começar a preencher, e link no chrome compartilhado seria rota de fuga. O caminho é `/produto` → `/calculadora`; a volta existe só no rodapé.

Convenções:
- Tokens de marca em `src/lib/brand.ts` + CSS custom properties. **Nunca hex solto no JSX.**
- Lógica de cálculo em `src/lib/pricing/` — **funções puras, testáveis, sem React**. A calculadora é o coração do produto; não pode estar amarrada a um componente. Ter testes unitários dela desde o começo.
- Textos de interface em `src/lib/copy/` (pt-BR).
- Camada de dados isolada em `src/lib/data/` — trocar Supabase não deve tocar em componente.
- Componentes de cálculo em `src/components/calculator/` — **compartilhados** entre o herói da landing e a tela `/calculadora`. Por isso não vivem dentro de nenhum route group.

`scripts/check-tokens.mjs` roda no `pretest` e falha o build em quatro casos:

| Regra | Só é permitido em |
|---|---|
| literal do nome da marca | `src/lib/brand.ts` |
| literal da unidade de trabalho | `src/lib/pricing/config.ts` |
| hex de cor | `src/app/globals.css` |
| promessa de aumento de margem | em nenhum lugar |

As três primeiras existem porque as abstrações obrigatórias não sobrevivem sem guarda. A quarta automatiza a restrição de posicionamento — "não negociável" que depende de alguém lembrar não é garantia, e quem escrever a próxima landing pode não conhecer a restrição.

Escape para caso legítimo: comentar a linha com `token-ok` e o motivo. O único uso hoje são os termos de busca em `src/lib/copy/landing.ts`, que precisam da palavra que a pessoa digita no Google.

---

## Instrumentação — obrigatória desde o primeiro commit

Sem isso não existe evidência do que funciona nem argumento sobre o funil daqui a alguns meses. Ligar instrumentação depois significa perder a linha de base, e a primeira leva é justamente a que estabelece essa linha.

Eventos mínimos: `calc_iniciada`, `calc_campo_alterado` (qual campo), `calc_resultado_visto`, `calc_composicao_aberta`, `calc_memoria_aberta`, `lead_email_capturado`, `conta_criada`, `config_salva`.

`calc_campo_alterado` importa mais do que parece: mostra qual campo trava o usuário. A hipótese é que seja taxa de ocupação.

Acrescentado na Leva 2: `calc_passo_concluido` (qual passo do modo guiado). O wizard existe para vencer resistência à adoção, e sem medir abandono por passo não há como saber se ele funcionou — a hipótese continua sendo que a taxa de ocupação é onde o usuário trava.

Acrescentado antes, com motivo: `cta_calculadora_clicado`. A landing institucional tem dois CTAs concorrentes — lista de espera e calculadora — e sem ele sobraria a leitura de só um dos dois caminhos.

⚠️ Evento carrega o **nome** do campo, nunca o valor, e nunca dado de contato. Vale igual para log de erro.

---

## Idioma

Interface, copy, mensagens de erro e domínio de negócio em **português do Brasil**.
Código, variáveis e tipos em **inglês**, exceto termos de domínio sem tradução limpa (`oficina`, `orcamento`, `maoDeObra`) — nesses casos, português sem acento.

---

## Mapa dos documentos

Três pastas, três ciclos de vida.

**`docs/geral/`** — invariante, vale para landing e para o produto:

| Arquivo | Conteúdo |
|---|---|
| `docs/geral/01-contexto.md` | Problema, mercado, concorrência, decisão de segmento em aberto |
| `docs/geral/02-produto.md` | Escopo da Leva 1, o que está parado, métricas |
| `docs/geral/05-marca.md` | ⚙️ **EDITÁVEL** — nome, cores, tipografia, tokens |
| `docs/geral/06-dados.md` | ⚙️ **EDITÁVEL** — fórmula de cálculo e modelo de dados |
| `docs/geral/07-copy.md` | ⚙️ **EDITÁVEL** (seção "Assistente de campo") — tom de voz, glossário, microcopy, e a wording do assistente de campo |

**`docs/landings/`** — peças de aquisição:

| Arquivo | Conteúdo |
|---|---|
| `docs/landings/04-landing.md` | Landing da calculadora gratuita (`/`) |
| `docs/landings/08-landing-produto.md` | Landing institucional do produto (`/produto`) |

**`docs/saas/`** — o produto:

| Arquivo | Conteúdo |
|---|---|
| `docs/saas/03-telas.md` | Especificação das telas |
| `docs/saas/09-benchmark.md` | Regra de N mínimo, anonimização e agregação do benchmark |

Arquivos ⚙️ são fonte única de verdade para valores que o Felipe ajusta.

Os prefixos numéricos são vocabulário compartilhado — "o 06" é a fórmula. Ficam não-contíguos dentro das pastas de propósito; a ordem de leitura 01→07 continua válida.

---

## Como trabalhar aqui

1. **A fórmula em `docs/geral/06-dados.md` está marcada como INFERIDA e foi implementada assim, por decisão do Felipe.** A lib exporta `FORMULA_STATUS = 'INFERIDA'` e lista os 4 pontos de divergência provável. Se surgir número da calculadora em produção (`calculadoramaodeobra.nocobi.com`) que divirja, **a que está no ar vence** — corrigir o documento primeiro, depois a lib.
2. Antes de tela nova: ler `docs/saas/03-telas.md` e `docs/geral/07-copy.md`.
3. Antes de cor, fonte ou espaçamento: ler `docs/geral/05-marca.md`.
4. **Nunca inventar número de mercado.** Se o design pedir um dado (preço médio da hora), usar mock explicitamente marcado — nunca número que possa passar por real. O produto se vende como "baseado em dados"; um número inventado que vaze destrói exatamente a credibilidade que ele promete.
5. Estados vazios, de erro e de carregamento são parte da entrega, não segundo passo.

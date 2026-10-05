# 02 — Produto: escopo

Leva 1 (A–E) está entregue ou em curso. Leva 2 (F–H) foi liberada com a decisão de segmento.

## O que entra

### A. Landing page da calculadora gratuita
Peça de aquisição. Objetivo único: fazer o dono de oficina começar a preencher. Spec em `docs/landings/04-landing.md`.

### B. Calculadora de custo real da hora
Descobre quanto custa, de fato, uma hora de mão de obra na oficina — considerando custo fixo, encargos, ociosidade e impostos.

- **Conta obrigatória** para usar a ferramenta (decisão da Leva 3). Gratuita. A prévia de três campos no herói da landing continua aberta — é a prova de valor antes de pedir qualquer coisa.
- **Cálculo reativo** — o número muda enquanto o usuário digita, sem botão "Calcular". Ver o número reagir é o mecanismo pedagógico do produto.
- **Composição do preço sempre expansível.** É o princípio de transparência do produto.
- Comparativo entre o que a oficina cobra hoje e o que deveria cobrar.

### C. Conta mínima
E-mail e senha, dados da oficina, mecânicos, custos fixos, parâmetros. Desde a Leva 3 existe painel (`/painel`), mas ele mostra apenas dado do próprio usuário: os números do momento e duas leituras sobre o próprio custo. Não é dashboard de métricas de negócio. Desde a Leva 4.1 também não é tela de análise — comparação e série ao longo do tempo moram em `/benchmark` (`docs/saas/03-telas.md`, seção 6).

### D. Instrumentação
Eventos de funil desde o primeiro commit. Lista em `CLAUDE.md`.

### E. Landing institucional do produto
Segunda peça de aquisição, em `/produto`. Spec em `docs/landings/08-landing-produto.md`.

**Estava parada e saiu da lista por decisão do Felipe.** A razão original — "o argumento central depende do segmento" — foi resolvida por restrição, não por decisão de segmento: a copy é neutra entre mecânica e funilaria, fala de "oficina" e "mão de obra" e passa toda menção à unidade por `unit`. Com isso a peça vale nos dois cenários, que é o mesmo critério que qualificou o resto da Leva 1.

A página descreve os módulos parados como visão de produto, em tempo presente. Três coisas seguram a honestidade disso, e as três são obrigatórias: a banda que diz o que já está no ar, o CTA de lista de espera em vez de "criar conta", e a ausência de qualquer data de lançamento.

Ela **não** constrói casca de módulo nenhum. Descrever não é implementar.

### F. Segmento de oficina — mecânica e funilaria

O usuário escolhe o segmento no primeiro uso, e a escolha governa três coisas: a **unidade de trabalho** (hora ou UT), as **categorias de custo fixo** oferecidas e as **funções produtivas**. Detalhe em `docs/geral/01-contexto.md` e `docs/geral/06-dados.md`.

A aritmética dos 7 passos é a mesma nos dois segmentos. O que muda é o que entra nela.

### G. Calculadora guiada na primeira vez

Modo passo a passo na primeira visita; tela única com tudo aberto depois. Os dois modos usam a mesma lib e produzem o mesmo número.

A razão é a ameaça número um do produto: resistência à adoção. A tela única é melhor para quem já entendeu e quer simular; ela é intimidante para quem abre pela primeira vez e nunca fez essa conta na vida.

### H. Benchmark regional

**Saiu da lista de parados.** A razão original tinha duas partes e só uma caiu:

- ✅ "A tese muda conforme o segmento" — resolvido: o segmento agora é explícito, e a agregação separa hora de mecânica de UT de funilaria.
- ⚠️ "Depende de volume de dados que ainda não existe" — **continua verdadeiro.**

Por isso o benchmark é a última entrega da leva, e depende de uma regra dura: **abaixo do N mínimo por região e segmento, nenhuma faixa de mercado é renderizada.** A tela diz que a amostra ainda é pequena. Nunca preenche com estimativa.

A fonte é `CalculoAnonimo` — o próprio uso da calculadora. Por isso a gravação começa bem antes da tela existir. Spec em `docs/saas/09-benchmark.md`.

---

## O que fica parado

| Módulo | Por que parou |
|---|---|
| Gerador de orçamento / tempário | Em funilaria o orçamento vem do Audatex e o produto vira análise de glosa. Dois produtos diferentes sob o mesmo nome |
| Apontamento e produtividade | A unidade de medida difere por segmento (hora-mecânico × box/ciclo) |
| Integração com ERP | Fora de escopo nesta fase |
| Modelo de custo por comissão | Torna o cálculo circular; ver `06-dados.md`. Funilaria entra com salário fixo |

Não construir "só a casca" desses módulos. Casca vira dívida.

---

## Sequência de construção

1. Design system e tokens (`docs/geral/05-marca.md`)
2. Lib de cálculo pura, com testes (`docs/geral/06-dados.md`) — **antes de qualquer tela**
3. Calculadora
4. Landing da calculadora
5. Auth e persistência da configuração
6. Instrumentação ligada ponta a ponta

A lib vem antes da tela de propósito: se o cálculo estiver errado, a tela não importa, e é o cálculo que precisa da validação do Felipe.

---

## Métricas da Leva 1

- **Taxa de conclusão da calculadora** (concluídas ÷ iniciadas) — proxy direto de fricção do formulário
- **Campo onde o usuário para** — hipótese: taxa de ocupação
- **Leads capturados** (e-mail após resultado)
- **Contas criadas** ÷ leads
- **Oficinas que voltam e editam a configuração** — melhor sinal de valor percebido

Sem número de referência inventado. A primeira leva é que estabelece a linha de base.

---

## Definição de pronto

A Leva 1 está pronta quando:

- [ ] A lib de cálculo tem testes cobrindo os casos-limite (impostos + margem ≥ 100%, zero mecânicos, ocupação zero)
- [ ] A calculadora funciona ponta a ponta em 375px, com teclado numérico e alvos de 44px
- [ ] A composição do preço abre e a memória de cálculo mostra os passos com os números do usuário
- [ ] Estados vazio, de erro e de resultado implausível existem
- [ ] A landing carrega com o primeiro campo interativo visível na primeira dobra
- [ ] Os eventos de funil chegam ao analytics
- [ ] Nenhum literal do nome da marca ("Apura") fora de `src/lib/brand.ts`
- [ ] Nenhum literal "hora" fora do token de unidade de trabalho

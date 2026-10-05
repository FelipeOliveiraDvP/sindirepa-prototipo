# 03 — Telas

Leva 1: calculadora, landing, auth, configuração.
Leva 2 acrescenta o **modo guiado** dentro da calculadora e a tela de **benchmark**.
Leva 3 acrescenta conta obrigatória, assistente de campo e o **painel** (`/painel`).
Leva 4 devolve `/benchmark` ao status de página própria (na Leva 3 ela tinha virado um bloco dentro do painel), aprofunda o painel com análises novas sobre o próprio custo, e acrescenta o simulador **`/e-se`**.

Regra transversal: **toda tela é desenhada primeiro para 375px.** Desktop é expansão, não o contrário.

---

## 1. Calculadora (`/calculadora`)

A tela mais importante do produto. Porta de entrada, ferramenta de captação e prova do conceito de transparência.

**Exige conta.** Decisão da Leva 3, revertendo o "sem login obrigatório" das levas anteriores.

O que continua aberto é a **prévia do herói da landing**: três campos, número preliminar, sem cadastro. Ela é a única prova de valor antes de pedir algo — sem ela a landing apenas promete. Ao continuar, o visitante cai no cadastro e **o que ele digitou vai junto**.

### Dois modos, um cálculo

**Primeira visita → modo guiado.** Um passo por vez, um assunto por passo. **Depois → tela única**, com tudo aberto e o resultado sempre visível. O modo guiado não volta; fica um atalho discreto para refazê-lo.

Por que os dois: a tela única é melhor para quem já entendeu e quer simular, e é intimidante para quem abre pela primeira vez e nunca fez essa conta. A ameaça número um do produto é resistência à adoção — a primeira tela precisa ser vencível.

Passos: **segmento e cidade** → equipe → jornada → custos fixos → números comerciais. Espelham as seções da tela única; não são um formulário paralelo.

Regras do modo guiado:

- **Mesma lib, mesmos componentes.** Os dois modos, com os mesmos dados, produzem exatamente o mesmo número. Isso é testado, não presumido.
- **O resultado parcial aparece assim que se torna calculável** e acompanha o usuário até o fim. Ver o número reagir é o mecanismo pedagógico; adiar tudo para uma tela final joga isso fora.
- **Voltar sem perder nada.**
- **Nenhum passo obrigatório além do salário.** Todos os outros já têm padrão. Quem quiser pular chega ao resultado.
- Instrumentar `calc_passo_concluido` — é como se mede se o wizard funcionou.

O passo de **segmento e cidade** é novo e é o único que acrescenta campo. Justifica-se: o segmento governa unidade e categorias de custo, e a cidade é o que destrava o benchmark. Fica no caminho guiado, nunca como obstáculo na tela única.

### Layout

- **Desktop:** duas colunas. Entradas à esquerda, resultado à direita, sticky.
- **Mobile:** empilhado, com o resultado numa barra fixa no rodapé que expande ao toque.

O resultado **nunca sai da vista**. O usuário precisa ver o número mudar enquanto mexe nos campos — é o mecanismo de aprendizado da ferramenta, não um detalhe de layout.

### Entradas, em quatro seções

1. **Sua equipe** — quantos produtivos, salário médio, % de encargos
2. **Sua jornada** — dias úteis, horas por dia, taxa de ocupação
3. **Seus custos fixos** — lista com categorias pré-preenchidas em R$ 0
4. **Seus números comerciais** — impostos, margem desejada, quanto cobra hoje (opcional)

Seções colapsáveis, todas abertas por padrão.

### Regras de campo

- Label **sempre visível acima do campo**. Placeholder só com exemplo real (`ex: R$ 3.200,00`).
- **Todo campo com padrão sensato preenchido.** Quem não muda nada ainda chega a um resultado plausível. Essa é a diferença entre uma calculadora usada e uma abandonada.
- **⚠️ EXCEÇÃO: salário médio abre vazio.** Decisão do Felipe. `06-dados.md` deixou o campo sem padrão e qualquer valor inventado aqui poderia passar por referência de mercado — o que `CLAUDE.md` proíbe. É o único campo sem padrão, e é o campo que deve receber o foco inicial.
- Tooltip explicando **o que é e por que importa**, em linguagem de oficina, não de contador. Textos fixos em `docs/geral/07-copy.md`.
- **Taxa de ocupação merece tratamento próprio:** é o campo que o usuário menos entende e que mais muda o resultado. Slider + explicação inline + faixa típica de referência. Instrumentar abandono aqui.
- Máscara de moeda, `inputMode="decimal"` no mobile.
- Validação no blur, nunca a cada tecla.

### Painel de resultado

Hierarquia visual, nesta ordem:

1. **Custo real da hora** — número-herói, Chakra Petch 48px
2. **Preço sugerido** — secundário, destacado
3. **Ponto de equilíbrio** — abaixo disso é prejuízo
4. **Comparativo** (se informou o preço atual) — diferença por unidade e impacto no mês
5. **Composição do preço**

### Composição do preço — o elemento assinatura

Barra empilhada horizontal: mão de obra direta / custos fixos / impostos / margem. Cada faixa clicável, abrindo valor absoluto e cálculo.

Abaixo, a **memória de cálculo** em texto, na ordem exata dos 7 passos de `docs/geral/06-dados.md`, com os números do usuário substituídos. Colapsável, fechada por padrão, rótulo "Ver como esse número foi calculado".

É o elemento assinatura do produto. Não cortar por espaço.

Animar a transição do número quando o valor muda — é a parte que ensina. Respeitar `prefers-reduced-motion`.

### Estados

- **Zero:** os padrões cobrem todos os campos menos o salário médio (ver a exceção acima), então a tela abre com **um** campo a preencher e o resto pronto. Pedir o salário de forma clara — nunca mostrar `R$ 0,00`, que parece um cálculo e ensina a coisa errada. Assim que o salário entra, o resultado aparece e reage a cada tecla.
- **Erro de validação:** ver tabela de casos-limite em `docs/geral/06-dados.md`. Mensagem explica por que é impossível, não diz "erro".
- **Resultado implausível:** avisar que algum valor parece fora da curva e **apontar qual campo**.

### Depois do resultado

Bloco discreto. Não modal, não bloqueante:

- Receber o cálculo por e-mail → captura de lead
- Baixar em PDF
- Criar conta para guardar a configuração

Consentimento LGPD explícito antes de persistir e-mail.

---

## 2. Landing da calculadora (`/`)

Spec completa em `docs/landings/04-landing.md`.

---

## 3. Auth (`/entrar`, `/criar-conta`)

E-mail e senha. Sem login social.

Cadastro pede o mínimo: nome, e-mail, senha, nome da oficina, cidade.

**Se o usuário veio da calculadora, os dados já preenchidos migram para a conta.** Fazer o cara digitar duas vezes é perder o cara.

---

## 4. Configuração da oficina (`/oficina`)

Onde vivem os dados que alimentam o cálculo. Quatro abas:

- **Oficina** — nome, CNPJ, cidade, região
- **Equipe** — produtivos, salário, encargos, ativo/inativo
- **Custos fixos** — lista editável por categoria, total mensal sempre visível
- **Parâmetros** — jornada, ocupação, impostos, margem

Toda alteração mostra em tempo real **o impacto no custo da hora**: "aumentar o aluguel em R$ 500 sobe sua hora em R$ X". É a mesma pedagogia da calculadora aplicada à configuração.

Salvar cria nova versão de `ConfiguracaoCalculo`.

Desde a Leva 3 existe `/painel`, e é onde o usuário logado cai ao entrar. Ver a seção 6.

---

## 5. Benchmark (`/benchmark`)

Spec completa em `docs/saas/09-benchmark.md`.

Página própria desde a Leva 4 — na Leva 3 ela era um bloco dentro do painel; virou grande demais para caber ali sem esmagar o resto. O painel guarda um cartão-resumo que leva até ela.

A pergunta deixou de ser só "meu preço está perto do que a região cobra" e passou a ser **"como eu estou perto de oficinas parecidas com a minha"**: comparação em custo, preço e composição, não só um número contra uma faixa. "Parecidas" tem definição operacional — região × segmento × porte, ver `09-benchmark.md`. Exige cálculo salvo e cidade informada.

O que a tela compara:

- Custo real por unidade — o da oficina contra a faixa do grupo
- Preço praticado (se informado) e preço sugerido, na mesma faixa
- **Composição comparada, categoria a categoria** — "seu aluguel pesa 18% do custo; nas parecidas, 12%". É a análise que mais ensina, porque aponta onde procurar, não só se o número está alto
- **Distribuição** — histograma do custo do grupo, com a faixa da própria oficina destacada. Faixa e mediana dizem onde você está; o histograma diz se o grupo é homogêneo ou se há dois mercados no mesmo recorte
- **Tendência ao longo do tempo** — a série do grupo com o custo da própria oficina atravessando. Veio do painel na Leva 4.1: a evolução só significa alguma coisa contra alguma referência, e a referência mora aqui
- **Tabela por tipo de custo** — cada categoria da oficina contra a mediana do grupo, em R$ por unidade. É a versão detalhada da composição comparada, para quem quer conferir linha a linha
- Porte e recorte **sempre visíveis**: o usuário precisa saber contra quem está sendo comparado, principalmente enquanto a amostra é pequena

A tela cresceu de três para seis blocos na Leva 4.1 e passou a usar grade de duas colunas em desktop. A diferença é de arranjo, não de regra: cada bloco com dado do grupo continua carregando a própria tarja, e todos continuam atrás da mesma cadeia de guarda.

**A tela precisa ser correta com amostra pequena** — abaixo do N mínimo ela mostra o número do próprio usuário e nada do mercado. Esse é o estado normal nos primeiros meses, não uma falha.

Os dados do grupo são ilustrativos até haver base própria, sob as três travas de `09-benchmark.md`. Com mais número ilustrativo na tela desde a Leva 4, a tarja deixou de ser uma linha no topo e passou a marcar **cada bloco** que contém dado do grupo — ver "Modo demonstração" em `09-benchmark.md`.

---

## 6. Painel (`/painel`)

Destino de quem entra logado. Todos os blocos mostram dado do próprio usuário — não é dashboard de métricas de negócio.

### ⚠️ O painel é um resumo, não uma tela de análise (Leva 4.1)

A Leva 4 encheu o painel: histograma da região, tabela por tipo de custo, tendência com linha do grupo. Ficou uma segunda tela de benchmark, e o dono de oficina que entra para conferir o número do dia tinha que atravessar seis blocos de análise para achá-lo.

**A regra passou a ser:** o painel responde *"como está minha oficina agora"*. Toda comparação e toda série ao longo do tempo vivem em `/benchmark`.

O corte é de tela, não de funcionalidade — nada foi apagado, tudo mudou de endereço. Duas leituras que este documento pedia aqui e agora moram lá: **peso de cada categoria no custo** (virou a tabela por tipo de custo, comparada contra a mediana do grupo) e **tendência do próprio custo** (virou a série temporal, com a curva do grupo por trás). A segunda ganhou com a mudança: evolução sem referência não diz se o movimento é da oficina ou do mercado.

**Números do momento**, cada um com o "o que é isso?" que os campos da calculadora já têm — reusar `TERMOS` de `lib/copy/common.ts`, nunca reescrever. São quatro, numa faixa só, alinhados entre si:

| KPI | Leitura |
|---|---|
| Custo real por unidade | O número-herói. O maior da tela |
| Preço sugerido | O que cobrir custo, imposto e a margem definida |
| Ponto de equilíbrio, em R$ | Abaixo disso cada unidade vendida dá prejuízo |
| Quanto vender por mês | Em unidades, e em carros quando a oficina informou a média por carro |

Os dois últimos eram cartões separados e diziam "ponto de equilíbrio" duas vezes, com significados diferentes. Volume e valor são leituras da mesma conta e ficam lado a lado.

**Duas análises sobre o próprio custo**, ambas derivadas do que a pessoa já preencheu:

| Análise | Por que importa |
|---|---|
| Maior alavanca — a categoria que mais pesa, e quanto o custo cairia se ela caísse 10% | Transforma diagnóstico em ação, sem recomendar preço |
| Custo da ociosidade — quanto as unidades disponíveis e não vendidas custam por mês | Torna a taxa de ocupação tangível em reais |

**Barra de composição** — mão de obra, custos fixos, impostos e margem, aberta item a item. É dado próprio e é o elemento-assinatura do produto; fica.

**Cartão-resumo do benchmark**, que leva até `/benchmark`. É a **única** menção a comparação no painel, e existe para ser a porta, não a resposta.

**Identificação no cabeçalho** — nome da oficina como título, com cidade, segmento e tamanho da equipe embaixo. Quem tem duas oficinas precisa saber de qual são os números antes de ler qualquer um deles. Parte não informada some, em vez de virar traço.

O painel não substitui a calculadora: ele é o lugar de onde se olha, e a calculadora é o lugar onde se mexe.

---

## 7. Simulador "e se" (`/e-se`)

Não depende de nenhum dado externo: é a lib pura de `lib/pricing/calculate.ts` aplicada sobre a configuração salva do usuário, com uma alavanca alterada por vez. Cada cenário mostra antes → depois, no custo real e no preço sugerido.

Alavancas: contratar mais um produtivo · um custo fixo subir · a ocupação subir ou cair · o salário médio mudar · a margem desejada mudar.

**Nenhuma fórmula nova.** Reusa `calcular()` e `paraCalculoInput()` — se aparecer aritmética fora de `lib/pricing` para o simulador, é bug.

O simulador **não salva**: é exploração, não configuração. Um botão leva o cenário simulado para a calculadora, se a pessoa quiser adotá-lo de verdade.

---

## Navegação

Cresceu, mas continua mínima. Logado: painel, calculadora, benchmark, oficina e simulador. Deslogado: landing e calculadora.

Três destinos passam a justificar estrutura: barra inferior no mobile (alvos ≥ 44px, `--spacing-touch`), navegação lateral em desktop. Sem hambúrguer.

O modo guiado roda **sem navegação** — nada de rota de fuga enquanto o usuário está preenchendo pela primeira vez. É a mesma razão pela qual `/` não tem menu no header.

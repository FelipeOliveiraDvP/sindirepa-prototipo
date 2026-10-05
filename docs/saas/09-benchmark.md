# 09 — Benchmark regional

> ⚙️ **ARQUIVO EDITÁVEL** — o N mínimo e o recorte de região são parâmetros de produto, ajustados pelo Felipe.

O benchmark responde a uma pergunta só: **"como eu estou perto de oficinas parecidas com a minha?"**

Não é dashboard. Não é relatório. É uma tela de posicionamento — e desde a Leva 4 ela compara a oficina inteira (custo, preço e composição), não só um preço contra uma faixa.

---

## "Parecidas" — a definição operacional

> "Benchmark **SEMPRE** é comparado com outras oficinas parecidas na região."

"Parecidas" sem definição vira comparação sem sentido — uma oficina de 2 mecânicos contra uma de 15 não ensina nada a nenhuma das duas. O recorte de agregação passa a ser **região × segmento × porte**.

**Porte**, derivado da quantidade de produtivos ativos — nunca uma coluna própria, para nunca desatualizar:

| Porte | Produtivos |
|---|---|
| Pequena | 1–2 |
| Média | 3–8 (o ICP de `01-contexto.md`) |
| Grande | 9+ |

`06-dados.md` já listava `porte` na entidade `Oficina`; a migration 400 não o incluiu, e esta é a razão: ele não é dado que se digita, é dado que se calcula toda vez que se agrega, a partir de `produtivos` — a mesma tabela que já alimenta o cálculo.

---

## ⚠️ A restrição que define esta tela

A fonte do dado é **`configuracoes_calculo` × `oficinas`**, agregada por região e segmento — as configurações que os donos de oficina salvam na conta. **Ela nasce vazia.**

> Mudou na Leva 3. Antes era `CalculoAnonimo`, quando a calculadora era aberta. Com conta obrigatória, aquela tabela passou a registrar só a prévia de três campos do herói da landing — preliminar demais para entrar numa mediana. A amostra ficou menor e melhor: oficina real, uma por conta, todos os campos, com histórico.

A parceria com o SINDIREPA-SP deve levantar o volume rápido, mas volume prometido não é volume existente, e a tela precisa ser correta no dia em que houver 3 cálculos na região.

**Regra dura: abaixo do N mínimo, nenhuma faixa de mercado é renderizada.**

Não vale, em nenhuma hipótese:

- preencher com estimativa, média nacional ou "referência de mercado"
- mostrar mock não rotulado
- gerar distribuição sintética — o protótipo Lovable fazia isso com `Math.random()` a cada render
- interpolar entre regiões vizinhas para "ter algo"

O produto se vende como baseado em dados. Um número inventado que vaze destrói exatamente a credibilidade que ele promete. Ver `CLAUDE.md`, regra 4.

---

## Modo demonstração — e por que ele é travado

O Felipe precisa **ver** a tela pronta antes de existir amostra, para demonstrar a terceiros. Isso é legítimo. Inventar número não é.

O modo demonstração existe com três travas, e nenhuma delas depende de alguém lembrar:

1. **Tarja permanente** — "DADO ILUSTRATIVO — não é pesquisa de mercado", parte do componente. O componente **não renderiza número sem ela**; não há prop para desligar. Aparece em qualquer print.
2. **Só liga por variável de ambiente** que não existe em produção.
3. **Guarda no build** — `scripts/check-tokens.mjs` falha se a variável aparecer em arquivo versionado.

O risco que isso endereça não é o Felipe se enganar: é alguém printar a tela numa reunião com o SINDIREPA, ou o modo ficar ligado por esquecimento. O protótipo Lovable gerava a distribuição com `Math.random()` a cada render — é exatamente o que não fazer.

Quando a agregação real passar do N mínimo, o dado real substitui a demonstração e a tarja some sozinha.

⚠️ **Endurecida na Leva 4.** Com a página `/benchmark` mostrando muito mais número ilustrativo — faixa por categoria, comparação de composição, corte por porte — a tarja no topo da tela deixa de bastar: um usuário que rola a página perde o aviso de vista, e "uma linha no topo" começa a virar papel de parede que ninguém lê mais. A partir desta leva, **cada bloco que contém dado do grupo carrega o próprio selo**, não só o topo da tela. O risco de fadiga de tarja é discutido nos `Riscos`, no fim deste documento.

---

## N mínimo

⚙️ Valores propostos, **a confirmar com o Felipe antes de implementar**:

| Mostra | N mínimo | Por quê |
|---|---|---|
| Posição relativa (acima/abaixo da mediana) | 10 | Uma comparação ordinal aguenta amostra pequena |
| Faixa, mediana e quartis | 30 | Abaixo disso o quartil é ruído, não sinal |
| Distribuição (histograma) | 30 | Idem, e com menos vira contagem de indivíduos |
| Série temporal | 30 por período | Sem isso a "tendência" é oscilação de amostra |

O N conta **oficinas distintas por região, segmento e porte**, não configurações salvas. Uma oficina que salva dez versões conta uma — a mais recente. Com conta obrigatória isso ficou trivial de garantir: a chave é a oficina, não uma sessão de navegador.

⚠️ **Dividir em três dimensões atinge o N muito mais devagar que dividir só por região.** Uma região com 30 oficinas de mecânica pode não ter 30 de porte médio sozinhas — pode nunca sair do estado insuficiente numa cidade pequena. Ver `Riscos` no fim deste documento; o valor acima é ponto de partida, não conclusão.

---

## Agregação

O recorte é **região × segmento × porte**. Nunca agregar os dois segmentos no mesmo balde: hora de mecânica e UT de funilaria não são a mesma grandeza, e a média das duas não significa nada. Pela mesma razão, nunca agregar portes diferentes: comparar o custo de uma oficina de 2 produtivos com o de uma de 12 não informa nenhuma das duas — é o motivo de o porte ter entrado no recorte na Leva 4.

Campos agregados, por recorte: mediana, p25, p75, mínimo, máximo, N — do custo real por unidade, do preço praticado e **de cada categoria da composição** (mão de obra, custos fixos, impostos, margem), para sustentar a comparação categoria a categoria da tela `/benchmark`.

**Nunca expor cálculo individual**, nem por inferência. Com N baixo, faixa e extremos identificam a oficina — é o motivo real do N mínimo, antes da estatística.

---

## Estados da tela

Estado vazio e estado insuficiente **não são o mesmo**.

| Estado | O que mostra |
|---|---|
| Sem cálculo do usuário | Manda calcular primeiro. Sem comparação não há tela. |
| Amostra insuficiente na região | Diz quantos cálculos existem e quantos faltam. Mostra o número do próprio usuário e nada do mercado. |
| Amostra suficiente | Posição, faixa, distribuição. |

O estado insuficiente é a entrega normal nos primeiros meses, não uma degradação. Escrever a copy dele com o mesmo cuidado da tela cheia.

---

## Viés de amostra

Quem chega pela distribuição do sindicato não é corte aleatório do mercado — tende a ser a oficina mais organizada, que já busca gestão.

Registrar a **origem** no `CalculoAnonimo` para conseguir medir isso depois. Não corrigir estatisticamente agora; só preservar a informação que permite corrigir.

Quando a tela mostrar número, dizer de onde ele vem: são oficinas que usaram esta calculadora, não uma pesquisa de mercado. Uma linha, sem letra miúda.

---

## Copy — o que o benchmark não pode dizer

Vale aqui a restrição de posicionamento do `CLAUDE.md`, e vale com força extra: esta é a tela que mais convida a virar conselho de preço.

| ❌ Não escrever | ✅ Escrever |
|---|---|
| "Você pode aumentar 15%" | "Seu preço está abaixo da mediana da região" |
| "Você está deixando dinheiro na mesa" | "Sua hora está R$ X abaixo da mediana" |
| "Oficinas como a sua cobram mais" | "Metade das oficinas da região cobra acima de R$ X" |

O benchmark informa posição. **Não recomenda preço.** Quem decide preço é o dono da oficina, e o produto que recomenda número vira responsável por ele.

Nota: o protótipo Lovable escrevia "Um aumento gradual de cerca de X% pode ajudar a equilibrar com o mercado". É exatamente o que não fazer.

---

## Riscos

1. **Fadiga de tarja.** Quanto mais número ilustrativo a tela mostra, mais o rótulo "ilustrativo" corre risco de virar papel de parede que ninguém lê. Mitigação adotada na Leva 4: selo por bloco, não por tela — cada pedaço da tela que carrega dado do grupo é auto-suficiente, nunca depende de o usuário ter visto o aviso lá em cima. A mitigação de fundo continua sendo a mesma: substituir a demonstração por base própria assim que o N mínimo permitir.
2. **Comparação sem amostra é comparação inventada.** O grupo "parecidas" é ficção até a base própria crescer. Quando ela crescer, um recorte em três dimensões (região × segmento × porte) atinge o N mínimo muito mais devagar que um recorte só de região — cidades menores podem nunca sair da demonstração num porte específico. Vale revisitar os valores de N mínimo acima à luz do volume real assim que ele existir, em vez de tratá-los como definitivos.
3. **Porte e recorte sempre visíveis na tela.** Consequência direta do ponto 2: o usuário precisa sempre poder ver contra que grupo está sendo comparado — região, segmento e porte — para calibrar sozinho o quanto confiar no número, principalmente enquanto a amostra é pequena.

# 07 — Copy e tom de voz

> ⚙️ **ARQUIVO EDITÁVEL** — a seção "Assistente de campo" é fonte única de verdade da wording. Mude a frase aqui; quem sincroniza com `src/lib/copy/assistente.ts` depois é o dev (ou o Claude).

Toda interface em **português do Brasil**.

---

## Tom

Fale como um consultor técnico que respeita o dono de oficina. Ele entende de carro melhor que você; você entende de conta melhor que ele. Nenhum dos dois é superior.

- **Direto.** Frase curta. Sem rodeio, sem entusiasmo forçado.
- **Sem jargão contábil não traduzido.** Se precisar de "markup", explique na mesma linha.
- **Nunca condescendente.** O usuário não é ingênuo — ele nunca teve o dado.
- **Nunca culpar o usuário.** Nem no erro de formulário, nem no diagnóstico de que ele cobra abaixo do custo.

Errado: "Você está cobrando errado há anos."
Certo: "Seu preço atual está R$ 18,40 abaixo do custo por hora."

O número faz o trabalho. O texto não dramatiza.

---

## Glossário — sempre o mesmo termo

| Use | Não use |
|---|---|
| oficina | empresa, negócio, estabelecimento |
| mecânico / produtivo | colaborador, técnico, profissional |
| custo real da hora | custo-hora, CH, custo hora/homem |
| preço da hora sugerido | preço ideal, preço recomendado |
| ponto de equilíbrio | break-even |
| taxa de ocupação | produtividade, eficiência (são outra coisa) |
| custos fixos | despesas, overhead |
| encargos | impostos sobre folha |

Consistência é o que ensina o usuário a se localizar. Sinônimo bonito atrapalha.

**Atenção:** "hora" no texto de interface vem de `WORK_UNIT_LABEL`, nunca literal. Ver `docs/geral/06-dados.md`.

---

## Padrões

### Botões
Verbo no infinitivo, 1–3 palavras, descritivo.
`Calcular custo` · `Salvar configuração` · `Receber por e-mail` · `Criar conta`
Nunca `OK`, `Enviar` ou `Confirmar` solto.

Rótulo e confirmação usam a mesma palavra: "Salvar configuração" → "Configuração salva."

### Labels e ajuda
Label sempre visível acima do campo. Placeholder só com exemplo real: `ex: R$ 3.200,00`.

O texto de ajuda responde à pergunta do usuário, não descreve o sistema:

- ❌ "Campo obrigatório para o cálculo do custo operacional"
- ✅ "Some tudo que a oficina paga todo mês mesmo quando não entra carro"

### Erros
[o que aconteceu] + [como resolver]. Sem "erro", sem "falha inesperada".

- "Impostos e margem somam mais de 100%. Reduza um dos dois para o cálculo funcionar."
- "Informe pelo menos um mecânico para calcular o custo da hora."
- "A taxa de ocupação não pode passar de 100% — não é possível vender mais horas do que a equipe tem disponível."
- "Não foi possível salvar. Verifique a conexão e tente de novo."

### Sucesso
Breve, factual. "Configuração salva." "Cálculo enviado para seu e-mail." Sem comemoração para ação rotineira.

### Estado vazio
Praticamente não existe nesta leva — a calculadora abre com padrões preenchidos. Onde aparecer: [o que está vazio] + [o que fazer].

---

## Textos fixos de explicação

Centralizar em `src/lib/copy/` e reutilizar — não reescrever por tela. É o princípio "Educativa" em forma de string.

| Termo | Frase |
|---|---|
| Custo real da hora | "Quanto custa manter um mecânico trabalhando por uma hora, com tudo incluso." |
| Preço sugerido | "O que você precisa cobrar para pagar todos os custos, os impostos e ainda ter a margem que você definiu." |
| Ponto de equilíbrio | "Abaixo desse valor, cada hora vendida dá prejuízo." |
| Taxa de ocupação | "De cada 10 horas que sua equipe fica disponível, quantas são realmente vendidas. Quase nenhuma oficina chega perto de 10." |
| Encargos | "O que se paga além do salário: FGTS, INSS, 13º, férias e benefícios." |
| Custos fixos | "Tudo que a oficina paga todo mês mesmo quando não entra carro." |
| Margem | "Quanto sobra depois de pagar tudo. É o que financia investimento e imprevisto." |
| Impostos | "O percentual do faturamento que vai para o Simples ou para o regime da sua oficina." |
| Produtivos | "Só quem vende hora. Balconista, gerente e quem não põe a mão no carro entram em custos fixos." |

---

## Assistente de campo

Responde uma pergunta diferente da do "o que é isso?" de cada campo: não **o que o campo significa**, mas **onde o dono de oficina acha esse número** — papel, sistema ou conta específica. É o texto que aparece no painel do assistente (`AssistenteFixoMobile`/`AssistenteLateral`), ligado ao campo em foco.

Implementado em `src/lib/copy/assistente.ts`, uma entrada por campo, com até quatro partes:

- **Onde encontrar** — sempre presente. Em que papel, conta ou sistema está o número.
- **Pergunte ao seu contador** — frase pronta para copiar e mandar por WhatsApp, quando o número normalmente vem do contador.
- **Se você não souber** — como chegar a um número razoável quando não existe documento (nunca inventa referência de mercado — só orienta a estimar a partir do que a própria pessoa vive).
- **Cuidado** — erro comum que distorce o resultado.

Os textos abaixo são o caso mecânica (hora/mecânico); dentro de `(app)` a unidade e o rótulo do produtivo trocam sozinhos para UT/produtivo em funilaria — nunca reescrever a frase por segmento, só o token muda (`docs/geral/06-dados.md`).

| Campo | Onde encontrar | Pergunte ao contador | Se você não souber | Cuidado |
|---|---|---|---|---|
| Tipo de oficina (`segmento`) | É o tipo de serviço que a sua oficina vende. Mecânica cobra por tempo de serviço; funilaria e pintura trabalham em UT e costumam negociar com seguradora. | — | — | Se você faz os dois, escolha o que responde pela maior parte do faturamento. Dá para trocar depois sem perder o que já preencheu. |
| Cidade da oficina (`cidade`) | A cidade onde a oficina atende. | — | Serve só para comparar você com oficinas da mesma região. Se a sua não estiver na lista, marque Outra — o cálculo funciona igual. | — |
| Quantos mecânicos (`quantidadeProdutivos`) | Conte quem põe a mão no carro: mecânicos e auxiliares que executam serviço. | — | — | Balconista, gerente, recepção e você, se não estiver na bancada, NÃO entram aqui — eles entram em custos fixos, na linha de salários administrativos. Contá-los aqui divide o custo por gente que não vende serviço, e o resultado sai barato demais. |
| Salário médio (`salarioMedio`) | Na folha de pagamento, ou no holerite. Some o salário bruto dos que você contou acima e divida pela quantidade. | Qual é o salário bruto médio dos meus funcionários de produção? | — | Use o salário BRUTO, sem encargos — eles entram no campo seguinte. Somar os dois aqui conta o encargo duas vezes. |
| Encargos sobre o salário (`percentualEncargos`) | Com o contador. É quanto você paga além do salário: FGTS, INSS, 13º, férias com o terço, e benefícios como vale-transporte e alimentação. | Qual é o meu percentual de encargos sobre a folha de pagamento? | Se ele não responder de imediato, deixe como está: o campo já vem com uma referência conservadora para CLT. Oficina no Simples costuma ficar mais baixo. | — |
| Dias abertos por mês (`diasUteisMes`) | Quantos dias a oficina abre num mês normal. Conte sábado se você atende aos sábados. | — | — | É dia de porta aberta, não dia de calendário. |
| Horas de trabalho por dia (`unidadesPorDia`) | Quantas horas cada mecânico fica à disposição por dia — do horário de entrada ao de saída, menos o almoço. | — | — | Não é quanto ele produz, é quanto ele está lá. O quanto vira serviço vendido é o campo seguinte, e é lá que a diferença aparece. |
| Taxa de ocupação (`ocupacao`) | Esse número quase nenhuma oficina tem anotado, e não tem problema — dá para estimar bem. | — | Pense na semana passada. De todas as horas em que sua equipe ficou na oficina, quantas você conseguiu efetivamente cobrar de um cliente? O resto foi espera de peça, orçamento que não fechou, retrabalho, organização, carro parado no box aguardando aprovação. Se der 7 de 10, sua ocupação é 70%. | Quem coloca 100% está dizendo que nunca houve um minuto ocioso no mês inteiro. Isso não existe, e o resultado sai barato demais — é o erro que mais faz oficina cobrar abaixo do custo. |
| Aluguel (`custoFixoAluguel`) | No contrato de locação ou no boleto/recibo que você paga todo mês pelo imóvel. | — | — | Se o imóvel é seu, ainda assim conte um aluguel — pelo valor que você cobraria de outro inquilino. Não contar é subestimar o custo real da oficina. |
| Energia (`custoFixoEnergia`) | Na conta de luz dos últimos meses. Tire uma média de 2 ou 3 meses — o consumo varia com o uso de compressor, elevador e iluminação. | — | — | — |
| Água (`custoFixoAgua`) | Na conta de água/saneamento dos últimos meses. | — | — | — |
| Internet e telefone (`custoFixoInternetTelefone`) | Nas faturas da operadora de internet e do telefone (fixo ou celular) da oficina. | — | — | — |
| Contador (`custoFixoContador`) | No boleto mensal de honorários do escritório de contabilidade. | — | — | — |
| Software de gestão (`custoFixoSoftwareGestao`) | Na fatura de assinatura do sistema que você usa para orçamento, ordem de serviço ou financeiro. | — | — | — |
| Seguros (`custoFixoSeguros`) | Na apólice ou no boleto do seguro da oficina — prédio, responsabilidade civil, ou frota, se tiver. | — | — | — |
| Salários administrativos + encargos (`custoFixoSalariosAdministrativos`) | Folha de quem NÃO põe a mão no carro: recepção, financeiro, gerência. Some salário bruto + encargos dessas pessoas. | — | — | Quem está na bancada entra em outro lugar, lá atrás, na contagem de mecânicos/produtivos. Contar a mesma pessoa aqui e lá infla o custo. |
| Pró-labore (`custoFixoProLabore`) | O que você retira todo mês da empresa pelo seu trabalho de dono — diferente de lucro. Se hoje você não define um valor fixo, este é o momento de arbitrar um. | — | — | Não deixe zerado. Sem pró-labore, o cálculo mostra um custo menor que o real — a oficina parece dar lucro enquanto você trabalha de graça. |
| Manutenção e ferramental (`custoFixoManutencaoFerramental`) | Gastos recorrentes com manutenção de equipamento (elevador, compressor, alinhamento) e reposição de ferramentas. Use a média dos últimos meses, não o mês em que comprou algo caro. | — | — | — |
| Marketing (`custoFixoMarketing`) | O que você gasta com anúncios (Google, Instagram, panfletos) e mensalidade de plataformas de indicação ou avaliação, se tiver. | — | — | — |
| Tinta e vernizes — funilaria (`custoFixoTintaVernizes`) | Consumo médio mensal de tinta e verniz, não o valor de uma compra isolada. Pegue as últimas notas do fornecedor e calcule a média. | — | — | Isto é insumo por serviço, não custo fixo de verdade — entra aqui como média porque o cálculo divide o total pelas unidades produzidas no mês. |
| Material de pintura — funilaria (`custoFixoMaterialPintura`) | Gasto médio mensal com lixa, massa e fita — olhe as notas dos últimos meses do fornecedor de material de pintura. | — | — | — |
| Cabine de pintura — funilaria (`custoFixoCabinePintura`) | Soma do consumo extra de energia e gás da cabine (se for medido separado) mais a manutenção preventiva do equipamento. | — | — | — |
| EPI e filtros — funilaria (`custoFixoEpiFiltros`) | Compra recorrente de máscara, luva, óculos de proteção e filtro da cabine — nas notas do fornecedor de segurança. | — | — | — |
| Descarte de resíduos — funilaria (`custoFixoDescarteResiduos`) | No contrato ou nota da empresa que recolhe os resíduos (tinta, solvente, estopa contaminada) — descarte é obrigação legal, não opcional. | — | — | — |
| Custos fixos — outras categorias (`custosFixos`, fallback) | Tudo que a oficina paga todo mês mesmo sem entrar carro nenhum. Um jeito rápido: abra o extrato bancário do mês passado e percorra os débitos. | Pode me mandar a relação das despesas fixas mensais da oficina? | — | Não esqueça o seu pró-labore. Muitos donos deixam de fora o próprio salário, e aí o cálculo mostra um custo menor do que a realidade — a oficina parece dar lucro enquanto o dono trabalha de graça. |
| Impostos sobre o faturamento (`impostosSobreFaturamento`) | É o percentual do faturamento que vai para o seu regime tributário. Está na guia do Simples, ou com o contador. | Qual é o meu percentual efetivo de imposto sobre o faturamento de serviços? | Se não souber agora, deixe o valor que já está preenchido: é a faixa inicial do Simples Nacional para serviços. | — |
| Margem desejada (`margemDesejada`) | Este é o único campo que não está em papel nenhum: é uma decisão sua. | — | É o que sobra depois de pagar todos os custos e os impostos. Serve para investir em ferramenta, aguentar mês fraco e remunerar o risco de ter um negócio. Comece pelo valor preenchido e mexa para ver o efeito. | — |
| Quanto você cobra hoje (`precoUnidadeAtual`) | O que você cobra hoje por hora de mão de obra. Olhe uma ordem de serviço recente e divida o valor da mão de obra pelas horas cobradas. | — | É opcional. Se informar, a tela mostra a diferença entre o que você cobra e o que o cálculo indica, e o impacto disso no mês. | — |

**Rótulos fixos do cartão do assistente** (`ASSISTENTE_UI` em `assistente.ts`):

| Chave | Texto |
|---|---|
| Título | Onde encontrar esse número |
| Onde encontrar | Onde encontrar |
| Pergunte ao contador | Pergunte ao seu contador |
| Se você não souber | Se você não souber |
| Cuidado | Cuidado |
| Botão de copiar | Copiar pergunta |
| Depois de copiar | Copiado |
| Estado ocioso | Toque num campo e eu explico onde achar o número. |

---

## Como dar má notícia

Quando o cálculo mostra que a oficina cobra abaixo do custo: **fato + causa provável + próximo passo**. Sem alarme, sem dedo na cara.

> Seu preço atual está R$ 18,40 abaixo do custo por hora.
> Na maioria dos casos isso vem da taxa de ocupação: horas disponíveis que não viram serviço vendido.
> Veja a composição do preço para entender onde o custo se concentra.

O próximo passo é **entender o custo**, não "subir o preço" — é o que o posicionamento exige.

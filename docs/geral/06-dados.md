# 06 — Fórmula de cálculo e modelo de dados

> ⚙️ **ARQUIVO EDITÁVEL — FONTE ÚNICA DE VERDADE DO CÁLCULO.**
> Nenhuma fórmula em outro lugar do projeto. Se algo aqui mudar, muda em `src/lib/pricing/` e em nenhum outro ponto.

---

## ⚠️ A FÓRMULA ABAIXO CONTINUA INFERIDA — NÃO VALIDADA

Reconstruída a partir do modelo padrão de custo-hora de serviço. **Não foi extraída da calculadora em produção** (`calculadoramaodeobra.nocobi.com`).

**Antes de implementar, avisar o Felipe.** Se divergir da calculadora que já está no ar, a que está no ar vence — ela já tem uso real e leads associados.

Pontos de divergência mais provável, em ordem:
1. Se salários administrativos entram em custo fixo ou em mão de obra
2. Se a margem é markup divisor ou margem sobre custo
3. O percentual padrão de encargos
4. Se impostos entram no cálculo do preço ou são tratados fora dele

---

## Duas abstrações obrigatórias

### 1. Unidade de trabalho — derivada do segmento

Com mecânica e funilaria ativas, a unidade deixou de ser constante:

```ts
// src/lib/pricing/config.ts   (único arquivo autorizado ao literal)
export type WorkUnit = 'hora' | 'UT';
export const UNIDADE_HORA: WorkUnit;
export const UNIDADE_UT: WorkUnit;
export const WORK_UNIT_LABEL: Record<WorkUnit, UnitLabel>;
export const unit: UnitLabel;          // estático, só para as landings

// src/lib/pricing/segmento.ts   (importa os literais, nunca os escreve)
export function unitDoSegmento(segmento: Segmento): UnitLabel;
export function lexicoDoSegmento(segmento: Segmento): Lexico;
```

`Lexico` = `{ unit, produtivo }`. O rótulo do produtivo entra junto porque `"mecânico"` estava cravado nas mensagens de `validate.ts` e `explain.ts` — correto em mecânica, errado em funilaria. `validar`, `avisosDoResultado` e `memoriaDeCalculo` recebem o léxico com padrão de mecânica, então chamador antigo continua correto.

Onde cada forma vale:

- **Landings (`(landings)`)** — SSG, falam para mecânica, seguem usando o `unit` estático.
- **Produto (`(app)`)** — a unidade vem do segmento do usuário, via contexto.

`UnitLabel` carrega as formas flexionadas (`singular`, `plural`, `abbrev`, `definite`, `ofDefinite`, `per`) porque copy em pt-BR precisa de contração — montar com template string quebra na primeira unidade de gênero masculino.

Nenhum literal da unidade em label, copy, nome de campo ou variável de domínio. `scripts/check-tokens.mjs` falha o build; a única isenção é `config.ts`. Escrever `unidade: 'hora'` em `segmento.ts` quebra o build — importar `UNIDADE_HORA`.

### 2. Modelo de custo de mão de obra

```ts
export interface LaborCostInput {
  produtivos: Produtivo[];
  faturamentoMensal?: number; // usado só por modelos variáveis
}

export interface LaborCostModel {
  readonly id: 'salario_fixo' | 'comissao';
  monthlyLaborCost(input: LaborCostInput): number;
}
```

**Só `salario_fixo` é implementado — nos dois segmentos.** Funilaria entra com salário fixo, o que cobre a oficina de funileiro CLT e erra na comissionada. Decisão consciente: o motivo é o parágrafo abaixo, não prioridade.

Aviso para quem for implementar `comissao` depois: comissão é percentual do serviço, então o custo de mão de obra passa a depender do faturamento, que depende do preço, que depende do custo. **O cálculo vira circular.** Vai precisar de resolução iterativa ou de reformulação algébrica — não é só trocar uma linha. Registrado aqui para não virar surpresa.

---

## Fórmula

### Entradas

**Segmento** — escolhido pelo usuário, governa três coisas e nenhuma conta

| Segmento | Unidade | Funções produtivas | Custos fixos adicionais |
|---|---|---|---|
| `mecanica` | hora | Mecânico, Eletricista, Auxiliar | — |
| `funilaria` | UT | Funileiro, Pintor, Preparador, Auxiliar | Tinta e vernizes, material de pintura, cabine (energia/gás/manutenção), EPI e filtros, descarte de resíduos |

⚠️ Tinta e material de pintura são consumo por serviço, não custo fixo. Entram como **média mensal** e o rótulo precisa dizer isso. A fórmula divide custo total por unidades produtivas, então a média mensal se comporta corretamente — o que não pode é o rótulo mentir sobre a natureza do custo.

**A aritmética dos 7 passos é idêntica nos dois segmentos.** O segmento muda o que entra na conta e como o resultado é rotulado — nunca a conta. Isso é testado.

**Estrutura da oficina**
| Campo | Tipo | Padrão | Observação |
|---|---|---|---|
| `produtivos` | inteiro | 4 | Só quem vende hora. Não inclui balconista, gerente, dono que não põe a mão. |
| `diasUteisMes` | inteiro | 22 | |
| `horasPorDia` | decimal | 8.8 | 44h semanais ÷ 5 |
| `ocupacao` | % | 70% | Horas vendidas ÷ horas disponíveis. **O campo mais importante e o mais ignorado pelo mercado.** |

**Mão de obra direta** (modelo `salario_fixo`)
| Campo | Tipo | Padrão |
|---|---|---|
| `salarioBruto` | R$/mês | — |
| `percentualEncargos` | % | 80% |

`percentualEncargos` cobre 13º, férias + 1/3, FGTS, INSS e benefícios. 80% é referência conservadora para CLT; oficinas no Simples ficam mais perto de 60–70%. **Editável pelo usuário, nunca travado.**

**Custos fixos mensais** — lista aberta com sugestões pré-preenchidas em R$ 0
Aluguel, energia, água, internet e telefone, contador, software de gestão, seguros, salários administrativos + encargos, pró-labore, manutenção e ferramental, marketing, outros.

**Parâmetros comerciais**
| Campo | Tipo | Padrão |
|---|---|---|
| `impostosSobreFaturamento` | % | 6% (Simples Nacional, Anexo III faixa inicial) |
| `margemDesejada` | % | 15% |
| `precoUnidadeAtual` | R$ | opcional — o que a oficina cobra hoje |
| `unidadesPorCarro` | unidades | opcional — média faturada por carro atendido; sem padrão |

### Cálculo

```
1. unidadesDisponiveis = produtivos × diasUteisMes × horasPorDia

2. unidadesProdutivas  = unidadesDisponiveis × ocupacao

3. custoMaoDeObra      = laborCostModel.monthlyLaborCost(input)
                         // salario_fixo: Σ (salarioBruto × (1 + percentualEncargos))

4. custoFixoTotal      = Σ (custos fixos mensais)

5. custoTotalMensal    = custoMaoDeObra + custoFixoTotal

6. custoRealUnidade    = custoTotalMensal ÷ unidadesProdutivas

7. precoUnidadeSugerido = custoRealUnidade ÷ (1 − impostos − margem)
```

**O passo 7 usa markup divisor**, não margem sobre custo. É a forma correta: garante margem percentual sobre o preço de venda, não sobre o custo. Com 6% e 15%, dividir por `0,79`.

Validação obrigatória: se `impostos + margem ≥ 1`, o cálculo estoura. Bloquear com mensagem clara — nunca renderizar `Infinity`.

### Comparativo (quando `precoUnidadeAtual` for informado)

```
diferencaPorUnidade  = precoUnidadeSugerido − precoUnidadeAtual
impactoMensal        = diferencaPorUnidade × unidadesProdutivas
margemRealAtual      = 1 − (custoRealUnidade ÷ precoUnidadeAtual) − impostos
pontoDeEquilibrio    = custoRealUnidade ÷ (1 − impostos)
```

`pontoDeEquilibrio` é o número mais forte da tela: abaixo dele a oficina trabalha no prejuízo. Merece destaque visual próprio.

### Leituras do ponto de equilíbrio (painel)

O ponto de equilíbrio em R$ responde "abaixo de quanto eu perco dinheiro". Ele não
responde "quanto eu preciso trabalhar". Estas duas leituras respondem, e **nenhuma
delas é fórmula nova** — são a mesma conta dividida por um denominador diferente.

```
pontoDeEquilibrioEmUnidades = custoTotalMensal ÷ (precoReferencia × (1 − impostos))

pontoDeEquilibrioEmCarros   = pontoDeEquilibrioEmUnidades ÷ unidadesPorCarro
```

`precoReferencia` é `precoUnidadeAtual` quando informado, senão `precoUnidadeSugerido`
— o preço que a oficina realmente pratica é a melhor base, e o sugerido é o melhor
substituto disponível.

`unidadesPorCarro` é **entrada nova e opcional**: quantas unidades de trabalho a oficina
fatura, em média, por carro atendido. Não tem padrão — a média varia demais entre
mecânica de revisão e funilaria de colisão, e chutar um número aqui seria exatamente o
tipo de dado inventado que a regra 4 do CLAUDE.md proíbe.

**Quando `unidadesPorCarro` for 0 ou ausente, a leitura em carros não existe** — o painel
mostra um estado vazio que orienta a preencher, nunca `0 carros` nem `Infinity`.

Leitura secundária, derivada sem função própria (é multiplicação de dois números que já
estão na tela):

```
ticketMaoDeObraPorCarro = unidadesPorCarro × precoReferencia
```

⚠️ Isto **não** introduz faturamento, ordem de serviço nem apontamento de tempo no
modelo. `unidadesPorCarro` é um divisor digitado pelo dono, e nada além do painel o lê.

---

## Casos-limite (cobrir com teste)

| Caso | Comportamento esperado |
|---|---|
| `impostos + margem ≥ 1` | Erro de validação com mensagem explicativa; não calcular |
| `produtivos = 0` | Erro de validação; não dividir por zero |
| `ocupacao = 0` | Erro de validação; não dividir por zero |
| `ocupacao > 1` | Bloquear — não se vende mais hora do que existe |
| Todos os custos fixos zerados | Calcular normalmente, mas sinalizar que o resultado subestima |
| `custoRealUnidade` acima de teto plausível | Calcular, mas avisar qual campo parece fora da curva |
| `precoUnidadeAtual = 0` | Tratar como não informado, não como zero |

---

## Regras de exibição

- Moeda: `R$ 1.234,56` — milhar com ponto, decimal com vírgula, sempre 2 casas
- Percentual: 1 casa decimal (`14,5%`)
- Unidades: 1 casa decimal (`2,5 h`), com o rótulo vindo de `WORK_UNIT_LABEL`
- **Nenhum valor calculado sem caminho para abrir a memória de cálculo** (princípio de transparência)
- Arredondar só na exibição, jamais no cálculo intermediário
- Somar em centavos inteiros ou decimal de precisão — não acumular erro de float em soma de custos

---

## Entidades da Leva 1

```
Oficina
  id, nome, cnpj?, cidade, uf, regiao, criadoEm
  → `porte` NÃO é coluna. É derivado, sempre, da contagem de
    `produtivos` ativos da oficina — nunca gravado, nunca sincronizado
    à parte. Uma coluna própria desatualizaria assim que a equipe
    mudasse; a contagem nunca desatualiza porque é a mesma tabela que
    já alimenta o cálculo.
      pequena: 1–2 produtivos · média: 3–8 (o ICP de 01-contexto.md) · grande: 9+
    Usado como terceira dimensão da agregação do benchmark, junto de
    região e segmento — docs/saas/09-benchmark.md.

Usuario
  id, oficinaId, nome, email, papel (dono | gestor)

Produtivo
  id, oficinaId, nome, salarioBruto, percentualEncargos, ativo

CustoFixo
  id, oficinaId, categoria, descricao, valorMensal, ativo

ConfiguracaoCalculo
  id, oficinaId, laborCostModelId, workUnit,
  diasUteisMes, horasPorDia, ocupacao,
  impostosSobreFaturamento, margemDesejada, precoUnidadeAtual?,
  atualizadoEm
  → versionado. Nunca sobrescrever: criar nova versão.
    Os módulos posteriores dependem de snapshot histórico.

CalculoAnonimo
  id, sessionId, payload, resultado, criadoEm, emailCapturado?
  segmento, regiao, origem
  → uso da calculadora sem login. É o ativo de pesquisa de mercado
    mais valioso que existe hoje. Persistir desde o dia um,
    com aviso de privacidade explícito.
  → `segmento` e `regiao` são o recorte de agregação do benchmark.
    Nunca misturar hora de mecânica com UT de funilaria.
  → `origem` existe para medir viés de amostra depois: quem chega
    pela distribuição do sindicato não é corte aleatório do mercado.
```

⚠️ **Mudança da Leva 3 — `CalculoAnonimo` deixou de ser a base do benchmark.**

Com conta obrigatória, ele passa a registrar apenas a prévia de três campos do herói da landing: sinal de topo de funil, não amostra de mercado. Um cálculo de três campos é preliminar demais para entrar numa mediana regional.

A base do benchmark passa a ser **`configuracoes_calculo` × `oficinas`**, agregada por região, segmento **e porte** — porte derivado da contagem de produtivos, nunca coluna própria (ver a entidade `Oficina` acima). É amostra menor e melhor: oficina real, uma por conta, com todos os campos preenchidos e com histórico. Regra de N mínimo e anonimização em `docs/saas/09-benchmark.md`.

---

## Preparação, sem construir

- Toda entidade com `origemExterna?: { sistema, idExterno }`
- Camada de acesso a dados isolada
- LGPD: consentimento explícito antes de persistir `CalculoAnonimo` com e-mail

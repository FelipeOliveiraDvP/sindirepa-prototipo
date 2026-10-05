# 01 — Contexto de negócio

## O problema

No Brasil, oficinas mecânicas independentes não têm base padronizada de tempos de reparo. Diferente de mercados como EUA e Alemanha — onde tabelas de tempo padrão são commodity — aqui o dono da oficina define o preço da hora por:

- imitação do concorrente
- "o que o cliente aceita pagar"
- conta de padeiro que ignora custo fixo, ociosidade e encargos

Resultado: a oficina cobra abaixo do custo real e não sabe. O prejuízo aparece como "movimento bom, mas sem dinheiro em caixa".

Isso é **estrutural**, não comportamental. Não adianta ensinar mentalidade de precificação se não existe o dado de tempo padrão. É por isso que a parceria com o SENAI importa: cronoanálise em campo gera o dado que o mercado não tem.

> ⚠️ Esta premissa vale para **manutenção mecânica**. Em funilaria e pintura ela é falsa — ver "Decisão de segmento" abaixo.

## Solução, em ciclo

**custo → preço → execução → produtividade real → custo mais preciso.**

A Leva 1 entrega o primeiro elo: o custo. Os demais dependem da decisão de segmento.

## Modelo de negócio

**Freemium.**

- **Gratuito:** calculadora de custo real da hora. Gratuita, **com conta obrigatória** desde a Leva 3. A versão aberta segue no ar em `calculadoramaodeobra.nocobi.com`.

> ⚠️ **A conta mudou a fonte da pesquisa de mercado.** Enquanto a calculadora era aberta, o ativo era `CalculoAnonimo` — volume anônimo. Com conta, a amostra encolhe em volume e melhora em qualidade: passa a ser `configuracoes_calculo` ligada a `oficinas.cidade` e `oficinas.segmento`, ou seja, oficina identificável, uma por conta, com histórico. É essa a base do benchmark agora. Ver `docs/saas/09-benchmark.md`.
- **Pago:** módulos posteriores.

A calculadora gratuita é o topo do funil. Precisa entregar valor real sozinha — não pode ser isca capada.

**Risco conhecido:** as oficinas que mais precisam de ajuda são as menores e as que menos podem pagar. Por isso o ICP é a oficina de médio porte (3–8 mecânicos), não a de fundo de quintal.

## Concorrência

| Player | O que é | Relação |
|---|---|---|
| **Tempário Automotivo** (Bosch) | Referência oficial de tempos de reparo da rede credenciada Bosch Service | Concorrente mais próximo. Diferencial: cálculo de custo-hora próprio, benchmark regional e integração com ERP — não competimos como tabela de tempos pura. |
| **Ultracar, WorkMotor, Mecanie** | ERPs de gestão de oficina | **Não são concorrentes — são canal.** Somos o motor de precificação que se pluga neles. Nunca posicionar como substituto. |

---

## ✅ Decisão de segmento — fechada

Decidido com o **UPLAB SENAI-SP** e o **SINDIREPA-SP**: o produto atende **mecânica e funilaria**. Não é "ou" — os dois convivem, e o usuário escolhe o segmento da oficina dele no primeiro uso.

**Elétrica não é segmento.** O protótipo oferecia a opção, mas oficina elétrica opera com a mesma estrutura de custo e a mesma unidade da mecânica — separar criaria uma terceira configuração sem diferença de comportamento. Fica como função de produtivo dentro de mecânica, não como segmento.

Por que funilaria muda a modelagem: em colisão a oficina é **tomadora de preço**. O tempo vem de sistemas de orçamentação eletrônica de sinistro (Audatex, Cilia, Órion) e o valor da UT é negociado pela seguradora. As tabelas que faltam na mecânica **existem** na colisão — e são justamente o que aperta a oficina.

Diferenças estruturais mapeadas:

| | Mecânica | Funilaria |
|---|---|---|
| Quem define o preço | A oficina | A seguradora, via sistema de orçamentação |
| Tabela de tempos | Não existe padronizada | Existe (Audatex, Cilia, Órion) |
| Unidade | Hora | UT |
| Remuneração do produtivo | Salário fixo + encargos | Frequentemente comissão / "meia" |
| Gargalo de capacidade | Hora-mecânico | Box e cabine de pintura; ciclo em dias |
| Papel da calculadora de custo | Definir o próprio preço | **Munição de negociação** com a seguradora |

A tabela continua valendo — ela deixou de ser critério de decisão e virou especificação.

**O que a decisão ativa no código:**

1. **A unidade de trabalho deixa de ser constante.** `WORK_UNIT` era resolvido em tempo de import; passa a ser derivado do segmento. Funilaria opera em UT, mecânica em hora. É exatamente o cenário para o qual a abstração foi criada.
2. **As categorias de custo fixo passam a variar por segmento.** Funilaria carrega tinta, material de pintura, cabine e descarte de resíduos, que não existem em mecânica.
3. **As funções produtivas mudam** — funileiro, pintor e preparador, não mecânico.

**O que ainda NÃO entra:** o modelo de custo por comissão. Funilaria entra com `salario_fixo`, que cobre a oficina de funileiro CLT e erra na comissionada. O motivo está em `06-dados.md`: comissão torna o cálculo circular e exige resolução iterativa. Decisão consciente, registrada para não virar surpresa.

---

## Parceria

O produto foi selecionado na **Chamada de Aceleração para Gestão em Oficinas Automotivas do UPLAB SENAI-SP, com o SINDIREPA-SP**.

O que isso significa para o produto, e só isso:

1. **Acesso a campo.** A cronoanálise em oficina real gera o dado de tempo padrão que o mercado brasileiro não tem — é o que sustenta os módulos futuros.
2. **A interface precisa mostrar o método, não só o resultado.** Haverá demonstração para terceiros, e um número sem a conta aberta não convence quem avalia. É a origem da regra de transparência que atravessa o produto.
3. **Nada de superprometer prazo ou capacidade em material público.**

A parceria também é o ativo de credibilidade da landing — ver `docs/landings/04-landing.md`.

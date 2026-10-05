# 05 — Marca e design tokens — Apura

> ⚙️ **ARQUIVO EDITÁVEL — FONTE ÚNICA DE VERDADE VISUAL (junto do manual).**
> Fonte canônica: **`docs/geral/marca/apura-manual-da-marca.pdf`** (v 1.0 · setembro 2026).
> Este arquivo traduz o manual para o sistema de tokens do código. Todo hex,
> fonte e espaçamento sai daqui. Nenhum valor de cor solto no JSX.

---

## Nome

**Apura** — de "apurar": descobrir, com precisão, o custo real (a tagline do
manual: *"O custo real do serviço da sua oficina."*).

Conflito de marca que travava o nome PreciFix foi resolvido; manual fechado em
septembro 2026. **Trocar a marca = editar só `src/lib/brand.ts`** — nada mais no
código. Em conteúdo textual, importar de `BRAND.name`; nunca escrever "Apura"
literal em componente, copy ou meta tag.

```ts
// src/lib/brand.ts — LOCAL ÚNICO do nome
export const BRAND = {
  name: "Apura",
  legalOwner: "Nocobi",
  domain: "apura.com.br",
  calculatorDomain: "calculadoramaodeobra.nocobi.com",
} as const;
```

Checklist que os tokens não alcançam (checa na troca): `public/` (favicon, logo,
og-image), e-mails transacionais, DNS e `metadataBase` (vém de `BRAND.domain`).

---

## Conceito

O símbolo junta as três idéias da marca:

1. **A de Apura** — a letra A forma um elevador automotivo: a oficina é o ponto de partida.
2. **O carro** — o serviço que está no elevador; é ele que tem um custo a ser descoberto.
3. **O braço do elevador** — fino e preciso, como uma régua: a medida certa, sem exagero.
4. **O anel** — um gráfico de rosca: o custo decomposto, parte por parte.
5. **O segmento laranja** — a parte do custo que a oficina passa a enxergar com clareza.

**Elemento assinatura do produto converte o conceito em interface:** a memória de
cálculo aberta e a barra de composição do preço (decompor o custo, parte por
parte) — é a tradução visual direta do anel + segmento laranja.

---

## Versões do logo

| Versão | Uso |
|---|---|
| **Horizontal** (principal) | cabeçalhos, site, orçamentos, assinatura de e-mail |
| **Vertical** | capas, fachada, redes sociais, materiais quadrados |
| **Símbolo** | avatar, ícone de app, favicon, carimbos |
| **Negativa** | sempre sobre Petróleo ou fundos escuros |

### Área de proteção

`x = ½ do diâmetro do anel` em volta do logo inteiro. Nenhum texto, borda ou
imagem dentro dessa área.

### Tamanhos mínimos (tela → impresso)

| Peça | Mínimo |
|---|---|
| Símbolo | 24 px → 8 mm |
| Logo horizontal | 120 px → 35 mm |
| Logo vertical | 64 px → 20 mm |

Abaixo disso, usar só o símbolo.

### Usos incorretos — nunca

Não distorcer nem esticar · não trocar as cores · não remover o carro nem outros
elementos · não aplicar sobre fundos poluídos · sem sombras, brilhos ou
gradientes · não girar nem inclinar.

### Arquivos

`public/branding/` — `logo-horizontal.png` (+ svg), `logo-vertical.png`,
`simbolo.png` (+ favicon), `logo-negativa.png`, `og-apura.png`.
Estrutura criada; os PNG chegam depois — o header hoje usa placeholder de texto.

---

## Cores

Manual, pág. 05. **Proporção de uso: 60% Base/Branco · 25% Petróleo · 10% Anel · 5% Laranja.**
CMYK e Pantone conversam com a gráfica a partir do HEX, com prova impressa.

| Token Tailwind | Nome no manual | Hex | Uso |
|---|---|---|---|
| `--color-petroleo` | Petróleo | `#0F3B45` | Cor principal: texto, wordmark do logo, títulos, fundos escuros |
| `--color-primary` (`laranja-apura`) | Laranja Apura | `#D96B1A` | Destaque, CTA, segmento do anel no símbolo. **Use pouco** |
| `--color-laranja-claro` | Laranja claro | `#F08A3C` | **Substitui** o Laranja Apura sobre fundos escuros |
| `--color-anel` | Anel | `#D6E1E0` | Anel do símbolo, divisores, fundos de cartões |
| `--color-base` | Base | `#ECEEEC` | Fundo geral de telas e materiais |
| `--color-surface` | Branco | `#FFFFFF` | Superfície de cartão, fundos de documentos e orçamentos |

### Derivados (não estão literalmente no manual, derivados dele)

```
--color-petroleo-suave   #5E7980    texto secundário — cinza puro brigaria com o tom
--color-laranja-hover    #B2530F    hover de CTA — escurece, padrão de feedback
--color-border           #D6E1E0    = Anel
--color-surface-alt      #ECEEEC    = Base (fundo de página)
--color-text             #0F3B45    = Petróleo
--color-text-inverse     #FFFFFF
```

### Semânticas de status — mantidas do sistema anterior

```
--color-success  #2E7D5B
--color-warning  #C98A1E
--color-danger   #C63122
--color-info     #3B6E8F
```

**Regra do danger, revisada no rebrand Apura (antes "regra do vermelho").**

- A cor de marca (agora o **Laranja Apura**) continua **exclusiva de CTA e do
  segmento do símbolo** — nunca fora de botão, nunca em número.
- Para sinalizar que um valor do **próprio custo/margem da oficina** piorou
  (custo subiu, margem caiu), usar `--color-danger` (`#C63122`) — vermelho distinto
  da cor de marca. Motivo: o padrão do setor (verde sobe, vermelho desce) é lido
  de relance, e manter o número neutro obrigava o usuário a ler o texto. [`danger`]
- **Nunca aplicar a posição de mercado** (`/benchmark`): dizer que a oficina está
  abaixo da mediana é fato de posicionamento, não avaliação de bom/ruim —
  docs/saas/09-benchmark.md proíbe conselho de preço.
- Cor nunca é o único sinal: sempre seta/ícone e rótulo textual junto.

---

## Tipografia

Manual, pág. 06. Duas famílias, via `next/font/google` em `src/app/layout.tsx`.

| Papel | Fonte | Especificação |
|---|---|---|
| Marca e títulos | **Archivo** | Expanded (largura **118%**), ExtraBold **800** |
| Textos, números e telas | **Barlow** | Regular 400 · SemiBold 600 · Bold 700 |

Regras do manual:

- **Archivo:** títulos curtos e o nome da marca. **Nunca** em texto longo.
  Aplicação técnica: o eixo `wdth` é carregado pelo `axes: ["wdth"]` e o stretch
  de 118% é aplicado uma vez em `@utility font-display` (globals.css) — nenhum
  componente precisa saber.
- **Nunca usar display abaixo de 20 px** (`--text-lg`).
- **Barlow:** mínimo de 16 px em telas para texto de interface.
- **Números sempre tabulares** (`font-variant-numeric: tabular-nums`) — a
  ferramenta é de cálculo e os números aparecem em coluna. O manual não define
  fonte mono: os valores saem do próprio Barlow (token `--font-tabular`).
- A classe `.tabular` e `.metric-value` são os pontos de entrada do número tabular.

### Escala de tipo

```
xs    12px / 1.4    labels, legendas
sm    15px / 1.55   texto de ajuda e assistente — leitor de 35–55 anos, em pé, no celular
base  16px / 1.6    corpo  (mínimo Barlow em tela)
lg    20px / 1.4    subtítulo de seção  (mínimo Archivo)
xl    24px / 1.3    título de seção
2xl   32px / 1.2    título de página
4xl   48px / 1.1    número-herói (Archivo Expanded)
```

Máximo 3 tamanhos por tela.

### Espaçamento

Base 4px: `4, 8, 12, 16, 24, 32, 48, 64, 80` (`--spacing: 0.25rem` default do
Tailwind, sem override). Padding de card 20px. Entre seções 48/80px.

### Raio e elevação

- Botão: `8px`, card: `14px` (Leva 3 — deixa de parecer formulário de sistema)
- Badge: pill
- Sombra: só `--shadow-card` (2 camadas rasas, tom Petróleo). **Sem sombra pesada
  e nunca no logo** — o manual proíbe; o espírito se estende à interface.

---

## Personalidade

**Técnico mas acessível. Sério mas não corporativo.**

O usuário é um técnico que desconfia de coisa bonita demais. A interface deve
parecer um instrumento de medição — precisa, legível, sem enfeite — e não um
dashboard de startup.

Evitar: ilustração 3D genérica, gradiente colorido, ícone de chave inglesa e
engrenagem (clichê automotivo esgotado), foto de banco de imagem de mecânico
sorrindo com braços cruzados. O manual repete: sem sombras, brilhos ou gradientes
no logo; fundos limpos sempre.

---

## Acessibilidade

- Contraste mínimo 4.5:1 corpo, 3:1 texto grande. **Branco sobre Laranja Apura (`#D96B1A`) é limítrofe** — passa como elemento gráfico/CTA com texto grande e 800, mas laranja como texto pequeno sobre Base é curto: usar contraste adequado ou rótulo, nunca só cor.
- Alvo de toque ≥ 44×44px — não negociável; usuário em pé, no balcão, mão suja.
- Foco de teclado sempre visível (2px, offset 2px, cor `primary`)
- Nunca cor sozinha para transmitir estado — ícone ou rótulo junto
- Respeitar `prefers-reduced-motion`

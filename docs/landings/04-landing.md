# 04 — Landing da calculadora gratuita

Peça de topo do funil. A landing institucional do produto é a outra, e está em `docs/landings/08-landing-produto.md`.

As duas não se confundem: aqui o objetivo é fazer o dono de oficina **começar a preencher**, e por isso esta página não tem saída além do CTA — nem link de navegação no header. Quem quiser conhecer a plataforma chega por `/produto`, e o único caminho daqui para lá é um link no rodapé.

## Funil

```
Meta Ads (Reels/carrossel) ─┐
Grupos de Facebook          ├─→ Landing ─→ Calculadora ─→ Resultado
Prospecção Google Maps      │                                 │
WhatsApp / telefone         │                                 ▼
Rede dos parceiros         ─┘                      Captura de e-mail → conta
```

**Objetivo único: fazer o dono de oficina começar a preencher a calculadora.** Tudo o que não serve a isso sai.

---

## Estrutura

### Herói
Não é headline + imagem. **É a calculadora, ou o primeiro passo dela, visível na primeira dobra.**

O usuário deve conseguir digitar antes de rolar. Isso derruba a maior fonte de abandono: a landing que pede fé antes de entregar valor.

- Título: pergunta direta que o dono de oficina já se faz
- Uma linha dizendo o que faz e que é grátis
- Primeiro campo já em foco

### Prova
Logos SENAI-SP e SINDIREPA-SP, com uma linha explicando a parceria. É o ativo de credibilidade mais forte que existe hoje — usar cedo.

Sem depoimento inventado. Sem "mais de X oficinas confiam". Quando houver número real, entra.

### Por que a maioria erra o preço da hora
Três blocos curtos: custo fixo esquecido, ociosidade ignorada, encargos subestimados. Educativo, não vendedor — é a tradução direta do princípio "Educativa".

### O que você recebe
Custo real da hora, ponto de equilíbrio, composição aberta do preço, comparativo com o que cobra hoje.

### FAQ
É grátis mesmo? Precisa cadastrar? Meus dados ficam guardados? Serve pra oficina do meu tamanho? Como vocês calculam?

### Fechamento
Volta para a calculadora. Um CTA, um só.

---

## Regras

- **Sem pop-up de saída, sem modal de e-mail antes do resultado, sem contador de urgência falso.** O público desconfia de software que promete demais; truque de conversão queima confiança e o produto inteiro depende dela.
- Público em 4G, celular mediano. Sem vídeo de fundo, sem biblioteca de animação pesada.
- **Tempo até o primeiro campo interativo** é a métrica de performance que conta — não o Lighthouse.
- Renderizada no servidor ou pré-renderizada: é a página que precisa rankear.

---

## Copy — restrição obrigatória

Reler o posicionamento em `CLAUDE.md`. Nenhuma superfície pública **pode prometer aumento de margem**.

| ❌ | ✅ |
|---|---|
| "Aumente sua margem em 30%" | "Saiba quanto custa de verdade a sua hora" |
| "Cobre o que você merece" | "Preço com base em cálculo, não em achismo" |
| "Pare de perder dinheiro" | "Descubra seu ponto de equilíbrio" |
| "Dobre seu lucro" | "Mostre ao cliente como o preço é formado" |

O ganho econômico é consequência de precificar certo — nunca a manchete.

---

## SEO e técnico

- Meta e Open Graph a partir de `BRAND` — nunca literal
- Termos: "calcular preço hora oficina mecânica", "custo hora mão de obra oficina", "como precificar serviço oficina"
- Aviso de privacidade e uso de dados visível (LGPD)

## Animação

Discreta e funcional.

**Onde:** transição do número quando o cálculo muda (é a coisa que ensina), montagem da barra de composição, revelação sutil de seção no scroll.

**Onde não:** parallax, contador subindo do zero no herói, elemento flutuante. Respeitar `prefers-reduced-motion` sempre.

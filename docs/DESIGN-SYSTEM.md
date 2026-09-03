# Design System — JML Sports / Jamal Fotos
> Referência visual extraída das artes enviadas (agenda BJJ, ícones spray, logo).
> Status: **apenas especificação**. Nenhum código de projeto foi iniciado ainda.

## 1. Conceito

Portfólio de **fotógrafo esportivo** (foco em Jiu-Jitsu / BJJ) com linguagem
**street art / pichação / spray + stencil**:

- Fundo **preto absoluto** dominante (dark-only, não há tema claro).
- Elementos em **branco stencil** com textura de meio-tom (halftone/dot screen).
- Acentos em **rosa/magenta neon** com respingos (splatter), escorridos (drips)
  e traços de spray.
- Sensação de **cartaz colado no muro**: grão, ruído, bordas irregulares.
- Fotos entram como o "conteúdo limpo" dentro dessa moldura suja — a arte
  emoldura, nunca compete com a foto.

Tagline oficial (vista na arte): **"FOCO, AGILIDADE E EXCELÊNCIA"** ·
**"FOTOGRAFIA ESPORTIVA"** · **"COBERTURA ESPORTIVA"**.

## 2. Paleta

| Token | Hex | Uso |
|---|---|---|
| `--ink-900` | `#0A0A0A` | Fundo global (preto com leve calor) |
| `--ink-800` | `#111111` | Superfície de card / faixa |
| `--ink-700` | `#1A1A1A` | Card elevado, hover de linha |
| `--ink-600` | `#2A2A2A` | Bordas sutis, divisórias |
| `--white` | `#FFFFFF` | Texto primário, stencil |
| `--white-dim` | `#E8E8E8` | Texto de título secundário |
| `--gray-400` | `#9A9A9A` | Texto de apoio, legendas, local |
| `--gray-600` | `#5A5A5A` | Texto desativado / placeholder |
| `--pink-500` | `#F0197D` | **Cor de marca** — CTA, destaque, links |
| `--pink-400` | `#FF2E93` | Neon / glow / hover |
| `--pink-600` | `#C9106A` | Pressed, sombra do CTA |
| `--pink-300` | `#FF6BB5` | Splatter claro, detalhes |
| `--violet-500` | `#8B3FD1` | Fim do gradiente de título |
| `--violet-400` | `#A455E8` | Realce do gradiente |

### Gradiente de título (usado em "AGENDA DE AGOSTO")
```
linear-gradient(100deg, #FFFFFF 0%, #FF2E93 35%, #F0197D 60%, #8B3FD1 100%)
```
Aplicar com `background-clip: text; color: transparent`.

### Glow neon (aura rosa dos ícones)
```
filter: drop-shadow(0 0 6px #FF2E93) drop-shadow(0 0 24px rgba(240,25,125,.45));
```

### Regra de uso de cor
- Rosa é **acento**, nunca fundo de área grande. Alvo: ~10% da tela.
- Branco carrega a informação; cinza carrega o secundário.
- Roxo aparece **só em gradiente**, nunca sozinho como cor sólida.
- Nada de outra matiz (sem azul, verde, amarelo) fora de logos de terceiros.

## 3. Tipografia

Três papéis distintos, como nas artes:

| Papel | Fonte | Peso / estilo | Onde |
|---|---|---|---|
| **Display / Hero** | `Anton` (alt: `Archivo Black`, `Bebas Neue`) | 400, uppercase, tracking `-0.02em`, textura de spray | "AGENDA DE AGOSTO", títulos de seção, nome nas capas |
| **Script / Assinatura** | `Permanent Marker` (alt: `Rock Salt`, `Caveat Brush`) | 400, inclinado | Palavra "Jamal", assinaturas, selos "tag" |
| **UI / Corpo** | `Inter` (alt: `Barlow Condensed` para linhas de dados) | 400 / 600 / 800 | Navegação, parágrafos, cards, formulário |
| **Números / datas** | `Barlow Condensed` ou `Oswald` | 700, uppercase | "01/08", contadores, EXIF, preços |

### Escala (desktop → mobile)
```
display-xl : 96px / 0.9  → 48px    (hero)
display-l  : 64px / 0.95 → 36px    (seção)
display-m  : 40px / 1.0  → 28px
h3         : 24px / 1.2  → 20px
body       : 16px / 1.6  → 15px
small      : 14px / 1.5
caption    : 12px / 1.4  · tracking 0.12em · uppercase (labels, local, tag)
```
Títulos display sempre **uppercase**. Corpo nunca uppercase.

## 4. Componentes (padrão das artes)

**Card de item (linha da agenda)**
- `background: var(--ink-800)`, `border: 1px solid rgba(240,25,125,.25)`,
  `border-radius: 14px`, `padding: 20px 24px`.
- Layout: `[data grande] [título + 📍 local] [logo/thumb à direita]`.
- Hover: borda → `--pink-500`, `box-shadow: 0 0 24px rgba(240,25,125,.25)`,
  leve `translateY(-2px)`.

**Timeline vertical** (bolinhas + linha à esquerda dos cards)
- Linha `1px` em `--pink-600`; nó = círculo `20px` com borda rosa.
- Estado concluído: nó preenchido com ✓ e **data riscada com traço de spray rosa**.

**Botão primário**
- Fundo `--pink-500`, texto branco/preto `Anton` uppercase, cantos levemente
  irregulares (clip-path), sem sombra suave — sombra **dura** offset 4px em preto.

**Ícones**
- Estilo stencil branco + halftone + aura rosa (ver imagens: câmera, calendário,
  kimono, fotógrafo). Usar como PNG/SVG sobre fundo preto — não recolorir.

**Texturas obrigatórias (camadas)**
1. `noise` — grão em `overlay`, opacidade 4–8%, sobre o fundo.
2. `splatter` — respingos rosa nos cantos das seções (topo e rodapé).
3. `drip` — escorrido saindo da borda inferior de faixas/headers.
4. `stroke` — traço de spray como divisor entre seções, no lugar de `<hr>`.

## 5. Layout

- Container máx. `1200px`, gutter `24px` (mobile `16px`).
- Grid de portfólio: masonry / 3 colunas desktop, 2 tablet, 1 mobile, `gap 12px`.
- Foto em preto e branco no repouso → **cor no hover**, com moldura rosa fina.
- Seções separadas por traço de spray, não por linha reta.
- Bordas de imagem: `border-radius: 2px` (quase reto — é cartaz, não app).

## 6. Movimento

- Entrada de seção: fade + `translateY(16px)`, `320ms cubic-bezier(.2,.7,.3,1)`.
- Hover de card: `180ms`. Nada de bounce.
- Efeito assinatura: **spray reveal** — máscara de respingo revelando a imagem.
- Respeitar `prefers-reduced-motion`.
- **Modo econômico no celular** (ver seção 11): o desenho é o mesmo, o
  orçamento de quadro não. Movimento contínuo é privilégio de quem tem GPU
  sobrando.

## 7. Ativos

- `public/logo.jpeg` — **flor graffiti** branca com halftone, spray rosa e drips
  sobre preto (marca-símbolo). Fundo já é preto sólido → combina direto com
  `--ink-900`. Ideal para favicon, avatar, marca d'água e watermark de fotos.
- Wordmark **"JML SPORTS"** (Anton branco + traço rosa) e o lettering
  **"Jamal"** (script rosa com coroa) aparecem nas artes — recriar em texto/SVG
  ou pedir os arquivos originais.

## 8. Conteúdo previsto do site
Hero · Portfólio (galeria por evento/campeonato) · Agenda de eventos (mesmo
padrão do card da arte) · Sobre / Bio · Serviços (cobertura esportiva) ·
Depoimentos · Contato / Orçamento · Rodapé com redes.

## 9. Acessibilidade
- `#F0197D` sobre `#0A0A0A` = contraste ~5.2:1 → OK para texto ≥16px e UI.
  Não usar rosa em texto abaixo de 14px; nesse caso use branco.
- Texto sobre foto sempre com scrim preto `rgba(0,0,0,.55)`.
- Foco visível: outline rosa `2px` + offset `2px`.

---

## 10. Implementação (atualizado conforme o código)

Os tokens vivem em `src/app/globals.css` dentro do `@theme` do Tailwind 4 —
`docs/tokens.css` fica como referência legível. Nomes no código:

| Papel | Classe Tailwind | Token |
|---|---|---|
| Fundo | `bg-ink-900` | `--color-ink-900` |
| Superfícies | `bg-ink-800` / `bg-ink-700` | `--color-ink-800/700` |
| Acento | `text-pink-500` / `bg-pink-500` | `--color-pink-500` |
| Texto de apoio | `text-ash-400` / `text-ash-600` | `--color-ash-400/600` |
| Display | `font-display` | Anton |
| Script | `font-script` | Permanent Marker |
| Corpo | `font-sans` | Inter |
| Números/labels | `font-num` | Barlow Condensed |

Utilitários próprios: `.text-brand-gradient` (gradiente branco→rosa→roxo em
`background-clip: text`), `.glow-pink`, `.texture-noise`, `.texture-halftone`.

**Gradiente entre letras:** no wordmark cada letra é um elemento próprio (para
animar em stagger), mas todas usam `background-size: 300%` com
`background-position` fatiado por índice — assim o gradiente lê como *um só*
atravessando "JML", e não três gradientes repetidos.

**Texturas:** `src/components/ui/spray.tsx` exporta `Splatter`, `Drips` e
`SprayStroke`. Todos usam o PRNG determinístico `seeded()` de `src/lib/utils.ts`
— nunca `Math.random()`, que quebraria a hidratação do Next.

**Escorridos em HTML, não SVG:** um SVG esticado para a largura da tela
engrossa os filetes junto. `Drips` usa spans posicionados, com espessura em px.

### Rodapé (`src/components/footer/footer.tsx`)

- **Arte de fecho:** `public/pictures/footer.jpeg` → `public/art/footer.webp`
  (manifesto `src/data/art.ts`). Como o fundo dela é preto chapado, entra com
  `mix-blend-lighten` + máscara radial — assim some a borda do quadrado e a
  arte "vaza" no fundo em vez de virar um card colado.
- **Contatos** ficam só em `src/data/social.ts`: WhatsApp, Instagram e TikTok.
  Nada de outras redes — o rodapé lista exatamente o que o Jamal usa.
- **Movimento:** GSAP/ScrollTrigger para o que depende da posição da rolagem
  (revelação da arte, parallax, escorridos, deriva do wordmark) e Framer Motion
  para entradas `whileInView` e estados de hover/tap.
- O wordmark gigante sangra na borda de baixo (`-mb-[0.16em]`) — o corte é
  proposital, é o cartaz passando da parede.

**Imagens avulsas:** `scripts/optimize-images.mjs` tem o array `SINGLES` —
cada grupo (retratos, artes) vira um diretório em `public/` e um manifesto em
`src/data/`, e os arquivos listados ali ficam **fora** do túnel do hero. Ao
adicionar uma arte nova em `public/pictures`, cadastre-a nesse array; senão ela
entra na galeria junto com as fotos.

### Navegação (`src/components/nav/navbar.tsx`)

Itens em `src/data/nav.ts` — fonte única para a navbar e para o rodapé.
Âncoras são `/#secao`, para funcionarem também a partir de `/portfolio`.

- **Desktop:** `src/components/ui/slide-tabs.tsx` (base: Uiverse/SlideTabs),
  trazido para o sistema — trilho `ink-800`, pílula `pink-500`, raio 14px no
  lugar do `rounded-full`. O original inverte o texto com
  `mix-blend-difference`; sobre o rosa isso daria verde, então a cor do item
  aceso é controlada por estado. A pílula desliza em `x` (transform), não em
  `left`, para não recalcular layout a cada quadro.
- **Mobile:** chave hambúrguer com o CSS do Uiverse (`.nav-toggle` em
  `globals.css`) em barras rosa, controlada por um checkbox que o React
  governa — assim os seletores irmãos do CSS original continuam valendo e o
  estado ainda serve para abrir o painel.
- **Entrada da barra em CSS** (`.nav-enter`), não em JS: o GSAP já usa o
  `transform` do `<header>` para o auto-hide, e uma animação CSS sempre
  termina no estado final — com JS, uma aba escondida durante a entrada
  deixaria a navbar presa fora da tela.
- Âncoras na própria home rolam com `gsap.to(window, { scrollTo })`; fora
  dela, navegação normal do Next.

**`src/lib/utils.ts` não pode importar hooks.** Ele é importado por
`spray.tsx`, que roda em componentes de servidor — um `import { useEffect }`
no topo faz o Next recusar o módulo inteiro. Hooks vivem em
`src/lib/hooks.ts`, com `"use client"`.

### Marca e ícones

`public/logo_bg.png` é a marca-símbolo atual (flor graffiti, fundo
transparente). Ela aparece:

- **no header**, direto por `next/image` — o PNG de ~400 KB só é lido pelo
  otimizador do Next, o navegador recebe webp no tamanho pedido;
- **como favicon**, por `src/app/icon.png` e `src/app/apple-icon.png` (convenção
  do App Router). Esses dois são **gerados** por `npm run images` a partir do
  logo_bg — achatados sobre o `--ink-900`, porque a flor é branca e sumiria
  numa aba clara, e porque servir o PNG cru como favicon custaria 400 KB.
  Trocou a logo? Rode `npm run images` de novo.

Não declare `metadata.icons` no layout: isso sobrescreveria a convenção.

### Botão animado (`.btn-animated`)

Base: Uiverse.io / gharsh11032000. Adaptações:

- Rosa da marca no lugar do greenyellow; tipografia `font-display` em caixa
  alta, como manda o padrão de botão do sistema.
- No hover a pílula vira retângulo de `--radius-card` (14px) — a transição de
  "app" para "cartaz" que o sistema pede.
- `display: inline-flex`, não `flex`: como `flex` é block-level, o botão
  esticaria para a largura da coluna inteira no desktop. A largura cheia do
  mobile vem de `w-full sm:w-auto`.
- O círculo cresce em `scale` (compositor) em vez de `width`/`height`, que
  refariam layout a cada quadro. O fator 22 sobre 24px dá 528px — cobre
  também o botão de largura cheia no mobile.
- Vive em `@layer components` para que utilitários do Tailwind aplicados no
  mesmo elemento continuem vencendo na cascata.

### Portfólio — esfera de campeonatos

`src/components/ui/img-sphere.tsx` distribui as peças numa **esfera de
Fibonacci** e projeta cada uma em 2D a cada quadro.

- Nada de `transform-style: preserve-3d`: as fotos precisam ficar sempre de
  frente para quem olha. A projeção manual (`perspective / (perspective - z)`)
  também dá controle sobre profundidade, opacidade e ordem de pilha.
- O laço escreve só `transform`, `opacity` e `z-index`, direto no DOM. Com ~50
  peças, re-renderizar o React a 60fps seria desperdício. Filtro e moldura
  ficam na classe `.sphere-tile` (globals.css), trocada por evento — não por
  quadro.
- Preto e branco em repouso, cor e moldura rosa no hover ou no evento em foco:
  é a regra que o sistema define para a grade de portfólio.
- **Densidade por breakpoint:** 52 peças no desktop, 26 no celular
  (`sphereTiles` / `sphereTilesCompact`). Em 375px as 52 se cobrem e a esfera
  vira um borrão. A troca só acontece depois de montar — decidir pela largura
  no SSR quebraria a hidratação.
- `touch-action: pan-y`: arrastar de lado gira a esfera, arrastar para cima
  ainda rola a página. Travar tudo prenderia o dedo do usuário num quadrado.

**Acessibilidade:** a esfera é `aria-hidden`. Quem navega por teclado ou
leitor de tela usa a lista de eventos ao lado, que é a mesma fonte de verdade
— apontar um item acende as peças correspondentes.

**As fotos por evento ainda são provisórias.** `src/data/championships.ts`
reparte o acervo geral em rodízio entre os 9 campeonatos, de forma
determinística (nada de `Math.random()`, que quebraria a hidratação). Quando
chegarem os conjuntos reais, é só trocar a montagem de `photos`.

---

## 11. Movimento no celular (`src/lib/perf.ts`)

O site é feito de camadas em movimento — túnel de fotos, respingos, escorridos,
parallax, esfera. No desktop elas cabem no quadro; no celular, somadas, não. A
regra é: **em tela de toque ou estreita, o que não muda o desenho sai de cena.**

`LOW_POWER_QUERY` (`max-width: 900px, pointer: coarse`) é a fonte única dessa
decisão, e vale nos dois lados:

- **JS** — `useLowPower()` / `isLowPowerDevice()` cortam o que custa por quadro:
  parallax dos respingos, deriva dos planos de spray, reação ao cursor
  (que num celular nem existe), o pingo que se desprende dos escorridos, o
  `blur()` na saída do lockup e o `letter-spacing` animado do rodapé —
  propriedades que refazem layout ou repintam a tela inteira a cada quadro.
- **CSS** — o bloco "modo econômico" de `globals.css` desliga `mix-blend-mode`,
  `backdrop-filter`, sombras desfocadas e o pulso das gotas de spray.

Duas regras valem em **qualquer** aparelho:

- **Laço fora da tela não roda.** `watchActivity()` (IntersectionObserver +
  `visibilitychange`) pausa o túnel do hero, a esfera do portfólio e os
  escorridos quando saem de vista ou a aba é escondida.
- **Não reescrever o que não mudou.** Os laços guardam o último valor escrito
  de `visibility`, `z-index`, `opacity` e `--near`; este último anda em degraus,
  porque cada mudança repinta a foto (ela tem `grayscale()`).

Medido no Chromium com emulação de Pixel 5 e CPU 4× mais lenta, rolando a página
inteira: home 50 ms → 16,7 ms de mediana por quadro (76 de 77 quadros
atrasados → 2 de 185); portfólio 33,3 ms → 16,7 ms. O desktop não mudou —
mesmas 26 fotos no túnel e mesmas 943 gotas de spray de antes.

# JML Sports — Portfólio

Site portfólio do fotógrafo esportivo **Jamal** (JML Sports), nicho
Jiu-Jitsu / esportes de combate.

## Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS 4 · Framer Motion ·
GSAP + ScrollTrigger · Radix UI · Sharp

## Rodando

```bash
npm install
npm run images   # otimiza public/pictures -> public/gallery + manifesto
npm run dev
```

> `npm run images` só precisa rodar de novo quando você adicionar ou trocar
> fotos em `public/pictures`. Ele gera `public/gallery/*.webp` e reescreve
> `src/data/gallery.ts` (com `blurDataURL` de cada foto).
> Na última execução: **26 fotos, 79 MB → 3,8 MB**.

## Estrutura

```
docs/DESIGN-SYSTEM.md          # identidade visual (cores, fontes, texturas)
docs/tokens.css                # tokens em CSS puro, referência
public/pictures/               # originais (não versionar em produção)
public/gallery/                # webp otimizado (gerado)
public/logo.jpeg               # marca-símbolo (flor graffiti)
scripts/optimize-images.mjs    # pipeline Sharp
src/app/globals.css            # @theme do Tailwind = tokens da marca
src/components/ui/
  3d-gallery-photography.tsx   # InfiniteGallery — o túnel de fotos
  spray.tsx                    # Splatter / Drips / SprayStroke
src/components/hero/
  hero.tsx                     # composição da seção
  hero-title.tsx               # lockup Jamal / JML / SPORTS
src/data/gallery.ts            # manifesto gerado
```

## Hero

Túnel 3D infinito de fotos com o wordmark **JML** ancorado no centro.

- **3D em CSS puro** (`perspective` + `translate3d` + `preserve-3d`), sem
  Three.js — mantém o bundle na stack acordada.
- As fotos são distribuídas pelo **ângulo áureo** com um raio mínimo
  (`CLEAR_ZONE`) que mantém o miolo livre para o wordmark.
- Profundidade controla **opacidade, saturação e o brilho da moldura rosa**:
  ao fundo a foto é preto e branco e apagada, perto da câmera ganha cor e
  a borda neon acende.
- Navegação por **roda do mouse, setas, PageUp/Down, espaço e toque**;
  o auto-play volta após 3 s de inatividade.
- O loop roda no `gsap.ticker`; o primeiro frame é aplicado de forma
  síncrona (`useLayoutEffect`), então a galeria já nasce posicionada.
- Respeita `prefers-reduced-motion` (sem auto-play, sem animação de entrada).

### Props do `InfiniteGallery`

| prop | padrão | o que faz |
|---|---|---|
| `images` | — | manifesto de `src/data/gallery.ts` |
| `speed` | `1.2` | unidades por segundo no auto-play |
| `zSpacing` | `3` | distância entre fotos consecutivas |
| `visibleCount` | `12` | quantas fotos cabem na janela do túnel |
| `falloff` | `{near: .8, far: 14}` | bandas de fade na câmera e ao fundo |
| `idleDelay` | `3000` | ms até o auto-play voltar |

## Rolagem

O hero **não sequestra mais o scroll**. A seção é uma pista de `210svh` com o
visual em `position: sticky`; um ScrollTrigger lê o progresso da pista e empurra
o túnel pela API imperativa da galeria (`ref.nudge()`). Consequências:

- roda, teclado, barra de rolagem e **a inércia nativa do toque** continuam
  funcionando — nada de `preventDefault` nem `touch-action: none`;
- no fim da pista o lockup se dissolve e um véu preto entrega a seção Sobre;
- `ScrollTrigger.config({ ignoreMobileResize: true })` evita remedir tudo quando
  a barra do navegador mobile aparece e some.

## Sobre

Retrato do Jamal com o nome sobrepondo a borda da foto, no modelo de referência
— mas construído mobile-first: uma coluna no celular (retrato → nome puxado por
cima da base da foto → traço → bio → pilares) e duas colunas a partir de `lg`,
com o nome invadindo a coluna da direita.

- `Jamal` em Anton com o gradiente da marca; `Sports` vazado em contorno rosa
  (`.text-outline-pink`) — o "outline" do graffiti.
- ScrollTrigger: revelação do retrato em `clip-path`, parallax interno da foto,
  entrada do nome linha a linha, traço de spray e bio em stagger.
- Framer Motion cuida das entradas simples (`whileInView`): olho da seção e os
  três pilares FOCO / AGILIDADE / EXCELÊNCIA.

O retrato sai de `public/pictures/jamal_imagem.jpg`, mas é **excluído do túnel
do hero** pelo mapa `PORTRAITS` em `scripts/optimize-images.mjs`; ele vira
`public/portrait/jamal.webp` + `src/data/portrait.ts`.

> ⚠ A bio em `src/components/about/about.tsx` é **texto provisório** genérico —
> troque pela versão do Jamal antes de publicar.
> O círculo com seta é grafismo (`aria-hidden`), pronto para virar o CTA do
> portfólio quando aquela seção existir.

## Próximas seções

Portfólio por evento · Agenda de campeonatos · Serviços · Depoimentos · Contato.

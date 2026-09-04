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
| `visibleCount` | `12` | quantas fotos cabem na janela do túnel (o nível de desempenho aperta este teto) |
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
  a tagline CONGELANDO HISTÓRIAS ALÉM DO TATAME.

O retrato sai de `public/pictures/jamal_imagem.jpg`, mas é **excluído do túnel
do hero** pelo mapa `PORTRAITS` em `scripts/optimize-images.mjs`; ele vira
`public/portrait/jamal.webp` + `src/data/portrait.ts`.

> ⚠ A bio em `src/components/about/about.tsx` é **texto provisório** genérico —
> troque pela versão do Jamal antes de publicar.
> O círculo com seta é grafismo (`aria-hidden`), pronto para virar o CTA do
> portfólio quando aquela seção existir.

## Eventos (home, abaixo do Sobre)

Uma tira por campeonato — `src/components/portfolio/events-preview.tsx` monta
as tiras a partir de `championships` (a capa é a primeira foto do conjunto) e
`src/components/ui/image-gallery.tsx` faz o leque.

Cada tira leva para `/portfolio?evento=<slug>`, que abre aquela galeria já na
chegada; abaixo delas, o CTA `.btn-animated` vai para `/portfolio` inteiro.

O leque é o mesmo nas duas pontas, mas quem abre a tira muda: no desktop é o
`:hover`; no toque, que não tem hover, a tira aberta é estado — a primeira já
entra aberta, tocar numa fechada abre ela e só o toque na aberta é que navega.
Uma `matchMedia` tira esse estado da frente acima de `lg`, senão a tira aberta
no celular ficaria presa aberta ao voltar para o desktop.

O deep link é lido de `location.search` num efeito de montagem, e **não** com o
`useSearchParams` do Next: numa página estática aquele hook exige um limite de
Suspense e faz a subárvore renderizar de novo no cliente — a esfera montava
duas vezes, só uma das montagens via o parâmetro, e o link abria a galeria uma
vez sim, outra não. Sem ele, `/portfolio` também volta a ser pré-renderizada.

## Desempenho — os três níveis

O site é pesado de propósito. Em máquina boa isso é a identidade da marca; num
PC fraco vira travamento, e um site que engasga não passa a impressão de
qualidade que o portfólio precisa passar. Então o peso é **regulável**, e quem
regula é `src/lib/perf.ts`.

| nível | quem cai aqui | o que muda |
|---|---|---|
| `high` | máquina folgada | tudo como projetado |
| `mid` | ≤ 4 núcleos ou ≤ 4 GB, ou quem pediu menos movimento | menos camadas por quadro |
| `low` | ≤ 2 núcleos, ≤ 2 GB, economia de dados, tela lenta — **ou quem foi medido engasgando** | só o essencial |

### Como o nível é decidido

1. **Palpite**, na hidratação: núcleos, memória, `saveData`, `(update: slow)`,
   `prefers-reduced-motion`. Barato e imediato, mas mente — um PC de 4 núcleos
   e 8 GB pode ter uma GPU integrada terrível.
2. **Medida**: um cão de guarda cronometra os quadros de verdade por até 25 s.
   A cada 90 quadros ele tira a mediana; passando de 21 ms (≈ 48 fps), rebaixa
   um degrau. É esta etapa que pega o PC fraco que o palpite deixou passar.

O nível **só desce**, nunca sobe, e fica guardado na sessão: ir para
`/portfolio` já começa no nível medido, sem precisar engasgar de novo. O
resultado sai em `<html data-perf="...">`, que é por onde o CSS lê.

> Para testar um nível à mão, no console:
> `sessionStorage.setItem("jml:perf-tier", "low")` e recarregue.

### O que sai em cada corte

Os cortes seguem uma regra só: **a composição não muda de leitura, o custo por
quadro é que cai**. Nada de esconder seção ou trocar cor — o que sai é filtro,
mistura de camadas, desfoque e elemento repetido, que é o que obriga o
navegador a rasterizar de novo.

- **Túnel do hero** — 26 fotos em camada dupla (P&B embaixo, colorida
  acendendo por cima) viram 16 e depois 9, sempre em camada simples: a foto
  passa a ser sempre colorida em vez de acender, e a rasterização por foto cai
  pela metade. O laço também ganha teto de 32 fps no `low` — 30 fps
  **constantes** passam sensação de fluidez muito melhor do que 45 que
  despencam para 18 sem aviso.
- **Respingos e escorridos** — a nuvem cai para 55% e depois 30% das gotas
  (corte no fim da lista: afina, não muda de desenho). Fora do `high` somem a
  deriva, o cursor, o parallax e o pulso das gotas graúdas: tudo isso mexe
  dentro do SVG, e SVG não é composto em camadas — mexer é repintar tudo.
- **Barra de navegação** — o `backdrop-blur` é o item mais caro da página: a
  barra é fixa, então cada quadro de rolagem desfoca de novo tudo que passa
  atrás dela. Fora do `high` ela vira fundo sólido.
- **Rodapé** — o wordmark gigante deixa de animar `letter-spacing` no scrub.
  É propriedade de *layout*: remedia a palavra inteira a cada quadro.
- **Tiras de eventos** — `flex-grow` (layout) e `grayscale` (filtro) são as
  duas transições mais caras do site; no `low` elas encurtam de 500/700 ms
  para 200 ms. A tira ainda abre e ainda ganha cor, num tempo que a máquina
  paga.
- **Esfera do portfólio** — teto de 32 fps e halo de hover sem desfoque.
- **Enfeite entra depois** — fora do `high`, respingos e escorridos esperam a
  máquina ficar ociosa (`requestIdleCallback`, teto de 2 s) em vez de montarem
  centenas de nós justo nos quadros da entrada do lockup.

### Mexendo nisso

Componente novo que precise pesar menos:

```tsx
const tier = usePerfTier();          // null no servidor e na hidratação
const passos = byTier(tier, { high: 40, mid: 24, low: 12 });
```

`usePerfTier` devolve `null` no servidor **e no primeiro render do cliente** —
é o que faz a hidratação bater. Quem usa o nível para decidir *quantos
elementos criar* trata `null` como "ainda não": o HTML do servidor sai leve e
a decoração entra no render seguinte. Dentro de um efeito de animação de
entrada, use `perfTier()` (imperativo) em vez do hook, senão o efeito roda
duas vezes e a entrada toca, é desfeita e toca de novo.

## Próximas seções

Agenda de campeonatos · Serviços · Depoimentos · Contato.

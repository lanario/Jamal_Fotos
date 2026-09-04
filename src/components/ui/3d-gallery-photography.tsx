"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import gsap from "gsap";

import type { GalleryImage } from "@/lib/types";
import { useIsomorphicLayoutEffect } from "@/lib/hooks";
import { cn, clamp, invLerp, mod, seeded } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Constantes do "tunel"
 * ------------------------------------------------------------------ */

/** Profundidade da camera. Quanto menor, mais agressiva a fuga. */
const PERSPECTIVE = 1200;
/** Pixels de profundidade por unidade de `zSpacing`. */
const UNIT = 150;
/** Angulo aureo: espalha as fotos sem repetir padrao. */
const GOLDEN_ANGLE = 2.399963229728653;
/** Suavizacao do scroll (maior = mais seco). */
const DAMPING = 5.5;
/** Raio minimo das fotos: mantem o centro livre para o wordmark. */
const CLEAR_ZONE = 0.32;

type Placement = {
  x: number; // vw a partir do centro
  y: number; // vh a partir do centro
  w: number; // largura em vw
  rot: number; // rotacao Z em graus
};

/** Posicao fixa de cada foto no plano do tunel. */
function placeImage(i: number): Placement {
  const angle = i * GOLDEN_ANGLE;
  const radius = CLEAR_ZONE + seeded(i, 1) * 0.26;
  // arredondado: SSR e cliente precisam gerar exatamente a mesma string
  const r = (n: number) => Number(n.toFixed(3));
  return {
    x: r(Math.cos(angle) * radius * 108),
    y: r(Math.sin(angle) * radius * 96),
    w: r(19 + seeded(i, 2) * 13),
    rot: r((seeded(i, 3) - 0.5) * 5),
  };
}

/** API imperativa: quem controla a rolagem empurra o tunel por aqui. */
export type InfiniteGalleryHandle = {
  /** Avanca (ou recua) o tunel em `delta` unidades e adia o auto-play. */
  nudge: (delta: number) => void;
};

export type InfiniteGalleryProps = {
  images: GalleryImage[];
  /** Unidades por segundo no auto-play. */
  speed?: number;
  /** Distancia entre fotos consecutivas, em unidades. */
  zSpacing?: number;
  /** Quantas fotos cabem na janela visivel do tunel. */
  visibleCount?: number;
  /** `far`: banda de fade-in ao fundo. `near`: banda de fade-out na camera. */
  falloff?: { near: number; far: number };
  /** ms de inatividade ate o auto-play voltar. */
  idleDelay?: number;
  className?: string;
  ref?: React.Ref<InfiniteGalleryHandle>;
};

export default function InfiniteGallery({
  images,
  speed = 1.2,
  zSpacing = 3,
  visibleCount = 12,
  falloff = { near: 0.8, far: 14 },
  idleDelay = 3000,
  className,
  ref,
}: InfiniteGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** Camada colorida por cima da versao P&B — so a opacidade dela anima. */
  const colorRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** Moldura rosa + halo: idem, opacidade so. */
  const glowRefs = useRef<(HTMLDivElement | null)[]>([]);

  /**
   * Ultimo valor escrito em cada elemento. O laco compara antes de tocar no
   * DOM: parado, o tunel nao gera uma unica escrita de estilo por quadro.
   */
  const written = useRef<{ t: string; o: string; n: string }[]>([]);

  const current = useRef(0);
  const target = useRef(0);
  const lastInput = useRef(0);
  /** Fica falso quando o hero sai da tela — ai o laco nem roda. */
  const onScreen = useRef(true);

  /**
   * Viewport em px + o `--photo-spread` do breakpoint atual, medidos no
   * resize. Sem isto o transform teria de carregar `calc(vw * var(...))`,
   * e o navegador refaria essa conta para cada foto a cada quadro.
   */
  const view = useRef({ w: 0, h: 0, spread: 1 });

  const placements = useMemo(() => images.map((_, i) => placeImage(i)), [images]);

  const total = images.length * zSpacing;
  const windowDepth = Math.min(visibleCount * zSpacing, total);
  const fadeIn = Math.min(falloff.far, windowDepth * 0.9);
  const fadeOut = falloff.near;

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const spread = Number.parseFloat(
      getComputedStyle(root).getPropertyValue("--photo-spread")
    );
    view.current = {
      w: root.clientWidth || window.innerWidth,
      h: root.clientHeight || window.innerHeight,
      spread: Number.isFinite(spread) ? spread : 1,
    };
  }, []);

  /** Posiciona todas as fotos para um dado avanco do tunel. */
  const layout = useCallback(
    (progress: number) => {
      const { w: vw, h: vh, spread } = view.current;
      const kx = (vw / 100) * spread;
      const ky = (vh / 100) * spread;

      for (let i = 0; i < placements.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;

        // profundidade em unidades, embrulhada em [-fadeOut, total - fadeOut)
        const d = mod(i * zSpacing - progress + fadeOut, total) - fadeOut;

        const opacity =
          d > windowDepth
            ? 0
            : invLerp(windowDepth, windowDepth - fadeIn, d) *
              invLerp(-fadeOut, 0, d);

        const slot = (written.current[i] ??= { t: "", o: "", n: "" });

        if (opacity <= 0.001) {
          if (el.style.visibility !== "hidden") {
            el.style.visibility = "hidden";
            // zera o cache: ao reaparecer, tudo e reescrito
            slot.t = "";
            slot.o = "";
            slot.n = "";
          }
          continue;
        }

        const p = placements[i]!;
        // perto da camera a foto ganha cor; ao fundo fica preto e branco
        const near = 1 - invLerp(0, windowDepth * 0.6, Math.max(d, 0));

        if (el.style.visibility !== "visible") el.style.visibility = "visible";

        // px inteiros no plano: o meio-pixel e o que faz a foto "vibrar"
        const t = `translate3d(${Math.round(p.x * kx)}px, ${Math.round(
          p.y * ky
        )}px, ${(-d * UNIT).toFixed(1)}px) rotate(${p.rot}deg)`;
        if (t !== slot.t) {
          el.style.transform = t;
          slot.t = t;
        }

        const o = opacity.toFixed(3);
        if (o !== slot.o) {
          el.style.opacity = o;
          slot.o = o;
        }

        /*
         * A cor e o halo NAO passam mais por `filter`/`box-shadow` animados:
         * mudar um filtro obriga o navegador a rasterizar a foto inteira de
         * novo, 60x/s, para cada foto na tela — era isso que fazia o tunel
         * piscar e travar. Agora a foto colorida e a moldura acesa sao duas
         * camadas fixas por cima da versao P&B, e so a opacidade delas anima:
         * trabalho de compositor, sem repintura.
         */
        const n = near.toFixed(3);
        if (n !== slot.n) {
          const color = colorRefs.current[i];
          const glow = glowRefs.current[i];
          if (color) color.style.opacity = n;
          if (glow) glow.style.opacity = n;
          slot.n = n;
        }
      }
    },
    [placements, zSpacing, total, windowDepth, fadeIn, fadeOut]
  );

  // primeiro frame sincrono: a galeria aparece ja posicionada, sem esperar rAF
  useIsomorphicLayoutEffect(() => {
    measure();
    layout(current.current);
  }, [measure, layout]);

  /*
   * A galeria NAO captura roda/toque: quem manda no tunel e a rolagem da
   * pagina (ScrollTrigger no hero chama `nudge`). Assim o scroll nativo —
   * e a inercia do mobile — continuam intactos.
   */
  useImperativeHandle(
    ref,
    () => ({
      nudge: (delta: number) => {
        target.current += clamp(delta, -zSpacing * 4, zSpacing * 4);
        lastInput.current = performance.now();
      },
    }),
    [zSpacing]
  );

  /* ---------- medidas: so no resize, nunca por quadro ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onResize = () => {
      measure();
      layout(current.current);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    window.addEventListener("orientationchange", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", onResize);
    };
  }, [measure, layout]);

  /* ---------- o tunel so gasta quadro enquanto esta a vista ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting;
        // ao voltar, nao recupera o tempo parado de uma vez
        if (entry.isIntersecting) lastInput.current = performance.now();
      },
      { rootMargin: "10% 0px" }
    );
    io.observe(root);

    const onVisibility = () => {
      if (!document.hidden) lastInput.current = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    const onMotion = () => {
      reduced = motion.matches;
    };
    motion.addEventListener("change", onMotion);

    lastInput.current = performance.now();

    /* ---------------- loop ---------------- */

    const tick = () => {
      if (!onScreen.current || document.hidden) return;

      const now = performance.now();
      const dt = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.05);

      if (!reduced && now - lastInput.current > idleDelay) {
        target.current += speed * dt;
      }

      const diff = target.current - current.current;

      // ja chegou: nada mudou, entao nem chama o layout
      if (Math.abs(diff) < 0.00005) {
        current.current = target.current;
        return;
      }

      current.current += diff * (1 - Math.exp(-DAMPING * dt));

      layout(current.current);
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      motion.removeEventListener("change", onMotion);
    };
  }, [images.length, speed, idleDelay, layout]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "gallery-3d relative isolate select-none overflow-hidden bg-ink-900",
        className
      )}
      style={{ perspective: `${PERSPECTIVE}px` }}
      role="region"
      aria-label="Galeria de fotografia esportiva"
    >
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        {images.map((img, i) => {
          const p = placements[i]!;
          const sizes = "(max-width: 768px) 60vw, 34vw";
          return (
            <div
              key={img.src}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="absolute"
              style={{
                width: `calc(${p.w}vw * var(--photo-scale))`,
                minWidth: 128,
                aspectRatio: `${img.width} / ${img.height}`,
                visibility: "hidden",
                // sem `will-change`: com dezenas de fotos ele so multiplica
                // camadas na GPU. O translate3d ja promove cada uma.
                backfaceVisibility: "hidden",
                // a foto nao influencia (nem sofre) layout de mais ninguem.
                // So `layout`: `paint` recortaria o halo e a sombra de baixo.
                contain: "layout",
              }}
            >
              <div className="rounded-img relative h-full w-full">
                {/* recorte da foto; as molduras ficam fora dele para que o
                    halo e a sombra possam vazar */}
                <div className="rounded-img absolute inset-0 overflow-hidden">
                {/* base: preto e branco, estatica */}
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes={sizes}
                  placeholder={img.blurDataURL ? "blur" : "empty"}
                  blurDataURL={img.blurDataURL}
                  priority={i < 4}
                  className="object-cover"
                  style={{ filter: "grayscale(1) contrast(1.05)" }}
                  draggable={false}
                />

                {/* mesma foto em cor: acende pela opacidade, sem repintura */}
                <div
                  ref={(el) => {
                    colorRefs.current[i] = el;
                  }}
                  aria-hidden
                  className="absolute inset-0"
                  style={{ opacity: 0 }}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes={sizes}
                    priority={i < 4}
                    className="object-cover"
                    style={{ filter: "contrast(1.05)" }}
                    draggable={false}
                  />
                </div>

                {/* trama de meio-tom por cima da foto, como nas artes.
                    Sem `mix-blend-mode`: misturar exige reler o fundo a cada
                    quadro, e o fundo aqui e um tunel em movimento. */}
                <div
                  aria-hidden
                  className="texture-halftone pointer-events-none absolute inset-0 opacity-[0.05]"
                />
                </div>

                {/* moldura de base, sempre visivel */}
                <div
                  aria-hidden
                  className="rounded-img pointer-events-none absolute inset-0"
                  style={{
                    border: "1px solid rgb(240 25 125 / 0.18)",
                    boxShadow: "0 18px 60px rgb(0 0 0 / 0.65)",
                  }}
                />

                {/* moldura pichada acesa: entra por opacidade */}
                <div
                  ref={(el) => {
                    glowRefs.current[i] = el;
                  }}
                  aria-hidden
                  className="rounded-img pointer-events-none absolute inset-0"
                  style={{
                    opacity: 0,
                    border: "1px solid rgb(240 25 125 / 0.73)",
                    boxShadow: "0 0 44px rgb(240 25 125 / 0.38)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

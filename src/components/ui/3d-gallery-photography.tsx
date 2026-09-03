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

/** API imperativa: quem controla a rolagem empurra o túnel por aqui. */
export type InfiniteGalleryHandle = {
  /** Avança (ou recua) o túnel em `delta` unidades e adia o auto-play. */
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

  const current = useRef(0);
  const target = useRef(0);
  const lastInput = useRef(0);

  const placements = useMemo(() => images.map((_, i) => placeImage(i)), [images]);

  const total = images.length * zSpacing;
  const windowDepth = Math.min(visibleCount * zSpacing, total);
  const fadeIn = Math.min(falloff.far, windowDepth * 0.9);
  const fadeOut = falloff.near;

  /** Posiciona todas as fotos para um dado avanço do túnel. */
  const layout = useCallback(
    (progress: number) => {
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

        if (opacity <= 0.001) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          continue;
        }

        const p = placements[i]!;
        // perto da câmera a foto ganha cor; ao fundo fica preto e branco
        const near = 1 - invLerp(0, windowDepth * 0.6, Math.max(d, 0));

        el.style.visibility = "visible";
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate3d(calc(${p.x}vw * var(--photo-spread)), calc(${p.y}vh * var(--photo-spread)), ${(-d * UNIT).toFixed(1)}px) rotate(${p.rot}deg)`;
        el.style.setProperty("--near", near.toFixed(3));
      }
    },
    [placements, zSpacing, total, windowDepth, fadeIn, fadeOut]
  );

  // primeiro frame síncrono: a galeria aparece já posicionada, sem esperar rAF
  useIsomorphicLayoutEffect(() => {
    layout(current.current);
  }, [layout]);

  /*
   * A galeria NÃO captura roda/toque: quem manda no túnel é a rolagem da
   * página (ScrollTrigger no hero chama `nudge`). Assim o scroll nativo —
   * e a inércia do mobile — continuam intactos.
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

  useEffect(() => {
    if (images.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lastInput.current = performance.now();

    /* ---------------- loop ---------------- */

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.05);

      if (!reduced && now - lastInput.current > idleDelay) {
        target.current += speed * dt;
      }

      current.current +=
        (target.current - current.current) * (1 - Math.exp(-DAMPING * dt));

      layout(current.current);
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
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
          return (
            <div
              key={img.src}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="absolute will-change-transform"
              style={{
                width: `calc(${p.w}vw * var(--photo-scale))`,
                minWidth: 128,
                aspectRatio: `${img.width} / ${img.height}`,
                visibility: "hidden",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              {/* moldura pichada: borda rosa + halo neon que acende de perto */}
              <div
                className="rounded-img relative h-full w-full overflow-hidden"
                style={{
                  border:
                    "1px solid rgb(240 25 125 / calc(0.18 + var(--near, 0) * 0.55))",
                  boxShadow:
                    "0 0 calc(var(--near, 0) * 44px) rgb(240 25 125 / calc(var(--near, 0) * 0.38)), 0 18px 60px rgb(0 0 0 / 0.65)",
                  filter: "grayscale(calc(1 - var(--near, 0) * 0.95)) contrast(1.05)",
                }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 60vw, 34vw"
                  placeholder={img.blurDataURL ? "blur" : "empty"}
                  blurDataURL={img.blurDataURL}
                  priority={i < 3}
                  className="object-cover"
                  draggable={false}
                />
                {/* trama de meio-tom por cima da foto, como nas artes */}
                <div
                  aria-hidden
                  className="texture-halftone pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

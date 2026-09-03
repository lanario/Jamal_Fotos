"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";

import type { GalleryImage } from "@/lib/types";
import { useIsomorphicLayoutEffect } from "@/lib/hooks";
import { isLowPowerDevice, watchActivity } from "@/lib/perf";
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

/**
 * Fotos que o HTML do servidor já traz. O cliente completa a fila conforme o
 * aparelho (ver `LIMIT`): assim o primeiro render é igual nos dois lados —
 * sem erro de hidratação — e nenhum celular baixa e decodifica o acervo
 * inteiro só para preencher um túnel que mostra uma dúzia de fotos por vez.
 */
const SSR_COUNT = 8;

/** Teto de fotos no DOM por tipo de aparelho. */
const LIMIT = { low: 14, full: Infinity };

/**
 * Degraus de `--near`. Cada mudança repinta a foto (o `grayscale()` do
 * `.tunnel-photo`), então o valor anda em passos em vez de a cada quadro —
 * o olho não vê a diferença, a GPU sente.
 */
const NEAR_STEPS = { low: 4, full: 10 };

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
  /** Último estado escrito em cada peça — evita reescrever o que não mudou. */
  const written = useRef<{ near: number; hidden: boolean }[]>([]);

  const current = useRef(0);
  const target = useRef(0);
  const lastInput = useRef(0);
  /** Multiplicador de `--photo-spread`, lido do CSS (muda por breakpoint). */
  const spread = useRef(1);

  /** Sobe de `SSR_COUNT` para o teto do aparelho logo após a hidratação. */
  const [mounted, setMounted] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    setLowPower(isLowPowerDevice());
    setMounted(true);
  }, []);

  const shown = useMemo(() => {
    if (!mounted) return images.slice(0, SSR_COUNT);
    const cap = lowPower ? LIMIT.low : LIMIT.full;
    return images.slice(0, Math.min(images.length, cap));
  }, [images, mounted, lowPower]);

  const placements = useMemo(() => shown.map((_, i) => placeImage(i)), [shown]);

  // menos fotos acesas ao mesmo tempo: cada uma é uma camada composta
  const depthWindow = lowPower ? Math.min(visibleCount, 7) : visibleCount;
  const nearSteps = lowPower ? NEAR_STEPS.low : NEAR_STEPS.full;

  const total = shown.length * zSpacing;
  const windowDepth = Math.min(depthWindow * zSpacing, total);
  const fadeIn = Math.min(falloff.far, windowDepth * 0.9);
  const fadeOut = falloff.near;

  /** Posiciona todas as fotos para um dado avanço do túnel. */
  const layout = useCallback(
    (progress: number) => {
      const spd = spread.current;

      for (let i = 0; i < placements.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;

        // `hidden: true` casa com o estado inicial do elemento (o style inline
        // do render) — começar em `false` faria o laço pular a primeira
        // liberação e o túnel ficaria invisível
        const state = (written.current[i] ??= { near: -1, hidden: true });

        // profundidade em unidades, embrulhada em [-fadeOut, total - fadeOut)
        const d = mod(i * zSpacing - progress + fadeOut, total) - fadeOut;

        const opacity =
          d > windowDepth
            ? 0
            : invLerp(windowDepth, windowDepth - fadeIn, d) *
              invLerp(-fadeOut, 0, d);

        if (opacity <= 0.001) {
          if (!state.hidden) {
            el.style.visibility = "hidden";
            state.hidden = true;
          }
          continue;
        }

        const p = placements[i]!;
        // perto da câmera a foto ganha cor; ao fundo fica preto e branco
        const near = 1 - invLerp(0, windowDepth * 0.6, Math.max(d, 0));

        if (state.hidden) {
          el.style.visibility = "visible";
          state.hidden = false;
        }

        el.style.opacity = opacity.toFixed(3);
        // o fator de `--photo-spread` entra já resolvido: um `calc()` com
        // `var()` no transform obrigaria o browser a reavaliar a variável
        // para cada foto, a cada quadro
        el.style.transform = `translate3d(${(p.x * spd).toFixed(2)}vw, ${(
          p.y * spd
        ).toFixed(2)}vh, ${(-d * UNIT).toFixed(1)}px) rotate(${p.rot}deg)`;

        // repinta só quando muda de degrau (ver NEAR_STEPS)
        const stepped = Math.round(near * nearSteps) / nearSteps;
        if (stepped !== state.near) {
          state.near = stepped;
          el.style.setProperty("--near", stepped.toFixed(3));
        }
      }
    },
    [placements, zSpacing, total, windowDepth, fadeIn, fadeOut, nearSteps]
  );

  /** Relê o `--photo-spread` do CSS (muda com o breakpoint). */
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const raw = getComputedStyle(root).getPropertyValue("--photo-spread");
    const value = Number.parseFloat(raw);
    spread.current = Number.isFinite(value) && value > 0 ? value : 1;
  }, []);

  // primeiro frame síncrono: a galeria aparece já posicionada, sem esperar rAF
  useIsomorphicLayoutEffect(() => {
    measure();
    layout(current.current);
  }, [layout, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure]);

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
    const root = rootRef.current;
    if (!root || shown.length === 0) return;

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

    /*
     * O laço só roda com o túnel na tela. Fora dela ele continuaria
     * recalculando dezenas de transforms por quadro enquanto a pessoa lê o
     * resto da página — no celular é exatamente essa disputa que trava a
     * rolagem depois do hero.
     */
    let running = false;

    const stop = watchActivity(root, (active) => {
      if (active === running) return;
      running = active;

      if (active) {
        // sem o "pulo" acumulado do tempo parado
        lastInput.current = performance.now();
        gsap.ticker.add(tick);
      } else {
        gsap.ticker.remove(tick);
      }
    });

    return () => {
      stop();
      gsap.ticker.remove(tick);
    };
  }, [shown.length, speed, idleDelay, layout]);

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
        {shown.map((img, i) => {
          const p = placements[i]!;
          return (
            <div
              key={img.src}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              // sem `will-change`: o `translate3d` do laço já promove a camada,
              // e a dica permanente multiplicaria as texturas na GPU
              className="absolute"
              style={{
                width: `calc(${p.w}vw * var(--photo-scale))`,
                minWidth: 128,
                aspectRatio: `${img.width} / ${img.height}`,
                visibility: "hidden",
                backfaceVisibility: "hidden",
              }}
            >
              {/* moldura pichada: borda rosa + halo neon que acende de perto
                  (as três propriedades ligadas a `--near` estão no CSS, para
                  o modo econômico do celular poder desligá-las) */}
              <div className="tunnel-photo rounded-img relative h-full w-full overflow-hidden">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 60vw, 34vw"
                  placeholder={img.blurDataURL ? "blur" : "empty"}
                  blurDataURL={img.blurDataURL}
                  priority={i < 3}
                  loading={i < 3 ? undefined : "lazy"}
                  className="object-cover"
                  draggable={false}
                />
                {/* trama de meio-tom por cima da foto, como nas artes */}
                <div
                  aria-hidden
                  className="texture-halftone halftone-photo pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

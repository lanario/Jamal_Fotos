"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn, clamp, seeded } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/**
 * Texturas de spray — respingos, escorridos e traço.
 *
 * O desenho continua determinístico (`seeded`) para o HTML do servidor bater
 * com o do cliente. O movimento entra só depois da hidratação:
 *
 * - Framer Motion (`useScroll` + `useSpring`) faz o parallax de profundidade;
 * - GSAP + ScrollTrigger cuidam da física: a tinta escorre, engorda a gota,
 *   às vezes solta um pingo, treme e depois retorna pro topo.
 *
 * Sem JS (ou com `prefers-reduced-motion`), tudo fica no estado estático de
 * sempre — os valores inline do render são o próprio fallback.
 */

const r3 = (n: number) => Number(n.toFixed(3));

const NO_MOTION = "(prefers-reduced-motion: no-preference)";

/**
 * Só há cursor de verdade em ponteiro fino. No celular os handlers de
 * `pointermove` disparariam a cada toque de rolagem sem nada para mostrar —
 * puro custo.
 */
const hasCursor = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * Retângulo do elemento em cache. `getBoundingClientRect()` dentro de um
 * `pointermove` força o navegador a recalcular layout no meio do quadro —
 * com o mouse andando, é dezenas de recálculos por segundo. Aqui a medida é
 * refeita só quando pode ter mudado (rolagem, resize) e sempre no início do
 * quadro seguinte.
 */
function useCachedRect(ref: React.RefObject<HTMLElement | null>) {
  const rect = useRef<DOMRect | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let queued = false;
    const refresh = () => {
      queued = false;
      rect.current = el.getBoundingClientRect();
    };
    const invalidate = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(refresh);
    };

    refresh();
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate);
    const ro = new ResizeObserver(invalidate);
    ro.observe(el);

    return () => {
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      ro.disconnect();
    };
  }, [ref]);

  return rect;
}

/**
 * Parallax vertical ligado à rolagem da página.
 * Mola no meio para a camada "arrastar" um pouco em vez de grudar no scroll.
 */
function useScrollParallax(distance: number) {
  const { scrollY } = useScroll();
  const raw = useTransform(scrollY, [0, 1200], [0, distance], { clamp: false });
  return useSpring(raw, { stiffness: 38, damping: 18, mass: 0.6 });
}

/* ------------------------------------------------------------------ */
/* Respingos                                                           */
/* ------------------------------------------------------------------ */

type SplatterProps = {
  /** Muda a semente para variar o desenho entre instâncias. */
  seed?: number;
  /** Quantidade de gotas. */
  count?: number;
  /** Concentração: 0 = espalhado, 1 = grudado na origem. */
  density?: number;
  /** Profundidade aparente: quanto maior, mais a nuvem viaja no parallax. */
  depth?: number;
  /** A nuvem acompanha o cursor de leve. */
  interactive?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

/** Nuvem de respingos, como o spray nos cantos das artes. */
export function Splatter({
  seed = 0,
  count = 140,
  density = 0.6,
  depth = 1,
  interactive = true,
  className,
  ...rest
}: SplatterProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const driftRefs = useRef<(SVGGElement | null)[]>([]);
  const cursorRefs = useRef<(SVGGElement | null)[]>([]);
  const y = useScrollParallax(-46 * depth);
  const rect = useCachedRect(hostRef);

  // três planos de profundidade: as gotas graúdas ficam na frente
  const layers = useMemo(() => {
    const groups: {
      cx: number;
      cy: number;
      r: number;
      o: number;
      dur: number;
      delay: number;
      pulse: boolean;
    }[][] = [[], [], []];

    for (let i = 0; i < count; i++) {
      const a = seeded(i, seed + 1) * Math.PI * 2;
      // raio com viés para o centro: agrupa perto da origem e rareia longe
      const rad = Math.pow(seeded(i, seed + 2), 1 + density * 2) * 100;
      // maioria minúscula (poeira de spray), poucas gotas graúdas
      const r = 0.12 + Math.pow(seeded(i, seed + 3), 4) * 1.5;
      const layer = r > 0.85 ? 2 : r > 0.38 ? 1 : 0;
      groups[layer].push({
        cx: r3(50 + Math.cos(a) * rad * 0.95),
        cy: r3(50 + Math.sin(a) * rad * 0.95),
        r: r3(r),
        o: r3(0.12 + seeded(i, seed + 4) * 0.7),
        dur: r3(4 + seeded(i, seed + 9) * 7),
        // atraso negativo: cada gota já entra num ponto diferente do ciclo
        delay: r3(seeded(i, seed + 10) * -9),
        // só o plano da frente pulsa: a poeira de trás fica estática, senão
        // seriam centenas de animações de SVG rodando ao mesmo tempo
        pulse: layer === 2,
      });
    }

    return groups;
  }, [count, density, seed]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const mm = gsap.matchMedia();

    mm.add(NO_MOTION, () => {
      // 1. respiração: cada plano vagueia devagar, em ritmo próprio
      driftRefs.current.forEach((g, i) => {
        if (!g) return;
        const amp = 0.9 + i * 0.8;
        gsap.to(g, {
          x: `random(${-amp}, ${amp})`,
          y: `random(${-amp}, ${amp})`,
          duration: `random(${7 - i}, ${13 - i})`,
          ease: "sine.inOut",
          repeat: -1,
          repeatRefresh: true,
          yoyo: true,
          delay: i * 0.7,
        });
      });

      // 2. o cursor empurra os planos — o da frente reage mais
      let move: ((e: PointerEvent) => void) | null = null;

      if (interactive && hasCursor()) {
        const setters = cursorRefs.current.map((g, i) =>
          g
            ? {
                x: gsap.quickTo(g, "x", { duration: 0.9, ease: "power3.out" }),
                y: gsap.quickTo(g, "y", { duration: 0.9, ease: "power3.out" }),
                k: 1.4 + i * 1.9,
              }
            : null
        );

        move = (e: PointerEvent) => {
          const box = rect.current;
          if (!box || !box.width || !box.height) return;
          const nx = clamp(
            (e.clientX - (box.left + box.width / 2)) / (box.width / 2),
            -1.6,
            1.6
          );
          const ny = clamp(
            (e.clientY - (box.top + box.height / 2)) / (box.height / 2),
            -1.6,
            1.6
          );
          setters.forEach((s) => {
            if (!s) return;
            s.x(nx * s.k);
            s.y(ny * s.k);
          });
        };

        window.addEventListener("pointermove", move, { passive: true });
      }

      return () => {
        if (move) window.removeEventListener("pointermove", move);
      };
    });

    return () => mm.revert();
  }, [interactive, rect]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      {...rest}
    >
      <motion.div style={{ y }} className="h-full w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full overflow-visible"
        >
          {layers.map((dots, li) => (
            // dois <g>: um para a deriva, outro para o cursor — o GSAP não
            // anima duas fontes de transform no mesmo elemento
            <g
              key={li}
              ref={(el) => {
                driftRefs.current[li] = el;
              }}
            >
              <g
                ref={(el) => {
                  cursorRefs.current[li] = el;
                }}
              >
                {dots.map((d, i) => (
                  <circle
                    key={i}
                    cx={d.cx}
                    cy={d.cy}
                    r={d.r}
                    fill="var(--color-pink-500)"
                    opacity={d.o}
                    className={d.pulse ? "spray-dot" : undefined}
                    style={
                      d.pulse
                        ? ({
                            "--dot-o": d.o,
                            "--dot-dur": `${d.dur}s`,
                            "--dot-delay": `${d.delay}s`,
                          } as React.CSSProperties)
                        : undefined
                    }
                  />
                ))}
              </g>
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Escorridos                                                          */
/* ------------------------------------------------------------------ */

type DripsProps = {
  seed?: number;
  count?: number;
  /** Altura máxima do escorrido, em px. */
  maxLength?: number;
  /** Multiplica a velocidade de todo o ciclo. */
  speed?: number;
  /** Profundidade aparente no parallax. */
  depth?: number;
  /** Reage ao cursor e à velocidade da rolagem. */
  interactive?: boolean;
  className?: string;
};

/** Estado por escorrido — o GSAP escreve aqui, o loop de render lê. */
type DripState = {
  /** 0 = recolhido, 1 = comprimento total do ciclo. */
  p: number;
  /** Escala da gota da ponta. */
  bead: number;
  /** Queda do pingo desprendido, em px abaixo da ponta. */
  dropY: number;
  dropA: number;
  /** Comprimento do ciclo atual, em px. */
  h: number;
};

/**
 * Tinta escorrendo da borda superior. Em HTML (não SVG) para a espessura
 * ficar em px de verdade — um SVG esticado engrossaria os filetes.
 *
 * O ciclo imita tinta de verdade: acumula na borda, cede devagar (a tensão
 * superficial ainda segura), dispara, freia ao afinar, treme pendurada, às
 * vezes solta um pingo — e então retorna pro topo. Rolar a página estica os
 * filetes na proporção da velocidade; o cursor apressa quem passa por perto.
 */
export function Drips({
  seed = 0,
  count = 9,
  maxLength = 180,
  speed = 1,
  depth = 0.6,
  interactive = true,
  className,
}: DripsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const beadRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dropRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const y = useScrollParallax(-26 * depth);
  const rect = useCachedRect(hostRef);

  const drips = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const left = ((i + 0.5) / count) * 100 + (seeded(i, seed + 5) - 0.5) * 9;
        return {
          left: r3(left),
          /** comprimento do render estático — é também o fallback sem JS */
          height: r3(14 + seeded(i, seed + 6) * maxLength),
          width: r3(1 + seeded(i, seed + 7) * 1.6),
          opacity: r3(0.25 + seeded(i, seed + 8) * 0.45),
          delay: r3(seeded(i, seed + 15) * 3.5),
        };
      }),
    [count, maxLength, seed]
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const mm = gsap.matchMedia();

    mm.add(NO_MOTION, () => {
      const states: DripState[] = drips.map((d) => ({
        p: d.height / maxLength,
        bead: 1,
        dropY: 0,
        dropA: 0,
        h: maxLength,
      }));

      /** Esticão momentâneo dado pela velocidade da rolagem. */
      const scroll = { boost: 0 };
      /** Enquanto os filetes estão fora da tela, o laço não escreve nada. */
      let visible = true;
      /** Último valor escrito por elemento — evita repetir o mesmo estilo. */
      const last = states.map(() => ({ t: "", b: "", d: "", a: "" }));

      // um único rAF escreve todos os transforms: nada de layout por quadro
      const render = (_t: number, deltaTime: number) => {
        if (!visible || document.hidden) return;

        // decaimento por tempo, não por quadro — a 120 Hz cairia em metade
        // do tempo se fosse um fator fixo por tick
        scroll.boost *= Math.pow(0.93, deltaTime / 16.667);
        const stretch = 1 + scroll.boost;

        for (let i = 0; i < states.length; i++) {
          const s = states[i];
          const len = s.h * s.p * stretch;
          const trail = trailRefs.current[i];
          const bead = beadRefs.current[i];
          const drop = dropRefs.current[i];
          const seen = last[i];

          if (trail) {
            // afina conforme estica: a tinta se esgota no caminho
            const t = `scaleY(${r3(len / maxLength)}) scaleX(${r3(
              1 - 0.32 * s.p
            )})`;
            if (t !== seen.t) {
              trail.style.transform = t;
              seen.t = t;
            }
          }
          if (bead) {
            const t = `translate3d(-50%, ${r3(len)}px, 0) scale(${r3(s.bead)})`;
            if (t !== seen.b) {
              bead.style.transform = t;
              seen.b = t;
            }
          }
          if (drop) {
            const t = `translate3d(-50%, ${r3(len + s.dropY)}px, 0)`;
            if (t !== seen.d) {
              drop.style.transform = t;
              seen.d = t;
            }
            const a = `${r3(s.dropA)}`;
            if (a !== seen.a) {
              drop.style.opacity = a;
              seen.a = a;
            }
          }
        }
      };

      gsap.ticker.add(render);

      // fora da tela nem o laço nem as timelines precisam correr
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { rootMargin: "15% 0px" }
      );
      io.observe(host);

      // ciclo de vida de cada escorrido
      const timelines = states.map((s, i) => {
        const tl = gsap.timeline({
          repeat: -1,
          // re-sorteia as durações "random(a, b)" a cada volta
          repeatRefresh: true,
          delay: drips[i].delay,
        });

        tl
          // 1. retorna pro topo (na 1ª volta, desfaz o estado estático)
          .to(s, { p: 0, bead: 0, duration: 1.1, ease: "power2.inOut" })
          .to({}, { duration: "random(0.4, 2.6)" })
          // 2. sorteia o comprimento desta passada
          .call(() => {
            s.h = gsap.utils.random(maxLength * 0.42, maxLength);
            s.dropA = 0;
            s.dropY = 0;
          })
          // 3. a tinta acumula na borda antes de ceder
          .to(s, { bead: 0.85, duration: 0.45, ease: "back.out(2.2)" })
          // 4. o começo lento — a tensão superficial ainda segura
          .to(s, { p: 0.18, duration: "random(0.7, 1.4)", ease: "power1.in" })
          // 5. a corrida: dispara e freia ao afinar
          .to(s, { p: 1, duration: "random(1.1, 2.2)", ease: "power3.out" })
          .to(s, { bead: 1.3, duration: 0.8, ease: "sine.out" }, "<")
          // 6. às vezes o peso vence e um pingo se solta
          .call(() => {
            if (Math.random() > 0.45) return;
            gsap.fromTo(
              s,
              { dropY: 0, dropA: 0.85 },
              {
                dropY: gsap.utils.random(70, 190),
                dropA: 0,
                duration: gsap.utils.random(0.5, 0.95),
                ease: "power2.in",
              }
            );
            gsap.to(s, { bead: 0.95, duration: 0.35, ease: "power2.out" });
          })
          // 7. pendurada, tremendo de leve
          .to(s, {
            bead: "+=0.14",
            duration: 0.7,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1,
          })
          .to({}, { duration: "random(0.6, 3)" });

        tl.timeScale(speed);
        return tl;
      });

      // a rolagem estica os filetes na proporção da velocidade
      const st = ScrollTrigger.create({
        trigger: host,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = Math.min(Math.abs(self.getVelocity()) / 1800, 1);
          scroll.boost = Math.max(scroll.boost, v * 0.7);
        },
      });

      // o cursor apressa quem passa por perto
      let move: ((e: PointerEvent) => void) | null = null;

      if (interactive && hasCursor()) {
        const nudged = states.map(() => false);

        move = (e: PointerEvent) => {
          const box = rect.current;
          if (!box || !box.width) return;
          const x = e.clientX - box.left;
          // vale também um pouco acima e bem abaixo: o filete é comprido
          const near =
            e.clientY > box.top - box.height &&
            e.clientY < box.top + box.height * 2.4;

          drips.forEach((d, i) => {
            const hot = near && Math.abs((d.left / 100) * box.width - x) < 110;
            if (hot === nudged[i]) return;
            nudged[i] = hot;
            gsap.to(timelines[i], {
              timeScale: speed * (hot ? 2.6 : 1),
              duration: 0.5,
              overwrite: true,
            });
          });
        };

        window.addEventListener("pointermove", move, { passive: true });
      }

      return () => {
        gsap.ticker.remove(render);
        io.disconnect();
        timelines.forEach((tl) => tl.kill());
        st.kill();
        if (move) window.removeEventListener("pointermove", move);
      };
    });

    return () => mm.revert();
  }, [drips, interactive, maxLength, speed, rect]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
    >
      <motion.div style={{ y }} className="absolute inset-0">
        {drips.map((d, i) => (
          <span
            key={i}
            className="absolute top-0 block"
            style={{
              left: `${d.left}%`,
              width: d.width,
              opacity: d.opacity,
            }}
          >
            {/* o filete: altura fixa, comprimento pelo scaleY */}
            <span
              ref={(el) => {
                trailRefs.current[i] = el;
              }}
              className="block w-full origin-top will-change-transform"
              style={{
                height: maxLength,
                borderRadius: "0 0 999px 999px",
                background:
                  "linear-gradient(to bottom, rgb(201 16 106 / 0.95), rgb(240 25 125) 45%, rgb(255 46 147))",
                boxShadow: "0 0 6px rgb(240 25 125 / 0.6)",
                transform: `scaleY(${r3(d.height / maxLength)}) scaleX(1)`,
              }}
            />
            {/* a gota que se forma na ponta */}
            <span
              ref={(el) => {
                beadRefs.current[i] = el;
              }}
              // sem will-change: o translate3d já promove a camada
              className="absolute top-0 left-1/2 block rounded-full"
              style={{
                width: d.width * 2.6,
                height: d.width * 3.1,
                marginTop: -d.width * 1.8,
                background:
                  "radial-gradient(circle at 34% 28%, rgb(255 158 208), var(--color-pink-500) 62%, var(--color-pink-600))",
                boxShadow: "0 0 8px rgb(240 25 125 / 0.65)",
                transform: `translate3d(-50%, ${d.height}px, 0) scale(1)`,
              }}
            />
            {/* o pingo que se desprende e cai */}
            <span
              ref={(el) => {
                dropRefs.current[i] = el;
              }}
              // sem will-change: o translate3d já promove a camada
              className="absolute top-0 left-1/2 block rounded-full"
              style={{
                width: d.width * 2.1,
                height: d.width * 2.6,
                opacity: 0,
                background:
                  "radial-gradient(circle at 34% 28%, rgb(255 158 208), var(--color-pink-500) 65%, var(--color-pink-600))",
                transform: `translate3d(-50%, ${d.height}px, 0)`,
              }}
            />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Traço                                                               */
/* ------------------------------------------------------------------ */

/** Traço de spray — substitui o `<hr>` entre blocos. */
export function SprayStroke({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const specksRef = useRef<SVGGElement>(null);

  const specks = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        cx: r3(seeded(i, 11) * 200),
        cy: r3(1 + seeded(i, 12) * 10),
        r: r3(0.25 + seeded(i, 13) * 0.9),
        o: r3(0.2 + seeded(i, 14) * 0.5),
      })),
    []
  );

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const mm = gsap.matchMedia();

    mm.add(NO_MOTION, () => {
      // o traço se desenha ao entrar na tela, como se fosse pintado agora
      const len = path.getTotalLength();

      gsap.fromTo(
        path,
        { strokeDasharray: len, strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: { trigger: svgRef.current, start: "top 94%" },
          // solta o dash no fim: preso, ele quebraria se o SVG mudasse de escala
          onComplete: () => {
            path.style.strokeDasharray = "";
            path.style.strokeDashoffset = "";
          },
        }
      );

      gsap.from(specksRef.current, {
        opacity: 0,
        scale: 0.7,
        transformOrigin: "center",
        duration: 0.8,
        delay: 0.35,
        ease: "power2.out",
        scrollTrigger: { trigger: svgRef.current, start: "top 94%" },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("pointer-events-none", className)}
    >
      <defs>
        <linearGradient id="jml-spray-stroke" x1="0" x2="1">
          <stop offset="0" stopColor="var(--color-pink-500)" stopOpacity="0" />
          <stop offset="0.3" stopColor="var(--color-pink-400)" stopOpacity="0.95" />
          <stop offset="0.72" stopColor="var(--color-pink-500)" stopOpacity="0.85" />
          <stop offset="1" stopColor="var(--color-violet-500)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d="M2 7 C 40 3, 70 10, 104 5 S 168 4, 198 6"
        stroke="url(#jml-spray-stroke)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      <g ref={specksRef}>
        {specks.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="var(--color-pink-500)"
            opacity={s.o}
          />
        ))}
      </g>
    </svg>
  );
}

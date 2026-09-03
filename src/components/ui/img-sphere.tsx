"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

import { prefersReducedMotion, watchActivity } from "@/lib/perf";
import { cn, clamp } from "@/lib/utils";

/**
 * Esfera de imagens: as peças são distribuídas numa esfera de Fibonacci e
 * projetadas em 2D a cada quadro. Não usamos `transform-style: preserve-3d`
 * de propósito — as fotos precisam ficar sempre de frente para quem olha, e
 * a projeção manual também dá controle sobre profundidade e ordem de pilha.
 *
 * O laço mexe só em `transform`, `opacity` e `zIndex`, direto no DOM: com
 * ~50 peças, re-renderizar o React a 60fps seria desperdício.
 */

export type ImageData = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  blurDataURL?: string;
  /** Agrupa peças do mesmo evento, para realçar todas juntas. */
  groupId?: string;
};

export type SphereImageGridProps = {
  images: ImageData[];
  /** Lado máximo do palco, em px. Encolhe sozinho em telas estreitas. */
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  /** Distância focal da projeção (não é a `perspective` do CSS). */
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  /** Slug do evento em foco: as outras peças apagam. */
  activeGroup?: string | null;
  onHoverImage?: (image: ImageData | null) => void;
  onSelectImage?: (image: ImageData) => void;
  className?: string;
};

export default function SphereImageGrid({
  images,
  containerSize = 600,
  sphereRadius = 200,
  dragSensitivity = 0.8,
  momentumDecay = 0.96,
  maxRotationSpeed = 6,
  baseImageScale = 0.15,
  hoverScale = 1.3,
  perspective = 1000,
  autoRotate = true,
  autoRotateSpeed = 0.2,
  activeGroup = null,
  onHoverImage,
  onSelectImage,
  className,
}: SphereImageGridProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<(HTMLButtonElement | null)[]>([]);
  const labelRef = useRef<HTMLDivElement>(null);
  /** Último `z-index`/`opacity` escrito em cada peça. */
  const written = useRef<{ z: number; o: string }[]>([]);

  const rotation = useRef({ x: -0.12, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const dragDelta = useRef(0);
  const hovered = useRef<number | null>(null);
  const activeRef = useRef<string | null>(activeGroup);
  /** 0 → 1 durante a entrada; multiplica a opacidade das peças. */
  const intro = useRef({ v: 0 });

  // o palco encolhe junto com a coluna — 600px não cabe num celular
  const [size, setSize] = useState(containerSize);
  /* só o texto do rótulo passa pelo React; a posição dele é do laço */
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  useEffect(() => {
    activeRef.current = activeGroup;

    // a moldura entra por classe, e não pelo laço: `activeGroup` muda a cada
    // hover, não a cada quadro — escrever o box-shadow 60×/s seria desperdício
    tilesRef.current.forEach((el, i) => {
      if (!el) return;
      el.classList.toggle(
        "is-active",
        Boolean(activeGroup) && images[i]?.groupId === activeGroup
      );
    });
  }, [activeGroup, images]);

  useEffect(() => {
    const stage = hostRef.current;
    if (!stage) return;

    const measure = () => {
      const available = stage.getBoundingClientRect().width;
      setSize(Math.max(220, Math.min(containerSize, available)));
    };

    measure();

    // ResizeObserver pega mudanças de layout que não passam pela janela;
    // o listener de resize é a rede de segurança para quando a entrega do
    // observer atrasa (ela é amarrada ao ciclo de quadros).
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerSize]);

  // pontos na esfera pela sequência de Fibonacci: espaçamento uniforme
  const points = useMemo(() => {
    const n = images.length;
    const golden = Math.PI * (3 - Math.sqrt(5));

    return images.map((_, i) => {
      const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      return { x: Math.cos(theta) * ring, y, z: Math.sin(theta) * ring };
    });
  }, [images]);

  const ratio = size / containerSize;
  const radius = sphereRadius * ratio;
  // bolhas: redondas e um pouco maiores em tela estreita, senão viram selos
  const tileSize = size * baseImageScale * (size < 480 ? 1.2 : 1);

  useEffect(() => {
    const reduce = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();

    // entrada: as peças surgem em vez de aparecerem prontas
    const tween = reduce
      ? gsap.set(intro.current, { v: 1 })
      : gsap.to(intro.current, { v: 1, duration: 1.1, ease: "power2.out" });

    const frame = () => {
      const now = performance.now();
      // em "quadros de 60fps", para a velocidade não depender do monitor
      const dt = Math.min(4, (now - last) / 16.667);
      last = now;

      const rot = rotation.current;
      const vel = velocity.current;

      if (!dragging.current) {
        rot.y += vel.y * dt;
        rot.x += vel.x * dt;
        vel.x *= Math.pow(momentumDecay, dt);
        vel.y *= Math.pow(momentumDecay, dt);

        if (autoRotate && !reduce) rot.y += autoRotateSpeed * 0.009 * dt;
      }

      // trava a inclinação antes de virar de cabeça para baixo
      rot.x = clamp(rot.x, -1.1, 1.1);

      const cosY = Math.cos(rot.y);
      const sinY = Math.sin(rot.y);
      const cosX = Math.cos(rot.x);
      const sinX = Math.sin(rot.x);
      const fade = intro.current.v;
      const active = activeRef.current;

      for (let i = 0; i < points.length; i++) {
        const el = tilesRef.current[i];
        if (!el) continue;

        const p = points[i];

        const x1 = p.x * cosY + p.z * sinY;
        const z1 = p.z * cosY - p.x * sinY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const depth = z2 * radius;
        const proj = perspective / (perspective - depth);
        const isHovered = hovered.current === i;
        const scale = proj * (isHovered ? hoverScale : 1);

        // apagar demais deixaria a esfera oca: 45% ainda lê como fundo
        const dimmed = Boolean(active) && images[i].groupId !== active;
        const byDepth = 0.32 + 0.68 * ((z2 + 1) / 2);

        const px = x1 * radius * proj;
        const py = y2 * radius * proj;

        const state = (written.current[i] ??= { z: NaN, o: "" });

        el.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(
          2
        )}px, 0) scale(${scale.toFixed(4)})`;

        // z-index e opacity mudam devagar perto dos polos: reescrever o mesmo
        // valor invalida o estilo da peça à toa
        const z = 1000 + Math.round(depth);
        if (z !== state.z) {
          state.z = z;
          el.style.zIndex = String(z);
        }

        const o = (
          (dimmed ? byDepth * 0.45 : isHovered ? 1 : byDepth) * fade
        ).toFixed(3);
        if (o !== state.o) {
          state.o = o;
          el.style.opacity = o;
        }

        // o rótulo é um elemento só, que segue a bolha apontada. Se fosse um
        // por bolha, herdaria o `scale()` dela e o texto sairia deformado.
        if (isHovered && labelRef.current) {
          labelRef.current.style.transform = `translate3d(${px}px, ${
            py + (tileSize / 2) * scale + 12
          }px, 0) translateX(-50%)`;
          labelRef.current.style.zIndex = String(2000);
        }
      }

      if (labelRef.current) {
        labelRef.current.style.opacity = hovered.current === null ? "0" : "1";
      }

      raf = requestAnimationFrame(frame);
    };

    /*
     * A esfera vive numa página inteira de rolagem: sem esta trava, o laço
     * seguia projetando as peças quadro a quadro enquanto a pessoa lia o
     * rodapé — e disputando tempo com a rolagem no celular.
     */
    const host = hostRef.current;
    if (!host) return () => tween.kill();

    const stop = watchActivity(host, (active) => {
      if (active) {
        if (!raf) {
          // sem o salto do tempo parado na primeira volta
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
        tween.resume();
        return;
      }

      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      tween.pause();
    });

    return () => {
      stop();
      cancelAnimationFrame(raf);
      tween.kill();
    };
  }, [
    points,
    images,
    radius,
    tileSize,
    perspective,
    hoverScale,
    momentumDecay,
    autoRotate,
    autoRotateSpeed,
  ]);

  const startDrag = (e: React.PointerEvent) => {
    dragging.current = true;
    dragDelta.current = 0;
    pointer.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return;

    const dx = e.clientX - pointer.current.x;
    const dy = e.clientY - pointer.current.y;
    dragDelta.current += Math.abs(dx) + Math.abs(dy);
    pointer.current = { x: e.clientX, y: e.clientY };

    const step = dragSensitivity * 0.006;
    const maxSpeed = maxRotationSpeed * 0.01;

    rotation.current.y += dx * step;
    rotation.current.x -= dy * step;

    // guarda o embalo para continuar girando quando soltar
    velocity.current = {
      x: clamp(-dy * step, -maxSpeed, maxSpeed),
      y: clamp(dx * step, -maxSpeed, maxSpeed),
    };
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    // Se o deslocamento total foi pequeno, é um clique real — abre a galeria.
    // O onClick nos botões filhos não dispara de forma confiável porque o pai
    // capturou o pointer (setPointerCapture). Por isso resolvemos aqui.
    if (dragDelta.current < 6 && hovered.current !== null) {
      const image = images[hovered.current];
      if (image) onSelectImage?.(image);
    }
  };

  return (
    <div
      ref={hostRef}
      className={cn(
        // `isolate` é obrigatório: o laço dá z-index de 1000+ às bolhas para
        // ordená-las por profundidade e, sem um contexto de empilhamento
        // próprio, esses valores competem na raiz e passam por cima de
        // qualquer modal.
        "relative isolate mx-auto aspect-square w-full cursor-grab touch-pan-y select-none active:cursor-grabbing",
        className
      )}
      style={{ maxWidth: containerSize }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      /*
        A esfera é decorativa para leitores de tela: a mesma informação está
        na lista de campeonatos ao lado, que é navegável por teclado e abre
        as mesmas galerias.
      */
      aria-hidden
    >
      <div ref={stageRef} className="absolute top-1/2 left-1/2 h-0 w-0">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            tabIndex={-1}
            ref={(el) => {
              tilesRef.current[i] = el;
            }}
            onPointerEnter={() => {
              hovered.current = i;
              setHoveredLabel(image.title);
              onHoverImage?.(image);
            }}
            onPointerLeave={() => {
              if (hovered.current === i) hovered.current = null;
              onHoverImage?.(null);
            }}
            // onClick não dispara de forma confiável quando o pai usa
            // setPointerCapture; o clique real é tratado no endDrag do pai.
            onClick={(e) => e.stopPropagation()}
            className="sphere-tile"
            style={{
              width: tileSize,
              height: tileSize,
              marginLeft: -tileSize / 2,
              marginTop: -tileSize / 2,
            }}
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="180px"
              placeholder={image.blurDataURL ? "blur" : "empty"}
              blurDataURL={image.blurDataURL}
              className="object-cover"
              draggable={false}
            />
          </button>
        ))}

        {/* rótulo único, posicionado pelo laço sobre a bolha apontada */}
        <div
          ref={labelRef}
          className="pointer-events-none absolute whitespace-nowrap opacity-0 transition-opacity duration-200"
        >
          <span className="font-num rounded-[6px] border border-pink-500/40 bg-ink-900/90 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-white uppercase backdrop-blur-sm">
            {hoveredLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";

import type { GalleryImage } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Pilha de fotos arrastáveis (base: image-stack do 21st.dev), trazida para o
 * sistema: carta escura com moldura rosa e raio de 2px — é cartaz, não app.
 *
 * O original só responde a arrasto, o que deixa a galeria inacessível por
 * teclado; aqui os botões de avançar/voltar fazem a mesma coisa e o arrasto
 * vira o atalho para quem usa o mouse ou o dedo.
 */

type ImgStackProps = {
  images: GalleryImage[];
  /** Rótulo lido junto de cada carta. */
  eventName: string;
  className?: string;
};

const MIN_DRAG = 50;

export default function ImgStack({
  images,
  eventName,
  className,
}: ImgStackProps) {
  const [order, setOrder] = useState(() => images.map((_, i) => i));
  const [animating, setAnimating] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  /** Manda a carta do topo para o fim da pilha. */
  const advance = useCallback(() => {
    setOrder((prev) => {
      const next = [...prev];
      next.push(next.shift()!);
      return next;
    });
  }, []);

  const rewind = useCallback(() => {
    setOrder((prev) => {
      const next = [...prev];
      next.unshift(next.pop()!);
      return next;
    });
  }, []);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (animating) return;

    const distance = Math.hypot(
      info.point.x - dragStart.current.x,
      info.point.y - dragStart.current.y
    );

    // arrasto curto: o Motion devolve a carta ao lugar sozinho
    if (distance < MIN_DRAG) return;

    setAnimating(true);
    advance();
    window.setTimeout(() => setAnimating(false), 300);
  };

  const top = order[0];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/*
        As cartas de trás saem para a esquerda (deslocamento + tombo), então a
        pilha inteira anda um pouco para a direita: sem isso o leque encosta na
        borda da tela no celular e parece corte, não composição.
      */}
      <div
        className="relative flex aspect-[5/7] w-[min(62vw,17rem)] items-center justify-center"
        style={{ marginLeft: (images.length - 1) * 8 }}
      >
        {order.map((imageIndex, position) => {
          const image = images[imageIndex];
          const isTop = position === 0;

          return (
            <motion.div
              key={imageIndex}
              className="absolute w-full origin-bottom overflow-hidden border border-pink-500/30 bg-ink-800"
              style={{
                zIndex: images.length - position,
                aspectRatio: "5 / 7",
                borderRadius: "var(--radius-img)",
                boxShadow: isTop
                  ? "0 0 40px rgb(240 25 125 / 0.18), 0 24px 60px rgb(0 0 0 / 0.7)"
                  : "0 16px 40px rgb(0 0 0 / 0.6)",
              }}
              animate={{
                x: position * -12,
                y: position * -8,
                // a de cima fica reta; as de trás vão tombando
                rotate: position === 0 ? 0 : -(2 + position * 3),
                scale: 1,
              }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.3, 1] }}
              drag={isTop && !animating}
              dragElastic={0.2}
              dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
              dragSnapToOrigin
              dragTransition={{ bounceStiffness: 600, bounceDamping: 18 }}
              onDragStart={(_, info) => {
                dragStart.current = { x: info.point.x, y: info.point.y };
              }}
              onDragEnd={handleDragEnd}
              whileHover={isTop ? { scale: 1.03 } : undefined}
              whileDrag={{
                scale: 1.06,
                rotate: 0,
                zIndex: 100,
                transition: { duration: 0.1 },
              }}
            >
              <Image
                src={image.src}
                alt={`${eventName} — foto ${imageIndex + 1} de ${images.length}`}
                fill
                sizes="(max-width: 640px) 64vw, 272px"
                placeholder={image.blurDataURL ? "blur" : "empty"}
                blurDataURL={image.blurDataURL}
                className={cn(
                  "pointer-events-none object-cover",
                  isTop ? "cursor-grab active:cursor-grabbing" : ""
                )}
                draggable={false}
                priority={isTop}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="mt-7 flex items-center gap-5">
        <StackButton label="Foto anterior" onClick={rewind} direction="prev" />

        <p
          aria-live="polite"
          className="font-num min-w-[4.5rem] text-center text-[11px] font-semibold tracking-[0.24em] text-ash-400 uppercase"
        >
          {String(top + 1).padStart(2, "0")}
          <span className="text-ash-600"> / </span>
          {String(images.length).padStart(2, "0")}
        </p>

        <StackButton label="Próxima foto" onClick={advance} direction="next" />
      </div>
    </div>
  );
}

function StackButton({
  label,
  onClick,
  direction,
}: {
  label: string;
  onClick: () => void;
  direction: "prev" | "next";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-ink-600 bg-ink-800 text-ash-400 transition-colors duration-200 hover:border-pink-500 hover:text-pink-400"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <path
          d={direction === "prev" ? "M20 12H5m0 0 6-6m-6 6 6 6" : "M4 12h15m0 0-6-6m6 6-6 6"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

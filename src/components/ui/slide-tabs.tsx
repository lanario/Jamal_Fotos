"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Abas com "cursor" deslizante (padrão Uiverse/SlideTabs), reescrito em TS e
 * trazido para o design system: trilho escuro, pílula rosa e raio de 14px —
 * o `rounded-full` original destoa do "é cartaz, não app" do sistema.
 *
 * O original usa `mix-blend-difference` no texto para inverter sobre a pílula
 * branca. Sobre o rosa da marca essa inversão daria verde, então aqui a cor do
 * texto é controlada por estado: o item aceso (hover ou selecionado) fica
 * branco, o resto em cinza.
 */

export type SlideTab = {
  id: string;
  label: string;
};

type Position = { left: number; width: number; opacity: number };

type SlideTabsProps = {
  tabs: SlideTab[];
  /** Índice da aba ativa. */
  selected: number;
  onSelect?: (index: number, tab: SlideTab) => void;
  className?: string;
};

export function SlideTabs({
  tabs,
  selected,
  onSelect,
  className,
}: SlideTabsProps) {
  const [position, setPosition] = useState<Position>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [hovered, setHovered] = useState<number | null>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  const moveTo = useCallback((index: number) => {
    const el = itemsRef.current[index];
    if (!el) return;
    setPosition({
      left: el.offsetLeft,
      width: el.getBoundingClientRect().width,
      opacity: 1,
    });
  }, []);

  // A pílula é medida em px, então precisa remedir quando a largura muda —
  // e depois que as fontes carregam, porque a Barlow muda a largura do texto.
  useEffect(() => {
    moveTo(hovered ?? selected);
  }, [hovered, selected, moveTo, tabs]);

  useEffect(() => {
    const remeasure = () => moveTo(hovered ?? selected);

    document.fonts?.ready.then(remeasure);
    window.addEventListener("resize", remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, [hovered, selected, moveTo]);

  const lit = hovered ?? selected;

  return (
    <ul
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "relative flex w-fit items-center rounded-[14px] border border-ink-600 bg-ink-800/70 p-1 backdrop-blur-md",
        className
      )}
    >
      {tabs.map((tab, i) => (
        <li
          key={tab.id}
          ref={(el) => {
            itemsRef.current[i] = el;
          }}
          onMouseEnter={() => setHovered(i)}
          className="relative z-10 block"
        >
          <button
            type="button"
            onClick={() => onSelect?.(i, tab)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            aria-current={selected === i ? "page" : undefined}
            className={cn(
              "font-num block cursor-pointer px-4 py-2 text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors duration-200 lg:px-5 lg:text-xs",
              lit === i ? "text-white" : "text-ash-400"
            )}
          >
            {tab.label}
          </button>
        </li>
      ))}

      {/*
        A pílula desliza em `x` (transform, vai para a GPU) em vez de `left` —
        animar `left` recalcularia o layout do trilho a cada quadro.
      */}
      <motion.li
        aria-hidden
        animate={{ x: position.left, width: position.width, opacity: position.opacity }}
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
        className="absolute top-1 bottom-1 left-0 z-0 rounded-[10px] bg-pink-500"
        style={{ boxShadow: "0 0 20px rgb(240 25 125 / 0.45)" }}
      />
    </ul>
  );
}

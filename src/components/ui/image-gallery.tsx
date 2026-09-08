"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { usePerfTier } from "@/lib/perf";
import type { GalleryImage } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Galeria em tiras (base: image-gallery do 21st.dev), trazida para o sistema.
 *
 * Três mudanças de fundo em relação ao original:
 *
 * 1. O original expande a tira com `w-56 → hover:w-full`, o que muda a largura
 *    de um item e força o navegador a refazer o layout da fila inteira a cada
 *    quadro. Aqui todas as tiras dividem o espaço por `flex-grow` e só esse
 *    número anima — mesmo efeito, uma conta de layout em vez de nove.
 *
 * 2. Abrir a tira e ir para a galeria são duas ações separadas. A tira em si é
 *    um botão: clicar nela só abre o leque naquela imagem, em qualquer tela —
 *    o hover do desktop continua abrindo por cima, sem grudar. Quem leva para
 *    a galeria do evento é a seta, e só ela. Sem isso, no toque um clique de
 *    "quero ver essa foto maior" virava navegação.
 *
 * 3. Nesse leque a fila sangra até as bordas da tela e a tira aberta cresce
 *    menos no celular (4x, não 5x): numa tela de 375px, é o que mantém as
 *    fechadas com largura suficiente para a imagem se ler e o nome vertical
 *    caber.
 */

export type GalleryStrip = {
  id: string;
  /** Para onde a seta leva. */
  href: string;
  image: GalleryImage;
  title: string;
  /** Linha de apoio — contagem de fotos, data, local. */
  meta?: string;
  /**
   * `cover` (padrão) é para foto: a imagem sangra a tira inteira. `contain` é
   * para marca — logo de federação, por exemplo —, que não pode ser cortada:
   * ela entra inteira, centralizada, com respiro nas bordas.
   */
  fit?: "cover" | "contain";
};

type ImageGalleryProps = {
  items: GalleryStrip[];
  /** Rótulo da lista para leitores de tela. */
  label: string;
  className?: string;
};

export default function ImageGallery({
  items,
  label,
  className,
}: ImageGalleryProps) {
  const [selected, setSelected] = useState(items[0]?.id ?? null);

  /*
   * O hover do desktop passa por cima da escolha enquanto o ponteiro está em
   * cima e devolve o leque para a tira selecionada quando ele sai. Fosse só
   * CSS, a selecionada e a que está sob o ponteiro ficariam abertas juntas.
   */
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? selected;

  const tier = usePerfTier();

  /*
   * As duas transições daqui são das mais caras do site:
   *
   * - `flex-grow` é LAYOUT — abrir uma tira remede a fila de nove a cada
   *   quadro, com uma foto grande dentro de cada uma;
   * - `grayscale` é FILTRO — a foto que abre é rasterizada de novo, quadro a
   *   quadro, durante os 700 ms.
   *
   * Numa máquina fraca isso vira meio segundo de travamento a cada passada do
   * ponteiro. O corte não tira o efeito, encurta: a tira ainda abre e ainda
   * ganha cor, num tempo que a máquina consegue pagar.
   */
  const smooth = tier === null || tier === "high";

  return (
    <ul
      aria-label={label}
      className={cn(
        // sangra até a borda enquanto as tiras são estreitas
        "-mx-5 flex gap-[3px] sm:-mx-8 sm:gap-1.5 lg:mx-0 lg:gap-2",
        className
      )}
    >
      {items.map((item) => {
        const isOpen = active === item.id;
        const isMark = item.fit === "contain";

        return (
          <li
            key={item.id}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() =>
              setHovered((current) => (current === item.id ? null : current))
            }
            className={cn(
              "shrink basis-0",
              "transition-[flex-grow] ease-[cubic-bezier(0.2,0.7,0.3,1)]",
              smooth ? "duration-500" : "duration-200",
              isOpen ? "grow-[4] lg:grow-[5]" : "grow"
            )}
          >
            <div
              className={cn(
                "rounded-img relative h-[22rem] overflow-hidden sm:h-[28rem] lg:h-[32rem]",
                "border transition-colors duration-500",
                isOpen ? "border-pink-500/70" : "border-pink-500/25",
                // marca não sangra a tira: sem foto, o card precisa de um
                // fundo próprio para não virar um buraco no fundo da seção
                isMark && "bg-white/[0.035]"
              )}
            >
              <Image
                src={item.image.src}
                alt=""
                fill
                sizes="(max-width: 1024px) 45vw, 32vw"
                placeholder={item.image.blurDataURL ? "blur" : "empty"}
                blurDataURL={item.image.blurDataURL}
                className={cn(
                  // regra do sistema: preto e branco em repouso, cor no foco
                  "object-center transition",
                  smooth ? "duration-700" : "duration-200",
                  isOpen ? "grayscale-0" : "grayscale",
                  /*
                   * Foto em preto e branco continua legível; marca, não. Metade
                   * dessas logos é escura (azul-marinho, verde) e some contra o
                   * ink-900 assim que perde a cor — o brilho a mais devolve a
                   * silhueta na tira fechada e sai quando ela abre em cor.
                   */
                  isMark && !isOpen && "brightness-[1.7] contrast-[1.1]",
                  isMark
                    ? // o padding de baixo é maior para a marca subir e sair de
                      // cima do bloco de texto, que pousa no rodapé da tira
                      "object-contain px-2 pt-10 pb-28 sm:px-5 sm:pt-14 sm:pb-32"
                    : "object-cover"
                )}
              />

              <span
                aria-hidden
                className="texture-halftone pointer-events-none absolute inset-0 opacity-[0.07]"
              />

              {/* rebaixamento na base para o nome ter onde pousar */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
                style={{
                  background:
                    "linear-gradient(to top, rgb(10 10 10 / 0.94) 12%, rgb(10 10 10 / 0.55) 48%, transparent)",
                }}
              />

              {/*
                A tira inteira é o alvo de abrir: cobre a foto por baixo do
                texto, e o texto por cima não intercepta o clique.
              */}
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={
                  item.meta ? `${item.title} — ${item.meta}` : item.title
                }
                onClick={() => setSelected(item.id)}
                // o teclado abre ao chegar, sem precisar de um Enter só para isso
                onFocus={() => setSelected(item.id)}
                className="absolute inset-0 cursor-pointer"
              />

              {/*
                Nome na vertical: recolhida, a tira não chega a 30px e não cabe
                texto deitado. Some quando a tira abre.
              */}
              <span
                aria-hidden
                className={cn(
                  "font-display pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.14em] whitespace-nowrap text-white uppercase sm:text-[13px] lg:bottom-5 lg:text-[15px]",
                  "[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180",
                  "transition-opacity duration-300",
                  isOpen && "opacity-0"
                )}
              >
                {item.title}
              </span>

              {/* bloco deitado: entra junto com a tira aberta */}
              <span
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 opacity-0 transition-opacity duration-300 sm:gap-4 sm:p-5 lg:p-6",
                  isOpen && "opacity-100"
                )}
              >
                <span aria-hidden className="min-w-0">
                  <span className="font-display block text-[15px] leading-tight tracking-[0.01em] text-white uppercase sm:text-[19px] lg:text-[22px]">
                    {item.title}
                  </span>
                  {item.meta && (
                    <span className="font-num mt-1.5 block text-[10px] font-semibold tracking-[0.24em] text-pink-400 uppercase">
                      {item.meta}
                    </span>
                  )}
                </span>

                {/* único caminho da tira para a galeria do evento */}
                <Link
                  href={item.href}
                  tabIndex={isOpen ? undefined : -1}
                  aria-hidden={!isOpen}
                  aria-label={`Ver a galeria de ${item.title}`}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pink-500/50 text-pink-400 transition-colors duration-300",
                    "hover:border-pink-500 hover:bg-pink-500 hover:text-white",
                    "focus-visible:border-pink-500 focus-visible:bg-pink-500 focus-visible:text-white",
                    isOpen && "pointer-events-auto"
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                    <path
                      d="M4 12h15m0 0-6-6m6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

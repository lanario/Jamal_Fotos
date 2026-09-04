"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
 * 2. Hover não existe em toque, e o original simplesmente não tem resposta
 *    para isso. Abaixo de `lg` a tira aberta passa a ser estado: a primeira
 *    já entra aberta, tocar numa fechada abre ela, e tocar na que está aberta
 *    é que navega. Assim o celular fica com a mesma composição do desktop —
 *    o leque de tiras em P&B, o nome na vertical — em vez de virar carrossel.
 *
 * 3. Nesse leque de toque a fila sangra até as bordas da tela e a tira aberta
 *    cresce menos (4x, não 5x): com nove eventos numa tela de 375px, é o que
 *    mantém as fechadas com largura suficiente para a foto se ler e o nome
 *    vertical caber.
 */

export type GalleryStrip = {
  id: string;
  /** Para onde a tira leva. */
  href: string;
  image: GalleryImage;
  title: string;
  /** Linha de apoio — contagem de fotos, data, local. */
  meta?: string;
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
  const [open, setOpen] = useState(items[0]?.id ?? null);

  /*
   * Acima de `lg` quem manda é o hover do CSS, e o estado tem que sair da
   * frente — senão a tira aberta no celular ficaria presa aberta no desktop.
   * Daí `byTouch`: no primeiro render é `false` (o HTML do servidor sai com
   * todas as tiras iguais, que é o repouso do desktop) e vira `true` na
   * hidratação em tela pequena, abrindo a primeira com a transição normal.
   */
  const [byTouch, setByTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const sync = () => setByTouch(mq.matches);

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
        const isOpen = byTouch && open === item.id;

        return (
          <li
            key={item.id}
            className={cn(
              "shrink basis-0",
              "transition-[flex-grow] duration-500 ease-[cubic-bezier(0.2,0.7,0.3,1)]",
              isOpen ? "grow-[4]" : "grow",
              // `focus-within` junto do hover: sem ele a tira nunca abre para
              // quem chega no link pelo teclado
              "lg:hover:grow-[5] lg:focus-within:grow-[5]"
            )}
          >
            <Link
              href={item.href}
              // no toque, o primeiro toque abre a tira; o segundo é que navega
              onClick={(event) => {
                if (!byTouch || isOpen) return;
                event.preventDefault();
                setOpen(item.id);
              }}
              // o teclado abre ao chegar, sem precisar de um Enter só para isso
              onFocus={() => byTouch && setOpen(item.id)}
              aria-label={
                item.meta ? `${item.title} — ${item.meta}` : item.title
              }
              className={cn(
                "group rounded-img relative block h-[22rem] overflow-hidden sm:h-[28rem] lg:h-[32rem]",
                "border border-pink-500/25 transition-colors duration-500",
                "hover:border-pink-500/70 focus-visible:border-pink-500",
                isOpen && "border-pink-500/70"
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
                  "object-cover object-center grayscale transition duration-700",
                  isOpen && "grayscale-0",
                  "lg:group-hover:grayscale-0 lg:group-focus-visible:grayscale-0"
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
                Nome na vertical: recolhida, a tira não chega a 30px e não cabe
                texto deitado. Some quando a tira abre.
              */}
              <span
                aria-hidden
                className={cn(
                  "font-display absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.14em] whitespace-nowrap text-white uppercase sm:text-[13px] lg:bottom-5 lg:text-[15px]",
                  "[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180",
                  "transition-opacity duration-300",
                  isOpen && "opacity-0",
                  "lg:group-hover:opacity-0 lg:group-focus-visible:opacity-0"
                )}
              >
                {item.title}
              </span>

              {/* bloco deitado: entra junto com a tira aberta */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 opacity-0 transition-opacity duration-300 sm:gap-4 sm:p-5 lg:p-6",
                  isOpen && "opacity-100",
                  "lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100"
                )}
              >
                <span className="min-w-0">
                  <span className="font-display block text-[15px] leading-tight tracking-[0.01em] text-white uppercase sm:text-[19px] lg:text-[22px]">
                    {item.title}
                  </span>
                  {item.meta && (
                    <span className="font-num mt-1.5 block text-[10px] font-semibold tracking-[0.24em] text-pink-400 uppercase">
                      {item.meta}
                    </span>
                  )}
                </span>

                <span
                  className={cn(
                    "hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pink-500/50 text-pink-400 transition-colors duration-300 sm:flex",
                    "group-hover:border-pink-500 group-hover:bg-pink-500 group-hover:text-white"
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
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

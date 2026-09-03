"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { SprayStroke } from "@/components/ui/spray";

const LETTERS = ["J", "M", "L"];

/**
 * Lockup central do hero: assinatura "Jamal", wordmark JML em gradiente
 * e a tagline da marca. Entra com stagger via GSAP.
 *
 * O gradiente é fatiado entre as letras (background-size 300%) para ler
 * como UM gradiente contínuo, e não três repetidos.
 */
export default function HeroTitle() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-anim='letter']", {
        opacity: 0,
        yPercent: 55,
        scale: 0.9,
        filter: "blur(16px)",
        duration: 0.9,
        stagger: 0.1,
      })
        .from(
          "[data-anim='script']",
          { opacity: 0, y: 14, rotate: -12, scale: 0.8, duration: 0.6 },
          "-=0.35"
        )
        .from(
          "[data-anim='stroke']",
          {
            opacity: 0,
            scaleX: 0.2,
            duration: 0.7,
            transformOrigin: "left center",
          },
          "-=0.45"
        )
        .from(
          "[data-anim='sports']",
          { opacity: 0, y: 10, letterSpacing: "1.4em", duration: 0.8 },
          "-=0.55"
        )
        .from("[data-anim='tagline']", { opacity: 0, y: 10, duration: 0.6 }, "-=0.4");
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none relative flex flex-col items-center text-center"
    >
      {/* scrim: abre um respiro escuro sob o lockup sem apagar as fotos */}
      <div
        aria-hidden
        className="absolute -inset-x-[35%] -inset-y-[55%] -z-10"
        style={{
          background:
            "radial-gradient(closest-side, rgb(10 10 10 / 0.9) 0%, rgb(10 10 10 / 0.62) 42%, rgb(10 10 10 / 0.22) 72%, transparent 100%)",
        }}
      />

      <h1 className="contents">
        <span className="sr-only">JML Sports — fotografia esportiva por Jamal</span>

        {/* assinatura pichada, encaixada acima do wordmark */}
        <span
          data-anim="script"
          aria-hidden
          className="glow-pink font-script mb-1 block -rotate-3 text-xl text-pink-400 sm:text-2xl md:mb-2 md:text-3xl"
        >
          Jamal
        </span>

        {/* wordmark */}
        <span
          aria-hidden
          className="flex items-baseline justify-center"
          style={{ filter: "drop-shadow(0 6px 28px rgb(0 0 0 / 0.85))" }}
        >
          {LETTERS.map((letter, i) => (
            <span
              key={letter}
              data-anim="letter"
              className="text-brand-gradient font-display block text-[26vw] leading-[0.82] tracking-[-0.045em] sm:text-[21vw] md:text-[15vw] lg:text-[13rem]"
              style={{
                backgroundSize: "300% 100%",
                backgroundPosition: `${(i / (LETTERS.length - 1)) * 100}% 0`,
                willChange: "transform, filter, opacity",
              }}
            >
              {letter}
            </span>
          ))}
        </span>
      </h1>

      <span data-anim="stroke" aria-hidden className="mt-1 block">
        <SprayStroke className="h-[14px] w-[min(80vw,34rem)]" />
      </span>

      <p
        data-anim="sports"
        className="font-display mt-2 text-sm tracking-[0.6em] text-white/90 sm:text-base md:text-lg"
        style={{ textShadow: "0 2px 16px rgb(0 0 0 / 0.9)" }}
      >
        SPORTS
      </p>

      <p
        data-anim="tagline"
        className="font-num mt-5 text-[11px] font-semibold tracking-[0.24em] text-ash-400 uppercase sm:text-xs"
        style={{ textShadow: "0 2px 14px rgb(0 0 0 / 0.95)" }}
      >
        Foco, agilidade e excelência
        <span className="mx-2 text-pink-500">/</span>
        Fotografia esportiva
      </p>
    </div>
  );
}

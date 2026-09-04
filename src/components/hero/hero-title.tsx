"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

import { SprayStroke } from "@/components/ui/spray";
import { perfTier } from "@/lib/perf";

/**
 * Lockup central do hero: o grafite "Jamal / JML" como imagem única
 * e a tagline da marca. Entra com stagger via GSAP.
 */
export default function HeroTitle() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      const logo = root.querySelector<HTMLElement>("[data-anim='logo']");

      // o `will-change` entra só durante a entrada e sai no fim: mantê-lo
      // ligado prenderia uma camada de GPU do tamanho da tela pelo resto
      // da sessão, e é a galeria que precisa desse orçamento
      /*
       * O desfoque de entrada é lindo e é caro: o grafite ocupa boa parte da
       * tela e, desfocado, é rasterizado de novo a cada quadro da entrada —
       * justamente quando o túnel está montando e as fotos decodificando. Na
       * máquina fraca ele entra sem desfoque; o movimento é o mesmo.
       */
      const soft = perfTier() !== "low";

      if (logo) {
        logo.style.willChange = soft
          ? "transform, filter, opacity"
          : "transform, opacity";
      }

      tl.from("[data-anim='logo']", {
        opacity: 0,
        yPercent: 12,
        scale: 0.9,
        ...(soft ? { filter: "blur(12px)" } : null),
        duration: 1,
        onComplete: () => {
          if (!logo) return;
          logo.style.willChange = "";
          // o GSAP deixa `filter: blur(0px)` no inline; sem limpar, a imagem
          // continua sendo rasterizada como camada filtrada
          logo.style.filter = "";
        },
      })
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
          { opacity: 0, y: 10, letterSpacing: "0.7em", duration: 0.8 },
          "-=0.55"
        )
        .from("[data-anim='tagline']", { opacity: 0, y: 10, duration: 0.6 }, "-=0.4");
    }, root);

    return () => ctx.revert();
    // uma vez só, na montagem: a entrada não toca de novo
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

        {/*
          O grafite não está centralizado dentro do próprio PNG: sobram 52px de
          transparência à esquerda contra 3px à direita, então o centro da arte
          cai 24px (3.74% da largura) à direita do centro do arquivo. Centralizar
          a imagem centraliza o arquivo, não o desenho — daí o empurrão para a
          esquerda, que alinha a arte com o "SPORTS" abaixo.

          A largura é travada também em svh (76svh ≈ 46svh × 642/388) em vez de
          um max-height: assim a caixa nunca fica maior que a imagem, e o
          deslocamento em % continua sendo % da arte.
        */}
        <span
          data-anim="logo"
          aria-hidden
          className="block w-[min(82vw,36rem,76svh)]"
          style={{ filter: "drop-shadow(0 6px 28px rgb(0 0 0 / 0.85))" }}
        >
          <Image
            src="/jamal_grafite.png"
            alt=""
            width={642}
            height={388}
            priority
            sizes="(max-width: 640px) 82vw, 36rem"
            className="h-auto w-full max-w-none select-none"
            style={{ transform: "translateX(-3.74%)" }}
          />
        </span>
      </h1>

      <span data-anim="stroke" aria-hidden className="mt-1 block">
        <SprayStroke className="h-[14px] w-[min(80vw,34rem)]" />
      </span>

      <p
        data-anim="sports"
        className="font-display mt-2 text-[0.6rem] tracking-[0.34em] text-white/90 uppercase sm:text-xs sm:tracking-[0.4em] md:text-sm"
        style={{ textShadow: "0 2px 16px rgb(0 0 0 / 0.9)" }}
      >
        Fotografia Esportiva
      </p>

      <p
        data-anim="tagline"
        className="font-num mt-5 text-[11px] font-semibold tracking-[0.24em] text-ash-400 uppercase sm:text-xs"
        style={{ textShadow: "0 2px 14px rgb(0 0 0 / 0.95)" }}
      >
        Congelando histórias além do tatame
      </p>
    </div>
  );
}

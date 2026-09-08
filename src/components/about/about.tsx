"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Splatter, SprayStroke } from "@/components/ui/spray";
import { jamalPortrait } from "@/data/portrait";
import { perfTier } from "@/lib/perf";

gsap.registerPlugin(ScrollTrigger);

const BIO = [
  "Meu nome é Jamal e eu trabalho com fotografia esportiva.",
  "Mais do que registrar uma luta, uma corrida ou uma disputa, eu procuro fotografar tudo o que existe ao redor daquele momento: a concentração antes de entrar, o olhar do treinador, a comemoração, o cansaço, a fé e tudo aquilo que normalmente acontece rápido demais para ser percebido.",
  "Foi assim que encontrei a forma como gosto de fotografar esporte: com intensidade, proximidade e atenção às histórias que existem além da competição.",
  "Hoje, meu trabalho passa principalmente pelo universo dos tatames e dos eventos esportivos, acompanhando atletas, equipes e campeonatos com uma linguagem mais documental e editorial.",
  "Porque, no fim, o resultado importa. Mas a história que levou até ele também.",
];

const TAGLINE = "Congelando histórias além do tatame";

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const heavy = perfTier() !== "low";

    const ctx = gsap.context(() => {
      // retrato: revela de baixo para cima como um cartaz sendo colado
      gsap.from(frameRef.current, {
        clipPath: "inset(100% 0% 0% 0%)",
        yPercent: 6,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: frameRef.current, start: "top 82%" },
      });

      // parallax interno: a foto anda mais devagar que a moldura
      gsap.fromTo(
        photoRef.current,
        { yPercent: -7 },
        {
          yPercent: 7,
          ease: "none",
          scrollTrigger: {
            trigger: frameRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5,
          },
        }
      );

      // nome: sobe com uma leve inclinação, uma linha depois da outra
      gsap.from("[data-about='name-line']", {
        yPercent: 60,
        opacity: 0,
        skewY: 4,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-about='name']", start: "top 88%" },
      });

      gsap.from("[data-about='stroke']", {
        scaleX: 0.15,
        opacity: 0,
        transformOrigin: "left center",
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-about='stroke']", start: "top 92%" },
      });

      gsap.from("[data-about='bio'] > p", {
        y: 22,
        opacity: 0,
        duration: 0.7,
        stagger: 0.14,
        ease: "power2.out",
        scrollTrigger: { trigger: "[data-about='bio']", start: "top 88%" },
      });

      // círculo de acento: desenha o traço junto com a bio
      gsap.from("[data-about='accent']", {
        scale: 0.5,
        opacity: 0,
        rotate: -45,
        duration: 0.8,
        ease: "back.out(1.6)",
        scrollTrigger: { trigger: "[data-about='bio']", start: "top 88%" },
      });

      /*
       * Respingos com parallax leve, para o fundo não ficar estático.
       * Fora do modo econômico: mover a nuvem obriga a repintar as centenas
       * de gotas a cada quadro de rolagem.
       */
      if (heavy) {
        gsap.to("[data-about='splat']", {
          yPercent: -18,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="sobre"
      // `-flat`: o grão cobre respingos que fazem parallax no scroll, e a
      // versão com `mix-blend-mode` faria o navegador remisturar a seção
      // inteira a cada quadro de rolagem
      className="texture-noise-flat relative overflow-hidden bg-ink-900 py-20 sm:py-28 lg:py-36"
    >
      <Splatter
        seed={17}
        count={150}
        data-about="splat"
        className="-top-[8%] -right-[18%] h-[52vh] w-[60vw] opacity-40 sm:w-[38vw]"
      />
      <Splatter
        seed={31}
        count={110}
        data-about="splat"
        className="-bottom-[12%] -left-[20%] h-[45vh] w-[62vw] opacity-30 sm:w-[34vw]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* olho da seção */}
        <motion.p
          initial={{ opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.3, 1] }}
          className="font-num mb-8 flex items-center gap-3 text-[11px] font-semibold tracking-[0.34em] text-ash-400 uppercase sm:mb-12 sm:text-xs"
        >
          <span className="inline-block h-px w-8 bg-pink-500" aria-hidden />
          Fotógrafo esportivo
        </motion.p>

        <div className="lg:flex lg:items-start lg:gap-0">
          {/* retrato */}
          <figure
            ref={frameRef}
            className="relative z-0 w-full max-w-[26rem] sm:max-w-[30rem] lg:w-[46%] lg:max-w-none lg:shrink-0"
          >
            <div className="rounded-img relative aspect-[4/5] overflow-hidden border border-pink-500/30 shadow-[0_0_60px_rgb(240_25_125/0.18),0_24px_80px_rgb(0_0_0/0.7)]">
              <div ref={photoRef} className="absolute inset-x-0 -inset-y-[8%]">
                <Image
                  src={jamalPortrait.src}
                  alt={jamalPortrait.alt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 46vw"
                  placeholder={jamalPortrait.blurDataURL ? "blur" : "empty"}
                  blurDataURL={jamalPortrait.blurDataURL}
                  className="object-cover"
                  style={{ objectPosition: "52% 38%" }}
                />
              </div>

              {/* trama de meio-tom + rebaixamento na base, para o nome respirar */}
              <div
                aria-hidden
                // sem `mix-blend-screen`: a foto atrás faz parallax, então a
                // mistura seria refeita a cada quadro
                className="texture-halftone pointer-events-none absolute inset-0 opacity-[0.07]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
                style={{
                  background:
                    "linear-gradient(to top, rgb(10 10 10 / 0.92), transparent)",
                }}
              />
            </div>
          </figure>

          {/* nome — sobrepõe a borda do retrato, como no modelo */}
          <div className="relative z-10 -mt-16 pl-1 sm:-mt-24 sm:pl-2 lg:-ml-28 lg:mt-24 lg:pl-0">
            <h2 data-about="name" className="relative">
              <span className="sr-only">
                Jamal — fotógrafo esportivo da JML Sports
              </span>

              <span aria-hidden className="block overflow-hidden">
                <span
                  data-about="name-line"
                  className="text-brand-gradient font-display block text-[19vw] leading-[0.86] tracking-[-0.03em] sm:text-[15vw] lg:text-[8.5rem] xl:text-[10rem]"
                  style={{ filter: "drop-shadow(0 6px 30px rgb(0 0 0 / 0.9))" }}
                >
                  Jamal
                </span>
              </span>

              <span aria-hidden className="block overflow-hidden">
                <span
                  data-about="name-line"
                  className="text-outline-pink font-display block text-[19vw] leading-[0.9] tracking-[0.02em] sm:text-[15vw] lg:text-[8.5rem] xl:text-[10rem]"
                >
                  Sports
                </span>
              </span>
            </h2>

            <span data-about="stroke" className="mt-3 block sm:mt-5">
              <SprayStroke className="h-[14px] w-[min(72vw,26rem)]" />
            </span>
          </div>
        </div>

        {/* bio */}
        <div className="mt-10 sm:mt-14 lg:mt-16 lg:flex lg:justify-end">
          <div className="lg:w-[54%]">
            <div className="flex gap-5 sm:gap-7">
              {/* acento gráfico: a seta do modelo, aqui só como grafismo */}
              <span
                data-about="accent"
                aria-hidden
                className="mt-1 hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-pink-500/45 text-pink-500 sm:flex"
                style={{ boxShadow: "0 0 24px rgb(240 25 125 / 0.22)" }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M4 12h15m0 0-6-6m6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <div
                data-about="bio"
                className="max-w-[46ch] space-y-4 text-[15px] leading-relaxed text-ash-400 sm:space-y-5 sm:text-base"
              >
                {BIO.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* a tagline da marca */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.3, 1] }}
              className="font-num mt-9 text-[11px] font-semibold tracking-[0.28em] text-white/85 uppercase sm:mt-12 sm:text-xs"
            >
              {TAGLINE}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}

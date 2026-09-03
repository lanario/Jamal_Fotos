"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import InfiniteGallery, {
  type InfiniteGalleryHandle,
} from "@/components/ui/3d-gallery-photography";
import { Drips, Splatter } from "@/components/ui/spray";
import HeroTitle from "@/components/hero/hero-title";
import { galleryImages } from "@/data/gallery";

gsap.registerPlugin(ScrollTrigger);

/** Quantas unidades o túnel avança ao longo de toda a pista de rolagem. */
const SCROLL_UNITS = 16;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<InfiniteGalleryHandle>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // a barra do navegador mobile aparecendo/sumindo não deve remedir tudo
    ScrollTrigger.config({ ignoreMobileResize: true });

    const ctx = gsap.context(() => {
      // 1. a rolagem da página empurra o túnel — sem sequestrar o scroll
      let last = 0;
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const delta = self.progress - last;
          last = self.progress;
          galleryRef.current?.nudge(delta * SCROLL_UNITS);
        },
        onRefresh: (self) => {
          last = self.progress;
        },
      });

      // 2. o lockup segura firme e só então se dissolve
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
          },
        })
        .to(lockupRef.current, { duration: 0.4 })
        .to(lockupRef.current, {
          opacity: 0,
          yPercent: -8,
          scale: 0.94,
          filter: "blur(14px)",
          ease: "none",
          duration: 0.6,
        });

      // 3. véu preto no fim da pista: entrega suave para a seção Sobre
      gsap.fromTo(
        fadeRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "center top",
            end: "bottom bottom",
            scrub: 0.6,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="topo"
      // pista de rolagem: o visual fica preso enquanto o túnel avança
      className="relative h-[210svh]"
      aria-label="Abertura — JML Sports"
    >
      <div className="texture-noise sticky top-0 h-dvh w-full overflow-hidden bg-ink-900">
        {/* túnel de fotos */}
        <InfiniteGallery
          ref={galleryRef}
          images={galleryImages}
          speed={1.2}
          zSpacing={3}
          visibleCount={12}
          falloff={{ near: 0.8, far: 14 }}
          className="absolute inset-0 h-full w-full"
        />

        {/* vinheta: escurece as bordas e joga o foco pro centro */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 42%, rgb(10 10 10 / 0.28) 74%, rgb(10 10 10 / 0.82) 100%)",
          }}
        />

        {/* spray nos cantos + escorridos no topo, como nas artes */}
        <Splatter
          seed={3}
          count={170}
          depth={1.2}
          className="-top-[16%] -left-[14%] h-[60vh] w-[45vw] opacity-60"
        />
        <Splatter
          seed={9}
          count={140}
          depth={0.7}
          className="-right-[16%] -bottom-[18%] h-[55vh] w-[42vw] opacity-50"
        />

        {/* dois planos de tinta: o de trás corre devagar e desfocado, o da
            frente é o que reage ao cursor e à velocidade da rolagem */}
        <Drips
          seed={17}
          count={7}
          maxLength={280}
          speed={0.65}
          depth={0.25}
          interactive={false}
          className="inset-x-0 top-0 h-[38vh] opacity-45 blur-[1.5px]"
        />
        <Drips
          seed={2}
          count={11}
          depth={1}
          className="inset-x-0 top-0 h-[26vh]"
        />

        {/* lockup central */}
        <div
          ref={lockupRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
        >
          <HeroTitle />
        </div>

        {/* véu de entrega para a próxima seção */}
        <div
          ref={fadeRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-ink-900 opacity-0"
        />
      </div>
    </section>
  );
}

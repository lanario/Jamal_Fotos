"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import ImageGallery, { type GalleryStrip } from "@/components/ui/image-gallery";
import { Splatter, SprayStroke } from "@/components/ui/spray";
import { championships } from "@/data/championships";

const EASE_BRAND = [0.2, 0.7, 0.3, 1] as const;

/** Uma tira por evento — a primeira foto do conjunto é a capa. */
const strips: GalleryStrip[] = championships.map((championship) => ({
  id: championship.slug,
  // leva direto para a galeria daquele campeonato, já aberta
  href: `/portfolio?evento=${championship.slug}`,
  image: championship.photos[0],
  title: championship.name,
  meta: `${championship.photos.length} fotos`,
}));

export default function EventsPreview() {
  return (
    <section
      id="eventos"
      className="texture-noise-flat relative overflow-hidden bg-ink-900 py-20 sm:py-28 lg:py-32"
      aria-label="Eventos cobertos"
    >
      <Splatter
        seed={41}
        count={140}
        className="-top-[10%] -left-[18%] h-[50vh] w-[60vw] opacity-30 sm:w-[34vw]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <motion.p
          initial={{ opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: EASE_BRAND }}
          className="font-num mb-6 flex items-center gap-3 text-[11px] font-semibold tracking-[0.34em] text-ash-400 uppercase sm:text-xs"
        >
          <span className="inline-block h-px w-8 bg-pink-500" aria-hidden />
          Eventos cobertos
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 0.7, ease: EASE_BRAND }}
        >
          {/* 11.5vw, e não 13: "UM MOMENTO ÚNICO" é a linha mais longa e a
              13vw ela quebrava, jogando "ÚNICO" sozinho numa terceira linha */}
          <h2 className="font-display text-[11.5vw] leading-[0.88] tracking-[-0.02em] uppercase sm:text-[8vw] lg:text-[4.5rem]">
            <span className="text-brand-gradient block">Cada campeonato</span>
            <span className="text-outline-pink block">um momento único</span>
          </h2>

          <span className="mt-4 block sm:mt-5">
            <SprayStroke className="h-[14px] w-[min(72vw,26rem)]" />
          </span>

          <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-ash-400 sm:text-base">
            Do primeiro combate da manhã à final. Escolha um evento para ver a
            cobertura completa.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_BRAND }}
          className="mt-10 sm:mt-14"
        >
          <ImageGallery items={strips} label="Campeonatos cobertos por Jamal" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.16, ease: EASE_BRAND }}
          className="mt-10 flex justify-center sm:mt-14"
        >
          <Link href="/portfolio" className="btn-animated w-full justify-center sm:w-auto">
            <ArrowIcon className="icon-in" />
            <span className="label">Ver todos os campeonatos</span>
            <ArrowIcon className="icon-out" />
            <span className="circle" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 12h15m0 0-6-6m6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

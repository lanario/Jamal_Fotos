"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";

import EventGalleryModal from "@/components/portfolio/event-gallery-modal";
import SphereImageGrid, { type ImageData } from "@/components/ui/img-sphere";
import { championships, championshipTiles } from "@/data/championships";

const EASE_BRAND = [0.2, 0.7, 0.3, 1];

/**
 * Uma bolha por campeonato: apontar mostra o nome, clicar abre a galeria.
 *
 * A esfera é decorativa (aria-hidden) — quem navega por teclado ou leitor de
 * tela usa a lista ao lado, que abre exatamente as mesmas galerias.
 */
export default function ChampionshipSphere() {
  const [selected, setSelected] = useState<string>(championships[0].slug);
  const [preview, setPreview] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const focused = preview ?? selected;

  const current = useMemo(
    () => championships.find((c) => c.slug === focused) ?? championships[0],
    [focused],
  );

  const opened = useMemo(
    () => championships.find((c) => c.slug === openSlug) ?? null,
    [openSlug],
  );

  const handleHover = useCallback((image: ImageData | null) => {
    setPreview(image?.groupId ?? null);
  }, []);

  const handleSelect = useCallback((image: ImageData) => {
    if (!image.groupId) return;
    setSelected(image.groupId);
    setOpenSlug(image.groupId);
  }, []);

  return (
    <div className="lg:flex lg:items-center lg:gap-14">
      <div className="w-full lg:w-[52%] lg:shrink-0">
        <SphereImageGrid
          images={championshipTiles}
          containerSize={600}
          sphereRadius={215}
          dragSensitivity={0.8}
          momentumDecay={0.96}
          maxRotationSpeed={6}
          baseImageScale={0.2}
          hoverScale={1.18}
          /* focal curta de propósito: com 9 bolhas, é a profundidade que dá
             a variação de tamanho que faz o conjunto ler como esfera */
          perspective={680}
          autoRotate
          autoRotateSpeed={0.2}
          activeGroup={focused}
          onHoverImage={handleHover}
          onSelectImage={handleSelect}
        />

        <p className="font-num mt-2 text-center text-[10px] tracking-[0.24em] text-ash-600 uppercase">
          Arraste para girar · toque para abrir
        </p>
      </div>

      <div className="mt-10 lg:mt-0 lg:flex-1">
        {/* painel do evento em foco */}
        <div className="min-h-[8.5rem] border-l-2 border-pink-500 pl-5 sm:min-h-[9.5rem] sm:pl-6">
          {/*
            Sem AnimatePresence de propósito: com `mode="wait"` cada troca
            esperaria a saída da anterior, e varrer a lista com o mouse
            deixaria o painel uns 600 ms atrás. A chave remonta o bloco e a
            entrada roda na hora.
          */}
          <motion.div
            key={current.slug}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_BRAND }}
          >
            <p className="font-num text-[11px] font-semibold tracking-[0.3em] text-ash-600 uppercase">
              Evento
            </p>
            <h2 className="font-display text-brand-gradient mt-2 text-[9vw] leading-[0.95] uppercase sm:text-[5vw] lg:text-[2.75rem]">
              {current.name}
            </h2>

          </motion.div>
        </div>

        {/* lista acessível — é ela que dirige a esfera */}
        <ul
          className="mt-9 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:mt-11"
          onMouseLeave={() => setPreview(null)}
        >
          {championships.map((championship, i) => {
            const isActive = championship.slug === focused;

            return (
              <li key={championship.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(championship.slug);
                    setOpenSlug(championship.slug);
                  }}
                  onMouseEnter={() => setPreview(championship.slug)}
                  onFocus={() => setPreview(championship.slug)}
                  onBlur={() => setPreview(null)}
                  aria-label={`Abrir galeria de ${championship.name}, ${championship.photos.length} fotos`}
                  className="group flex w-full items-baseline gap-3 py-2 text-left"
                >
                  <span
                    className={`text-[15px] transition-colors duration-200 ${
                      isActive
                        ? "text-white"
                        : "text-ash-400 group-hover:text-white"
                    }`}
                  >
                    {championship.name}
                  </span>
                  <span
                    aria-hidden
                    className={`ml-auto h-px flex-1 self-center transition-colors duration-200 ${
                      isActive ? "bg-pink-500/70" : "bg-ink-600"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <EventGalleryModal championship={opened} onClose={() => setOpenSlug(null)} />
    </div>
  );
}

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";

import ImgStack from "@/components/ui/image-stack";
import { Splatter } from "@/components/ui/spray";
import type { Championship } from "@/data/championships";

const EASE_BRAND = [0.2, 0.7, 0.3, 1];

type EventGalleryModalProps = {
  championship: Championship | null;
  onClose: () => void;
};

/**
 * Galeria do evento. Radix cuida do que é chato e fácil de errar à mão —
 * prender o foco, fechar no Escape, travar a rolagem de fundo e marcar o
 * resto da página como inerte.
 */
export default function EventGalleryModal({
  championship,
  onClose,
}: EventGalleryModalProps) {
  const open = Boolean(championship);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <AnimatePresence>
        {championship && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[60] bg-ink-900/92 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.35, ease: EASE_BRAND }}
                /*
                  Fundo próprio, e não só o do overlay: o painel ocupa a tela
                  inteira, e se depender da camada de trás qualquer tropeço na
                  animação deixa a esfera aparecendo por baixo do conteúdo.
                */
                className="texture-noise fixed inset-0 z-[70] overflow-x-hidden overflow-y-auto bg-ink-900 focus:outline-none"
              >
                <Splatter
                  seed={61}
                  count={140}
                  className="-top-[6%] -right-[20%] h-[46vh] w-[64vw] opacity-30 sm:w-[34vw]"
                />

                <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="font-num flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] text-ash-400 uppercase">
                        <span
                          className="inline-block h-px w-6 bg-pink-500"
                          aria-hidden
                        />
                        Galeria
                      </p>

                      <Dialog.Title className="font-display text-brand-gradient mt-3 text-[9vw] leading-[0.95] uppercase sm:text-[5vw] lg:text-[3.25rem]">
                        {championship.name}
                      </Dialog.Title>

                      <Dialog.Description className="font-num mt-3 text-[11px] font-semibold tracking-[0.24em] text-ash-400 uppercase">
                        {championship.photos.length} fotos · arraste a carta ou
                        use as setas
                      </Dialog.Description>
                    </div>

                    <Dialog.Close
                      aria-label="Fechar galeria"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-ink-600 bg-ink-800 text-ash-400 transition-colors duration-200 hover:border-pink-500 hover:text-pink-400"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="m6 6 12 12M18 6 6 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </Dialog.Close>
                  </div>

                  <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
                    <ImgStack
                      images={championship.photos}
                      eventName={championship.name}
                    />
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

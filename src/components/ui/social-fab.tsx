"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";

import { socialLinks } from "@/data/social";

const EASE_BRAND = [0.2, 0.7, 0.3, 1] as const;

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Só WhatsApp e Instagram: o atalho flutuante é para puxar conversa, não um
 * índice de redes (esse já existe no rodapé). O WhatsApp vem primeiro e, como
 * a pilha cresce para cima, fica o mais perto do polegar.
 */
const CHANNELS = socialLinks.filter(
  (s) => s.id === "whatsapp" || s.id === "instagram"
);

/**
 * Atalho de contato preso no canto inferior direito.
 *
 * Divisão de trabalho entre as duas bibliotecas, para elas nunca disputarem a
 * mesma matriz de transform: o framer-motion cuida do estado (abrir, fechar,
 * hover, tap) e o GSAP cuida do que fica pulsando sozinho — os halos e a
 * cutucada periódica no ícone.
 */
export default function SocialFab() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const menuId = useId();

  /* ---------- pulso de atenção (GSAP) ---------- */
  useEffect(() => {
    const root = rootRef.current;
    // com o menu aberto o botão já tem a atenção: nada de pulsar por baixo
    if (!root || open || reduceMotion()) return;

    const ctx = gsap.context(() => {
      // halos saindo do botão, como a onda de um respingo
      gsap.set("[data-fab='ring']", { scale: 0.92, opacity: 0.55 });
      gsap.to("[data-fab='ring']", {
        scale: 2.1,
        opacity: 0,
        duration: 2.6,
        ease: "power2.out",
        repeat: -1,
        stagger: 0.9,
      });

      // e de vez em quando o ícone dá uma sacudida de pichação
      gsap
        .timeline({ repeat: -1, repeatDelay: 6, delay: 3 })
        .to(iconRef.current, { rotate: -12, duration: 0.11 })
        .to(iconRef.current, { rotate: 10, duration: 0.11 })
        .to(iconRef.current, { rotate: -6, duration: 0.1 })
        .to(iconRef.current, {
          rotate: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.35)",
        });
    }, root);

    return () => ctx.revert();
  }, [open]);

  /* ---------- Esc fecha ---------- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = () => {
    setOpen((v) => !v);
    setEverOpened(true);
  };

  return (
    <>
      {/* captura o clique fora; no mobile também escurece o fundo */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            tabIndex={-1}
            aria-label="Fechar atalhos de contato"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default bg-ink-900/55 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
          />
        )}
      </AnimatePresence>

      <div
        ref={rootRef}
        /* z-30: abaixo da navbar (z-50) e do menu mobile (z-40) */
        className="fixed right-5 bottom-5 z-30 flex flex-col-reverse items-end gap-3 sm:right-8 sm:bottom-8"
      >
        {/* ---------- gatilho ---------- */}
        <motion.button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Fechar atalhos de contato" : "Falar com o Jamal"}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6, ease: EASE_BRAND }}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-pink-500/70 bg-ink-800 text-pink-400 shadow-[0_0_28px_rgb(240_25_125/0.35)] transition-colors duration-200 hover:border-pink-400 hover:text-white sm:h-16 sm:w-16"
        >
          {/* halos do pulso — o GSAP cuida deles */}
          {!open && (
            <>
              <span
                data-fab="ring"
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full border border-pink-500"
              />
              <span
                data-fab="ring"
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full border border-pink-400"
              />
            </>
          )}

          {/* miolo rosa que preenche no hover, como no .btn-animated */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 scale-0 rounded-full bg-pink-500 opacity-0 transition-all duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-100"
          />

          <span ref={iconRef} className="relative z-10 block">
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE_BRAND }}
                  className="block"
                >
                  <CloseIcon />
                </motion.span>
              ) : (
                <motion.span
                  key="chat"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE_BRAND }}
                  className="block"
                >
                  <ChatIcon />
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          {/* selo de novidade: some assim que a pessoa abre pela primeira vez */}
          {!everOpened && (
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.35, 1], opacity: [1, 0.45, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-pink-500 ring-2 ring-ink-900"
            />
          )}
        </motion.button>

        {/* ---------- canais ---------- */}
        <AnimatePresence>
          {open && (
            <motion.ul
              id={menuId}
              className="flex flex-col-reverse items-end gap-3"
            >
              {CHANNELS.map((social, i) => (
                <motion.li
                  key={social.id}
                  initial={{ opacity: 0, y: 18, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.7 }}
                  transition={{
                    type: "spring",
                    stiffness: 460,
                    damping: 26,
                    delay: i * 0.07,
                  }}
                >
                  <motion.a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${social.label} — ${social.handle}`}
                    onClick={() => setOpen(false)}
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className="group flex items-center gap-3"
                  >
                    <span className="font-num rounded-[14px] border border-ink-600 bg-ink-800/95 px-3 py-1.5 text-[11px] font-semibold tracking-[0.24em] text-ash-400 uppercase backdrop-blur-sm transition-colors duration-200 group-hover:border-pink-500 group-hover:text-white">
                      {social.label}
                    </span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-600 bg-ink-800 text-ash-400 transition-all duration-200 group-hover:border-pink-500 group-hover:text-pink-400 group-hover:shadow-[0_0_24px_rgb(240_25_125/0.32)]">
                      <social.Icon className="h-5 w-5" />
                    </span>
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 sm:h-7 sm:w-7"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M20.5 11.6c0 4.1-3.8 7.4-8.5 7.4-1 0-2-.15-2.9-.42L4 20.5l1.5-3.6C4.05 15.5 3.5 13.6 3.5 11.6 3.5 7.5 7.3 4.2 12 4.2s8.5 3.3 8.5 7.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="8.4" cy="11.6" r="1.05" fill="currentColor" />
      <circle cx="12" cy="11.6" r="1.05" fill="currentColor" />
      <circle cx="15.6" cy="11.6" r="1.05" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 sm:h-7 sm:w-7"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="m6.5 6.5 11 11m0-11-11 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Drips, Splatter, SprayStroke } from "@/components/ui/spray";
import { footerArt } from "@/data/art";
import { navItems } from "@/data/nav";
import { WHATSAPP_DISPLAY, socialLinks } from "@/data/social";
import { isLowPowerDevice, prefersReducedMotion } from "@/lib/perf";

gsap.registerPlugin(ScrollTrigger);

const EASE_BRAND = [0.2, 0.7, 0.3, 1];

const HEADLINE = ["Bora registrar", "sua próxima luta"];

const whatsapp = socialLinks.find((s) => s.id === "whatsapp")!;

/** Ano do rodapé — só o texto do copyright depende dele. */
const YEAR = new Date().getFullYear();

const columnVariants = {
  hidden: { opacity: 0, y: 22 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_BRAND } },
};

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const artInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    if (prefersReducedMotion()) return;

    const lowPower = isLowPowerDevice();

    const ctx = gsap.context(() => {
      // a arte é um cartaz sendo colado: revela de baixo para cima
      gsap.from(artRef.current, {
        clipPath: "inset(0% 0% 100% 0%)",
        yPercent: 8,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: artRef.current, start: "top 88%" },
      });

      // parallax + respiro de escala enquanto o rodapé sobe na tela.
      // No mobile o curso é menor: a arte já ocupa quase toda a largura e um
      // deslocamento grande abriria um vão morto acima do texto.
      const shift = window.matchMedia("(min-width: 1024px)").matches ? 8 : 4;

      /*
       * A arte entra com `mix-blend-lighten` + máscara radial. Qualquer
       * movimento dela obriga o celular a refazer a mistura da imagem
       * inteira a cada quadro de rolagem — e o ganho visual é um deslize de
       * 4%. Lá fica só a revelação de entrada, que roda uma vez.
       */
      if (!lowPower) {
        gsap.fromTo(
          artInnerRef.current,
          { yPercent: shift, scale: 1.05 },
          {
            yPercent: -shift,
            scale: 0.99,
            ease: "none",
            scrollTrigger: {
              trigger: artRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          }
        );
      }

      // escorridos crescendo da borda de cima conforme o rodapé entra
      gsap.from("[data-footer='drips']", {
        scaleY: 0.2,
        opacity: 0,
        transformOrigin: "top center",
        duration: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: footer, start: "top 95%" },
      });

      // respingos com parallax leve, para o fundo não ficar estático
      if (!lowPower) {
        gsap.to("[data-footer='splat']", {
          yPercent: -22,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.9,
          },
        });
      }

      // wordmark gigante: desliza e vai abrindo o tracking com o scroll.
      // O tracking é a única parte cara (mexer em `letter-spacing` remede e
      // repinta a linha inteira a cada quadro), então no celular sobram só
      // o deslize e o fade — os dois de graça, na composição.
      const tracking = lowPower
        ? null
        : { from: "0.05em", to: "-0.03em" };

      gsap.fromTo(
        "[data-footer='wordmark']",
        {
          xPercent: -4,
          opacity: 0.2,
          ...(tracking ? { letterSpacing: tracking.from } : null),
        },
        {
          xPercent: 2,
          opacity: 1,
          ...(tracking ? { letterSpacing: tracking.to } : null),
          ease: "none",
          scrollTrigger: {
            trigger: "[data-footer='wordmark']",
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.7,
          },
        }
      );
    }, footer);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      id="contato"
      className="texture-noise relative overflow-hidden bg-ink-900 pt-20 sm:pt-28 lg:pt-32"
    >
      {/* tinta escorrendo da emenda com a seção anterior */}
      <div
        data-footer="drips"
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[18vh] sm:h-[22vh]"
      >
        <Drips seed={5} count={13} maxLength={150} className="inset-0" />
      </div>

      <Splatter
        seed={23}
        count={160}
        data-footer="splat"
        className="top-[6%] -left-[22%] h-[55vh] w-[64vw] opacity-35 sm:w-[40vw]"
      />
      <Splatter
        seed={41}
        count={130}
        data-footer="splat"
        className="-right-[18%] bottom-[8%] h-[50vh] w-[58vw] opacity-30 sm:w-[36vw]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* ---------- chamada ---------- */}
        <div className="lg:flex lg:items-center lg:gap-14">
          {/* o fundo preto da arte some no `screen`: ela funde com o rodapé */}
          <div
            ref={artRef}
            className="relative mx-auto w-full max-w-[20rem] sm:max-w-[24rem] lg:mx-0 lg:w-[44%] lg:max-w-[28rem] lg:shrink-0"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[14%] rounded-full opacity-70 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgb(240 25 125 / 0.22), transparent 70%)",
              }}
            />
            {/*
              A arte vem com fundo preto chapado. `lighten` faz esse preto
              sumir contra o rodapé e a máscara radial dissolve a borda do
              quadrado — sem isso a imagem lê como um "card" colado.
            */}
            <div ref={artInnerRef} className="relative">
              <Image
                src={footerArt.src}
                alt={footerArt.alt}
                width={footerArt.width}
                height={footerArt.height}
                sizes="(max-width: 1024px) 84vw, 28rem"
                placeholder={footerArt.blurDataURL ? "blur" : "empty"}
                blurDataURL={footerArt.blurDataURL}
                className="h-auto w-full mix-blend-lighten"
                style={{
                  maskImage:
                    "radial-gradient(circle at 50% 50%, #000 58%, transparent 92%)",
                  WebkitMaskImage:
                    "radial-gradient(circle at 50% 50%, #000 58%, transparent 92%)",
                }}
              />
            </div>
          </div>

          <div className="mt-8 sm:mt-12 lg:mt-0 lg:flex-1">
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.6, ease: EASE_BRAND }}
              className="font-num mb-6 flex items-center gap-3 text-[11px] font-semibold tracking-[0.34em] text-ash-400 uppercase sm:text-xs"
            >
              <span className="inline-block h-px w-8 bg-pink-500" aria-hidden />
              Contato
            </motion.p>

            <h2 className="font-display text-[12vw] leading-[0.88] tracking-[-0.02em] uppercase sm:text-[8vw] lg:text-[4.2rem] xl:text-[4.8rem]">
              <span className="sr-only">
                Bora registrar sua próxima luta — fale com a JML Sports
              </span>

              {HEADLINE.map((line, i) => (
                <span key={line} aria-hidden className="block overflow-hidden">
                  <motion.span
                    initial={{ y: "105%", skewY: 5 }}
                    whileInView={{ y: "0%", skewY: 0 }}
                    viewport={{ once: true, margin: "-12%" }}
                    transition={{
                      duration: 0.85,
                      delay: i * 0.12,
                      ease: EASE_BRAND,
                    }}
                    className={
                      i === 0
                        ? "text-brand-gradient block"
                        : "text-outline-pink block"
                    }
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h2>

            <motion.span
              initial={{ scaleX: 0.15, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.8, ease: EASE_BRAND }}
              style={{ transformOrigin: "left center" }}
              className="mt-4 block sm:mt-6"
            >
              <SprayStroke className="h-[14px] w-[min(72vw,24rem)]" />
            </motion.span>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE_BRAND }}
              className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-ash-400 sm:text-base"
            >
              Cobertura de campeonatos, treinos e ensaios em todo o Rio de
              Janeiro. Me chama no WhatsApp com a data do evento. A agenda de
              fim de semana fecha rápido.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.6, delay: 0.18, ease: EASE_BRAND }}
              className="mt-8 sm:mt-10"
            >
              <a
                href={whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-animated w-full justify-center sm:w-auto"
              >
                {/* o ícone sai pela direita e volta pela esquerda no hover */}
                <whatsapp.Icon className="icon-in" />
                <span className="label">Chamar no WhatsApp</span>
                <whatsapp.Icon className="icon-out" />
                <span className="circle" aria-hidden />
              </a>
            </motion.div>
          </div>
        </div>

        {/* ---------- colunas de informação ---------- */}
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: "-8%" }}
          variants={{ shown: { transition: { staggerChildren: 0.12 } } }}
          className="mt-20 grid gap-10 border-t border-ink-600 pt-12 sm:mt-24 sm:grid-cols-2 sm:gap-12 lg:grid-cols-3"
        >
          <motion.nav variants={columnVariants} aria-label="Navegação do rodapé">
            <FooterHeading>Navegação</FooterHeading>
            <ul className="mt-5 space-y-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-3 text-[15px] text-ash-400 transition-colors duration-200 hover:text-white"
                  >
                    <span
                      aria-hidden
                      className="h-px w-0 bg-pink-500 transition-all duration-200 group-hover:w-6"
                    />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>

          <motion.div variants={columnVariants}>
            <FooterHeading>Contato</FooterHeading>
            <ul className="mt-5 space-y-3">
              {socialLinks.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline gap-3 text-[15px] text-ash-400 transition-colors duration-200 hover:text-white"
                  >
                    <span className="font-num w-[5.5rem] shrink-0 text-[11px] font-semibold tracking-[0.2em] text-ash-600 uppercase transition-colors duration-200 group-hover:text-pink-500">
                      {social.label}
                    </span>
                    {social.handle}
                  </a>
                </li>
              ))}

              <li className="flex items-baseline gap-3 text-[15px] text-ash-400">
                <span className="font-num w-[5.5rem] shrink-0 text-[11px] font-semibold tracking-[0.2em] text-ash-600 uppercase">
                  Base
                </span>
                Rio de Janeiro — RJ
              </li>
            </ul>
          </motion.div>

          <motion.div
            variants={columnVariants}
            className="sm:col-span-2 lg:col-span-1"
          >
            <FooterHeading>Redes</FooterHeading>
            <ul className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <li key={social.id}>
                  <motion.a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${social.label} — ${social.handle}`}
                    whileHover={{ y: -4, scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-ink-600 bg-ink-800 text-ash-400 transition-colors duration-200 hover:border-pink-500 hover:text-pink-400 hover:shadow-[0_0_24px_rgb(240_25_125/0.28)]"
                  >
                    <social.Icon className="h-5 w-5" />
                  </motion.a>
                </li>
              ))}
            </ul>

            <p className="font-num mt-6 text-[11px] leading-relaxed font-semibold tracking-[0.24em] text-ash-600 uppercase">
              Foco <span className="text-pink-500/70">/</span> Agilidade{" "}
              <span className="text-pink-500/70">/</span> Excelência
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ---------- wordmark sangrando na borda de baixo ---------- */}
      <div className="relative mt-16 overflow-hidden sm:mt-20">
        <span
          data-footer="wordmark"
          aria-hidden
          className="text-outline-pink font-display block -mb-[0.16em] px-4 text-center text-[19vw] leading-[0.8] whitespace-nowrap"
        >
          JML Sports
        </span>
      </div>

      {/* ---------- barra final ---------- */}
      <div className="relative border-t border-ink-600">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-num text-[11px] tracking-[0.2em] text-ash-600 uppercase">
            © <span suppressHydrationWarning>{YEAR}</span> JML Sports —
            Fotografia esportiva
          </p>

          <div className="font-num flex items-center gap-5 text-[11px] tracking-[0.2em] text-ash-600 uppercase">
            <span>{WHATSAPP_DISPLAY}</span>
            <Link
              href="/#topo"
              className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-pink-500"
            >
              Topo
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 19V5m0 0-6 6m6-6 6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-num flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] text-white uppercase">
      <span className="inline-block h-px w-5 bg-pink-500" aria-hidden />
      {children}
    </h3>
  );
}

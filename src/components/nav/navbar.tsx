"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { SlideTabs, type SlideTab } from "@/components/ui/slide-tabs";
import { Drips, Splatter } from "@/components/ui/spray";
import { navItems, type NavItem } from "@/data/nav";
import { socialLinks } from "@/data/social";
import { prefersReducedMotion } from "@/lib/perf";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const EASE_BRAND = [0.2, 0.7, 0.3, 1];

const tabs: SlideTab[] = navItems.map((item) => ({
  id: item.href,
  label: item.short ?? item.label,
}));

const reduceMotion = prefersReducedMotion;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const toggleId = useId();

  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [active, setActive] = useState(0);

  const isHome = pathname === "/";

  /* ---------- seção ativa ---------- */
  useEffect(() => {
    if (!isHome) {
      const i = navItems.findIndex((item) => item.href === pathname);
      setActive(i === -1 ? 0 : i);
      return;
    }

    const watched = navItems
      .map((item, index) => ({ index, el: item.section && document.getElementById(item.section) }))
      .filter((entry): entry is { index: number; el: HTMLElement } => Boolean(entry.el));

    if (!watched.length) return;

    // a seção que ocupa a faixa central da tela é a "atual"
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        const match = watched.find((w) => w.el === visible.target);
        if (match) setActive(match.index);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    watched.forEach((w) => observer.observe(w.el));
    return () => observer.disconnect();
  }, [isHome, pathname]);

  /* ---------- fundo e auto-hide da barra ---------- */
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    /*
     * Este callback roda a cada quadro de rolagem, então ele não pode nem
     * criar tween nem mexer no estado do React sem necessidade: antes,
     * cada quadro instanciava um `gsap.to` novo (com `overwrite`, o que
     * ainda obriga a varrer os tweens existentes) e chamava `setSolid`.
     * Agora só o que muda é escrito.
     */
    let hidden: boolean | null = null;
    let isSolid: boolean | null = null;

    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();

        const solidNow = y > 40;
        if (solidNow !== isSolid) {
          isSolid = solidNow;
          setSolid(solidNow);
        }

        // esconde ao descer, revela ao subir — mas nunca com o menu aberto
        if (open || reduceMotion()) return;

        const hide = self.direction === 1 && y > 240;
        if (hide === hidden) return;
        hidden = hide;

        gsap.to(header, {
          yPercent: hide ? -130 : 0,
          duration: 0.45,
          ease: "power3.out",
          overwrite: true,
        });
      },
    });

    return () => trigger.kill();
  }, [open]);

  // com o menu aberto a barra tem que estar sempre à vista
  useEffect(() => {
    if (open && headerRef.current) {
      gsap.to(headerRef.current, { yPercent: 0, duration: 0.3, overwrite: true });
    }
  }, [open]);

  /* ---------- trava a rolagem enquanto o menu está aberto ---------- */
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // trocou de rota: fecha o menu
  useEffect(() => setOpen(false), [pathname]);

  /**
   * Âncora na própria home vira rolagem animada; qualquer outra coisa segue
   * como navegação normal do Next.
   */
  const goTo = useCallback(
    (item: NavItem) => (event?: React.MouseEvent) => {
      setOpen(false);

      if (!isHome || !item.section) return;

      const target = document.getElementById(item.section);
      if (!target) return;

      event?.preventDefault();

      if (reduceMotion()) {
        target.scrollIntoView();
        return;
      }

      gsap.to(window, {
        duration: 1.1,
        ease: "power2.inOut",
        scrollTo: { y: target, autoKill: true },
      });
    },
    [isHome]
  );

  return (
    <>
      {/* o <header> é do GSAP (auto-hide); a entrada vive na camada de dentro */}
      <header ref={headerRef} className="fixed inset-x-0 top-0 z-50">
        {/* `.nav-shell` está em globals.css: é lá que o modo econômico troca
            o `backdrop-filter` por um fundo opaco no celular */}
        <div className={`nav-enter nav-shell ${solid && !open ? "is-solid" : ""}`}>
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
            <Link
              href="/#topo"
              onClick={goTo(navItems[0])}
              aria-label="JML Sports — início"
              className="relative z-10 block transition-transform duration-200 hover:scale-105"
            >
              <Image
                src="/logo_bg.png"
                alt=""
                width={500}
                height={500}
                priority
                sizes="48px"
                className="h-11 w-11 object-contain sm:h-12 sm:w-12"
              />
            </Link>

            {/* desktop: abas com cursor deslizante */}
            <nav aria-label="Navegação principal" className="hidden md:block">
              <SlideTabs
                tabs={tabs}
                selected={active}
                onSelect={(i) => {
                  const item = navItems[i];
                  if (item.section && isHome) {
                    goTo(item)();
                    return;
                  }
                  router.push(item.href);
                }}
              />
            </nav>

            {/* mobile: a chave */}
            <div className="md:hidden">
              <input
                type="checkbox"
                id={toggleId}
                className="nav-toggle-input"
                checked={open}
                onChange={(e) => setOpen(e.target.checked)}
              />
              <label
                htmlFor={toggleId}
                className="nav-toggle relative z-10"
                aria-label={open ? "Fechar menu" : "Abrir menu"}
                aria-expanded={open}
                aria-controls="menu-mobile"
              >
                <span className="bar bar-top" />
                <span className="bar bar-mid" />
                <span className="bar bar-bottom" />
              </label>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        open={open}
        active={active}
        onNavigate={goTo}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

type MobileMenuProps = {
  open: boolean;
  active: number;
  onNavigate: (item: NavItem) => (event?: React.MouseEvent) => void;
  onClose: () => void;
};

function MobileMenu({ open, active, onNavigate, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // os respingos e escorridos entram por GSAP, fora do ciclo do framer
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel || reduceMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-menu='drips']", {
        scaleY: 0,
        transformOrigin: "top center",
        duration: 0.9,
        ease: "power2.out",
      });
      gsap.from("[data-menu='splat']", {
        scale: 0.6,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power2.out",
      });
    }, panel);

    return () => ctx.revert();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id="menu-mobile"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.55, ease: EASE_BRAND }}
          /* overflow-x travado: os respingos saem da caixa e, sem isso,
             `overflow-y-auto` deixaria o painel rolar de lado */
          className="texture-noise fixed inset-0 z-40 flex flex-col overflow-x-hidden overflow-y-auto bg-ink-900 md:hidden"
        >
          <div
            data-menu="drips"
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[16vh]"
          >
            <Drips seed={13} count={11} maxLength={120} className="inset-0" />
          </div>

          <Splatter
            seed={7}
            count={150}
            data-menu="splat"
            className="-top-[6%] -right-[24%] h-[46vh] w-[70vw] opacity-40"
          />
          <Splatter
            seed={29}
            count={120}
            data-menu="splat"
            className="-bottom-[10%] -left-[26%] h-[42vh] w-[68vw] opacity-30"
          />

          <nav
            aria-label="Navegação principal"
            className="relative flex flex-1 flex-col justify-center px-6 pt-24 pb-10"
          >
            <ul>
              {navItems.map((item, i) => (
                <li key={item.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "110%", skewY: 5 }}
                    animate={{ y: "0%", skewY: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.18 + i * 0.08,
                      ease: EASE_BRAND,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={onNavigate(item)}
                      aria-current={active === i ? "page" : undefined}
                      className="group flex items-baseline gap-4 py-2"
                    >
                      <span className="font-num w-7 shrink-0 text-[11px] font-semibold tracking-[0.2em] text-pink-500">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`font-display text-[13vw] leading-[1.05] uppercase transition-colors duration-200 ${
                          active === i
                            ? "text-brand-gradient"
                            : "text-white/90 group-hover:text-pink-400"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: EASE_BRAND }}
            className="relative border-t border-ink-600 px-6 py-6"
          >
            <p className="font-num mb-4 text-[11px] font-semibold tracking-[0.3em] text-ash-600 uppercase">
              Redes
            </p>
            <ul className="flex gap-3">
              {socialLinks.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    aria-label={`${social.label} — ${social.handle}`}
                    className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-ink-600 bg-ink-800 text-ash-400 transition-colors duration-200 hover:border-pink-500 hover:text-pink-400"
                  >
                    <social.Icon className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

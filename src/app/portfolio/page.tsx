import type { Metadata } from "next";

import Footer from "@/components/footer/footer";
import ChampionshipSphere from "@/components/portfolio/championship-sphere";
import { Splatter, SprayStroke } from "@/components/ui/spray";
import { championships } from "@/data/championships";

export const metadata: Metadata = {
  title: "Portfólio — JML Sports | Jamal",
  description:
    "Campeonatos de Jiu-Jitsu cobertos por Jamal no Rio de Janeiro: Carlson Gracie, CBJJD, Copa do Brasil BJJ, Copa Javali, FJJP-Rio e mais.",
};

export default function PortfolioPage() {
  return (
    <main className="w-full bg-ink-900">
      <section className="texture-noise relative overflow-hidden px-5 pt-28 pb-20 sm:px-8 sm:pt-36 sm:pb-28">
        <Splatter
          seed={19}
          count={160}
          className="-top-[8%] -right-[22%] h-[60vh] w-[64vw] opacity-35 sm:w-[36vw]"
        />
        <Splatter
          seed={53}
          count={120}
          className="-bottom-[14%] -left-[24%] h-[50vh] w-[62vw] opacity-25 sm:w-[32vw]"
        />

        <div className="relative mx-auto w-full max-w-6xl">
          <p className="font-num mb-6 flex items-center gap-3 text-[11px] font-semibold tracking-[0.34em] text-ash-400 uppercase sm:text-xs">
            <span className="inline-block h-px w-8 bg-pink-500" aria-hidden />
            Acervo
          </p>

          <h1 className="font-display text-[14vw] leading-[0.88] tracking-[-0.02em] uppercase sm:text-[9vw] lg:text-[5.5rem]">
            <span className="text-brand-gradient block">Campeonatos</span>
            <span className="text-outline-pink block">cobertos</span>
          </h1>

          <span className="mt-4 block sm:mt-6">
            <SprayStroke className="h-[14px] w-[min(72vw,26rem)]" />
          </span>

          <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-ash-400 sm:text-base">
            Eventos de Jiu-Jitsu registrados na beira do tatame, do primeiro
            combate da manhã à final. Gire a esfera ou escolha um evento na
            lista.
          </p>

          <div className="mt-14 sm:mt-20">
            <ChampionshipSphere />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

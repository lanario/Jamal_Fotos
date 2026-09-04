"use client";

import { useSyncExternalStore } from "react";

/**
 * Nível de desempenho da máquina que está vendo o site.
 *
 * O portfólio é pesado de propósito — túnel 3D, centenas de respingos,
 * escorridos, grão, halos. Numa máquina boa isso é a identidade da marca;
 * num PC fraco vira travamento, e um site que engasga não passa a impressão
 * de qualidade que o Jamal precisa passar. Então o peso é regulável:
 *
 *   high → tudo ligado, como projetado
 *   mid  → menos camadas por quadro (fotos coloridas duplicadas, parallax)
 *   low  → só o essencial: composição igual, movimento e camadas cortados
 *
 * O nível vem de duas fontes, nesta ordem:
 *
 * 1. **Palpite** pelo que o navegador conta (núcleos, memória, economia de
 *    dados, `prefers-reduced-motion`). Barato e imediato, mas mente: um PC de
 *    4 núcleos e 8 GB pode ter uma GPU integrada terrível.
 * 2. **Medida** — o cão de guarda abaixo cronometra os quadros de verdade e
 *    rebaixa o nível se a máquina não estiver dando conta. É esta que pega o
 *    PC fraco que o palpite deixou passar.
 *
 * O resultado fica na sessão: navegar para outra página já começa no nível
 * medido, sem precisar engasgar de novo para descobrir.
 */
export type PerfTier = "high" | "mid" | "low";

const STORAGE_KEY = "jml:perf-tier";
const STEPS: PerfTier[] = ["high", "mid", "low"];

/**
 * `null` = ainda não sabemos (servidor e primeiro render do cliente).
 * Os componentes usam isso para não gerar no HTML do servidor um enfeite que
 * talvez nem exista no cliente — e, de quebra, o HTML sai bem menor.
 */
let tier: PerfTier | null = null;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((notify) => notify());

const matches = (query: string) =>
  typeof window !== "undefined" && window.matchMedia(query).matches;

/* ------------------------------------------------------------------ *
 * Palpite inicial
 * ------------------------------------------------------------------ */

type Hinted = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

function guess(): PerfTier {
  if (typeof window === "undefined") return "high";

  // já medimos esta máquina nesta sessão
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved === "low" || saved === "mid" || saved === "high") return saved;
  } catch {
    // sessionStorage bloqueado (aba anônima com cookies travados): segue o jogo
  }

  const nav = navigator as Hinted;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;

  const base: PerfTier = nav.connection?.saveData
    ? "low"
    : // tela que não consegue repintar rápido (e-ink, TV antiga)
      matches("(update: slow)")
      ? "low"
      : cores <= 2 || memory <= 2
        ? "low"
        : cores <= 4 || memory <= 4
          ? "mid"
          : "high";

  /*
   * Quem pediu menos movimento não pediu menos fotografia: o pedido é sobre
   * o que se mexe, e as camadas que se mexem (deriva das nuvens, parallax,
   * pulso das gotas) já saem todas no `mid`. Por isso o teto é `mid`, e não
   * `low` — a máquina continua podendo ser rebaixada pelos outros sinais.
   */
  if (matches("(prefers-reduced-motion: reduce)")) return worst(base, "mid");

  return base;
}

/** O pior (mais econômico) entre dois níveis. */
const worst = (a: PerfTier, b: PerfTier) =>
  STEPS.indexOf(a) > STEPS.indexOf(b) ? a : b;

/* ------------------------------------------------------------------ *
 * Estado
 * ------------------------------------------------------------------ */

function remember(next: PerfTier) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, next);
  } catch {
    // idem: sem sessão persistida, só perdemos o atalho da próxima página
  }
}

function set(next: PerfTier) {
  if (tier === next) return;
  tier = next;
  // o CSS lê daqui: `[data-perf="low"]` desliga filtro, blend e desfoque
  document.documentElement.dataset.perf = next;
  remember(next);
  emit();
}

/** Desce um degrau. Nunca sobe: a máquina não fica mais rápida no meio. */
function demote() {
  const i = STEPS.indexOf(tier ?? "high");
  if (i >= STEPS.length - 1) return false;
  set(STEPS[i + 1]!);
  return true;
}

/* ------------------------------------------------------------------ *
 * Cão de guarda: mede o quadro de verdade
 * ------------------------------------------------------------------ */

/** Acima disto (ms por quadro) a máquina não está entregando ~48 fps. */
const SLOW_FRAME = 21;
/** Quantos quadros formam uma amostra. ~1,5 s a 60 fps. */
const SAMPLE = 90;
/** Ignora o começo: entrada do lockup e decodificação das fotos. */
const WARMUP = 1400;
/** Depois disto para de medir — quem passou, passou. */
const WATCH_FOR = 25000;

function watch() {
  let raf = 0;
  const started = performance.now();
  let last = started;
  let cooldown = 0;
  const frames: number[] = [];

  const loop = (now: number) => {
    const dt = now - last;
    last = now;

    // quadros absurdos são aba escondida / janela arrastada, não lentidão
    if (now - started > WARMUP && dt < 250 && !document.hidden) {
      frames.push(dt);
    }

    if (frames.length >= SAMPLE) {
      frames.sort((a, b) => a - b);
      const median = frames[frames.length >> 1]!;
      frames.length = 0;

      if (median > SLOW_FRAME && now > cooldown) {
        // pausa antes de rebaixar de novo: o corte anterior precisa valer
        cooldown = now + 2500;
        if (!demote() || tier === "low") return;
      }
    }

    if (now - started > WATCH_FOR) return;
    raf = requestAnimationFrame(loop);
  };

  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

/* ------------------------------------------------------------------ *
 * Pintura: quando a decoração pode entrar
 * ------------------------------------------------------------------ */

/**
 * Respingos e escorridos são enfeite: centenas de nós que não mudam o que a
 * página diz. Numa máquina boa eles entram junto com o resto. Numa máquina
 * fraca, montá-los na hidratação é roubar exatamente os quadros da entrada do
 * lockup e da primeira rolagem — o momento em que a pessoa decide se o site é
 * bom. Então lá eles esperam a máquina ficar ociosa.
 */
let painted = false;
const painters = new Set<() => void>();

function releasePaint() {
  if (painted) return;
  painted = true;
  painters.forEach((notify) => notify());
}

function schedulePaint(level: PerfTier) {
  if (level === "high") {
    releasePaint();
    return () => {};
  }

  const idle = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }
  ).requestIdleCallback;

  if (idle) {
    // o timeout é o teto: mesmo numa máquina que nunca fica ociosa, a
    // decoração entra em 2 s
    const id = idle(releasePaint, { timeout: 2000 });
    return () => window.cancelIdleCallback?.(id);
  }

  const id = window.setTimeout(releasePaint, 1200);
  return () => window.clearTimeout(id);
}

/** `true` quando a decoração pesada já pode ser montada. */
export function useDecorReady(): boolean {
  return useSyncExternalStore(
    (notify) => {
      painters.add(notify);
      return () => painters.delete(notify);
    },
    () => painted,
    () => false
  );
}

/* ------------------------------------------------------------------ *
 * API
 * ------------------------------------------------------------------ */

/** Liga o sistema. Chamado uma vez, pelo `PerfBoot` no layout. */
export function initPerf() {
  set(guess());

  const stopPaint = schedulePaint(tier!);
  if (tier === "low") return stopPaint;

  const stopWatch = watch();
  return () => {
    stopPaint();
    stopWatch();
  };
}

/** Nível atual fora do React (laços, handlers). `null` = ainda não sabido. */
export const perfTier = () => tier;

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/**
 * Nível atual, reagindo a rebaixamentos.
 *
 * Devolve `null` no servidor E no primeiro render do cliente — é o que
 * garante que a hidratação bata. Quem depende disso para decidir quantos
 * elementos criar deve tratar `null` como "ainda não, espera o próximo
 * render": o enfeite entra logo depois, e o HTML do servidor sai leve.
 */
export function usePerfTier(): PerfTier | null {
  return useSyncExternalStore(
    subscribe,
    () => tier,
    () => null
  );
}

/** Escolhe um valor por nível. Sem nível ainda, vale o de máquina boa. */
export function byTier<T>(
  level: PerfTier | null,
  options: { high: T; mid: T; low: T }
): T {
  return options[level ?? "high"];
}

/** Atalho: `true` só quando a máquina aguenta o pacote completo. */
export const isFull = (level: PerfTier | null) => level === "high";

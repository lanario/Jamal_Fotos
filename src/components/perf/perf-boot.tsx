"use client";

import { useEffect } from "react";

import { initPerf } from "@/lib/perf";

/**
 * Liga o medidor de desempenho. Não desenha nada: só descobre em que nível
 * esta máquina consegue rodar o site e avisa quem estiver ouvindo
 * (`usePerfTier`) e o CSS (`<html data-perf="...">`).
 *
 * Vive no layout para valer nas duas páginas, e num efeito — não durante o
 * render — porque o palpite lê `matchMedia`/`sessionStorage`.
 */
export default function PerfBoot() {
  useEffect(() => initPerf(), []);
  return null;
}

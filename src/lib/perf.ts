"use client";

import { useEffect, useState } from "react";

/**
 * Orçamento de quadro por dispositivo.
 *
 * O desktop aguenta o pacote completo (filtros, sombras, blend, dezenas de
 * tweens). O celular não: GPU integrada, tela de alta densidade e o mesmo
 * quadro de 16 ms para pintar tudo. Aqui ficam as duas perguntas que o resto
 * do site faz antes de decidir quanto movimento pode gastar — e o utilitário
 * que desliga laços de animação fora da tela.
 */

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const NO_MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

/**
 * Telas de toque e/ou estreitas. É o mesmo recorte do CSS
 * (`globals.css` → bloco "modo econômico"), para JS e folha de estilo nunca
 * discordarem sobre o que é "mobile".
 */
export const LOW_POWER_QUERY = "(max-width: 900px), (pointer: coarse)";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** Aparelho com pouco fôlego para animação — celular, tablet, tela de toque. */
export const isLowPowerDevice = () =>
  typeof window !== "undefined" && window.matchMedia(LOW_POWER_QUERY).matches;

/**
 * Versão em React da pergunta acima.
 *
 * Começa em `false` de propósito: o HTML do servidor não sabe o dispositivo e
 * precisa bater com o primeiro render do cliente. O valor real chega no efeito,
 * antes de qualquer animação começar.
 */
export function useLowPower() {
  const [low, setLow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(LOW_POWER_QUERY);
    const sync = () => setLow(mq.matches);

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return low;
}

/**
 * Avisa quando vale a pena manter um laço de animação rodando: o elemento
 * está na tela E a aba está visível.
 *
 * Sem isto, o túnel do hero e a esfera do portfólio continuam recalculando
 * dezenas de transforms por quadro enquanto a pessoa lê o rodapé — é essa
 * concorrência que trava a rolagem no celular.
 */
export function watchActivity(
  el: Element,
  onChange: (active: boolean) => void,
  rootMargin = "15%"
) {
  let onScreen = true;
  let emitted: boolean | null = null;

  const emit = () => {
    const active = onScreen && !document.hidden;
    if (active === emitted) return;
    emitted = active;
    onChange(active);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      onScreen = entry.isIntersecting;
      emit();
    },
    { rootMargin }
  );

  observer.observe(el);
  document.addEventListener("visibilitychange", emit);
  emit();

  return () => {
    observer.disconnect();
    document.removeEventListener("visibilitychange", emit);
  };
}

"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` no cliente, `useEffect` no servidor — evita o aviso do
 * React durante o SSR sem abrir mão de aplicar layout antes do paint.
 *
 * Vive aqui, e não em `utils.ts`, porque aquele módulo é importado por
 * componentes de servidor (`spray.tsx` → páginas): um import de hook no topo
 * do arquivo faz o Next recusar o módulo inteiro no servidor.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

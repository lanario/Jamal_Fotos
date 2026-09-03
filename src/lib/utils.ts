import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Interpolação linear inversa com clamp — 0 em `a`, 1 em `b`. */
export const invLerp = (a: number, b: number, v: number) =>
  a === b ? 0 : clamp((v - a) / (b - a), 0, 1);

/** Modulo sempre positivo (JS retorna negativo para dividendo negativo). */
export const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * PRNG determinístico por índice — mesma saída no servidor e no cliente,
 * essencial para não quebrar a hidratação com respingos "aleatórios".
 */
export function seeded(i: number, salt = 0) {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

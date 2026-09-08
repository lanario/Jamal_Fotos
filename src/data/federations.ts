import { championships } from "@/data/championships";
import { federationLogos } from "@/data/logos";
import type { GalleryImage } from "@/lib/types";

export type Federation = {
  /** Sigla — é o que aparece na tira. */
  name: string;
  logo: GalleryImage;
  /**
   * Eventos da lista de campeonatos que pertencem a essa federação. Uma
   * federação pode cobrir mais de um (LJJB tem Angra e o Sulamericano), e pode
   * não ter nenhum amarrado ainda — nesse caso a seta leva ao acervo inteiro.
   */
  eventSlugs: string[];
};

/**
 * As cinco federações dos campeonatos cobertos. A ordem é a dos arquivos em
 * public/pictures/logo_camps; a chave da logo é o nome do arquivo, sem extensão.
 */
export const federations: Federation[] = [
  {
    name: "CBJJD",
    logo: federationLogos.CBJJD,
    eventSlugs: ["cbjjd", "valdes-cbjjd-saquarema"],
  },
  {
    name: "CBJJO",
    logo: federationLogos.CBJJO,
    eventSlugs: [],
  },
  {
    name: "Copa Javali",
    logo: federationLogos.COPA_JAVALI,
    eventSlugs: ["copa-javali"],
  },
  {
    name: "FJJP-Rio",
    logo: federationLogos.FJJP,
    eventSlugs: ["fjjp-rio"],
  },
  {
    name: "LJJB",
    logo: federationLogos.LJJB,
    eventSlugs: ["ljjb-angra", "ljjb-sulamericano"],
  },
];

const bySlug = new Map(championships.map((c) => [c.slug, c]));

/** Fotos somadas dos eventos da federação. */
export const federationPhotoCount = (federation: Federation) =>
  federation.eventSlugs.reduce(
    (total, slug) => total + (bySlug.get(slug)?.photos.length ?? 0),
    0
  );

/** Primeiro evento da federação; sem nenhum, o acervo inteiro. */
export const federationHref = (federation: Federation) =>
  federation.eventSlugs.length
    ? `/portfolio?evento=${federation.eventSlugs[0]}`
    : "/portfolio";

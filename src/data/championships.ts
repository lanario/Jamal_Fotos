import type { ImageData } from "@/components/ui/img-sphere";
import { galleryImages } from "@/data/gallery";
import type { GalleryImage } from "@/lib/types";

export type Championship = {
  slug: string;
  name: string;
  photos: GalleryImage[];
};

/** Eventos cobertos, na ordem passada pelo Jamal. */
const NAMES = [
  "Carlson Gracie",
  "CBJJD",
  "Copa do Brasil BJJ",
  "Copa Javali",
  "FJJP-Rio",
  "Liga Desportiva Carioca",
  "LJJB - Angra",
  "LJJB - Sulamericano",
  "Valdes - CBJJD - Saquarema",
];

const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const championships: Championship[] = NAMES.map((name) => ({
  slug: slugify(name),
  name,
  photos: [],
}));

/**
 * PROVISÓRIO — as fotos ainda não estão separadas por evento. Até chegarem os
 * conjuntos certos, o acervo é repartido em rodízio entre os campeonatos.
 * A distribuição é determinística de propósito: `Math.random()` daria
 * resultados diferentes no servidor e no cliente e quebraria a hidratação.
 */
galleryImages.forEach((photo, i) => {
  championships[i % championships.length].photos.push(photo);
});

/**
 * Uma bolha por evento — a primeira foto do conjunto é a capa. Clicar abre a
 * galeria daquele campeonato, então nada de repetir fotos aqui: cada peça da
 * esfera precisa corresponder a exatamente um evento.
 */
export const championshipTiles: ImageData[] = championships.map(
  (championship) => {
    const cover = championship.photos[0];

    return {
      id: championship.slug,
      src: cover.src,
      alt: `${championship.name} — cobertura JML Sports`,
      blurDataURL: cover.blurDataURL,
      title: championship.name,
      description: `${championship.photos.length} fotos`,
      groupId: championship.slug,
    };
  }
);

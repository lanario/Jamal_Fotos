import { eventFolders } from "@/data/events";
import type { GalleryImage } from "@/lib/types";

export type Championship = {
  slug: string;
  name: string;
  photos: GalleryImage[];
};

/**
 * Os eventos cobertos são exatamente as pastas de `public/portifolio` que têm
 * foto — não existe lista de nomes aqui de propósito. Soltar uma pasta e rodar
 * `npm run images` põe o evento na galeria; tirar a pasta o remove. Uma lista
 * paralela a isso só teria como destino sair de sincronia com o acervo.
 *
 * A ordem e os nomes vêm do manifesto, que ordena as pastas alfabeticamente.
 */
export const championships: Championship[] = eventFolders.map(
  ({ slug, name, photos }) => ({ slug, name, photos })
);

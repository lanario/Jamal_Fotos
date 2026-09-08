"use client";

import { useEffect, useMemo, useState } from "react";

import EventGalleryModal from "@/components/portfolio/event-gallery-modal";
import ImageGallery, { type GalleryStrip } from "@/components/ui/image-gallery";
import { championships } from "@/data/championships";

/**
 * Uma tira por campeonato, no mesmo leque das federações da home. A capa é a
 * primeira foto da pasta do evento — aqui a tira já é a prévia da cobertura,
 * então nada de logo.
 */
const strips: GalleryStrip[] = championships.map((championship) => ({
  id: championship.slug,
  image: championship.photos[0],
  title: championship.name,
  meta: `${championship.photos.length} fotos`,
}));

/**
 * A seleção de campeonatos do portfólio.
 *
 * As tiras só abrem o leque; quem leva às fotos é a seta, e ela abre o mesmo
 * modal de sempre — o portfólio inteiro vive numa rota só, então navegar aqui
 * seria trocar a página por ela mesma.
 */
export default function ChampionshipGallery() {
  const [selected, setSelected] = useState(championships[0].slug);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  /*
   * `?evento=<slug>` — as tiras da home apontam para um campeonato específico,
   * então chegar aqui já com aquela galeria aberta é o que o clique prometeu.
   *
   * Lido de `location.search` num efeito de montagem, e não com o
   * `useSearchParams` do Next: numa página estática aquele hook precisa de um
   * limite de Suspense e faz a subárvore renderizar de novo no cliente — na
   * prática o bloco montava duas vezes e só uma das montagens enxergava o
   * parâmetro, então o link abria a galeria uma vez sim, outra não.
   *
   * Só na montagem, de propósito: fechar a galeria não pode reabri-la, e não
   * existe link que troque a query sem sair desta página.
   */
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("evento");
    if (!slug || !championships.some((c) => c.slug === slug)) return;

    setSelected(slug);
    setOpenSlug(slug);
  }, []);

  const opened = useMemo(
    () => championships.find((c) => c.slug === openSlug) ?? null,
    [openSlug],
  );

  return (
    <>
      <ImageGallery
        items={strips}
        label="Campeonatos cobertos por Jamal"
        selectedId={selected}
        onSelect={setSelected}
        onOpen={setOpenSlug}
      />

      <EventGalleryModal
        championship={opened}
        onClose={() => setOpenSlug(null)}
      />
    </>
  );
}

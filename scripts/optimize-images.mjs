/**
 * Otimiza os originais e gera os manifestos tipados, com blur placeholder.
 *
 *   npm run images
 *
 * Quatro origens, cada uma com seu destino:
 *
 *   public/portifolio/<Evento>  → public/eventos/<slug>  + src/data/events.ts
 *                                                        + src/data/event-counts.ts
 *   public/pictures/hero        → public/hero            + src/data/hero.ts
 *   public/pictures/logo_camps  → public/logos           + src/data/logos.ts
 *   public/pictures/<avulsas>   → public/portrait, /art  + src/data/{portrait,art}.ts
 *
 * Mais os ícones do app, achatados a partir de public/logo_bg.png.
 */
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "public", "pictures");

/**
 * Marca -> icones do app. O PNG da logo tem fundo transparente e ~400 KB;
 * como favicon ele seria servido cru (pesado) e sumiria em aba clara, porque
 * a flor e branca. Por isso os icones saem achatados sobre o --ink-900.
 */
const LOGO = path.join(ROOT, "public", "logo_bg.png");
const INK_900 = { r: 10, g: 10, b: 10, alpha: 1 };
const ICONS = [
  { out: path.join(ROOT, "src", "app", "icon.png"), size: 128, pad: 0.08 },
  { out: path.join(ROOT, "src", "app", "apple-icon.png"), size: 180, pad: 0.14 },
];

/**
 * Imagens avulsas: vivem em public/pictures mas NAO entram no tunel do hero.
 * Cada grupo vira um diretorio proprio em public/ e um manifesto em src/data.
 */
const SINGLES = [
  {
    label: "retrato",
    dir: path.join(ROOT, "public", "portrait"),
    manifest: path.join(ROOT, "src", "data", "portrait.ts"),
    width: 1400,
    quality: 82,
    suffix: "Portrait",
    files: new Map([
      [
        "jamal_imagem.jpg",
        {
          name: "jamal",
          alt: "Jamal em cobertura, de câmera em punho no meio do público",
        },
      ],
    ]),
  },
  {
    label: "arte",
    dir: path.join(ROOT, "public", "art"),
    manifest: path.join(ROOT, "src", "data", "art.ts"),
    width: 1200,
    // stencil + meio-tom: pontos finos viram borrão se a qualidade cair muito
    quality: 92,
    suffix: "Art",
    files: new Map([
      [
        "footer.jpeg",
        {
          name: "footer",
          alt: "Ilustração stencil de uma projeção de judô, com spray rosa sobre fundo preto",
        },
      ],
    ]),
  },
];

/**
 * Fotos do tunel do hero: curadoria propria, escolhidas a dedo, sem relacao
 * com as pastas dos campeonatos.
 */
const HERO_DIR = path.join(SRC_DIR, "hero");
const HERO_OUT = path.join(ROOT, "public", "hero");
const HERO_MANIFEST = path.join(ROOT, "src", "data", "hero.ts");

/**
 * Logos das federacoes. Saem com o alpha preservado e sem fundo chapado: quem
 * pinta atras e a tira da galeria, no preto da marca.
 */
const LOGOS_DIR = path.join(SRC_DIR, "logo_camps");
const LOGOS_OUT = path.join(ROOT, "public", "logos");
const LOGOS_MANIFEST = path.join(ROOT, "src", "data", "logos.ts");
const LOGO_WIDTH = 640;

/**
 * Fotos por campeonato — a origem principal do site. Cada subpasta de
 * `public/portifolio` e um evento e o nome da pasta e o nome que aparece na
 * galeria ("COPA JAVALI"). Os originais nao sao servidos nem versionados (sao
 * ~1 GB, e a pasta esta no .gitignore): o que vai para o ar e o
 * `public/eventos/<slug>` otimizado, com os manifestos ao lado.
 */
const EVENTS_DIR = path.join(ROOT, "public", "portifolio");
const EVENTS_OUT = path.join(ROOT, "public", "eventos");
const EVENTS_MANIFEST = path.join(ROOT, "src", "data", "events.ts");

/**
 * Só as contagens, num arquivo à parte.
 *
 * A home mostra "38 fotos" na tira da federação e mais nada — mas importar o
 * manifesto cheio para ler um `.length` arrasta junto os blur placeholders das
 * 262 fotos, que são ~27 KB comprimidos no primeiro carregamento de quem nem
 * chegou no portfólio. Este arquivo é um mapa de números.
 */
const EVENT_COUNTS_MANIFEST = path.join(
  ROOT,
  "src",
  "data",
  "event-counts.ts"
);

const MAX_WIDTH = 1600;
const QUALITY = 78;
const BLUR_WIDTH = 16;

const isPhoto = (f) => /\.(jpe?g|png|webp|avif)$/i.test(f);

/**
 * Os nomes chegam do Drive com acento e espaco ("Copia de INST1-10.jpg",
 * "COPA JAVALI"), entao o slug e agressivo antes de virar caminho publico:
 * a pasta "COPA JAVALI" vira o evento de slug "copa-javali", e e por esse
 * slug que a tira de federacoes da home aponta para ele.
 */
const slugify = (name) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// IMG-10 -> ["IMG", 10] para ordenar numericamente em vez de alfabeticamente
const naturalKey = (name) => {
  const m = name.match(/^(.*?)(\d+)?\.[^.]+$/);
  return [m?.[1] ?? name, Number(m?.[2] ?? 0)];
};

async function main() {
  for (const group of SINGLES) await buildSingles(group);
  await buildHero();
  await buildLogos();
  await buildEvents();
  await buildIcons();
}

/** Favicon e ícone de app, achatados sobre o preto da marca. */
async function buildIcons() {
  for (const { out, size, pad } of ICONS) {
    const inner = Math.round(size * (1 - pad * 2));

    const mark = await sharp(LOGO)
      .resize(inner, inner, { fit: "contain", background: { ...INK_900, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: INK_900,
      },
    })
      .composite([{ input: mark, gravity: "center" }])
      .png({ compressionLevel: 9, palette: true })
      .toFile(out);

    console.log(`✓ ícone ${path.basename(out)} (${size}×${size})`);
  }
}

/** Imagens avulsas (retrato do Jamal, artes) — ficam fora do túnel do hero. */
async function buildSingles({ label, dir, manifest, width, quality, suffix, files }) {
  if (files.size === 0) return;
  await mkdir(dir, { recursive: true });

  const publicDir = path.basename(dir);
  const blocks = [];

  for (const [file, { name, alt }] of files) {
    const input = sharp(path.join(SRC_DIR, file)).rotate();
    const outName = `${name}.webp`;

    const info = await input
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toFile(path.join(dir, outName));

    const blur = await input
      .clone()
      .resize({ width: BLUR_WIDTH })
      .webp({ quality: 40 })
      .toBuffer();

    const fields = [
      `  src: ${JSON.stringify(`/${publicDir}/${outName}`)},`,
      `  alt: ${JSON.stringify(alt ?? name)},`,
      `  width: ${info.width},`,
      `  height: ${info.height},`,
      `  blurDataURL: ${JSON.stringify(`data:image/webp;base64,${blur.toString("base64")}`)},`,
    ].join("\n");

    blocks.push(
      `export const ${name}${suffix}: GalleryImage = {\n${fields}\n};`
    );

    console.log(`✓ ${label} ${file} → ${outName} (${info.width}×${info.height})`);
  }

  await writeFile(
    manifest,
    `// GERADO AUTOMATICAMENTE por scripts/optimize-images.mjs — não editar à mão.
import type { GalleryImage } from "@/lib/types";

${blocks.join("\n\n")}
`,
    "utf8"
  );
}

/**
 * Fotos da abertura → public/hero + manifesto tipado.
 *
 * Mesmo tratamento do acervo (largura máxima, webp, blur placeholder); o que
 * muda é a origem e o destino. Os nomes chegam do Drive com acento e espaço
 * ("Cópia de Cópia de IMG 4-29.jpg"), então o slug é agressivo antes de virar
 * arquivo público.
 */
async function buildHero() {
  await mkdir(HERO_OUT, { recursive: true });

  const files = (await readdir(HERO_DIR)).filter(isPhoto).sort((a, b) => {
    const [pa, na] = naturalKey(a);
    const [pb, nb] = naturalKey(b);
    return pa === pb ? na - nb : pa.localeCompare(pb);
  });

  if (!files.length) {
    console.error(`Nenhuma imagem encontrada em ${HERO_DIR}`);
    process.exit(1);
  }

  const entries = [];

  for (const file of files) {
    const slug = slugify(file.replace(/\.[^.]+$/, ""));

    const outName = `${slug}.webp`;
    const input = sharp(path.join(HERO_DIR, file)).rotate(); // respeita EXIF

    const info = await input
      .clone()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(path.join(HERO_OUT, outName));

    const blur = await input
      .clone()
      .resize({ width: BLUR_WIDTH })
      .webp({ quality: 40 })
      .toBuffer();

    entries.push({
      src: `/hero/${outName}`,
      width: info.width,
      height: info.height,
      blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    });

    console.log(`✓ hero ${file} → ${outName} (${info.width}×${info.height})`);
  }

  const body = entries
    .map(
      (e, i) => `  {
    src: ${JSON.stringify(e.src)},
    alt: ${JSON.stringify(`Abertura JML Sports — foto ${i + 1}`)},
    width: ${e.width},
    height: ${e.height},
    blurDataURL: ${JSON.stringify(e.blurDataURL)},
  },`
    )
    .join("\n");

  await writeFile(
    HERO_MANIFEST,
    `// GERADO AUTOMATICAMENTE por scripts/optimize-images.mjs — não editar à mão.
// Rode \`npm run images\` após trocar as fotos em public/pictures/hero.
import type { GalleryImage } from "@/lib/types";

export const heroImages: GalleryImage[] = [
${body}
];
`,
    "utf8"
  );

  console.log(`\n${entries.length} fotos da abertura → src/data/hero.ts`);
}

/**
 * Logos das federações → public/logos + manifesto tipado.
 *
 * `trim()` come a moldura vazia (e o branco chapado do JPEG do Javali) antes do
 * resize. Sem isso cada arquivo entraria na tira com uma margem própria e as
 * logos apareceriam em tamanhos visualmente diferentes lado a lado.
 */
async function buildLogos() {
  await mkdir(LOGOS_OUT, { recursive: true });

  const files = (await readdir(LOGOS_DIR)).filter(isPhoto).sort();
  const entries = [];

  for (const file of files) {
    const key = file.replace(/\.[^.]+$/, "");
    const outName = `${key.toLowerCase().replace(/_/g, "-")}.webp`;

    const input = sharp(path.join(LOGOS_DIR, file)).trim({ threshold: 12 });

    const info = await input
      .resize({ width: LOGO_WIDTH, withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 100, effort: 5 })
      .toFile(path.join(LOGOS_OUT, outName));

    entries.push({ key, src: `/logos/${outName}`, width: info.width, height: info.height });

    console.log(`✓ logo ${file} → ${outName} (${info.width}×${info.height})`);
  }

  const body = entries
    .map(
      (e) => `  ${JSON.stringify(e.key)}: {
    src: ${JSON.stringify(e.src)},
    alt: ${JSON.stringify(`Logo da federação ${e.key.replace(/_/g, " ")}`)},
    width: ${e.width},
    height: ${e.height},
  },`
    )
    .join("\n");

  const header =
    "// GERADO AUTOMATICAMENTE por scripts/optimize-images.mjs — não editar à mão.\n" +
    "// Rode `npm run images` após adicionar logos em public/pictures/logo_camps.\n";

  await writeFile(
    LOGOS_MANIFEST,
    `${header}import type { GalleryImage } from "@/lib/types";

export const federationLogos: Record<string, GalleryImage> = {
${body}
};
`,
    "utf8"
  );

  console.log(`\n${entries.length} logos processadas → src/data/logos.ts`);
}

/**
 * Fotos de cada campeonato → public/eventos/<slug> + manifesto tipado.
 *
 * A varredura é cega de propósito: quem manda é o que existe em
 * public/portifolio. Uma pasta nova ali e um `npm run images` põem o evento no
 * ar — não há lista de campeonatos para manter em dia aqui dentro, e o nome da
 * pasta ("LJJB - Angra") é o nome que aparece na tira.
 */
async function buildEvents() {
  let dirs = [];

  try {
    dirs = (await readdir(EVENTS_DIR, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  } catch {
    console.log(`\n— sem ${path.relative(ROOT, EVENTS_DIR)}: nenhum evento processado`);
  }

  const groups = [];

  for (const dirName of dirs) {
    const files = (await readdir(path.join(EVENTS_DIR, dirName)))
      .filter(isPhoto)
      .sort((a, b) => {
        const [pa, na] = naturalKey(a);
        const [pb, nb] = naturalKey(b);
        return pa === pb ? na - nb : pa.localeCompare(pb);
      });

    if (!files.length) {
      console.log(`— ${dirName}: pasta sem foto, ignorada`);
      continue;
    }

    const slug = slugify(dirName);
    const outDir = path.join(EVENTS_OUT, slug);
    await mkdir(outDir, { recursive: true });

    const entries = [];

    // dois arquivos podem cair no mesmo slug ("INST1-10.jpg" e "INST1 10.JPG");
    // sem isso o segundo sobrescreveria o primeiro em silêncio
    const taken = new Set();

    for (const file of files) {
      let name = slugify(file.replace(/\.[^.]+$/, ""));
      while (taken.has(name)) name += "-b";
      taken.add(name);

      const outName = `${name}.webp`;
      const input = sharp(path.join(EVENTS_DIR, dirName, file)).rotate();

      const info = await input
        .clone()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 5 })
        .toFile(path.join(outDir, outName));

      const blur = await input
        .clone()
        .resize({ width: BLUR_WIDTH })
        .webp({ quality: 40 })
        .toBuffer();

      entries.push({
        src: `/eventos/${slug}/${outName}`,
        width: info.width,
        height: info.height,
        blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
      });
    }

    groups.push({ slug, name: dirName, entries });
    console.log(`✓ evento ${dirName} → /eventos/${slug} (${entries.length} fotos)`);
  }

  const body = groups
    .map((group) => {
      const photos = group.entries
        .map(
          (e, i) => `      {
        src: ${JSON.stringify(e.src)},
        alt: ${JSON.stringify(`${group.name} — cobertura JML Sports, foto ${i + 1}`)},
        width: ${e.width},
        height: ${e.height},
        blurDataURL: ${JSON.stringify(e.blurDataURL)},
      },`
        )
        .join("\n");

      return `  {
    slug: ${JSON.stringify(group.slug)},
    name: ${JSON.stringify(group.name)},
    photos: [
${photos}
    ],
  },`;
    })
    .join("\n");

  const header =
    "// GERADO AUTOMATICAMENTE por scripts/optimize-images.mjs — não editar à mão.\n" +
    "// Rode `npm run images` após adicionar uma pasta de campeonato em\n" +
    "// public/portifolio. O nome da pasta vira o nome do evento na galeria.\n";

  await writeFile(
    EVENTS_MANIFEST,
    `${header}import type { GalleryImage } from "@/lib/types";

export type EventFolder = {
  /** Nome da pasta, normalizado — é ele que casa com o slug do campeonato. */
  slug: string;
  /** Nome da pasta como veio: é o nome que aparece na tira. */
  name: string;
  photos: GalleryImage[];
};

export const eventFolders: EventFolder[] = [
${body}
];
`,
    "utf8"
  );

  const counts = groups
    .map((g) => `  ${JSON.stringify(g.slug)}: ${g.entries.length},`)
    .join("\n");

  await writeFile(
    EVENT_COUNTS_MANIFEST,
    `${header}// Só as contagens: quem precisa apenas do número (a tira de federações
// da home) importa daqui e não arrasta os blur placeholders de events.ts.

export const eventPhotoCounts: Record<string, number> = {
${counts}
};
`,
    "utf8"
  );

  const total = groups.reduce((n, g) => n + g.entries.length, 0);
  console.log(`\n${groups.length} eventos (${total} fotos) → src/data/events.ts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

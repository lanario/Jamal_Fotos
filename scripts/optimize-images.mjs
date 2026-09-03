/**
 * Otimiza as fotos originais de `public/pictures` para `public/gallery`
 * e gera o manifesto tipado em `src/data/gallery.ts` (com blur placeholder).
 *
 *   npm run images
 */
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "public", "pictures");
const OUT_DIR = path.join(ROOT, "public", "gallery");
const MANIFEST = path.join(ROOT, "src", "data", "gallery.ts");

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

const EXCLUDED = new Set(SINGLES.flatMap((g) => [...g.files.keys()]));

const MAX_WIDTH = 1600;
const QUALITY = 78;
const BLUR_WIDTH = 16;

const isPhoto = (f) => /\.(jpe?g|png|webp|avif)$/i.test(f);

// IMG-10 -> ["IMG", 10] para ordenar numericamente em vez de alfabeticamente
const naturalKey = (name) => {
  const m = name.match(/^(.*?)(\d+)?\.[^.]+$/);
  return [m?.[1] ?? name, Number(m?.[2] ?? 0)];
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(SRC_DIR))
    .filter(isPhoto)
    .filter((f) => !EXCLUDED.has(f))
    .sort((a, b) => {
      const [pa, na] = naturalKey(a);
      const [pb, nb] = naturalKey(b);
      return pa === pb ? na - nb : pa.localeCompare(pb);
    });

  if (!files.length) {
    console.error(`Nenhuma imagem encontrada em ${SRC_DIR}`);
    process.exit(1);
  }

  const entries = [];

  for (const file of files) {
    const slug = file.replace(/\.[^.]+$/, "").toLowerCase();
    const outName = `${slug}.webp`;
    const input = sharp(path.join(SRC_DIR, file)).rotate(); // respeita EXIF

    const pipeline = input
      .clone()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 });

    const info = await pipeline.toFile(path.join(OUT_DIR, outName));

    const blur = await input
      .clone()
      .resize({ width: BLUR_WIDTH })
      .webp({ quality: 40 })
      .toBuffer();

    entries.push({
      src: `/gallery/${outName}`,
      width: info.width,
      height: info.height,
      blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    });

    console.log(`✓ ${file} → ${outName} (${info.width}×${info.height})`);
  }

  const body = entries
    .map(
      (e, i) => `  {
    src: ${JSON.stringify(e.src)},
    alt: ${JSON.stringify(`Cobertura esportiva JML Sports — foto ${i + 1}`)},
    width: ${e.width},
    height: ${e.height},
    blurDataURL: ${JSON.stringify(e.blurDataURL)},
  },`
    )
    .join("\n");

  await writeFile(
    MANIFEST,
    `// GERADO AUTOMATICAMENTE por scripts/optimize-images.mjs — não editar à mão.
// Rode \`npm run images\` após adicionar fotos em public/pictures.
import type { GalleryImage } from "@/lib/types";

export const galleryImages: GalleryImage[] = [
${body}
];
`,
    "utf8"
  );

  console.log(`\n${entries.length} imagens processadas → src/data/gallery.ts`);

  for (const group of SINGLES) await buildSingles(group);
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

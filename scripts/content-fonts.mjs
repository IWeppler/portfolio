/**
 * Baja de Google Fonts las fuentes del modulo Content y les saca el kerning
 * (tablas GPOS y kern). Satori mide cada palabra sin kerning pero la dibuja
 * con kerning, y eso deja un hueco irregular despues de las palabras con
 * muchos pares ("propiedades  como"). Sin kerning, medida y dibujo coinciden.
 *
 *   node scripts/content-fonts.mjs
 *
 * Escribe assets/fonts/content/<familia>-<peso>.ttf. Correr de nuevo solo si
 * se suma una fuente o un peso (y actualizar lib/content/fonts.ts).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FONTS = [
  { family: "Geist", slug: "geist", weights: [300, 400, 500, 600] },
  { family: "Geist Mono", slug: "geist-mono", weights: [400, 500] },
  { family: "Inter Tight", slug: "inter-tight", weights: [400, 500, 600] },
  { family: "Bebas Neue", slug: "bebas-neue", weights: [400] },
];

const DROP = new Set(["GPOS", "kern"]);

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "assets", "fonts", "content");

// Con un user agent viejo Google Fonts sirve ttf en vez de woff2.
async function downloadTtf(family, weight) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
    { headers: { "User-Agent": "Mozilla/4.0" } },
  ).then((response) => response.text());
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`Sin ttf para ${family} ${weight}`);

  return Buffer.from(await fetch(url).then((response) => response.arrayBuffer()));
}

// Reescribe el sfnt sin las tablas de DROP (los offsets de las demas cambian).
function dropTables(font) {
  const count = font.readUInt16BE(4);
  const tables = Array.from({ length: count }, (_, index) => {
    const at = 12 + index * 16;
    return {
      tag: font.toString("latin1", at, at + 4),
      checksum: font.readUInt32BE(at + 4),
      offset: font.readUInt32BE(at + 8),
      length: font.readUInt32BE(at + 12),
    };
  }).filter((table) => !DROP.has(table.tag));

  const header = Buffer.alloc(12 + tables.length * 16);
  font.copy(header, 0, 0, 4);
  const power = 2 ** Math.floor(Math.log2(tables.length));
  header.writeUInt16BE(tables.length, 4);
  header.writeUInt16BE(power * 16, 6);
  header.writeUInt16BE(Math.log2(power), 8);
  header.writeUInt16BE(tables.length * 16 - power * 16, 10);

  let offset = header.length;
  const bodies = tables.map((table, index) => {
    const body = Buffer.alloc(Math.ceil(table.length / 4) * 4);
    font.copy(body, 0, table.offset, table.offset + table.length);
    const at = 12 + index * 16;
    header.write(table.tag, at, "latin1");
    header.writeUInt32BE(table.checksum, at + 4);
    header.writeUInt32BE(offset, at + 8);
    header.writeUInt32BE(table.length, at + 12);
    offset += body.length;
    return body;
  });

  return Buffer.concat([header, ...bodies]);
}

mkdirSync(outDir, { recursive: true });

for (const { family, slug, weights } of FONTS) {
  for (const weight of weights) {
    const file = path.join(outDir, `${slug}-${weight}.ttf`);
    writeFileSync(file, dropTables(await downloadTtf(family, weight)));
    console.log(path.relative(root, file));
  }
}

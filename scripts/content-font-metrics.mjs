/**
 * Lee de los ttf de assets/fonts/content el ancho de avance de cada caracter
 * y lo guarda en lib/content/font-metrics.json. Como las fuentes no tienen
 * kerning (ver content-fonts.mjs), el ancho de una palabra es la suma de sus
 * caracteres mas el tracking: el lint y las marcas del texto miden con esto
 * en vez de estimar.
 *
 *   node scripts/content-font-metrics.mjs
 *
 * Correr de nuevo cada vez que se corra content-fonts.mjs.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fontDir = path.join(root, "assets", "fonts", "content");
const outFile = path.join(root, "lib", "content", "font-metrics.json");

// Latin-1 imprimible mas la tipografia que aparece en los posteos.
const CHARS = [
  ...Array.from({ length: 95 }, (_, index) => String.fromCharCode(32 + index)),
  ...Array.from({ length: 96 }, (_, index) => String.fromCharCode(160 + index)),
  ..."–—‘’“”…•·×→←↗↓€",
];

function tables(font) {
  const count = font.readUInt16BE(4);
  const map = {};
  for (let index = 0; index < count; index++) {
    const at = 12 + index * 16;
    map[font.toString("latin1", at, at + 4)] = font.readUInt32BE(at + 8);
  }
  return map;
}

// Glifo de un caracter segun la tabla cmap (formatos 4 y 12).
function glyphLookup(font, cmap) {
  const count = font.readUInt16BE(cmap + 2);
  const subtables = Array.from({ length: count }, (_, index) => {
    const at = cmap + 4 + index * 8;
    return { platform: font.readUInt16BE(at), encoding: font.readUInt16BE(at + 2), offset: cmap + font.readUInt32BE(at + 4) };
  });
  const unicode = subtables.filter((table) => table.platform === 0 || (table.platform === 3 && [1, 10].includes(table.encoding)));
  const pick =
    unicode.find((table) => font.readUInt16BE(table.offset) === 12) ??
    unicode.find((table) => font.readUInt16BE(table.offset) === 4);
  if (!pick) throw new Error("Sin cmap unicode");

  const at = pick.offset;
  if (font.readUInt16BE(at) === 12) {
    const groups = font.readUInt32BE(at + 12);
    return (code) => {
      for (let index = 0; index < groups; index++) {
        const group = at + 16 + index * 12;
        const start = font.readUInt32BE(group);
        const end = font.readUInt32BE(group + 4);
        if (code >= start && code <= end) return font.readUInt32BE(group + 8) + code - start;
      }
      return 0;
    };
  }

  const segments = font.readUInt16BE(at + 6) / 2;
  const ends = at + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const rangeOffsets = deltas + segments * 2;
  return (code) => {
    for (let index = 0; index < segments; index++) {
      if (code > font.readUInt16BE(ends + index * 2)) continue;
      const start = font.readUInt16BE(starts + index * 2);
      if (code < start) return 0;
      const delta = font.readInt16BE(deltas + index * 2);
      const rangeAt = rangeOffsets + index * 2;
      const range = font.readUInt16BE(rangeAt);
      if (range === 0) return (code + delta) & 0xffff;
      const glyph = font.readUInt16BE(rangeAt + range + (code - start) * 2);
      return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    }
    return 0;
  };
}

function metrics(font) {
  const offsets = tables(font);
  const unitsPerEm = font.readUInt16BE(offsets.head + 18);
  const longMetrics = font.readUInt16BE(offsets.hhea + 34);
  const advance = (glyph) => font.readUInt16BE(offsets.hmtx + Math.min(glyph, longMetrics - 1) * 4);
  const glyphOf = glyphLookup(font, offsets.cmap);

  const widths = {};
  for (const char of CHARS) {
    const glyph = glyphOf(char.codePointAt(0));
    // Sin glifo, Satori dibuja el de respaldo: se mide como el promedio.
    if (glyph) widths[char] = Math.round((advance(glyph) / unitsPerEm) * 10000) / 10000;
  }
  const values = Object.values(widths);
  return { fallback: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10000) / 10000, widths };
}

const result = {};
for (const file of readdirSync(fontDir).filter((name) => name.endsWith(".ttf")).sort()) {
  result[file.replace(/\.ttf$/, "")] = metrics(readFileSync(path.join(fontDir, file)));
  console.log(file);
}
writeFileSync(outFile, `${JSON.stringify(result)}\n`);
console.log(path.relative(root, outFile));

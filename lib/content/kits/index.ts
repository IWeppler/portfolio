import { comerzKit } from "./comerz";
import { portfolioKit } from "./portfolio";
import type { BrandKit } from "./types";

export type { BrandKit, TypeRole } from "./types";

export const BRAND_KITS = {
  portfolio: portfolioKit,
  comerz: comerzKit,
} satisfies Record<string, BrandKit>;

export type BrandId = keyof typeof BRAND_KITS;

export const BRAND_IDS = Object.keys(BRAND_KITS) as [BrandId, ...BrandId[]];

export function getKit(brand: BrandId): BrandKit {
  return BRAND_KITS[brand];
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const TOKEN = /^\$([a-zA-Z0-9]+)(?:\/(\d{1,3}))?$/;

/** "$token" o "$token/20" (alfa en %): el nombre del token y el alfa (0-1). */
export function parseToken(color: string) {
  const match = TOKEN.exec(color);
  if (!match) return null;
  return { name: match[1], alpha: match[2] === undefined ? null : Math.min(100, Number(match[2])) / 100 };
}

function withAlpha(hex: string, alpha: number) {
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map((digit) => digit + digit).join("")}` : hex;
  const base = full.slice(0, 7);
  const current = full.length === 9 ? Number.parseInt(full.slice(7), 16) / 255 : 1;
  return `${base}${Math.round(current * alpha * 255).toString(16).padStart(2, "0")}`;
}

/** "$token", "$token/20" del kit o un hex. Cualquier otra cosa cae en el fallback. */
export function resolveColor(kit: BrandKit, color: string | undefined, fallback: string): string {
  const token = color ? parseToken(color) : null;
  if (token) {
    const value = kit.colors[token.name]?.value;
    if (value) return token.alpha === null ? value : withAlpha(value, token.alpha);
  }
  if (color && HEX.test(color)) return color;

  return fallback.startsWith("$") ? resolveColor(kit, fallback, "#000000") : fallback;
}

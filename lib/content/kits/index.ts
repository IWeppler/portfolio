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

/** "$token" del kit o un hex. Cualquier otra cosa cae en el fallback. */
export function resolveColor(kit: BrandKit, color: string | undefined, fallback: string) {
  if (color?.startsWith("$")) {
    const token = kit.colors[color.slice(1)];
    if (token) return token.value;
  }
  if (color && HEX.test(color)) return color;

  return fallback.startsWith("$") ? (kit.colors[fallback.slice(1)]?.value ?? "#000000") : fallback;
}

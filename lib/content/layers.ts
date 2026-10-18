import { closestWeight, type FontKey } from "./fonts";
import { resolveColor, type BrandKit, type TypeRole } from "./kits";
import type { Content, TextLayer } from "./schema";

// Completa una capa de texto con su rol y su campo de content. Lo usan el
// render, el lint y el panel, asi los tres ven exactamente el mismo texto.

export type ResolvedText = {
  text: string;
  role: TypeRole | null;
  font: FontKey;
  size: number;
  weight: number;
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;
  tracking: number;
  uppercase: boolean;
};

export function fieldText(content: Content, field: string) {
  if (field.startsWith("points.")) return content.points[Number(field.slice(7))] ?? "";
  return String(content[field as keyof Content] ?? "");
}

export function resolveText(layer: TextLayer, kit: BrandKit, content: Content): ResolvedText {
  const role = (layer.role && kit.type[layer.role]) || null;
  const font = layer.font ?? role?.font ?? "geist";

  return {
    text: layer.field ? fieldText(content, layer.field) : (layer.text ?? ""),
    role,
    font,
    size: layer.size ?? role?.size ?? 40,
    weight: closestWeight(font, layer.weight ?? role?.weight ?? 400),
    color: resolveColor(kit, layer.color ?? role?.color, kit.ink),
    align: layer.align ?? "left",
    lineHeight: layer.lineHeight ?? role?.lineHeight ?? 1.2,
    tracking: layer.tracking ?? role?.tracking ?? 0,
    uppercase: layer.uppercase ?? role?.uppercase ?? false,
  };
}

import { timingSafeEqual } from "node:crypto";

// Autenticacion de Claude Code: `Authorization: Bearer <CONTENT_MCP_TOKEN>`.
// La usan el MCP y la subida a la biblioteca (Claude sube archivos locales con curl).

export function hasMcpToken(request: Request) {
  const token = process.env.CONTENT_MCP_TOKEN;
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !given) return false;

  const a = Buffer.from(given);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

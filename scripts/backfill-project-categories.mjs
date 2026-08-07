/**
 * Asigna la categoria a los proyectos que ya estaban en la base (los migrados
 * desde /locales). Correr una vez, despues de aplicar la migracion
 * supabase/migrations/0006_projects_category.sql.
 *
 *   node scripts/backfill-project-categories.mjs
 *
 * Los proyectos que no esten en el mapa quedan con el default de la columna
 * ('web') y se listan al final para revisarlos desde el panel.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CATEGORIES = {
  proyecto1: "app-saas",
  proyecto2: "app-saas",
  proyecto3: "app-saas",
  proyecto4: "web",
  proyecto5: "diseno",
  proyecto6: "app-saas",
  proyecto7: "web",
  proyecto8: "web",
  proyecto9: "app-saas",
};

for (const file of [".env.local", ".env"]) {
  const full = path.join(ROOT, file);

  if (!existsSync(full)) continue;

  for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);

    if (!match) continue;

    const value = match[2].trim().replace(/^["']|["']$/g, "");

    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

async function rest(pathname, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`REST ${pathname} -> ${response.status} ${await response.text()}`);
  }

  return response;
}

const rows = await (await rest("projects?select=slug,category")).json();
const unmapped = [];

for (const row of rows) {
  const category = CATEGORIES[row.slug];

  if (!category) {
    unmapped.push(`${row.slug} (quedo en "${row.category}")`);
    continue;
  }

  await rest(`projects?slug=eq.${encodeURIComponent(row.slug)}`, {
    method: "PATCH",
    body: JSON.stringify({ category }),
  });

  console.log(`${row.slug}: ${category}`);
}

if (unmapped.length > 0) {
  console.log(`\nSin categoria asignada: ${unmapped.join(", ")}`);
}

/**
 * Migra los proyectos estaticos de /locales a Supabase (projects +
 * project_translations + project_images) y sube las portadas de /public al
 * bucket de Storage.
 *
 * Uso:
 *   node scripts/migrate-locales-to-supabase.mjs --dry-run
 *   node scripts/migrate-locales-to-supabase.mjs
 *
 * Es idempotente: se identifica cada proyecto por su slug (proyecto1..9). Si ya
 * existe, se hace PATCH de las columnas y se reemplazan traducciones e imagenes
 * completas. Las imagenes se suben con un nombre determinista, asi que correrlo
 * dos veces no duplica objetos en Storage.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["es", "en", "pt"];
const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_UPLOAD = process.argv.includes("--skip-upload");

/**
 * Imagenes de cada proyecto. La primera es la portada: se toma la que ya usaban
 * las grillas (components/Projects.tsx), no la del detalle, para que las
 * tarjetas se vean igual que antes de migrar.
 */
const IMAGES = {
  proyecto1: ["workmanantial2.png", "workmanantial1.png"],
  proyecto2: ["inmobiliaria1.webp", "inmobiliaria2.png"],
  proyecto3: ["checancha.webp", "checanchab.webp", "checanchac.webp"],
  proyecto4: ["atleticotostado.webp", "atleticotostado2.webp", "atleticotostado3.webp"],
  proyecto5: ["bikecomerce.png", "bikecomerceb.png", "bikecomercec.png"],
  proyecto6: ["mockupnivo1.png", "mockupnivo2.png", "figmanivo.webp"],
  proyecto7: ["reddittobooks.webp", "reddittobooksbanner.webp", "mockupreddittobooks.jpg"],
  proyecto8: ["mockupinaqui.png", "maininaqui.jpg", "mockinaqui2.jpg"],
  proyecto9: [],
};

/** Categoria de cada proyecto (ver lib/projects/categories.ts). */
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

const MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
};

function loadEnv() {
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
}

loadEnv();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = process.env.SUPABASE_PROJECTS_BUCKET || "project-images";

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

async function uploadImage(fileName) {
  const objectPath = `projects/locales/${fileName}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  if (SKIP_UPLOAD || DRY_RUN) return publicUrl;

  const body = await readFile(path.join(ROOT, "public", fileName));
  const extension = fileName.split(".").pop().toLowerCase();

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": MIME[extension] ?? "application/octet-stream",
        "x-upsert": "true",
      },
      body,
    }
  );

  if (!response.ok) {
    throw new Error(`Storage ${fileName} -> ${response.status} ${await response.text()}`);
  }

  return publicUrl;
}

/**
 * El schema tiene una sola columna `contenido` por idioma y el detalle la
 * renderiza como texto plano (whitespace-pre-line). Asi que desafio, solucion,
 * caracteristicas y resultados se concatenan con los mismos titulos traducidos
 * que usaba la pagina estatica.
 */
function buildContent(project, labels) {
  const blocks = [];

  if (project.p1) blocks.push(`${labels.challenge ?? "El Desafío"}\n\n${project.p1}`);
  if (project.p2) blocks.push(`${labels.solution ?? "La Solución"}\n\n${project.p2}`);

  const features = ["li1", "li2", "li3", "li4"]
    .map((key) => project[key])
    .filter(Boolean)
    .map((item) => `– ${item}`);

  if (features.length > 0) {
    blocks.push(`${project.caracteristicas ?? "Características"}\n\n${features.join("\n")}`);
  }

  if (project.p3) blocks.push(`${labels.outcome ?? "Resultados"}\n\n${project.p3}`);

  return blocks.join("\n\n");
}

async function loadLocales() {
  const dictionaries = {};

  for (const lang of LANGS) {
    dictionaries[lang] = JSON.parse(
      await readFile(path.join(ROOT, "locales", `${lang}.json`), "utf8")
    );
  }

  return dictionaries;
}

async function findProjectId(slug) {
  const response = await rest(`projects?slug=eq.${encodeURIComponent(slug)}&select=id`);
  const rows = await response.json();

  return rows[0]?.id ?? null;
}

async function migrate() {
  const dictionaries = await loadLocales();
  const publicFiles = new Set(await readdir(path.join(ROOT, "public")));
  const base = dictionaries.es.proyectos;
  const slugs = Object.keys(base).filter((key) => key.startsWith("proyecto"));

  for (const [index, slug] of slugs.entries()) {
    const source = base[slug];
    const files = IMAGES[slug] ?? [];
    const missing = files.filter((file) => !publicFiles.has(file));

    if (missing.length > 0) {
      throw new Error(`${slug}: faltan imagenes en /public: ${missing.join(", ")}`);
    }

    const columns = {
      slug,
      client: null,
      url_deploy: source.deploy ?? null,
      url_github: source.github ?? null,
      category: CATEGORIES[slug] ?? "web",
      // Sin portada no se renderiza en las grillas, asi que no se publica.
      is_published: files.length > 0,
      is_featured: false,
      orden: index,
    };

    const translations = LANGS.map((lang) => {
      const localized = dictionaries[lang].proyectos?.[slug];

      if (!localized?.name) return null;

      return {
        idioma: lang,
        titulo: localized.name,
        descripcion: localized.subtitulo ?? null,
        contenido: buildContent(localized, dictionaries[lang].proyectos.projects ?? {}),
      };
    }).filter(Boolean);

    if (DRY_RUN) {
      console.log(
        `${slug}: ${translations.length} traducciones, ${files.length} imagenes, ` +
          `published=${columns.is_published}, category=${columns.category}`
      );
      continue;
    }

    const urls = [];

    for (const file of files) {
      urls.push(await uploadImage(file));
    }

    let id = await findProjectId(slug);

    if (id) {
      await rest(`projects?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(columns),
      });
    } else {
      const response = await rest("projects", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(columns),
      });
      const rows = await response.json();

      id = (Array.isArray(rows) ? rows[0] : rows).id;
    }

    for (const table of ["project_translations", "project_images"]) {
      await rest(`${table}?project_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    }

    if (translations.length > 0) {
      await rest("project_translations", {
        method: "POST",
        body: JSON.stringify(translations.map((row) => ({ ...row, project_id: id }))),
      });
    }

    if (urls.length > 0) {
      await rest("project_images", {
        method: "POST",
        body: JSON.stringify(
          urls.map((url, order) => ({
            project_id: id,
            url,
            es_portada: order === 0,
            orden: order,
          }))
        ),
      });
    }

    console.log(`${slug}: ok (${translations.length} traducciones, ${urls.length} imagenes)`);
  }
}

migrate().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

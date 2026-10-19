import { z } from "zod";
import { EXPORT_SCALE, POST_FORMATS } from "./formats";
import { BRAND_IDS, getKit } from "./kits";
import { listCatalog, rankAssets, suggestSource, type CatalogAsset } from "./assets";
import {
  addLibraryItem,
  assetCategorySchema,
  fetchImage,
  libraryFieldsSchema,
  libraryKindSchema,
  listLibrary,
  previewForModel,
  registerExisting,
  viewportSchema,
  type LibraryItem,
} from "./library";
import { designedFormats, missingFormats, postLabel } from "./post-utils";
import { createPost, getPost, listPosts, listReviewedExamples, updatePost, type ContentPost } from "./posts";
import { contactSheet, renderSlidePng } from "./render";
import {
  brandSchema,
  createPostSchema,
  postFormatSchema,
  postStatusSchema,
  updatePostSchema,
} from "./schema";

// Herramientas del MCP de Content (/api/mcp). Claude Code las usa para tomar
// las ideas cargadas en el panel y convertirlas en piezas.

type ToolContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

type Tool<S extends z.ZodType> = {
  name: string;
  description: string;
  input: S;
  run: (args: z.infer<S>) => Promise<ToolContent[]>;
};

const json = (value: unknown): ToolContent[] => [
  { type: "text", text: JSON.stringify(value, null, 2) },
];

// Validar los argumentos contra el schema de la herramienta, asi el route no
// necesita conocer cada tipo.
function defineTool<S extends z.ZodType>(tool: Tool<S>) {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.input, { io: "input" }),
    call: (args: unknown) => tool.run(tool.input.parse(args ?? {})),
  };
}

const idInput = z.object({ id: z.string().uuid() });

/** Lo que vuelve despues de guardar: la pieza resumida y los avisos del lint. */
function saved(post: ContentPost) {
  return json({
    id: post.id,
    brand: post.brand,
    status: post.status,
    formats: designedFormats(post),
    issues: post.issues,
    next:
      post.issues.length > 0
        ? "Corregir los avisos de issues y despues revisar con render_preview."
        : "Revisar cada slide con render_preview.",
  });
}

/** Lo que Claude necesita de un recurso para elegirlo, sin ruido. */
function compactAsset(asset: CatalogAsset) {
  return {
    url: asset.url,
    category: asset.category ?? "sin describir",
    scope: asset.scope,
    origin: asset.origin ?? undefined,
    viewport: asset.viewport ?? undefined,
    project: asset.project?.slug,
    note: asset.note || undefined,
    tags: asset.tags.length ? asset.tags : undefined,
    ratio: asset.ratio ?? undefined,
    alpha: asset.hasAlpha ?? undefined,
    demoData: asset.demoData || undefined,
  };
}

const fromItem = (item: LibraryItem): CatalogAsset => ({
  ref: item.id,
  url: item.url,
  source: item.stored ? "library" : "project",
  scope: item.scope,
  category: item.category,
  origin: item.origin,
  viewport: item.viewport,
  project: item.projectSlug ? { slug: item.projectSlug, name: item.projectSlug } : null,
  title: item.title,
  note: item.note,
  tags: item.tags,
  ratio: item.height ? Math.round((item.width / item.height) * 100) / 100 : null,
  hasAlpha: item.hasAlpha,
  dominantColor: item.dominantColor || null,
  demoData: item.demoData,
});

const EXAMPLE_SLIDE = {
  layers: [
    { type: "text", role: "label", x: 72, y: 72, w: 600, text: "(01) Inmobiliarias" },
    { type: "text", role: "title", x: 72, y: 150, w: 936, field: "title" },
    { type: "rect", x: 72, y: 470, w: 936, h: 640, color: "$surface", radius: 16 },
    { type: "image", x: 112, y: 510, w: 856, h: 560, src: "<url de list_assets>", position: "top", radius: 8 },
    { type: "text", role: "note", x: 72, y: 1200, w: 700, field: "subtitle" },
    { type: "image", x: 912, y: 1182, w: 96, h: 96, src: "/brand/isotipo-fondo.png", radius: 16 },
  ],
};

export const CONTENT_TOOLS = [
  defineTool({
    name: "get_brand_kit",
    description:
      "Kit completo de una marca: colores, roles tipograficos con rango, margenes, composiciones, decoracion, voz, reglas y ejemplos revisados por Ignacio. Leer antes de diseñar para esa marca.",
    input: z.object({ brand: brandSchema }),
    run: async ({ brand }) => {
      const kit = getKit(brand);
      return json({
        ...kit,
        formats: POST_FORMATS,
        export: `Se diseña en el lienzo de 1080 de ancho; el panel descarga a ${EXPORT_SCALE}x (2160 de ancho).`,
        layers: {
          text: "x, y, w + role (obligatorio, del kit) + field (title|subtitle|body|cta|points.N) o text. size/weight/font/color/align/lineHeight/tracking/uppercase pisan el rol; size debe quedar en el rango del rol. Marcas: [[asi]] en el color highlight del kit (o el de la capa), [[asi|outline]] calado (solo sobre fondo liso), [[asi|box]] caja de seleccion con su medida real, [[asi|blur]] lupa desenfocada (sirve para parte de una palabra: [[so|blur]]la).",
          image:
            "x, y, w, h, src, fit (cover|contain), position (center|top|bottom|left|right), radius (de layout.radii), bleed si sale por el borde a proposito. crop {x,y,w,h en fraccion} toma un pedazo del original (un fragmento de interfaz). shadow, blur (profundidad de campo), motionBlur, brightness, saturation, fade (top|bottom|left|right|radial). device (browser|phone) monta una captura cruda en un marco dibujado: w/h son los del marco (telefono ~0.46 de ancho/alto). Las capturas reales solo se recortan, encajan y tratan con luz: nunca se inventa ni altera lo que muestran.",
          rect: "x, y, w, h, color, radius, stroke + strokeWidth (borde fino: $foreground/10), gradient {type linear|radial, angle, center, stops [{color, at}]}, shadow, glass (desenfoca lo que tiene atras; color con alfa como tinte, sin giro).",
          graphic:
            "x, y, w, h, kind: rings (anillos concentricos), sparkles (destellos; count, size, seed), cells (cols, rows, lit: indices encendidos), bars (values 0-1), dots (count columnas, rows puntos por columna, seed), lines (spacing), grid (spacing, size), glow (halo). color, accent (lo encendido), muted, strength. Son metaforas y textura: nunca escalas ni numeros inventados.",
          slide:
            "background (color), backdrop {image {src, blur, motionBlur, brightness, saturation}, gradient (velo), glows [{x, y, r, color, opacity}], grain 0-1} se arma en una sola imagen debajo de todo; light (top-left|top|top-right) orienta las sombras.",
          shadow: "soft | float | deep, o {distance, blur, opacity}. Cae del lado contrario a slide.light.",
          all: "id, purpose (para que esta la capa), opacity, rotate. Se apilan en orden: la primera queda abajo. Colores: tokens del kit, con alfa en % ($accent/20).",
        },
        content:
          "Lo que dice la pieza va en content (objective, audience, title, subtitle, body, cta, points, caption) y las capas lo toman con field: asi Ignacio corrige un titulo sin tocar el diseño.",
        example: EXAMPLE_SLIDE,
        reviewedExamples: await listReviewedExamples(brand).catch((error) => {
          // Sin ejemplos el kit sigue sirviendo.
          console.error("mcp: failed to load reviewed examples", error);
          return [];
        }),
        workflow: [
          "1. list_posts con pending true para ver los pedidos del panel.",
          "2. get_brand_kit de la marca de la pieza.",
          "3. list_library kind referencia y view_library de las que tengan que ver con la idea: seguir lo que dice cada nota (estructura, recursos, luz), nunca su paleta, tipografia ni fotos.",
          "4. find_assets por cada imagen que pide la idea. Prioriza capturas reales; las que dicen 'sin describir' se miran con view_assets y se describen con annotate_asset. Si vuelve missing, conseguirlo como dice (o pedirselo a Ignacio) antes de improvisar.",
          "5. Mirar reviewedExamples: los 'listo' son el estilo a seguir, los 'rechazado' dicen que evitar (reviewNote). Se pueden ver con render_preview.",
          "6. update_post con content y designs del formato pedido, status 'borrador'.",
          "7. Corregir los issues que devuelve y revisar cada slide con render_preview; para un carrusel, render_preview con sheet true muestra todos los slides juntos.",
        ],
      });
    },
  }),
  defineTool({
    name: "list_assets",
    description:
      "Catalogo completo de recursos de una marca: logos del kit, imagenes de los proyectos publicados (portfolio) y recursos de la biblioteca, propios y globales. Para elegir, mejor find_assets.",
    input: z.object({ brand: brandSchema }),
    run: async ({ brand }) => {
      const catalog = await listCatalog(brand);
      return json({ assets: catalog.assets.map(compactAsset), projects: catalog.projects });
    },
  }),
  defineTool({
    name: "find_assets",
    description:
      "Busca el recurso para una imagen de la pieza. Ordena por lo que pide (categoria, proyecto, vista, transparencia, texto) y prioriza lo real y propio. Si nada sirve, missing dice como conseguirlo. Excluye por defecto las imagenes con datos de demo.",
    input: z.object({
      brand: brandSchema,
      need: z.string().max(300).optional().describe("Que tiene que mostrar, en palabras: 'buscador de propiedades en celular'."),
      category: assetCategorySchema.optional(),
      viewport: viewportSchema.optional(),
      project: z.string().max(120).optional().describe("Slug o nombre del proyecto."),
      alpha: z.boolean().optional().describe("Necesita fondo transparente (un objeto que flota)."),
      allowDemo: z.boolean().optional().describe("Aceptar imagenes con cifras o testimonios de demo (solo como interfaz, nunca como dato)."),
      limit: z.number().int().min(1).max(20).optional(),
    }),
    run: async ({ brand, ...query }) => {
      const catalog = await listCatalog(brand);
      const results = rankAssets(catalog, query);
      // Sin un resultado de la categoria pedida (o sin nada), hay que conseguirlo.
      const fits = results.filter((result) => !query.category || result.asset.category === query.category);
      return json({
        results: results.map(({ asset, score, why }) => ({ ...compactAsset(asset), score: Math.round(score * 10) / 10, why })),
        missing: fits.length === 0 ? { need: query.need ?? query.category ?? "imagen", how: suggestSource(catalog, query) } : undefined,
      });
    },
  }),
  defineTool({
    name: "view_assets",
    description: "Muestra como imagen hasta 6 recursos del catalogo por url, para mirarlos antes de elegirlos o describirlos.",
    input: z.object({ brand: brandSchema, urls: z.array(z.string().max(600)).min(1).max(6) }),
    run: async ({ brand, urls }) => {
      const catalog = await listCatalog(brand);
      const assets = urls.map((url) => catalog.assets.find((asset) => asset.url === url));
      const missing = urls.filter((_, index) => !assets[index]);
      if (missing.length > 0) throw new Error(`No estan en el catalogo de ${brand} (list_assets): ${missing.join(", ")}`);

      const blocks = await Promise.all(
        assets.map(async (asset): Promise<ToolContent[]> => [
          {
            type: "text",
            text: `${asset!.url}\n${asset!.category ?? "sin describir"}${asset!.project ? ` · ${asset!.project.name}` : ""}${asset!.note ? ` · ${asset!.note}` : ""}`,
          },
          { type: "image", data: await previewForModel(asset!), mimeType: "image/jpeg" },
        ]),
      );
      return blocks.flat();
    },
  }),
  defineTool({
    name: "annotate_asset",
    description:
      "Describe una imagen que ya esta en Storage (por ejemplo una de los proyectos) para que find_assets la encuentre: categoria, vista, proyecto, que se ve. Mirarla antes con view_assets. Marcar demoData si muestra cifras, precios o testimonios de demo.",
    input: libraryFieldsSchema.omit({ kind: true }).extend({ url: z.string().url().max(600) }),
    run: async ({ url, ...fields }) => {
      const item = await registerExisting(url, { ...fields, kind: "recurso" });
      return json(compactAsset(fromItem(item)));
    },
  }),
  defineTool({
    name: "list_library",
    description:
      "Biblioteca de una marca, con lo global incluido. referencia = inspiracion cargada por Ignacio, con note de que tomar (nunca va dentro de la pieza). recurso = imagen para usar en las piezas (su url va en capas image).",
    input: z.object({ brand: brandSchema, kind: libraryKindSchema.optional(), category: assetCategorySchema.optional() }),
    run: async ({ brand, kind, category }) =>
      json(
        (await listLibrary({ brand, kind, category })).map((item) => ({
          id: item.id,
          kind: item.kind,
          scope: item.scope,
          category: item.category,
          title: item.title,
          note: item.note,
          tags: item.tags,
          url: item.url,
          ratio: Math.round((item.width / item.height) * 100) / 100,
          demoData: item.demoData || undefined,
          sourceUrl: item.sourceUrl || undefined,
        })),
      ),
  }),
  defineTool({
    name: "view_library",
    description:
      "Muestra como imagen hasta 6 items de la biblioteca, cada uno con su nota. Mirar las referencias antes de diseñar: la nota dice que tomar de cada una.",
    input: z.object({ ids: z.array(z.string().uuid()).min(1).max(6) }),
    run: async ({ ids }) => {
      const items = await listLibrary({ ids });
      if (items.length === 0) throw new Error("No hay items con esos ids.");

      const blocks = await Promise.all(
        items.map(async (item): Promise<ToolContent[]> => [
          {
            type: "text",
            text: `${item.kind} ${item.id}${item.title ? ` · ${item.title}` : ""}\n${item.note || "(sin nota)"}`,
          },
          { type: "image", data: await previewForModel(item), mimeType: "image/jpeg" },
        ]),
      );
      return blocks.flat();
    },
  }),
  defineTool({
    name: "add_library_item",
    description:
      "Agrega a la biblioteca una imagen publica por URL. Para un archivo local (una captura que pego Ignacio o una de scripts/content-capture.mjs), subirlo con curl: " +
      'curl -F file=@<ruta> -F scope=<global|marca> -F kind=<referencia|recurso> -F category=<capture|mockup|...> -F origin=<real|own|...> -F "note=<que se ve o que tomar>" -H "Authorization: Bearer $CONTENT_MCP_TOKEN" <origen>/api/content/library ' +
      "(el token esta en .env.local del portfolio; tambien acepta viewport, projectSlug, demoData, tags). Global solo para lo que sirve a todas las marcas (texturas, objetos, iconos); capturas y logos van en su marca. Preguntarle a Ignacio que tomar de una referencia si no lo dijo.",
    input: libraryFieldsSchema.extend({ imageUrl: z.string().url() }),
    run: async ({ imageUrl, ...fields }) => {
      const item = await addLibraryItem(await fetchImage(imageUrl), fields);
      return json({ id: item.id, kind: item.kind, scope: item.scope, category: item.category, url: item.url, width: item.width, height: item.height });
    },
  }),
  defineTool({
    name: "list_posts",
    description:
      "Piezas del modulo Content. pending true = pedidos esperando diseño (ideas, o formatos agregados en el panel que todavia no tienen slides).",
    input: z.object({
      brand: brandSchema.optional(),
      status: postStatusSchema.optional(),
      pending: z.boolean().optional(),
    }),
    run: async ({ brand, status, pending }) => {
      const posts = await listPosts({ brand, status });
      return json(
        posts
          .map((post) => ({
            id: post.id,
            brand: post.brand,
            title: postLabel(post),
            idea: post.idea,
            status: post.status,
            format: post.format,
            designed: designedFormats(post),
            missing: missingFormats(post),
            reviewNote: post.reviewNote || undefined,
            issues: post.issues.length,
            updatedAt: post.updatedAt,
          }))
          .filter((post) => !pending || post.missing.length > 0),
      );
    },
  }),
  defineTool({
    name: "get_post",
    description: "Pieza completa: content, designs por formato, avisos del lint.",
    input: idInput,
    run: async ({ id }) => {
      const post = await getPost(id);
      if (!post) throw new Error("No existe esa pieza.");
      return json(post);
    },
  }),
  defineTool({
    name: "create_post",
    description: "Crea una pieza nueva para una marca. Con slides queda como 'borrador'; sin slides, como 'idea'.",
    input: createPostSchema,
    run: async (input) => saved(await createPost(input, "claude")),
  }),
  defineTool({
    name: "update_post",
    description:
      "Actualiza una pieza. content se mezcla campo por campo; designs reemplaza solo los formatos que se manden (null borra uno). Al terminar de diseñar, status 'borrador'; 'listo' y 'rechazado' los marca Ignacio.",
    input: updatePostSchema.extend({ id: z.string().uuid() }),
    run: async ({ id, ...patch }) => {
      const post = await updatePost(id, patch, "claude");
      if (!post) throw new Error("No existe esa pieza.");
      return saved(post);
    },
  }),
  defineTool({
    name: "render_preview",
    description:
      "Render PNG de un slide (a 540 de ancho) para revisar el diseño. Con sheet true, todos los slides del formato en una sola imagen, para ver el carrusel como secuencia.",
    input: idInput.extend({
      format: postFormatSchema.optional().describe("Por defecto, el formato principal."),
      slide: z.number().int().min(0).max(9).default(0),
      sheet: z.boolean().optional().describe("Todos los slides lado a lado (a 360 de ancho cada uno)."),
    }),
    run: async ({ id, format, slide, sheet }) => {
      const post = await getPost(id);
      if (!post) throw new Error("No existe esa pieza.");
      const target = format ?? post.format;
      const slides = post.designs[target]?.slides ?? [];
      const render = (index: number, scale: number) =>
        renderSlidePng({ kit: getKit(post.brand), content: post.content, slide: slides[index], format: target, scale });

      if (sheet) {
        if (slides.length === 0) throw new Error(`El formato ${target} no tiene slides.`);
        const png = await contactSheet(await Promise.all(slides.map((_, index) => render(index, 1 / 3))));
        return [{ type: "image", data: png.toString("base64"), mimeType: "image/png" }];
      }

      if (!slides[slide]) throw new Error(`El formato ${target} tiene ${slides.length} slides.`);
      const png = await render(slide, 0.5);
      return [{ type: "image", data: png.toString("base64"), mimeType: "image/png" }];
    },
  }),
];

export const CONTENT_INSTRUCTIONS =
  `MCP del modulo Content: diseña posteos de Instagram para las marcas ${BRAND_IDS.join(", ")}. ` +
  "Cada marca tiene identidad propia: llamar get_brand_kit con la marca de la pieza antes de diseñar y mirar sus referencias (list_library + view_library). " +
  "Los pedidos del panel salen en list_posts con pending true. Guardar con update_post, corregir los issues que devuelve " +
  "y revisar cada slide con render_preview. Nunca inventar cifras, precios ni clientes.";

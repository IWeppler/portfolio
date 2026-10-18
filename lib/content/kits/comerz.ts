import type { BrandKit } from "./types";

// Comerz, sistema de gestion y punto de venta. Sale de la landing del repo
// comerz (app/landing.css y app/components/hero.tsx): papel calido, tinta casi
// negra, Bebas Neue en los carteles, Inter Tight en titulares y un solo acento,
// el naranja del logo.

export const comerzKit: BrandKit = {
  id: "comerz",
  name: "Comerz",
  description:
    "Comerz: sistema de gestion y punto de venta para comercios. Vender, cobrar, controlar el stock, fiados, tienda online y saber cuanto ganas de verdad.",
  colors: {
    canvas: { value: "#f4f2ec", use: "Papel calido. Fondo por defecto." },
    surface: { value: "#ffffff", use: "Tarjetas sobre el papel." },
    surfaceAlt: { value: "#eae6dc", use: "Bloques y franjas un tono abajo del papel." },
    sunken: { value: "#e4dfd3", use: "Huecos y placeholders." },
    fg: { value: "#1a1712", use: "Tinta principal." },
    fgSecondary: { value: "#5c574e", use: "Texto secundario." },
    fgMuted: { value: "#7c766c", use: "Notas y etiquetas." },
    accent: { value: "#e8401a", use: "Naranja del logo. SOLO botones, precios, tildes y el asterisco." },
    brandSoft: { value: "#fde6dc", use: "Fondo suave de un dato o etiqueta destacada." },
    up: { value: "#12804a", use: "Variacion positiva en KPIs." },
    night: { value: "#111111", use: "Fondo de las piezas oscuras (como el hero)." },
    white: { value: "#ffffff", use: "Texto sobre $night." },
    whiteMuted: { value: "#ffffff99", use: "Texto secundario sobre $night." },
    accentNight: { value: "#ff5a2e", use: "El acento sobre $night." },
  },
  background: "$canvas",
  ink: "$fg",
  highlight: "$accent",
  type: {
    poster: { font: "bebas-neue", weight: 400, size: 190, min: 120, max: 320, lineHeight: 0.88, tracking: 0.002, uppercase: true, color: "$fg", use: "Cartel en mayusculas, 2 a 4 palabras. El gancho de la pieza." },
    display: { font: "inter-tight", weight: 600, size: 64, min: 44, max: 96, lineHeight: 1.1, tracking: -0.035, color: "$fg", use: "Titular de seccion o frase manifiesto." },
    lead: { font: "geist", weight: 500, size: 36, min: 30, max: 44, lineHeight: 1.35, tracking: -0.01, color: "$fg", use: "Bajada debajo del cartel." },
    body: { font: "geist", weight: 400, size: 30, min: 26, max: 36, lineHeight: 1.45, tracking: 0, color: "$fgSecondary", use: "Texto corrido corto." },
    kicker: { font: "geist", weight: 300, size: 28, min: 22, max: 32, lineHeight: 1.3, tracking: 0, color: "$fgMuted", use: "Linea chica arriba del cartel ('Sistema de gestion y punto de venta')." },
    figure: { font: "inter-tight", weight: 600, size: 88, min: 56, max: 140, lineHeight: 1, tracking: -0.03, color: "$fg", use: "Numero grande de KPI o precio." },
    button: { font: "geist", weight: 600, size: 30, min: 24, max: 36, lineHeight: 1, tracking: 0, color: "$white", use: "Texto del boton pildora (sobre rect $accent con radio 999)." },
  },
  layout: {
    safeMargin: 64,
    imageShare: { min: 0.3, max: 0.85 },
    radii: [0, 16, 24, 32, 999],
    notes: [
      "El producto se muestra: las capturas son grandes y pueden salir por el borde inferior o lateral.",
      "Cartel arriba, captura abajo, boton al pie: es el esquema base.",
      "Boton: rect $accent radio 999, alto 88, texto rol button centrado.",
    ],
  },
  fontRules: [
    "Bebas Neue solo para el cartel en mayusculas (rol poster). Nunca en texto corrido.",
    "Inter Tight 600 para titulares y numeros grandes.",
    "Geist para bajadas, cuerpo y botones; 300 solo en el kicker.",
    "Comerz no usa mono.",
  ],
  compositions: [
    { name: "Cartel + producto", description: "Kicker, cartel poster de 2 lineas con un asterisco $accent, captura grande (puede sangrar abajo), boton al pie." },
    { name: "Noche", description: "Fondo $night, cartel en $white, asterisco $accentNight, captura con brillo. Para lanzamientos." },
    { name: "Dato", description: "Numero figure grande con su etiqueta, tarjeta $surface radio 24, frase display abajo." },
    { name: "Carrusel de funcion", description: "Portada cartel, un slide por paso (captura + frase display), cierre con 'Probar 14 días gratis'." },
  ],
  decoration: [
    "Fondos lisos: $canvas o $night. Las capturas sobre fondos naranja de las fotos aportan el color.",
    "Tarjetas $surface con radio 24, sin borde.",
    "El asterisco naranja al final del cartel remata una frase que se completa abajo, como en la landing: escribir 'tu comercio[[*]]' y la bajada empieza con '*'.",
    "Naranja solo en botones, precios, tildes y asterisco; si aparece en todos lados deja de marcar.",
  ],
  voice: [
    "Habla Comerz, el producto, al dueño o dueña de un comercio. Voseo: 'Hacé crecer tu comercio'.",
    "Concreto y de mostrador: vender, cobrar, caja, stock, fiado, ganancia. Nada de jerga tecnica.",
    "Frases cortas; el cartel plantea, la bajada lo baja a tierra.",
    "No inventar precios, cantidad de clientes ni resultados. Los numeros de las capturas son de una tienda demo.",
    "CTA real: 'Probar 14 días gratis'.",
  ],
  rules: [
    "Una captura del producto por slide como minimo.",
    "Logo arriba a la izquierda o al pie, de 72 a 110px de alto.",
    "Caption: problema del comercio en una linea, como lo resuelve Comerz, CTA a probar 14 días gratis.",
  ],
  logos: [{ src: "/brands/comerz/logo.png", ratio: 1.1, use: "Logo (toldo con sonrisa) sobre transparente. Va bien en claro y oscuro." }],
  assets: [
    { src: "/brands/comerz/caja-hand.webp", ratio: 1.78, use: "Mano sosteniendo el celular con la caja del dia, fondo negro." },
    { src: "/brands/comerz/ecommerce.webp", ratio: 1.33, use: "Tablet con la tienda online (ficha de zapatillas), fondo naranja." },
    { src: "/brands/comerz/iphone2.webp", ratio: 0.67, use: "iPhone con el inicio: vendiste, ganancia, ticket promedio y grafico, fondo negro." },
    { src: "/brands/comerz/model.webp", ratio: 0.56, use: "Mujer mostrando el celular con el panel, fondo naranja. Vertical." },
    { src: "/brands/comerz/model2.webp", ratio: 0.76, use: "Mano con celular rosa: 'Venta realizada $309.000', fondo naranja." },
    { src: "/brands/comerz/panel.webp", ratio: 1.78, use: "Panel de escritorio en modo oscuro con KPIs y grafico." },
    { src: "/brands/comerz/table-stock.webp", ratio: 1.78, use: "Tabla de stock oscura con productos, categorias y precios." },
  ],
};

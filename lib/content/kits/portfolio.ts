import type { BrandKit } from "./types";

// Portfolio de Ignacio Weppler. Colores y escala salen de app/globals.css
// (:root y @theme); si cambian ahi, actualizar aca.

export const portfolioKit: BrandKit = {
  id: "portfolio",
  name: "Portfolio",
  description:
    "Ignacio Weppler, desarrollador full-stack freelance (Argentina). Webs para inmobiliarias y desarrollo para agencias que tercerizan.",
  colors: {
    background: { value: "#111213", use: "Fondo grafito. Fondo de todas las piezas." },
    surface: { value: "#1a1b1d", use: "Un escalon arriba del fondo: marcos de capturas, bloques." },
    assets: { value: "#2a2b2e", use: "Bloques sobre surface, placeholders." },
    foreground: { value: "#ecebe8", use: "Tinta principal: titulos y texto corrido." },
    paragraph: { value: "#a2a3a8", use: "Solo notas secundarias y etiquetas." },
    accent: { value: "#d2dbdf", use: "Unico acento (el cuadro de la W): un detalle por pieza, como mucho." },
  },
  background: "$background",
  ink: "$foreground",
  highlight: "$paragraph",
  type: {
    display: { font: "geist", weight: 500, size: 220, min: 160, max: 300, lineHeight: 0.82, tracking: -0.045, color: "$foreground", use: "Una o dos palabras gigantes, como el nombre del hero. Maximo una vez por pieza." },
    title: { font: "geist", weight: 400, size: 96, min: 72, max: 128, lineHeight: 1, tracking: -0.04, color: "$foreground", use: "Titulo del slide." },
    statement: { font: "geist", weight: 400, size: 52, min: 40, max: 64, lineHeight: 1.2, tracking: -0.02, color: "$foreground", use: "Frase destacada o subtitulo." },
    body: { font: "geist", weight: 400, size: 34, min: 28, max: 40, lineHeight: 1.45, tracking: 0, color: "$foreground", use: "Texto corrido, cuatro lineas como mucho." },
    note: { font: "geist", weight: 400, size: 28, min: 24, max: 32, lineHeight: 1.5, tracking: 0, color: "$paragraph", use: "Notas secundarias y firma." },
    label: { font: "geist-mono", weight: 400, size: 22, min: 18, max: 26, lineHeight: 1.2, tracking: 0.04, uppercase: true, color: "$paragraph", use: "Etiquetas chicas: indices (01), categoria, ubicacion, '(Hola)'." },
  },
  layout: {
    safeMargin: 72,
    imageShare: { min: 0.2, max: 0.7 },
    radii: [0, 8, 16],
    notes: [
      "Grilla de 72px a los bordes; los bloques se alinean a esa linea izquierda.",
      "Mucho aire: si hay que elegir entre achicar el texto o sacar una linea, sacar la linea.",
      "Las capturas van dentro de un marco $surface con 40px de padding y radio 16 (la imagen, radio 8), o flotando con sombra cuando la pieza tiene profundidad.",
    ],
  },
  fontRules: [
    "Geist para todo lo que se lee: titulos en 400, display en 500. Nunca 600 ni negrita en titulos.",
    "Geist Mono solo en etiquetas chicas (rol label), siempre en mayuscula y $paragraph.",
    "Tracking negativo en titulos (-0.04em), apenas negativo en frases, cero en texto corrido.",
  ],
  compositions: [
    { name: "Captura protagonista", description: "Etiqueta mono arriba, titulo de 2 lineas, marco $surface con un mockup ocupando la mitad inferior, firma abajo." },
    { name: "Tipografica", description: "Un display o titulo grande con mucho aire y una sola captura chica o recortada al borde." },
    { name: "Carrusel de caso", description: "Portada (titulo + mockup), 2 a 4 slides con un punto y una captura cada uno, cierre con CTA a la web." },
    { name: "Lista", description: "Indices mono (01) (02) (03) a la izquierda y frases statement; sin imagen o con una al pie." },
  ],
  decoration: [
    "Punto de partida editorial: fondo $background, superficies separadas por tono ($surface, $assets), mucho aire.",
    "Cuando la idea lo pide, hay profundidad: sombras, halos de luz con $accent o $foreground a baja opacidad, desenfoque de lo que queda atras, vidrio, grano sutil, bordes finos ($foreground/8 a /16).",
    "Graficos generados (celdas, barras, puntos, anillos) como metafora de la idea; nunca con escalas o numeros que no sean reales.",
    "Siempre con la paleta del kit (las variantes con alfa son de la paleta). El color fuerte lo traen las capturas.",
    "Cada elemento tiene una funcion (purpose); lo que solo decora sobra.",
  ],
  voice: [
    "Habla Ignacio en primera persona como freelancer, no una agencia ni un producto.",
    "En español decir 'web', no 'sitio'. Voseo rioplatense. Directo, sin exclamaciones ni emojis en la pieza.",
    "Comerz (POS) es un proyecto mas del portfolio, nunca protagonista.",
    "Solo cifras y casos reales; si no hay un dato verdadero, no inventarlo.",
  ],
  rules: [
    "Al menos una captura real por pieza (list_assets), salvo que la idea pida solo tipografia.",
    "Logo chico en una esquina: isotipo de 88-110px o wordmark de 260-320px de ancho.",
    "Caption: 2 a 5 lineas, cerrar con un CTA a la web (ignacioweppler.dev) o a escribir por DM.",
  ],
  logos: [
    { src: "/brand/logo-transparente.png", ratio: 4, use: "Wordmark claro sobre transparente." },
    { src: "/brand/isotipo-fondo.png", ratio: 1, use: "La W sobre cuadro $accent. Sello o avatar." },
  ],
  assets: [],
};

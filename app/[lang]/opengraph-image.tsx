import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { seoCopy } from "@/lib/seo";

// Node (no edge): lee Geist y las miniaturas de proyectos desde /assets.
export const runtime = "nodejs";
const size = { width: 1200, height: 630 };

// Una sola imagen por idioma, pero con el alt traducido (un `alt` exportado
// fijo quedaba en espanol tambien en /en y /pt).
export async function generateImageMetadata({ params }: { params: Promise<{ lang: string }> | { lang: string } }) {
  const { lang } = await params;
  return [{ id: "default", alt: seoCopy(lang).homeTitle, size, contentType: "image/png" }];
}

// Portadas recortadas a 352x264 (4:3) en /assets/og (Satori no lee webp y los
// PNG originales pesan demasiado). Si se publica un proyecto nuevo, sumar su
// miniatura ahi y su slug aca.
const PROJECTS = [
  "inmobiliaria-terranova",
  "comerz-pos",
  "arcos-propiedades",
  "lumen-propiedades",
  "quesos-festa",
  "el-tolar-plataforma-agropecuaria",
  "apex-bikes",
  "club-atletico-tostado",
  "el-nuevo-manantial",
  "redditobooks",
  "inaqui-techos",
];

// Anillo eliptico alrededor del nombre, con ancho, giro y posicion
// irregulares para que no se vea como una grilla. `w` es el ancho; el alto
// sale de la proporcion 4:3 de las miniaturas.
const JITTER = [
  { r: 9, w: 128, dx: -14, dy: 10 },
  { r: -6, w: 112, dx: 22, dy: -14 },
  { r: 4, w: 136, dx: -10, dy: 18 },
  { r: -11, w: 116, dx: 18, dy: -6 },
  { r: 7, w: 132, dx: -6, dy: -18 },
  { r: -3, w: 108, dx: -22, dy: 12 },
  { r: 12, w: 124, dx: 14, dy: -10 },
  { r: -8, w: 138, dx: -4, dy: 20 },
  { r: 5, w: 114, dx: -20, dy: -12 },
  { r: -12, w: 130, dx: 12, dy: 14 },
  { r: 2, w: 120, dx: 20, dy: -20 },
];

const RX = 470;
const RY = 228;

// Angulos que reparten `count` puntos a igual distancia sobre la elipse
// (con angulos uniformes se amontonan a los costados). Arranca arriba al
// centro y gira en sentido horario.
function ringAngles(count: number) {
  const steps = 720;
  const lengths = [0];
  for (let i = 1; i <= steps; i++) {
    const t = -Math.PI / 2 + (i / steps) * Math.PI * 2;
    const speed = Math.hypot(RX * Math.sin(t), RY * Math.cos(t));
    lengths.push(lengths[i - 1] + speed);
  }
  const total = lengths[steps];

  return Array.from({ length: count }, (_, n) => {
    const target = (n / count) * total;
    const i = lengths.findIndex((length) => length >= target);
    return -Math.PI / 2 + (i / steps) * Math.PI * 2;
  });
}

const read = (...segments: string[]) =>
  readFile(path.join(process.cwd(), "assets", ...segments));

export default async function Image() {
  const [medium, thumbs] = await Promise.all([
    read("fonts", "geist-latin-500-normal.woff"),
    Promise.all(
      PROJECTS.map(async (slug) => {
        const file = await read("og", `${slug}.jpg`);
        return `data:image/jpeg;base64,${file.toString("base64")}`;
      }),
    ),
  ]);

  const cx = size.width / 2;
  const cy = size.height / 2;
  const angles = ringAngles(thumbs.length);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0b",
        color: "#f1f1f1",
        fontFamily: "Geist",
        position: "relative",
      }}
    >
      {thumbs.map((src, i) => {
        const j = JITTER[i % JITTER.length];
        const x = cx + Math.cos(angles[i]) * RX + j.dx;
        const y = cy + Math.sin(angles[i]) * RY + j.dy;
        const h = Math.round(j.w * 0.75);

        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={PROJECTS[i]}
            src={src}
            alt=""
            width={j.w}
            height={h}
            style={{
              position: "absolute",
              left: x - j.w / 2,
              top: y - h / 2,
              objectFit: "cover",
              transform: `rotate(${j.r}deg)`,
            }}
          />
        );
      })}

      <div
        style={{
          fontSize: 76,
          fontWeight: 500,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        Ignacio Weppler
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Geist", data: medium, weight: 500, style: "normal" }],
    },
  );
}

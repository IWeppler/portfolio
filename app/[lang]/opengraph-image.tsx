import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { seoCopy } from "@/lib/seo";

// Node (no edge): lee Geist desde /assets/fonts y lo embebe en la imagen.
export const runtime = "nodejs";
const size = { width: 1200, height: 630 };

// Una sola imagen por idioma, pero con el alt traducido (un `alt` exportado
// fijo quedaba en espanol tambien en /en y /pt).
export async function generateImageMetadata({ params }: { params: Promise<{ lang: string }> | { lang: string } }) {
  const { lang } = await params;
  return [{ id: "default", alt: seoCopy(lang).homeTitle, size, contentType: "image/png" }];
}

const font = (file: string) =>
  readFile(path.join(process.cwd(), "assets", "fonts", file));

export default async function Image() {
  const [regular, semibold] = await Promise.all([
    font("geist-latin-400-normal.woff"),
    font("geist-latin-600-normal.woff"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#111213",
        color: "#ecebe8",
        padding: "64px",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          fontSize: 26,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#a2a3a8",
        }}
      >
        Full-stack Developer
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 132,
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: "-0.045em",
          }}
        >
          Ignacio Weppler
        </div>
        <div
          style={{
            fontSize: 36,
            lineHeight: 1.3,
            color: "#a2a3a8",
            maxWidth: 860,
            marginTop: 32,
          }}
        >
          Desarrollo webs modernas y optimizadas para negocios que quieren
          crecer en serio.
        </div>
      </div>

      <div style={{ fontSize: 26, color: "#a2a3a8" }}>
        www.ignacioweppler.dev
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}

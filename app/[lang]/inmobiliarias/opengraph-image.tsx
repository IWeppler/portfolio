import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Node (no edge): lee la imagen de Arcos desde /public.
export const runtime = "nodejs";
export const alt =
  "Webs para inmobiliarias que llenan tu WhatsApp | Ignacio Weppler";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const file = await readFile(
    path.join(process.cwd(), "public", "inmobiliarias", "verde.png"),
  );
  const verde = `data:image/png;base64,${file.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#111213",
        color: "#ecebe8",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 700,
          padding: "64px 56px 56px 64px",
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#a2a3a8",
          }}
        >
          Ignacio Weppler · Webs
        </div>

        <div
          style={{
            fontSize: 98,
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: "-0.045em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Webs que</span>
          <span>llenan tu</span>
          <span>WhatsApp.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 26, color: "#ecebe8" }}>
            Casi 20 proyectos · clientes en 5 países
          </div>
          <div style={{ fontSize: 22, color: "#a2a3a8" }}>
            ignacioweppler.dev/es/inmobiliarias
          </div>
        </div>
      </div>

      <div style={{ display: "flex", width: 500, height: 630 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={verde}
          alt=""
          width={500}
          height={630}
          style={{
            width: 500,
            height: 630,
            objectFit: "cover",
            objectPosition: "50% 62%",
          }}
        />
      </div>
    </div>,
    size,
  );
}

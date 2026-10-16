import { ImageResponse } from "next/og";

export const alt = "Vos diseñás y vendés. Yo lo programo. Desarrollo para agencias | Ignacio Weppler";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        background: "#111213",
        color: "#ecebe8",
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
        Ignacio Weppler · Desarrollo para agencias
      </div>

      <div
        style={{
          fontSize: 104,
          fontWeight: 600,
          lineHeight: 0.98,
          letterSpacing: "-0.045em",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span>Vos diseñás y vendés.</span>
        <span>Yo lo programo.</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 26, color: "#ecebe8" }}>
          Marca blanca · Presupuesto en 24 h · 20 proyectos
        </div>
        <div style={{ fontSize: 22, color: "#a2a3a8" }}>ignacioweppler.dev/es/collabs</div>
      </div>
    </div>,
    size,
  );
}

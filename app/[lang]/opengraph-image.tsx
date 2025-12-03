import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ignacio Weppler - Desarrollador Full Stack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c1215",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
          fontFamily: "general-sans",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 1200,
            height: 1200,
            background:
              "radial-gradient(circle, rgba(255, 73, 66, 0.22) 0%, rgba(12, 18, 21, 0) 75%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        <div
          style={{
            zIndex: 10,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            maxWidth: "950px",
          }}
        >
          {/* Rol */}
          <div
            style={{
              fontSize: 36,
              color: "#ff4942",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              marginBottom: 28,
              fontWeight: 700,
            }}
          >
            Full-stack Developer
          </div>

          {/* Nombre */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              marginBottom: 32,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "#fefefe",
            }}
          >
            Ignacio Weppler
          </div>

          {/* Descripción */}
          <div
            style={{
              fontSize: 32,
              color: "#cfcfcf",
              lineHeight: 1.35,
              maxWidth: 900,
              marginBottom: 48,
            }}
          >
            Desarrollo webs modernas y optimizadas para negocios que quieren
            crecer en serio.
          </div>

          {/* Dominio */}
          <div
            style={{
              fontSize: 26,
              color: "#8a8a8a",
              fontWeight: 400,
            }}
          >
            www.ignacioweppler.com
          </div>
        </div>
      </div>
    ),
    size
  );
}

export const dynamic = "force-static";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "El Pistolero — Luis Suarez";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Red diagonal accent */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(227,6,19,0.1) 0%, transparent 60%)",
          }}
        />

        <p
          style={{
            fontSize: 24,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "#e30613",
            margin: 0,
            marginBottom: 16,
          }}
        >
          A tribute to
        </p>

        <h1
          style={{
            fontSize: 100,
            fontWeight: 900,
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: "#e30613" }}>El </span>
          <span style={{ color: "#f0f0f0" }}>Pistolero</span>
        </h1>

        <p
          style={{
            fontSize: 20,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#999",
            margin: 0,
            marginTop: 20,
          }}
        >
          Luis Suarez — No. 9
        </p>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 14,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#444",
          }}
        >
          pistolero.casa
        </div>
      </div>
    ),
    { ...size },
  );
}

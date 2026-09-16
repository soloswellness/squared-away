import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#1d4ed8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ color: "white", fontSize: 34, fontWeight: 700 }}>✓</div>
          </div>
          <div style={{ color: "#93c5fd", fontSize: 28, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
            Squared Away
          </div>
        </div>
        <div style={{ display: "flex", color: "white", fontSize: 56, fontWeight: 800, lineHeight: 1.15, maxWidth: 900 }}>
          Every dollar of your quote, shown.
        </div>
        <div style={{ display: "flex", color: "#94a3b8", fontSize: 28, marginTop: 24, maxWidth: 820 }}>
          Materials, labor, business costs, and profit — broken down, not buried.
        </div>
      </div>
    ),
    { ...size }
  );
}

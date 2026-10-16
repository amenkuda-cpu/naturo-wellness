import { ImageResponse } from "next/og";

export const alt = "Naturo Wellness: Feel good. Naturally.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F7EFD6", position: "relative", fontFamily: "sans-serif" }}>
        <div style={{ position: "absolute", right: -80, top: 40, width: 620, height: 620, borderRadius: 9999, background: "#F5D84E", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
          <div style={{ fontSize: 28, letterSpacing: 6, color: "#367A45", textTransform: "uppercase", fontWeight: 700 }}>Naturo Wellness</div>
          <div style={{ fontSize: 128, fontWeight: 900, color: "#173F2B", lineHeight: 0.9, marginTop: 24 }}>FEEL GOOD.</div>
          <div style={{ fontSize: 128, fontStyle: "italic", color: "#367A45", lineHeight: 0.95 }}>Naturally.</div>
          <div style={{ fontSize: 30, color: "#183126", marginTop: 36, maxWidth: 640 }}>
            Natural shots, traditional favourites and herbal blends, proudly made in Zimbabwe.
          </div>
        </div>
      </div>
    ),
    size,
  );
}

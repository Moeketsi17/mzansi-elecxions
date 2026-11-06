import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the site's ringed mark on the dark background (iOS rounds the corners itself). */
export default function AppleIcon() {
  const ring = (d: number, opacity: number) => ({
    position: "absolute" as const,
    width: d,
    height: d,
    borderRadius: d,
    border: `8px solid rgba(236, 235, 230, ${opacity})`,
  });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0d10",
          position: "relative",
        }}
      >
        <div style={ring(124, 0.32)} />
        <div style={ring(78, 0.62)} />
        <div style={{ width: 30, height: 30, borderRadius: 30, background: "#efe6cf" }} />
      </div>
    ),
    size,
  );
}

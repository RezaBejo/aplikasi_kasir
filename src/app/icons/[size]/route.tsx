import { ImageResponse } from "next/og";
import { appConfig } from "@/config/app";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: { size: string } }
) {
  const size = Math.min(512, Math.max(16, parseInt(params.size) || 192));
  const radius = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.32);
  const subSize = Math.round(size * 0.16);
  const gap = Math.round(size * 0.04);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: `linear-gradient(145deg, ${appConfig.themeColorLight} 0%, ${appConfig.themeColor} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius,
          gap,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize,
            fontWeight: 900,
            fontFamily: "sans-serif",
            letterSpacing: -size * 0.01,
            lineHeight: 1,
          }}
        >
          {appConfig.abbr}
        </div>
        <div
          style={{
            color: "#9ca3af",
            fontSize: subSize,
            fontFamily: "sans-serif",
            fontWeight: 600,
            letterSpacing: size * 0.02,
            lineHeight: 1,
          }}
        >
          {appConfig.tagline}
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}

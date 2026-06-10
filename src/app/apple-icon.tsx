import { ImageResponse } from "next/og";
import { appConfig } from "@/config/app";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: `linear-gradient(145deg, ${appConfig.themeColorLight} 0%, ${appConfig.themeColor} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 56,
            fontWeight: 900,
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          {appConfig.abbr}
        </div>
        <div
          style={{
            color: "#9ca3af",
            fontSize: 22,
            fontFamily: "sans-serif",
            fontWeight: 600,
            letterSpacing: 3,
            lineHeight: 1,
          }}
        >
          {appConfig.tagline}
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  );
}

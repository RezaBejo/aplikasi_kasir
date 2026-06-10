import { ImageResponse } from "next/og";
import { appConfig } from "@/config/app";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: appConfig.themeColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 900,
            fontFamily: "sans-serif",
          }}
        >
          {appConfig.abbr[0]}
        </div>
      </div>
    ),
    { width: 32, height: 32 }
  );
}

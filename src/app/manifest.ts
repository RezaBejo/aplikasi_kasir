import type { MetadataRoute } from "next";
import { appConfig } from "@/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.name,
    short_name: appConfig.shortName,
    description: appConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: appConfig.themeColor,
    // orientation tidak ada di tipe Next.js, tapi browser tetap baca dari JSON
    ...({ orientation: "portrait-primary" } as object),
    icons: [
      { src: "/icons/72",  sizes: "72x72",   type: "image/png" },
      { src: "/icons/96",  sizes: "96x96",   type: "image/png" },
      { src: "/icons/128", sizes: "128x128", type: "image/png" },
      { src: "/icons/144", sizes: "144x144", type: "image/png" },
      { src: "/icons/152", sizes: "152x152", type: "image/png" },
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/384", sizes: "384x384", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Kasir", short_name: "POS", url: "/pos", description: "Buka layar kasir" },
      { name: "Dashboard", short_name: "Admin", url: "/admin", description: "Buka dashboard owner" },
    ],
  };
}

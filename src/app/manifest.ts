import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "True Color Display Printing",
    short_name: "True Color",
    description:
      "Instant online pricing for signs, banners, business cards & more. Saskatoon print shop.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1c1712",
    icons: [
      {
        src: "/truecolorlogo.webp",
        sizes: "any",
        type: "image/webp",
      },
      {
        src: "/og-image.png",
        sizes: "1200x630",
        type: "image/png",
      },
    ],
  };
}

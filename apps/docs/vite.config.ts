import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "next/link": path.resolve(`${__dirname}`, "mocks", "link.tsx"),
      "next/image": path.resolve(`${__dirname}`, "mocks", "image.tsx"),
      "next/navigation": path.resolve(
        `${__dirname}`,
        "mocks",
        "navigation.tsx",
      ),
    },
  },
  define: {
    "process.env": {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "",
      NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: "",
    },
  },
});

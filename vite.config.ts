import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async ({ mode }) => {
  const replitPlugins = [];
  
  if (mode !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal");
      const { cartographer } = await import("@replit/vite-plugin-cartographer");
      const { devBanner } = await import("@replit/vite-plugin-dev-banner");
      
      replitPlugins.push(runtimeErrorOverlay());
      replitPlugins.push(cartographer());
      replitPlugins.push(devBanner());
    } catch (e) {
      console.warn("Replit plugins not found, skipping...");
    }
  }

  return {
    plugins: [
      react(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
      reportCompressedSize: false,
    },
    server: {
      allowedHosts: true,
      fs: {
        strict: false,
        allow: [
          path.resolve(import.meta.dirname, "client"),
          path.resolve(import.meta.dirname, "shared"),
          path.resolve(import.meta.dirname, "attached_assets"),
        ],
      },
    },
  };
});

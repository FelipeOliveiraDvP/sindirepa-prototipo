import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // A lib de pricing e' funcao pura, sem React e sem DOM.
    // Quando componentes ganharem teste, adicionar jsdom + @testing-library.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

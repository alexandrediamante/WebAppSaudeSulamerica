import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // NOTA: Para testar as API Routes localmente, use 'npx vercel dev'
    // em vez de 'npm run dev'. O Vercel CLI executa as serverless functions
    // localmente, enquanto o vite dev server não suporta proxy para serverless.
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

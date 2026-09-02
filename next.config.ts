import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // La imagen sigue validándose en 10 MB.
      // Dejamos margen para el multipart de la Server Action.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inclut les fichiers prompts dans les fonctions serverless Vercel
  outputFileTracingIncludes: {
    "/api/process": ["./prompts/**/*"],
    "/": ["./prompts/**/*"],
  },
};

export default nextConfig;

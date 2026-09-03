import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite rodar um segundo dev server sem que os dois briguem pelo mesmo
  // diretório de build (o que corrompe o cache do webpack):
  //   NEXT_DIST_DIR=.next-alt npm run dev -- --port 3100
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap"],
  },
};

export default nextConfig;

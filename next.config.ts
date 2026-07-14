import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@remotion/google-fonts"],
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/tailwind-v4",
  ],
  async redirects() {
    return [
      {
        // The static Swarm history page is retired — the live React gallery
        // (rendering Onur's model-card design) replaces it. (STA-416)
        source: "/swarm-arena-cards/history.html",
        destination: "/swarm-arena/history",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

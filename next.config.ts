import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every signed-in page is per-user, so we use request-time rendering
  // instead of Cache Components.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

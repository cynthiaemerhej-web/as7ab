import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Classic rendering model: nearly every page here is rendered per request
  // (ads rotate, top bar depends on the signed-in user), so Cache Components
  // would add Suspense boundaries without a caching benefit.
  cacheComponents: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase Auth のリダイレクトURL許可
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;

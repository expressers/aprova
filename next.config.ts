import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (Postgres embutido para desenvolvimento) e pg correm só no servidor
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;

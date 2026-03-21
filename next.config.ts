import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["@prisma/client"],
  allowedDevOrigins: ["172.16.0.2"],
};

export default nextConfig;

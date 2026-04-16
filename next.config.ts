import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.15', '192.168.0.103'],
  output: "standalone",
};

export default nextConfig;

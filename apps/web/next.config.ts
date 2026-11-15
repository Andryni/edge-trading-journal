import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@edge/core"],
  devIndicators: false,
  distDir: process.env.EDGE_BUILD_DIR ?? ".next",
};
export default config;

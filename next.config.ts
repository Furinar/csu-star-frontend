import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  transpilePackages: ["tdesign-react", "tdesign-icons-react"],
};

export default nextConfig;

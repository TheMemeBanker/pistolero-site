import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", basePath: "/pistolero-site", assetPrefix: "/pistolero-site/", images: { unoptimized: true }, trailingSlash: true,
  /* config options here */
};

export default nextConfig;

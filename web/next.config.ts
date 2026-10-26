import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(webDir, ".."),
  outputFileTracingIncludes: {
    "/opportunity": ["../career/*.json"]
  }
};

export default nextConfig;

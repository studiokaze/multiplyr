import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There is a stray lockfile in the parent directory; pin the workspace root
  // so Next doesn't infer C:\Users\Lenovo as the project root.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  // The desktop build runs this server inside Electron, so we need the
  // self-contained bundle rather than a node_modules-dependent one.
  output: "standalone",
};

export default nextConfig;

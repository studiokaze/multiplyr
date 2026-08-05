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

  // Clean URLs. /home mirrors the landing; section names land on their
  // anchors, so /pricing is shareable without anyone knowing about hashes.
  async rewrites() {
    return [{ source: "/home", destination: "/" }];
  },
  async redirects() {
    return [
      { source: "/features", destination: "/#features", permanent: false },
      { source: "/pricing", destination: "/#pricing", permanent: false },
      { source: "/faq", destination: "/#faq", permanent: false },
      { source: "/releases", destination: "/download", permanent: false },
    ];
  },
};

export default nextConfig;

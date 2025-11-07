import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Suppress multiple lockfiles warning by setting explicit root
  outputFileTracingRoot: path.join(__dirname, "../"),
  headers() {
    // FHEVM requires COEP, but RainbowKit/Base Account SDK needs COOP to allow popups
    // Use 'same-origin-allow-popups' to satisfy both requirements
    return Promise.resolve([
      {
        source: '/',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]);
  }
};

export default nextConfig;

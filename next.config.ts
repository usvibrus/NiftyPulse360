import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable in-memory page cache — use filesystem cache instead.
  // Saves ~200-300 MB RAM on Railway. Pages are still cached on disk
  // and behind Cloudflare CDN, so user-facing speed is unchanged.
  cacheMaxMemorySize: 0,

  // NOTE: We DON'T use `output: "standalone"` here.
  // standalone strips the public/ folder from the deployment, which broke
  // /icon.svg, /logo.svg, and other static assets. Memory savings now come
  // from cacheMaxMemorySize:0 + Railway replica limits (1 GB), so we don't
  // need standalone's bundle reduction.

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rankai.ai',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
};

export default nextConfig;

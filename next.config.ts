import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable in-memory page cache — use filesystem cache instead.
  // Saves ~200-300 MB RAM on Railway. Pages are still cached on disk
  // and behind Cloudflare CDN, so user-facing speed is unchanged.
  cacheMaxMemorySize: 0,

  // Generate a minimal standalone server bundle.
  // Only files actually needed at runtime are included, reducing
  // cold-start memory and deploy size from ~500 MB to ~100-150 MB.
  output: "standalone",

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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  cacheMaxMemorySize: 0,

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

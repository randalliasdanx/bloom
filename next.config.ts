import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: 'http://localhost:4123/v1/:path*',
      },
    ];
  },
};

export default nextConfig;

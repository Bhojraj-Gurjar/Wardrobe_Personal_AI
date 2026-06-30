/** @type {import('next').NextConfig} */
function withHttpProtocol(url) {
  const trimmed = String(url || '').trim().replace(/\/$/, '');
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

const backendInternalUrl = withHttpProtocol(
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000',
);

const aiServiceInternalUrl = withHttpProtocol(
  process.env.AI_SERVICE_INTERNAL_URL || 'http://localhost:8000',
);

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: import.meta.dirname,
  compress: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendInternalUrl}/api/v1/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendInternalUrl}/uploads/:path*`,
      },
      {
        source: '/tryon/:path*',
        destination: `${aiServiceInternalUrl}/tryon/:path*`,
      },
    ];
  },
  images: {
    // Avoid _next/image proxy failures in Docker/production without sharp.
    unoptimized: true,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

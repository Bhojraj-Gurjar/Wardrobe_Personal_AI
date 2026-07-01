import os from 'node:os';
import path from 'node:path';

/** @type {import('next').NextConfig} */
function withHttpProtocol(url) {
  const trimmed = String(url || '').trim().replace(/\/$/, '');
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

function resolveDevCacheDirectory() {
  if (process.env.NEXT_WEBPACK_CACHE_DIR) {
    return process.env.NEXT_WEBPACK_CACHE_DIR;
  }

  const isOneDrivePath =
    process.platform === 'win32' &&
    import.meta.dirname.toLowerCase().includes('onedrive');

  if (!isOneDrivePath) {
    return null;
  }

  const localAppData =
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');

  return path.join(localAppData, 'WardrobeAI', 'webpack-cache');
}

const backendInternalUrl = withHttpProtocol(
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000',
);

const aiServiceInternalUrl = withHttpProtocol(
  process.env.AI_SERVICE_INTERNAL_URL || 'http://localhost:8000',
);

const devCacheDirectory = resolveDevCacheDirectory();

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: import.meta.dirname,
  compress: true,
  poweredByHeader: false,
  webpack(config, { dev }) {
    if (dev && devCacheDirectory) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: devCacheDirectory,
      };
    }

    return config;
  },
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

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  // Note: Turbopack config removed to ensure webpack is used for custom bundle splitting
  experimental: {
    optimizePackageImports: ['@stream-io/video-react-sdk', '@stream-io/node-sdk', 'stream-chat-react'],
  },

  // Bundle analysis and optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        stream: {
          test: /[\\/]node_modules[\\/](@stream-io|stream-chat)[\\/]/,
          name: 'stream-vendor',
          priority: 10,
        },
        three: {
          test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
          name: 'three-vendor',
          priority: 10,
        },
        mongodb: {
          test: /[\\/]node_modules[\\/](mongoose|mongodb)[\\/]/,
          name: 'db-vendor',
          priority: 5,
        },
      };
    }

    // Add performance hints
    if (!dev) {
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      };
    }

    return config;
  },

  // Image optimization (for future use)
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  // PWA and service worker
  experimental: {
    optimizePackageImports: ['@stream-io/video-react-sdk', '@stream-io/node-sdk', 'stream-chat-react'],
  },
};

export default nextConfig;

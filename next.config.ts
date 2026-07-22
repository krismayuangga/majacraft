import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix workspace root detection — ada lockfile di /root yang membingungkan Next.js
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: __dirname,
  },

  // ✅ IMAGE OPTIMIZATION
  images: {
    // Using modern formats: webp, avif
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "majacraft.id" }, // CDN domain
    ],
    // Disk cache for Next.js Image Optimization
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ COMPRESSION & PERFORMANCE
  compress: true,
  productionBrowserSourceMaps: false, // Disable source maps in production

  // ✅ HEADERS FOR SEO & CACHING
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },

  // ✅ REDIRECTS FOR SEO
  async redirects() {
    return [
      {
        source: '/produk/page/:page',
        destination: '/produk?page=:page',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

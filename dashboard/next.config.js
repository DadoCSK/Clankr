/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a standalone build for production (minimal node_modules copy)
  output: 'standalone',

  // Security & performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent search engines from being blocked
          { key: 'X-Robots-Tag', value: 'index, follow' },
          // Security headers
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Block admin routes from indexing
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/logo.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

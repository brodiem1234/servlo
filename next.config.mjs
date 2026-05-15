/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false
  },

  // Permanent redirects: legacy /legal/* URLs → canonical pages.
  // Stops duplicate-content SEO penalty.
  async redirects() {
    return [
      { source: '/legal/terms', destination: '/terms', permanent: true },
      { source: '/legal/privacy', destination: '/privacy', permanent: true },
      { source: '/legal/refund', destination: '/refund', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // HSTS — force HTTPS for 2 years across all subdomains, eligible for preload list.
          // Vercel terminates TLS, so this is safe to set unconditionally on the production deploy.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.stripe.com https://js.stripe.com https://m.stripe.com https://m.stripe.network https://api.resend.com https://challenges.cloudflare.com",
              "frame-src https://challenges.cloudflare.com https://js.stripe.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

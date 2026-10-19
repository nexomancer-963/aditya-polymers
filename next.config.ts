import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
    }];
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/products', destination: '/aditya-polymers-products.html', permanent: true },
      { source: '/about', destination: '/about-aditya-polymers.html', permanent: true },
      { source: '/locations', destination: '/contact.html#locations', permanent: true },
      { source: '/locations-we-serve.html', destination: '/contact.html#locations', permanent: true },
      { source: '/capabilities', destination: '/about-aditya-polymers.html#working-methods', permanent: true },
      { source: '/contact', destination: '/contact.html', permanent: true },
      { source: '/enquiry.php', destination: '/contact.html', permanent: true }
    ];
  }
};

export default nextConfig;

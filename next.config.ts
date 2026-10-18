import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/products', destination: '/aditya-polymers-products.html', permanent: true },
      { source: '/about', destination: '/about-aditya-polymers.html', permanent: true },
      { source: '/locations', destination: '/locations-we-serve.html', permanent: true },
      { source: '/contact', destination: '/contact.html', permanent: true },
      { source: '/enquiry.php', destination: '/contact.html', permanent: true }
    ];
  }
};

export default nextConfig;

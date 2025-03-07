/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'assets.coingecko.com',
      'www.coingecko.com'
    ],
  },
  // We need to use a server-side deployment to support API routes
  experimental: {
    // Modern features configuration
  },
};

module.exports = nextConfig;

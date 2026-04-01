/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Disable static optimization for API routes
  experimental: {
    // Enable server actions if needed
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig

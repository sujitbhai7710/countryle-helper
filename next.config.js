/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'export',
  trailingSlash: true,
  basePath: '/countryle-helper',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

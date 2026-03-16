/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', '@prisma/client', 'nodemailer'],
  },
}

module.exports = nextConfig

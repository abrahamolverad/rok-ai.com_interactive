/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',          // your existing setting
  experimental: { appDir: true } // enable App Router
};

module.exports = nextConfig;

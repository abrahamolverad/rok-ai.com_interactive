/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Optimized for Docker deployments
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Expose only what's necessary to the client
  env: {
    // Example: NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  }
};

module.exports = nextConfig;
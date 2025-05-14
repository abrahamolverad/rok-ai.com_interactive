// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Essential for Docker deployments with standalone output
  reactStrictMode: false, // User's previous setting
  typescript: {
    ignoreBuildErrors: true, // User's previous setting
  },
  eslint: {
    ignoreDuringBuilds: true, // User's previous setting
  },
  // The following redirect is commented out for testing Render health checks.
  // If your dashboard is not at the root and you have a specific index.html
  // for the root, you might re-enable this later and configure Render's
  // health check path to point to a valid Next.js page (e.g., /dashboard).
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/index.html',
  //       permanent: false,
  //     },
  //   ];
  // }
};

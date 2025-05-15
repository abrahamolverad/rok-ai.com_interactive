// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Essential for Docker deployments with standalone output
  reactStrictMode: false, // User's previous setting
  
  // Temporarily comment out typescript and eslint ignore settings
  // to ensure all potential build issues are surfaced.
  typescript: {
    // ignoreBuildErrors: true, 
  },
  eslint: {
    // ignoreDuringBuilds: true,
  },

  // The following redirect is commented out for testing Render health checks.
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
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Essential for Docker deployments with standalone output
  // All other options temporarily removed for debugging standalone output.
  // reactStrictMode: false,
  // typescript: {
  //   // ignoreBuildErrors: true,
  // },
  // eslint: {
  //   // ignoreDuringBuilds: true,
  // },
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/index.html',
  //       permanent: false,
  //     },
  //   ];
  // }
}
// next.config.js  (CommonJS)
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',          // generates .next/standalone
  // more options…
};

module.exports = nextConfig;      // ←  this was missing

// next.config.js  (CommonJS)
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',          // generates .next/standalone
  // more options…
};

const nextConfig = { experimental: { appDir: true }, ...(typeof nextConfig !== "undefined" ? nextConfig : {}) };\n\nmodule.exports = nextConfig;      // ←  this was missing

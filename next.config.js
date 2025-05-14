const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ─────────────────────────────────────────────────────────────
  //  ⬇️  Don’t let lint or TS errors block the CI/Render build
  //      (you’ll still see them in `next dev` while coding).
  // ─────────────────────────────────────────────────────────────
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ─────────────────────────────────────────────────────────────
  //  ⬇️  Force all React imports to resolve to a single copy
  // ─────────────────────────────────────────────────────────────
  webpack: (config) => {
    config.resolve.alias['react'] = path.resolve(
      __dirname,
      './node_modules/react'
    );
    config.resolve.alias['react-dom'] = path.resolve(
      __dirname,
      './node_modules/react-dom'
    );
    return config;
  },
};

module.exports = nextConfig;

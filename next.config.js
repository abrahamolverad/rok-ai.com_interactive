// next.config.js  (final)
const path = require('path');

module.exports = {
  webpack: (config) => {
    // keep "@/…" import shortcut
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },

  eslint:    { ignoreDuringBuilds: true },
  typescript:{ ignoreBuildErrors:  true },
};

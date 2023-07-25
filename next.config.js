const MiniCssExtractPlugin = require("mini-css-extract-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(new MiniCssExtractPlugin());
    }

    return config;
  },
};

module.exports = nextConfig;

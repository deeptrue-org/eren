/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'playwright-extra',
      'puppeteer-extra-plugin-stealth',
      'selenium-webdriver',
      'chromedriver',
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'playwright-extra': false,
        'puppeteer-extra-plugin-stealth': false,
        'selenium-webdriver': false,
        chromedriver: false,
      };
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

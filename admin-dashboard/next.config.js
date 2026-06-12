const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');

if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;

import nextPwa from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Isolate dev artifacts from production builds to avoid chunk/cache races.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  experimental: {
    optimizePackageImports: ["@tanstack/react-query"]
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid flaky filesystem cache pack files in volatile dev environments.
      config.cache = false;
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

const withPwa = nextPwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline"
  }
});

export default withPwa(nextConfig);

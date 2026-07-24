/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize for performance
  swcMinify: true,
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  // Improve caching
  compress: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Improve build performance
  productionBrowserSourceMaps: false,
};

export default nextConfig;

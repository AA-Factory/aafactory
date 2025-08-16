/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      sharp: "commonjs sharp",
      canvas: "commonjs canvas",
    });

    // Suppress FFmpeg warnings
    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();
      return entries;
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      '@ffmpeg/ffmpeg': require.resolve('@ffmpeg/ffmpeg'),
    };

    return config;
  },

  // Suppress specific warnings
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    esmExternals: 'loose',
  }
};

module.exports = nextConfig;
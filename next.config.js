/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'cdn.phenompeople.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: '1000logos.net',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'logo.clearbit.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'i.postimg.cc',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'encrypted-tbn0.gstatic.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'www.google.com',
          pathname: '/s2/favicons/**',
        },
        {
          protocol: 'https',
          hostname: 'icons.duckduckgo.com',
          pathname: '/ip3/**',
        },
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com',
          pathname: '/**',
        }
      ],
    },
    webpack: (config, { isServer }) => {
      // Suppress all webpack warnings
      config.infrastructureLogging = {
        level: 'error',
      };

      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
          net: false,
          tls: false,
          crypto: false,
          path: false,
          os: false,
          stream: false,
          http: false,
          https: false,
          zlib: false,
        };
      }

      // Add resolve aliases for problematic modules
      config.resolve.alias = {
        ...config.resolve.alias,
        '@parcel/watcher': false,
        fsevents: false,
      };

      // Ignore specific warnings
      config.ignoreWarnings = [
        /node_modules\/@next\/swc-/,
        /node_modules\/@parcel\/watcher-/,
        /node_modules\/fsevents/,
        /Critical dependency/,
        /Module not found/,
        /webpack/,
        /optional require/,
      ];

      return config;
    },
    // Suppress build warnings
    onDemandEntries: {
      // period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
  }
  
  module.exports = nextConfig 
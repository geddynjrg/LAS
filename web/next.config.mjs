import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './i18n/request.ts'
);

const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uwezo.ddev.site',
      },
      ...(process.env.API_URL
        ? [{ protocol: new URL(process.env.API_URL).protocol.replace(':', ''), hostname: new URL(process.env.API_URL).hostname }]
        : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
};

export default withNextIntl(nextConfig);

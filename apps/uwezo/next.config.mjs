import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: "standalone",
  images: {
    remotePatterns: [
      {
        hostname: "uwezo-api.ddev.site",
      },
      {
        hostname: "uwezo-api-qa.fusion.adm.ee",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/monitoring/:path*",
        destination: "http://grafana:3000/:path*",
      },
    ];
  },
};

export default withNextIntl(nextConfig);

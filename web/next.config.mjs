import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: "standalone",
  images: {
    remotePatterns: [
      {
        hostname: "uwezo.ddev.site",
      },
      {
        hostname: "uwezo-api-qa.fusion.adm.ee",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default withNextIntl(nextConfig);

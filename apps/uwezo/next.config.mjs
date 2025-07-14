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
};

export default withNextIntl(nextConfig);

import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: "standalone",
  images: {
    domains: ["tvet-api-qa.fusion.adm.ee"],
  },
};

export default withNextIntl(nextConfig);

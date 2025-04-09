import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: "standalone",
  images: {
    remotePatterns: [
      {
        hostname: "tvet-api-qa.fusion.adm.ee",
      },
    ],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));

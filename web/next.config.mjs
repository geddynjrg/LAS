import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: "standalone",
  images: {
    remotePatterns: [
      ...(process.env.API_URL ? [{ hostname: new URL(process.env.API_URL).hostname }] : []),
    ],
  },
};

export default withNextIntl(nextConfig);

/**
 * @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions &
 *       import("@ianvs/prettier-plugin-sort-imports").PluginConfig}
 */
const config = {
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: [
    "<THIRD_PARTY_MODULES>",
    "",
    "^@workspace/",
    "",
    "^@/",
    "^[.][.]/",
    "^[.]/",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrderTypeScriptVersion: "4.5.0",
  tailwindStylesheet: "/packages/ui/src/styles/global.css",
  tailwindFunctions: ["cva", "cn", "classNames"],
};

export default config;

import { dirname, join } from "path";
import type { StorybookConfig } from "@storybook/react-vite";

export default {
  stories: ["../stories/*.stories.tsx", "../stories/**/*.stories.tsx"],
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-actions"),
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-themes"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },

  staticDirs: ["../public"],

  core: {
    disableTelemetry: true,
  },

  features: {
    experimentalRSC: true,
  },
} satisfies StorybookConfig;

function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, "package.json")));
}

import storybook from "eslint-plugin-storybook";

import { config as baseConfig } from "./react-internal.js";

/**
 * A custom ESLint configuration for libraries that use Storybook.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const storybookConfig = [
  ...baseConfig,
  ...storybook.configs["flat/recommended"],
];

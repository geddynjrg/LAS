import type { StorybookConfig } from "@storybook/react-vite";

export default {
	stories: ["../stories/*.stories.tsx", "../stories/**/*.stories.tsx"],
	addons: [
		"@storybook/addon-essentials",
		"@storybook/addon-actions",
		"@storybook/addon-links",
		"@storybook/addon-themes",
	],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},

	core: {
		disableTelemetry: true,
	},
} satisfies StorybookConfig;

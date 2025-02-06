import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react";

import "@workspace/ui/globals.css";

export default {
	tags: ["autodocs"],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
} satisfies Preview;

export const decorators = [
	withThemeByClassName({
		themes: {
			default: "default",
			TVET: "tvet",
			Uwezo: "uwezo",
			"Civil registry": "civil-registry",
		},
		defaultTheme: "Civil registry",
	}),
];

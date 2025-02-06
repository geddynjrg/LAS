import type { Meta, StoryObj } from "@storybook/react";

import { Select, selectVariants } from "@workspace/ui/components/select";

const meta = {
	component: Select,
	argTypes: {
		size: {
			control: { type: "select" },
			options: selectVariants.variants.size,
		},
	},
	args: {
		placeholder: "Select an option",
		options: [
			{ label: "Option 1", value: "1" },
			{ label: "Option 2", value: "2" },
			{ label: "Option 3", value: "3" },
		],
	},
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

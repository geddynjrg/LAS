import type { Meta, StoryObj } from "@storybook/react";

import { Header } from "@workspace/ui/components/header";

const meta = {
	component: Header,
	args: {
		startDecorator: <div className="flex items-center">startDecorator</div>,
		endDecorator: <div className="flex items-center">endDecorator</div>,
		children: <div className="flex items-center">children</div>,
	},
	decorators: [
		(Story) => (
			<div className="[--header-height:4.5rem] md:[--header-height:5.5rem]">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

import { useArgs } from "@storybook/preview-api";
import type { Meta, StoryObj } from "@storybook/react";
import { Bus, Car, Ship } from "lucide-react";

import {
  ButtonGroup,
  ButtonGroupItem,
  buttonGroupVariants,
} from "@workspace/ui/components/button-group";

const meta = {
  component: ButtonGroup,
  argTypes: {
    type: {
      control: { type: "radio" },
      options: ["single", "multiple"],
    },
    value: {
      control: { type: "text" },
    },
    defaultValue: {
      control: { type: "text" },
    },
    onValueChange: {
      action: "onValueChange",
    },

    variant: {
      control: { type: "select" },
      options: buttonGroupVariants.variants.variant,
    },
    size: {
      control: { type: "select" },
      options: buttonGroupVariants.variants.size,
    },
  },
  args: {
    type: "single",
    children: (
      <>
        <ButtonGroupItem value="a">A</ButtonGroupItem>
        <ButtonGroupItem value="b">B</ButtonGroupItem>
        <ButtonGroupItem value="c">C</ButtonGroupItem>
      </>
    ),
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Controlled = {
  render: ({ defaultValue: _defaultValue, ...props }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [{ value }, setArgs] = useArgs<typeof props>();

    return (
      <ButtonGroup
        {...props}
        type="single"
        value={value as string}
        onValueChange={(value) => setArgs({ value })}
      >
        <ButtonGroupItem value="a">A</ButtonGroupItem>
        <ButtonGroupItem value="b">B</ButtonGroupItem>
        <ButtonGroupItem value="c">C</ButtonGroupItem>
      </ButtonGroup>
    );
  },
} satisfies Story;

export const Multiple = {
  args: {
    type: "multiple",
  },
} satisfies Story;

export const Icons = {
  args: {
    children: (
      <>
        <ButtonGroupItem value="a">
          <Car />
        </ButtonGroupItem>
        <ButtonGroupItem value="b">
          <Bus />
        </ButtonGroupItem>
        <ButtonGroupItem value="c">
          <Ship />
        </ButtonGroupItem>
      </>
    ),
  },
} satisfies Story;

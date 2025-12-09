import type { Meta, StoryObj } from "@storybook/react";

import { Flag, flagVariants } from "@workspace/ui/components/flag";
import { countries } from "@workspace/ui/lib/countries";

/**
 * Renders a flag based on the provided code. Uses the react-flagpack package. https://flagpack.xyz/docs/flag-index/
 */
const meta = {
  component: Flag,
  argTypes: {
    size: {
      control: { type: "select" },
      options: flagVariants.variants.size,
    },
  },
  args: {
    code: "en",
    size: "s",
  },
} satisfies Meta<typeof Flag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Sizes = {
  render: () => (
    <div className="flex items-center gap-4">
      {flagVariants.variants.size.map((size) => (
        <Flag key={size} code="en" size={size} />
      ))}
    </div>
  ),
} satisfies Story;

export const AllCountries = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      {countries.map((country) => (
        <div
          className="w-30 flex flex-col items-center rounded bg-neutral-100 p-2 text-center"
          key={country.iso3}
        >
          <Flag code={country.iso2} size="l" />
          <p>{country.name}</p>
          <p>{country.iso2}</p>
          <p>+{country.callingCode}</p>
        </div>
      ))}
    </div>
  ),
} satisfies Story;

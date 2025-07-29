import type { Meta, StoryObj } from "@storybook/react";
import { createElement, type FunctionComponent } from "react";

// import all icons from "packages/ui/src/components/icon/*.tsx"
// glob actually exists on import.meta
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Icons: Record<string, FunctionComponent> = (import.meta as any).glob(
  "../../../packages/ui/src/components/icon/*.tsx",
  { eager: true },
);

const meta = {} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (_args) => {
    return (
      <div className="flex flex-wrap items-end gap-8">
        {Object.entries(Icons).map(([title, Icon]) => {
          const Element = Object.values(Icon).at(0);

          if (!Element) {
            return null;
          }

          return (
            <div
              key={title}
              className="bg-joy-palette-background-level3 bg-background flex flex-col items-center rounded-lg p-2"
            >
              {createElement(Element)}
              <p className="m-2">{pathToComponentName(title)}</p>
            </div>
          );
        })}
      </div>
    );
  },
} satisfies Story;

function pathToComponentName(path: string) {
  const name = path
    .split("/")
    .at(-1)
    ?.replace(".tsx", "")
    .split("-")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");

  return `<${name} />`;
}

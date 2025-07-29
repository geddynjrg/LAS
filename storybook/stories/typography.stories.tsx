import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "typography",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: () => {
    return (
      <div>
        <div className="typo-h1">h1 title</div>
        <div className="typo-h2">h2 title</div>
        <div className="typo-h3">h3 title</div>
        <div className="typo-h4">h4 title</div>
        <div className="typo-h5">h5 title</div>
        <div className="typo-h6">h6 title</div>
        <div className="typo-display">Display title</div>
        <div className="typo-body-responsive">Body text RESPONSIVE</div>
        <div className="typo-body-extra-small">Body text EXTRA SMALL</div>
        <div className="typo-body-small">Body text SMALL</div>
        <div className="typo-body-medium">Body text MEDIUM</div>
        <div className="typo-body-large">Body text LARGE</div>
        <div className="typo-link">Link text</div>

        <ul className="typo-list-bullet">
          <li>Bullet 1</li>
          <li>Bullet 2</li>
          <ul className="typo-list-bullet">
            <li>Sub-bullet 1</li>
            <li>Sub-bullet 2</li>
            <ul className="typo-list-bullet">
              <li>Sub-sub-bullet 1</li>
              <li>Sub-sub-bullet 2</li>
              <li>Sub-sub-bullet 3</li>
            </ul>
            <li>Sub-bullet 3</li>
          </ul>
          <li>Bullet 3</li>
        </ul>

        <br />

        <ol className="typo-list-numbered">
          <li>Ordered item 1</li>
          <li>Ordered item 2</li>
          <ol className="typo-list-numbered">
            <li>Ordered sub item 1</li>
            <li>Ordered sub item 2</li>
            <ol className="typo-list-numbered">
              <li>Ordered sub-sub item 1</li>
              <li>Ordered sub-sub item 2</li>
              <li>Ordered sub-sub item 3</li>
            </ol>
            <li>Ordered sub item 3</li>
          </ol>
          <li>Ordered item 3</li>
        </ol>

        <br />

        <ul className="typo-list-plain">
          <li>Plain 1</li>
          <li>Plain 2</li>
          <ul className="typo-list-plain">
            <li>Plain sub 1</li>
            <li>Plain sub 2</li>
            <ul className="typo-list-plain">
              <li>Plain sub-sub 1</li>
              <li>Plain sub-sub 2</li>
              <li>Plain sub-sub 3</li>
            </ul>
            <li>Plain sub 3</li>
          </ul>
          <li>Plain 3</li>
        </ul>
      </div>
    );
  },
} satisfies Story;

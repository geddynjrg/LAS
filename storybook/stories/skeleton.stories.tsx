import type { Meta, StoryObj } from "@storybook/react";

import { Skeleton } from "@workspace/ui/components/skeleton";

/**
 * Skeleton component for component loading states.
 * It uses the `@radix-ui/react-skeleton` package to create a skeleton loader.
 */

const meta = {
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: () => (
    <div className="flex w-full items-center space-x-4 bg-gray-600 p-10">
      <Skeleton className="w-42 h-12" />
    </div>
  ),
} satisfies Story;

export const CardExample = {
  render: () => (
    <div className="flex flex-col space-y-4 bg-gray-900 p-10">
      <div className="flex flex-col space-y-3">
        <Skeleton className="h-[125px] w-[250px] rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  ),
} satisfies Story;

export const CustomColor = {
  render: () => (
    <div className="flex space-y-4 bg-gray-900 p-10">
      <div className="flex w-full items-center space-x-4 p-10">
        <Skeleton className="w-42 h-12 bg-gray-600" />
        <Skeleton className="w-42 h-12 bg-pink-400" />
        <Skeleton className="w-42 h-12 bg-blue-400" />
        <Skeleton className="w-42 h-12 bg-white" />
      </div>
    </div>
  ),
} satisfies Story;

export const WithBackground = {
  render: () => (
    <div className="flex flex-col space-y-4 bg-gray-900 p-10">
      <div className="flex w-full items-center space-x-4 bg-white p-10">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="flex w-full items-center space-x-4 bg-gray-600 p-10">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  ),
} satisfies Story;

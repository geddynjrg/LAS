# Kenya e-services frontend monorepo

This is a monorepo for the frontend of the Kenya e-services project. It contains the following packages:

- `packages/ui`: A shared UI component library
- `apps/docs`: Documentation app (Storybook) for the shared UI component library
- `apps/civil-registry`: The Civil Registry frontend
- `apps/uwezo`: The Uwezo Fund digital application form frontend
- `apps/tvet`: The Nairobi vocational training centres (TVET) common web and digital application frontend

## Tech stack

- uses [pnpm](https://pnpm.io/) for package management
- uses [Next.js](https://nextjs.org/) for the frontend
- uses [Tailwind CSS](https://tailwindcss.com/) for styling
- uses [TypeScript](https://www.typescriptlang.org/) for type checking
- uses [ESLint](https://eslint.org/) for linting
- uses [Prettier](https://prettier.io/) for code formatting
- uses [Storybook](https://storybook.js.org/) for component documentation
- many components are based on [ChadCN UI](https://ui.shadcn.com/) component library

## Development requirements

- [Node.js](https://nodejs.org/en/) v20 or later
- [pnpm](https://pnpm.io/) v10 or later

## Development

To start the development server, run the following commands at the root of the project:

```bash
pnpm i
```

```bash
pnpm run dev
```

## Adding libraries to specific packages

```bash
pnpm --filter uwezo add axios
```

## Adding ChadCN UI components

To add components to your app, run the following command at the root of the project:

```bash
pnpm dlx shadcn@canary add button -c apps/uwezo
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/ui/button";
```

## Deployment

TODO: Add docker support and instructions

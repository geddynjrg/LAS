# Kenya e-services frontend monorepo

This is a monorepo for the frontend of the Kenya e-services project. It contains the following packages:

- `packages/ui`: A shared UI component library
- `apps/docs`: Documentation app (Storybook) for the shared UI component library
- `apps/uwezo`: The Uwezo Fund digital application form frontend

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

### Code quality

To check eslint issues run the following command at the root of the project:

```bash
pnpm run lint
```

To check typescript issues run the following command at the root of the project:

```bash
pnpm run check-types
```

To fix code formatting issues run the following command at the root of the project:

```bash
pnpm run format
```

## Adding libraries to specific packages

```bash
pnpm --filter ui add @radix-ui/react-popover
```

## Adding ChadCN UI components

To add components to your app, run the following command at the root of the project:

```bash
pnpm dlx shadcn@canary add button -c packages/ui
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/ui/button";
```

## Production build

to build all apps run the following command at the root of the repository:

```bash
pnpm run build
```

to build a specific app run the following command at the root of the repository:

```bash
pnpm --filter uwezo run build
```

to run a specific app run the following command at the root of the repository:

```bash
pnpm --filter uwezo run start
```

## Updating API schema

Whenever Api changes, you should also update the API schema typings

```bash
pnpm --filter uwezo run schema
```

### Common issues

#### `Error: EPERM: operation not permitted ... ` in windows

you need to enable `Developer mode` in windows settings
https://github.com/vercel/next.js/discussions/52244

## Docker

Start all apps in detached mode

```bash
docker-compose -f docker-compose.yml up -d
```

Start single app in detached mode

```bash
docker-compose -f docker-compose.yml up -d uwezo
```

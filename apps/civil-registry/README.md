# Civil Registry

## File Structure

### actions

A separation layer between server functions and the client.
Used primarily for form submissions and to bridge server-side logic with client-side interactions.

### app

Contains all views rendered to users.
The project uses file-based routing. Pages are server-side rendered (SSR) by default unless marked at the top of the file with `"use client"`.

**Recurring structure in page folders:**

- `Page.tsx`: Main page component.
- `form.tsx` or similar: Handles the form portion of the view. If `Page.tsx` is not present, the form file stands alone for modularity and easier logic management.
- `schema.ts`: Contains Zod validation schemas.
- `action.ts`: Connects server and client logic, especially for form handling. Follows a "near file" design pattern—if the action is shared across folders, it is moved to the **actions** directory.

#### Subfolders

- **[id]/**: Dynamic route folder that renders a user dashboard for the given `id`.
- **add/**: Contains all views related to the "Add Child" section.
- **edit/[personid]/**: Opens the edit page for a person with the specified `personid`.

### components

Reusable UI blocks specific to the Civil Registry project.
These components are visually complex or not simple enough to be demonstrated in Storybook.

Other reusable components can be found in `/packages/ui/src/components`, which houses the shared components for the entire monorepo.

### hooks

Custom React hooks used within the Civil Registry application.

### i18n

Contains internationalization configuration files.
See the [i18next documentation](https://www.i18next.com/) for more information.

### lib

Holds utility and helper methods.

- **data/**: Contains dummy `person` data and structures used for mocking and testing.
- **schema/**: Contains the main `person` schema used throughout the application.
- **services/** and **utils/**: Include various helper functions.

### messages

JSON translation files for managing multilingual support.
Currently supports:

- `en` (English)
- `sw` (Swahili)

## Workflow with Monorepo and UI Components

Most shared components are located in `/packages/ui/src/components`.
If there's a strong reason to keep a component within a specific project's own folder, that is acceptable. However, the general guideline is:

- **Shared components** (used across multiple projects) go into `/packages/ui/src/components`.
- **Project-specific components** should be placed under a folder named after the project within the same directory.

This structure provides a clear overview of available components and enables easy testing and documentation through **Storybook**.

### Storybook and Theming

Storybook supports theme switching to preview how each component appears within a specific project's design.

- Global styles are defined in `packages/ui/src/styles/globals.css`.
- Project-specific color overrides are placed in the `@layer base` block under their respective class selectors:
  - `.tvet`
  - `.uwezo`
  - `.civil-registry`

### Shared Resources

All components, hooks, utilities, and even component-specific translations under the `packages/ui` folder are accessible to all projects in the monorepo and help prevent **code duplication**.

## Future Improvements

### If mother or father is underage

Instead of adding a new field to select `mother/father is underage`, it can be determined by the age of the person that is already available.

### Removing Next.js as a dependency

Things to consider when removing Next.js:

- Next.js is used for server-side rendering (SSR) and routing. Alternative routing is needed
- Form submissions and actions are tightly coupled with Next.js. A custom logic for submitting forms is required
- Font loading and optimization are handled by Next.js. A custom solution for font loading is needed
- Multilingual support is managed through Next.js. A custom i18n solution is required

Instead of replacing Next.js, it could be beneficial to keep it for its SSR capabilities and routing features, and call necessary APIs directly from the server functions. This would allow for a more modular approach while still leveraging Next.js's strengths.

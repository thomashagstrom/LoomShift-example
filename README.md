# LoomShift-example

code created by LoomShift GitHub app

A TypeScript component library scaffold. Built with [tsup](https://tsup.egoist.dev/),
it emits ESM + CJS bundles and type declarations from a single build command.

## Documentation

- **[Components](docs/components.md)** — what each component is for, in plain
  language. Start here.
  - [`AnimatedDialog`](docs/components.md#animateddialog)
  - [`AnimatedSnackbar`](docs/components.md#animatedsnackbar)
- **[Usage](docs/usage.md)** — code examples and prop reference for every
  component.
  - [`AnimatedDialog`](docs/usage.md#animateddialog)
  - [`AnimatedSnackbar`](docs/usage.md#animatedsnackbar)
  - [Customising or disabling the animation](docs/usage.md#customising-or-disabling-the-animation)
- **[Interactive docs site](#interactive-docs-site)** — Storybook, with live
  previews and editable controls.

The rest of this README covers installing the package and working on the library
itself.

## Install

```sh
npm install loomshift-example
```

### Peer dependencies

MUI and Framer Motion (and their runtime peers) are declared as `peerDependencies`
so they are **not** bundled — the consuming app provides a single shared copy.
Install them alongside this package if you haven't already:

| Package             | Supported range                     |
| ------------------- | ----------------------------------- |
| `react`             | `^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0` |
| `react-dom`         | `^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0` |
| `@mui/material`     | `^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0`    |
| `@emotion/react`    | `^11.0.0`                           |
| `@emotion/styled`   | `^11.0.0`                           |
| `framer-motion`     | `^10.0.0 \|\| ^11.0.0 \|\| ^12.0.0` |

```sh
npm install @mui/material @emotion/react @emotion/styled framer-motion react react-dom
```

## Interactive docs site

An interactive [Storybook](https://storybook.js.org/) covers every component
with live previews, an auto-generated props table and editable controls for
`variant`, `duration`, `easing` and `open`:

```sh
npm run storybook        # dev server on http://localhost:6006
npm run build-storybook  # static site in storybook-static/
```

Stories live next to the component they document (`src/**/*.stories.tsx`), so a
feature slice ships its docs with its code. The `Introduction` page
(`docs/Introduction.mdx`) is the landing page.

## Development

```sh
npm install        # install dev dependencies
npm run build      # produce dist/ (ESM + CJS + .d.ts) in one command
npm run typecheck  # type-check without emitting
npm run lint       # lint with ESLint
npm test           # run the unit tests (Vitest + Testing Library)
npm run storybook  # browse the component docs
```

The build writes:

- `dist/index.js`   — ESM bundle (`module` / `exports.import`)
- `dist/index.cjs`  — CommonJS bundle (`main` / `exports.require`)
- `dist/index.d.ts` — type declarations (`types`)

## Publishing

`prepublishOnly` runs the build, so the compiled `dist/` is always fresh:

```sh
npm publish --dry-run   # verify the packed contents
npm publish
```

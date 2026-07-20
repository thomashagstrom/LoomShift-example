# LoomShift-example

code created by LoomShift GitHub app

A TypeScript component library scaffold. Built with [tsup](https://tsup.egoist.dev/),
it emits ESM + CJS bundles and type declarations from a single build command.

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

## Development

```sh
npm install        # install dev dependencies
npm run build      # produce dist/ (ESM + CJS + .d.ts) in one command
npm run typecheck  # type-check without emitting
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

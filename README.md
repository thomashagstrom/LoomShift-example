# LoomShift-example

code created by LoomShift GitHub app

A TypeScript component library scaffold. Built with [tsup](https://tsup.egoist.dev/),
it emits ESM + CJS bundles and type declarations from a single build command.

## Documentation

- [Components](docs/components.md) — what's available and what it's for, in plain language
- [Usage](docs/usage.md) — install instructions, peer dependencies, and code examples
- [Interactive Storybook](https://storybook.js.org/) — live previews and editable controls, run with `npm run storybook`

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

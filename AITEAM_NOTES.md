# LoomShift

Stub implementation for: As a maintainer, I want a TypeScript library scaffold with MUI and Framer Motion as peer dependencies so the package builds and publishes cleanly.

Drafted by the Loomshift Product Owner agent.

Acceptance Criteria
- Repo builds ESM and CJS bundles plus type declarations via a single build command
- MUI and Framer Motion are declared as peerDependencies (not bundled) with documented version ranges
- Package.json exposes correct main, module, types, and exports fields and passes `npm publish --dry-run`


Source issue: https://github.com/thomashagstrom/LoomShift-example/issues/1

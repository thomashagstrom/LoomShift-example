#!/usr/bin/env node
// Points git at the repo's versioned hooks directory and makes sure the
// hook scripts are executable. Runs automatically via `npm install`
// (the "prepare" script) so the README TOC hook is active for every
// contributor without extra manual steps.

import { chmodSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const hooksDir = resolve(repoRoot, ".githooks");
const preCommitHook = resolve(hooksDir, "pre-commit");

// Skip silently when this isn't a git checkout (e.g. installed as a
// dependency, or `.git` was pruned from a packed tarball).
if (!existsSync(resolve(repoRoot, ".git"))) {
  process.exit(0);
}

if (existsSync(preCommitHook)) {
  chmodSync(preCommitHook, 0o755);
}

execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: repoRoot,
  stdio: "inherit",
});

#!/usr/bin/env node
// Regenerates the "Table of Contents" section in README.md from its headings.
//
// The TOC lives between the `<!-- START TOC -->` / `<!-- END TOC -->` markers
// in README.md. Run `npm run toc` to update it by hand, or let the
// pre-commit hook (.githooks/pre-commit) keep it in sync automatically.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const readmePath = resolve(__dirname, "..", "README.md");

const START_MARKER = "<!-- START TOC -->";
const END_MARKER = "<!-- END TOC -->";

// Mirrors GitHub's heading-to-anchor algorithm closely enough for our needs:
// lowercase, strip characters that aren't word chars/spaces/hyphens, turn
// runs of whitespace into single hyphens, and de-duplicate repeated slugs.
function slugify(heading, seen) {
  let slug = heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  const count = seen.get(slug) ?? 0;
  seen.set(slug, count + 1);
  return count === 0 ? slug : `${slug}-${count}`;
}

function extractHeadings(markdown) {
  const lines = markdown.split("\n");
  const headings = [];
  let inCodeFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const [, hashes, text] = match;
    // Skip the TOC's own heading so it doesn't link to itself.
    if (text.trim().toLowerCase() === "table of contents") continue;

    headings.push({ depth: hashes.length, text: text.trim() });
  }

  return headings;
}

function buildToc(headings) {
  const seen = new Map();
  const minDepth = Math.min(...headings.map((h) => h.depth));

  return headings
    .map(({ depth, text }) => {
      const indent = "  ".repeat(depth - minDepth);
      const anchor = slugify(text, seen);
      return `${indent}- [${text}](#${anchor})`;
    })
    .join("\n");
}

export function generateToc(markdown) {
  const headings = extractHeadings(markdown);
  const toc = buildToc(headings);
  const block = `${START_MARKER}\n${toc}\n${END_MARKER}`;

  const startIndex = markdown.indexOf(START_MARKER);
  const endIndex = markdown.indexOf(END_MARKER);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      `README.md is missing the ${START_MARKER} / ${END_MARKER} markers.`,
    );
  }

  return (
    markdown.slice(0, startIndex) +
    block +
    markdown.slice(endIndex + END_MARKER.length)
  );
}

function main() {
  const original = readFileSync(readmePath, "utf8");
  const updated = generateToc(original);

  if (updated === original) {
    console.log("TOC is already up to date.");
    return;
  }

  writeFileSync(readmePath, updated);
  console.log("Updated table of contents in README.md.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

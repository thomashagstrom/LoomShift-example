#!/usr/bin/env node
// Generates (or verifies) a table of contents in README.md from its
// headings, written between the `<!-- toc:start -->` / `<!-- toc:end -->`
// markers. Run via `npm run docs:toc:update` to refresh it, or
// `npm run docs:toc:check` (read-only) to fail if it's stale.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const readmePath = resolve(__dirname, '../README.md');

const TOC_START = '<!-- toc:start -->';
const TOC_END = '<!-- toc:end -->';

// Mirrors GitHub's heading-to-anchor slugification closely enough for our
// purposes: lowercase, strip anything that isn't a word char/space/hyphen,
// then turn spaces into hyphens.
function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function extractHeadings(markdown) {
  const lines = markdown.split('\n');
  const headings = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const [, hashes, text] = match;
    // The TOC's own heading isn't part of the TOC.
    if (/table of contents/i.test(text)) continue;

    headings.push({ depth: hashes.length, text });
  }

  return headings;
}

function buildToc(headings) {
  const seen = new Map();
  const lines = headings.map(({ depth, text }) => {
    const base = slugify(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count}`;
    const indent = '  '.repeat(depth - 2);
    return `${indent}- [${text}](#${slug})`;
  });
  return lines.join('\n');
}

function withUpdatedToc(markdown) {
  const startIndex = markdown.indexOf(TOC_START);
  const endIndex = markdown.indexOf(TOC_END);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      `README.md is missing the ${TOC_START} / ${TOC_END} markers that the TOC is generated between.`,
    );
  }

  const toc = buildToc(extractHeadings(markdown));
  const before = markdown.slice(0, startIndex + TOC_START.length);
  const after = markdown.slice(endIndex);

  return `${before}\n${toc}\n${after}`;
}

function main() {
  const mode = process.argv[2];
  if (mode !== '--check' && mode !== '--write') {
    console.error('Usage: generate-toc.mjs --check|--write');
    process.exit(2);
  }

  const original = readFileSync(readmePath, 'utf8');
  const updated = withUpdatedToc(original);

  if (mode === '--write') {
    if (updated !== original) {
      writeFileSync(readmePath, updated);
      console.log('README.md table of contents updated.');
    } else {
      console.log('README.md table of contents already up to date.');
    }
    return;
  }

  // --check
  if (updated !== original) {
    console.error(
      'README.md table of contents is out of date. Run `npm run docs:toc:update` and commit the result.',
    );
    process.exit(1);
  }
  console.log('README.md table of contents is up to date.');
}

main();

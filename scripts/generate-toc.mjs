#!/usr/bin/env node
// Regenerates the table of contents between the `<!-- toc -->` /
// `<!-- tocstop -->` markers in README.md from its own `##`/`###` headings.
//
// Run directly (`npm run toc`) or let the pre-commit hook
// (`.husky/pre-commit`) keep it in sync automatically.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const README_PATH = path.join(__dirname, '..', 'README.md');

const TOC_START = '<!-- toc -->';
const TOC_END = '<!-- tocstop -->';

/** GitHub's own heading-to-anchor slug algorithm. */
function slugify(heading) {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Pull every `##`/`###` heading out of `markdown` — the caller only passes the
 * text *after* the `<!-- tocstop -->` marker, so the `# Title` above it and
 * the "Table of contents" heading itself are already out of scope and never
 * need a special case here.
 */
function extractHeadings(markdown) {
  const lines = markdown.split('\n');
  const headings = [];
  const seenSlugs = new Map();

  for (const line of lines) {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const [, hashes, text] = match;
    const depth = hashes.length;
    const baseSlug = slugify(text);
    // GitHub disambiguates repeated headings with a `-1`, `-2`, … suffix.
    const count = seenSlugs.get(baseSlug) ?? 0;
    seenSlugs.set(baseSlug, count + 1);
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

    headings.push({ depth, text, slug });
  }

  return headings;
}

function buildToc(headings) {
  const minDepth = Math.min(...headings.map((h) => h.depth));
  return headings
    .map((h) => `${'  '.repeat(h.depth - minDepth)}- [${h.text}](#${h.slug})`)
    .join('\n');
}

function main() {
  const original = readFileSync(README_PATH, 'utf8');
  const startIndex = original.indexOf(TOC_START);
  const endIndex = original.indexOf(TOC_END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error(
      `README.md is missing the ${TOC_START} / ${TOC_END} markers — nothing to update.`,
    );
    process.exitCode = 1;
    return;
  }

  const afterMarkers = original.slice(endIndex + TOC_END.length);
  const headings = extractHeadings(afterMarkers);
  const toc = buildToc(headings);

  const updated =
    original.slice(0, startIndex + TOC_START.length) +
    '\n\n' +
    toc +
    '\n\n' +
    original.slice(endIndex);

  if (updated === original) {
    return;
  }

  writeFileSync(README_PATH, updated);
  console.log('Updated the table of contents in README.md.');
}

main();

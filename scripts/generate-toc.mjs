#!/usr/bin/env node
// Generates a table of contents for markdown docs between
// `<!-- toc -->` / `<!-- tocstop -->` markers, inserting the markers
// before the first level-2 heading if they aren't present yet.
import { readFileSync, writeFileSync } from 'node:fs';

const TOC_START = '<!-- toc -->';
const TOC_STOP = '<!-- tocstop -->';
const DEFAULT_FILES = ['README.md'];

function slugify(text, seen) {
  let slug = text
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim()
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s+/g, '-');

  if (seen.has(slug)) {
    let suffix = 1;
    while (seen.has(`${slug}-${suffix}`)) suffix += 1;
    slug = `${slug}-${suffix}`;
  }
  seen.add(slug);
  return slug;
}

function extractHeadings(content) {
  const headings = [];
  let inFence = false;
  for (const line of content.split('\n')) {
    if (/^(```|~~~)/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,6})\s+(.+?)\s*$/.exec(line);
    if (match) {
      headings.push({ level: match[1].length, text: match[2] });
    }
  }
  return headings;
}

function buildToc(content) {
  const headings = extractHeadings(content);
  if (headings.length === 0) return '';

  const seen = new Set();
  const minLevel = Math.min(...headings.map((h) => h.level));
  return headings
    .map((h) => {
      const slug = slugify(h.text, seen);
      const indent = '  '.repeat(h.level - minLevel);
      return `${indent}- [${h.text}](#${slug})`;
    })
    .join('\n');
}

function ensureMarkers(content) {
  if (content.includes(TOC_START) && content.includes(TOC_STOP)) return content;

  const lines = content.split('\n');
  const headingIndex = lines.findIndex((line) => /^##\s+/.test(line));
  const insertAt = headingIndex === -1 ? lines.length : headingIndex;

  const before = lines.slice(0, insertAt);
  while (before.length && before[before.length - 1] === '') before.pop();
  const after = lines.slice(insertAt);

  return [...before, '', TOC_START, TOC_STOP, '', ...after].join('\n');
}

function replaceToc(content, toc) {
  const startIndex = content.indexOf(TOC_START);
  const stopIndex = content.indexOf(TOC_STOP);
  const before = content.slice(0, startIndex + TOC_START.length);
  const after = content.slice(stopIndex);
  return `${before}\n${toc}\n${after}`;
}

function computeUpdated(original) {
  const withMarkers = ensureMarkers(original);
  const toc = buildToc(withMarkers);
  return replaceToc(withMarkers, toc);
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const files = args.filter((arg) => arg !== '--check');
  const targets = files.length > 0 ? files : DEFAULT_FILES;

  let outOfSync = false;

  for (const file of targets) {
    const original = readFileSync(file, 'utf8');
    const updated = computeUpdated(original);

    if (updated === original) continue;

    if (checkOnly) {
      console.error(`Table of contents in ${file} is out of date. Run "npm run docs:toc".`);
      outOfSync = true;
    } else {
      writeFileSync(file, updated);
      console.log(`Updated table of contents in ${file}.`);
    }
  }

  if (checkOnly && outOfSync) {
    process.exitCode = 1;
  }
}

main();

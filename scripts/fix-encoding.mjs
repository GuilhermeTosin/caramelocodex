#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".md", ".json"]);
const ignoreDirs = new Set(["node_modules", "dist", ".git"]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (ignoreDirs.has(ent.name)) continue;
      walk(path.join(dir, ent.name), out);
    } else {
      const fp = path.join(dir, ent.name);
      if (includeExt.has(path.extname(fp))) out.push(fp);
    }
  }
  return out;
}

function score(text) {
  const markers = [/Ã/g, /Â/g, /ï¿½/g, /\uFFFD/g, /â€œ|â€|â€™|â€“|â€”/g];
  return markers.reduce((sum, rx) => sum + (text.match(rx)?.length || 0), 0);
}

function normalizeSymbols(text) {
  return text
    .replace(/^(\uFEFF|\uFFFD)+/, "")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”")
    .replace(/â€˜/g, "‘")
    .replace(/â€™/g, "’")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/Â·/g, "·")
    .replace(/Â/g, "");
}

function tryRepair(text) {
  let current = normalizeSymbols(text);
  for (let i = 0; i < 5; i++) {
    const candidate = normalizeSymbols(Buffer.from(current, "latin1").toString("utf8"));
    if (score(candidate) < score(current)) {
      current = candidate;
      continue;
    }
    break;
  }
  return current;
}

const files = walk(srcDir, []);
let changed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const repaired = tryRepair(original);
  if (repaired !== original) {
    fs.writeFileSync(file, repaired, "utf8");
    changed++;
  }
}

console.log(`Encoding repair finished. Files changed: ${changed}`);

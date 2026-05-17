#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".md", ".json", ".sql", ".toml"]);
const ignoreDirs = new Set(["node_modules", "dist", ".git"]);
const targetDirs = ["src", "scripts", "supabase", "public", ".vscode"];
const targetRootFiles = ["index.html", "package.json", ".editorconfig", ".gitattributes"];

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
  const markers = [/Ãƒ/g, /Ã‚/g, /Ã¯Â¿Â½/g, /\uFFFD/g, /â€”|â€“|â€œ|â€|â€¢/g];
  return markers.reduce((sum, rx) => sum + (text.match(rx)?.length || 0), 0);
}

function normalizeSymbols(text) {
  return text
    .replace(/^(\uFEFF|\uFFFD)+/, "")
    .replace(/Ã¢â‚¬Å“/g, "\"")
    .replace(/Ã¢â‚¬Â/g, "\"")
    .replace(/Ã¢â‚¬Ëœ/g, "'")
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢â‚¬â€œ/g, "-")
    .replace(/Ã¢â‚¬â€/g, "-")
    .replace(/Ã‚Â·/g, "-")
    .replace(/Ã‚/g, "");
}

function tryRepair(text) {
  let current = normalizeSymbols(text);
  for (let i = 0; i < 5; i += 1) {
    const candidate = normalizeSymbols(Buffer.from(current, "latin1").toString("utf8"));
    if (score(candidate) < score(current)) {
      current = candidate;
      continue;
    }
    break;
  }
  return current;
}

const targets = [];
for (const dir of targetDirs) {
  const fullPath = path.join(root, dir);
  if (fs.existsSync(fullPath)) walk(fullPath, targets);
}
for (const file of targetRootFiles) {
  const fullPath = path.join(root, file);
  if (fs.existsSync(fullPath)) {
    targets.push(fullPath);
  }
}

let changed = 0;
for (const file of targets) {
  const original = fs.readFileSync(file, "utf8");
  const repaired = tryRepair(original);
  if (repaired !== original) {
    fs.writeFileSync(file, repaired, "utf8");
    changed += 1;
  }
}

console.log(`Encoding repair finished. Files changed: ${changed}`);

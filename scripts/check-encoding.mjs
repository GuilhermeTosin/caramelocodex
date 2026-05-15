#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".md", ".json"]);
const ignoreDirs = new Set(["node_modules", "dist", ".git"]);

const suspicious = [
  /\uFFFD/, // replacement char
  /\u00C3|\u00C2/, // mojibake markers (Ã / Â)
  /N\?o|n\?o|h\?|H\?|voc\?|Voc\?/ // common broken PT-BR chunks
];

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

const targets = walk(path.join(root, "src"), []);
const indexPath = path.join(root, "index.html");
if (fs.existsSync(indexPath)) targets.push(indexPath);

const findings = [];
for (const file of targets) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (suspicious.some((rx) => rx.test(line))) {
      findings.push(`${path.relative(root, file)}:${i + 1}: ${line.trim()}`);
    }
  });
}

if (findings.length) {
  console.error("Encoding issues detected:\n");
  console.error(findings.slice(0, 300).join("\n"));
  if (findings.length > 300) {
    console.error(`\n...and ${findings.length - 300} more`);
  }
  process.exit(1);
}

console.log("Encoding check passed.");

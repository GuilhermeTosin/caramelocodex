#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".md", ".json", ".sql", ".toml"]);
const ignoreDirs = new Set(["node_modules", "dist", ".git"]);
const targetDirs = ["src", "scripts", "supabase", "public", ".vscode"];
const targetRootFiles = ["index.html", "package.json", ".editorconfig", ".gitattributes"];

const suspicious = [
  /\uFFFD/,
  /\u00C3|\u00C2/,
  /N\?o|n\?o|h\?|H\?|voc\?|Voc\?/,
  /â€”|â€“|â€œ|â€|â€¢/,
  /Alimentaaao|Servi\?os|Constru\?\?|Saade|Finanaas|Educaaao|Comarcio|Mudanaa/,
  /serviaos|construaao|traduaa|imigraa|localizaaao|referancia|histarico|cadigos/,
  /endereao|portuguas|negacios|madico|clanica|psicalogo|imavel|cafa|almoao|crianaa|opaaes/,
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

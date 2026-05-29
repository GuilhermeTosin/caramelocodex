import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const buildDir = path.join(root, "build");

if (!fs.existsSync(distDir)) {
  console.error("dist/ não encontrado. Rode o vite build antes.");
  process.exit(1);
}

if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}

fs.cpSync(distDir, buildDir, { recursive: true });
console.log("Preparado: dist/ copiado para build/ para compatibilidade com react-snap.");


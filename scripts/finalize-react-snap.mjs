import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const buildDir = path.join(root, "build");
const distDir = path.join(root, "dist");

if (!fs.existsSync(buildDir)) {
  console.error("build/ não encontrado após react-snap.");
  process.exit(1);
}

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

fs.cpSync(buildDir, distDir, { recursive: true });
console.log("Finalizado: build/ (prerender) copiado de volta para dist/.");


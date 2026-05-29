import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

run("vite build");

if (isVercel) {
  console.log("Ambiente Vercel detectado: pulando react-snap para evitar falha do Chromium.");
  process.exit(0);
}

run("node scripts/prepare-react-snap.mjs");
run("react-snap");
run("node scripts/finalize-react-snap.mjs");


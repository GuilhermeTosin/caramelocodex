import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || "business-images";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const convertable = [".jpg", ".jpeg", ".png"];

function isConvertible(path) {
  const lower = path.toLowerCase();
  return convertable.some((ext) => lower.endsWith(ext));
}

function toWebpPath(path) {
  return path.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

async function listAll(prefix = "") {
  const out = [];
  const queue = [prefix];

  while (queue.length) {
    const current = queue.shift();
    const { data, error } = await supabase.storage.from(BUCKET).list(current, { limit: 1000 });
    if (error) throw error;
    for (const item of data || []) {
      if (!item.name) continue;
      const full = current ? `${current}/${item.name}` : item.name;
      if (!item.id) {
        queue.push(full);
      } else {
        out.push(full);
      }
    }
  }

  return out;
}

async function main() {
  const files = await listAll("");
  const targets = files.filter(isConvertible);
  console.log(`Encontrados ${targets.length} arquivos para converter.`);
  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const path of targets) {
    try {
      const webpPath = toWebpPath(path);
      const { data: downloadData, error: downloadError } = await supabase.storage.from(BUCKET).download(path);
      if (downloadError || !downloadData) {
        console.warn(`Falha no download: ${path}`);
        failed += 1;
        continue;
      }

      const arrayBuffer = await downloadData.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);
      let webpBuffer;
      try {
        webpBuffer = await sharp(inputBuffer).webp({ quality: 84 }).toBuffer();
      } catch (err) {
        console.warn(`Pulando arquivo inválido/não suportado: ${path}`);
        skipped += 1;
        continue;
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(webpPath, webpBuffer, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.warn(`Falha no upload WEBP: ${webpPath}`);
        failed += 1;
        continue;
      }

      converted += 1;
      console.log(`Convertido: ${path} -> ${webpPath}`);
    } catch (err) {
      console.warn(`Falha inesperada em ${path}:`, err?.message || err);
      failed += 1;
    }
  }

  console.log("Migração de imagens finalizada.");
  console.log(`Resumo: convertidos=${converted}, ignorados=${skipped}, falhas=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

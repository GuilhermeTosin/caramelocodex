import type { VercelRequest, VercelResponse } from "@vercel/node";

type Row = {
  slug: string | null;
  country_code: string | null;
  state_code?: string | null;
  state?: string | null;
  city: string | null;
  created_at: string | null;
};

const CHUNK_SIZE = 1000;

function env(name: string) {
  return (process.env[name] || "").trim();
}

function getBaseUrl(req: VercelRequest) {
  const proto = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "www.caramelinho.com");
  return `${proto}://${host}`;
}

function getSupabaseUrl() {
  return env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
}

function getServiceRoleKey() {
  return env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SECRET_KEY");
}

function normalizePart(value: string): string {
  return encodeURIComponent(
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function buildBusinessUrl(base: string, row: Row): string | null {
  const slug = normalizePart(String(row.slug || ""));
  const country = normalizePart(String(row.country_code || ""));
  const state = normalizePart(String(row.state_code || row.state || ""));
  const city = normalizePart(String(row.city || ""));
  if (!slug || !country) return null;
  if (state && city) return `${base}/${country}/${state}/${city}/${slug}`;
  return `${base}/${country}/${slug}`;
}

async function fetchRows(): Promise<Row[]> {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configurados.");

  const endpoint = `${url}/rest/v1/businesses?select=slug,country_code,state_code,state,city,created_at&or=(moderation_status.eq.approved,moderation_status.is.null)&slug=not.is.null`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json; charset=utf-8",
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Falha ao consultar negócios (${response.status}) ${text}`.trim());
  }
  const rows = (await response.json()) as Row[];
  return rows.filter((r) => !!r.slug && !!r.country_code);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const base = getBaseUrl(req);
    const page = Math.max(1, Number(req.query.page || "1"));
    const rows = await fetchRows();
    const chunks = Math.max(1, Math.ceil(rows.length / CHUNK_SIZE));
    if (page > chunks) return res.status(404).send("Sitemap chunk não encontrado.");

    const start = (page - 1) * CHUNK_SIZE;
    const pageRows = rows.slice(start, start + CHUNK_SIZE);
    const now = new Date().toISOString();
    const body = pageRows
      .map((r) => {
        const loc = buildBusinessUrl(base, r);
        if (!loc) return "";
        const lastmodSource = r.created_at || now;
        const lastmod = new Date(lastmodSource).toISOString();
        return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq></url>`;
      })
      .filter(Boolean)
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Erro ao gerar sitemap de negócios." });
  }
}

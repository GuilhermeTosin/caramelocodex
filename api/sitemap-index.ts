import type { VercelRequest, VercelResponse } from "@vercel/node";

type Row = { slug: string | null; country_code: string | null };

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

async function getBusinessCount(): Promise<number> {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configurados.");

  const endpoint = `${url}/rest/v1/businesses?select=slug,country_code&or=(moderation_status.eq.approved,moderation_status.is.null)&slug=not.is.null`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json; charset=utf-8",
    },
  });
  if (!response.ok) throw new Error(`Falha ao consultar negócios (${response.status}).`);
  const rows = (await response.json()) as Row[];
  return rows.filter((r) => !!r.slug && !!r.country_code).length;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const base = getBaseUrl(req);
    const count = await getBusinessCount();
    const chunkSize = 1000;
    const chunks = Math.max(1, Math.ceil(count / chunkSize));
    const now = new Date().toISOString();
    const parts: string[] = [];
    parts.push(`<sitemap><loc>${base}/sitemaps/static.xml</loc><lastmod>${now}</lastmod></sitemap>`);
    for (let i = 1; i <= chunks; i += 1) {
      parts.push(`<sitemap><loc>${base}/sitemaps/businesses-${i}.xml</loc><lastmod>${now}</lastmod></sitemap>`);
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${parts.join("")}
</sitemapindex>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Erro ao gerar sitemap index." });
  }
}


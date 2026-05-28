import type { VercelRequest } from "@vercel/node";

type SitemapBusinessRow = {
  slug: string | null;
  country_code: string | null;
  state_code: string | null;
  city: string | null;
  updated_at: string | null;
};

type CachedSitemapData = {
  fetchedAt: number;
  rows: SitemapBusinessRow[];
};

const CHUNK_SIZE = 1000;
const CACHE_TTL_MS = 15 * 60 * 1000;
let cache: CachedSitemapData | null = null;

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

export function getBaseUrl(req: VercelRequest): string {
  const proto = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "www.caramelinho.com");
  return `${proto}://${host}`;
}

function buildBusinessUrl(baseUrl: string, row: SitemapBusinessRow): string | null {
  const slug = normalizePart(String(row.slug || ""));
  const country = normalizePart(String(row.country_code || ""));
  const state = normalizePart(String(row.state_code || ""));
  const city = normalizePart(String(row.city || ""));

  if (!slug || !country) return null;
  if (state && city) return `${baseUrl}/${country}/${state}/${city}/${slug}`;
  return `${baseUrl}/${country}/${slug}`;
}

async function fetchBusinessesForSitemap(): Promise<SitemapBusinessRow[]> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) são obrigatórios.");
  }

  const endpoint = `${url}/rest/v1/businesses?select=slug,country_code,state_code,city,updated_at&or=(moderation_status.eq.approved,moderation_status.is.null)&not.slug=is.null`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json; charset=utf-8",
    },
  });
  if (!response.ok) {
    throw new Error(`Falha ao consultar businesses para sitemap (${response.status}).`);
  }
  const rows = (await response.json()) as SitemapBusinessRow[];
  return rows.filter((r) => !!r.slug && !!r.country_code);
}

export async function getSitemapRows(forceRefresh = false): Promise<SitemapBusinessRow[]> {
  if (!forceRefresh && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rows;
  }
  const rows = await fetchBusinessesForSitemap();
  cache = { fetchedAt: Date.now(), rows };
  return rows;
}

export function getBusinessSitemapChunksCount(rows: SitemapBusinessRow[]): number {
  return Math.max(1, Math.ceil(rows.length / CHUNK_SIZE));
}

export function buildSitemapIndexXml(baseUrl: string, rows: SitemapBusinessRow[]): string {
  const now = new Date().toISOString();
  const chunks = getBusinessSitemapChunksCount(rows);
  const staticSitemapLoc = `${baseUrl}/sitemaps/static.xml`;
  const businesses = Array.from({ length: chunks }, (_, i) => {
    const page = i + 1;
    return `<sitemap><loc>${baseUrl}/sitemaps/businesses-${page}.xml</loc><lastmod>${now}</lastmod></sitemap>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${staticSitemapLoc}</loc><lastmod>${now}</lastmod></sitemap>
  ${businesses}
</sitemapindex>`;
}

export function buildStaticSitemapXml(baseUrl: string): string {
  const urls = [
    "/",
    "/buscar",
    "/sobre",
    "/contato",
    "/privacidade",
    "/termos",
    "/negocio-verificado",
  ];
  const now = new Date().toISOString();
  const body = urls
    .map((path) => `<url><loc>${baseUrl}${path}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${body}
</urlset>`;
}

export function buildBusinessSitemapXml(baseUrl: string, rows: SitemapBusinessRow[], page: number): string {
  const start = (page - 1) * CHUNK_SIZE;
  const pageRows = rows.slice(start, start + CHUNK_SIZE);
  const body = pageRows
    .map((row) => {
      const loc = buildBusinessUrl(baseUrl, row);
      if (!loc) return "";
      const lastmod = row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString();
      return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq></url>`;
    })
    .filter(Boolean)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${body}
</urlset>`;
}

export async function assertIsAdmin(accessToken: string): Promise<boolean> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !serviceRoleKey || !accessToken) return false;

  try {
    const userResponse = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: anonKey || serviceRoleKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!userResponse.ok) return false;
    const userData = (await userResponse.json()) as { id?: string };
    const userId = userData?.id;
    if (!userId) return false;

    const roleResponse = await fetch(`${url}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(userId)}&limit=1`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json; charset=utf-8",
      },
    });
    if (!roleResponse.ok) return false;
    const rows = (await roleResponse.json()) as Array<{ role?: string }>;
    return (rows[0]?.role || "").toLowerCase() === "admin";
  } catch {
    return false;
  }
}

import type { VercelRequest, VercelResponse } from "@vercel/node";

const PUBLIC_PAGE_PATHS = ["/", "/buscar", "/sobre", "/contato", "/privacidade", "/termos", "/negocio-verificado"];

function getBaseUrl(req: VercelRequest) {
  const proto = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "www.caramelinho.com");
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const base = getBaseUrl(req);
  const now = new Date().toISOString();
  const body = PUBLIC_PAGE_PATHS
    .map((path) => `<url><loc>${base}${path}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`)
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  return res.status(200).send(xml);
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildStaticSitemapXml, getBaseUrl } from "./_sitemap";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const xml = buildStaticSitemapXml(getBaseUrl(req));
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  return res.status(200).send(xml);
}


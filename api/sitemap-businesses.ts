import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  buildBusinessSitemapXml,
  getBaseUrl,
  getBusinessSitemapChunksCount,
  getSitemapRows,
} from "./_sitemap";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const page = Math.max(1, Number(req.query.page || "1"));
    const rows = await getSitemapRows(false);
    const chunks = getBusinessSitemapChunksCount(rows);
    if (page > chunks) {
      return res.status(404).send("Sitemap chunk não encontrado.");
    }
    const xml = buildBusinessSitemapXml(getBaseUrl(req), rows, page);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Erro ao gerar sitemap de negócios." });
  }
}


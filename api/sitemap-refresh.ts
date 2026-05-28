import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertIsAdmin, getBusinessSitemapChunksCount, getSitemapRows } from "./_sitemap";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const isAdmin = await assertIsAdmin(token);
  if (!isAdmin) {
    return res.status(403).json({ error: "Acesso negado." });
  }

  try {
    const rows = await getSitemapRows(true);
    const chunks = getBusinessSitemapChunksCount(rows);
    return res.status(200).json({
      ok: true,
      businessUrls: rows.length,
      sitemapChunks: chunks,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Erro ao atualizar sitemap." });
  }
}


import type { VercelRequest, VercelResponse } from "@vercel/node";

type SitemapBusinessRow = {
  slug: string | null;
  country_code: string | null;
};

type JwtPayload = {
  sub?: string;
  exp?: number;
};

function getEnv(name: string): string {
  return (process.env[name] || "").trim();
}

function getSupabaseUrl(): string {
  return getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL");
}

function getServiceRoleKey(): string {
  return getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_SECRET_KEY");
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadRaw = parts[1];
    const payloadJson = Buffer.from(payloadRaw, "base64url").toString("utf-8");
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
}

async function isAdmin(accessToken: string): Promise<boolean> {
  const url = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  if (!url || !serviceRoleKey || !accessToken) return false;
  const jwtPayload = decodeJwtPayload(accessToken);
  const userId = jwtPayload?.sub || "";
  const now = Math.floor(Date.now() / 1000);
  if (!userId) return false;
  if (jwtPayload?.exp && jwtPayload.exp < now) return false;

  const roleResp = await fetch(
    `${url}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json; charset=utf-8",
      },
    }
  );
  if (!roleResp.ok) return false;
  const rows = (await roleResp.json()) as Array<{ role?: string }>;
  return (rows[0]?.role || "").toLowerCase() === "admin";
}

async function countBusinessesForSitemap(): Promise<number> {
  const url = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configurados.");
  }

  const endpoint = `${url}/rest/v1/businesses?select=slug,country_code&or=(moderation_status.eq.approved,moderation_status.is.null)&not.slug=is.null`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json; charset=utf-8",
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Falha ao consultar negócios (${response.status}) ${text}`.trim());
  }
  const rows = (await response.json()) as SitemapBusinessRow[];
  return rows.filter((r) => !!r.slug && !!r.country_code).length;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const admin = await isAdmin(token);
    if (!admin) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const businessCount = await countBusinessesForSitemap();
    const chunkSize = 1000;
    const sitemapChunks = Math.max(1, Math.ceil(businessCount / chunkSize));

    return res.status(200).json({
      ok: true,
      businessUrls: businessCount,
      sitemapChunks,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Erro ao atualizar sitemap.",
      code: "SITEMAP_REFRESH_FAILED",
    });
  }
}

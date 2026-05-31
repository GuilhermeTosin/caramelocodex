import type { VercelRequest, VercelResponse } from "@vercel/node";

type GeoResponse = {
  lat: number;
  lng: number;
  city?: string;
  stateCode?: string;
  countryCode?: string;
};

function getClientIp(req: VercelRequest): string | null {
  const xff = req.headers["x-forwarded-for"];
  const xri = req.headers["x-real-ip"];
  const cf = req.headers["cf-connecting-ip"];

  if (typeof xff === "string" && xff.trim()) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff.length > 0) return xff[0].split(",")[0].trim();
  if (typeof xri === "string" && xri.trim()) return xri.trim();
  if (typeof cf === "string" && cf.trim()) return cf.trim();

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const ip = getClientIp(req);

  try {
    if (ip) {
      const r1 = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
      if (r1.ok) {
        const d1 = await r1.json();
        const lat = Number(d1?.latitude);
        const lng = Number(d1?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const payload: GeoResponse = {
            lat,
            lng,
            city: String(d1?.city || "").trim() || undefined,
            stateCode: String(d1?.region_code || "").trim().toLowerCase() || undefined,
            countryCode: String(d1?.country_code || "").trim().toLowerCase() || undefined,
          };
          return res.status(200).json(payload);
        }
      }

      const r2 = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
      if (r2.ok) {
        const d2 = await r2.json();
        const lat = Number(d2?.latitude);
        const lng = Number(d2?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const payload: GeoResponse = {
            lat,
            lng,
            city: String(d2?.city || "").trim() || undefined,
            stateCode: String(d2?.region_code || "").trim().toLowerCase() || undefined,
            countryCode: String(d2?.country_code || "").trim().toLowerCase() || undefined,
          };
          return res.status(200).json(payload);
        }
      }

      const r3 = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json`);
      if (r3.ok) {
        const d3 = await r3.json();
        const loc = String(d3?.loc || "");
        const [latRaw, lngRaw] = loc.split(",");
        const lat = Number(latRaw);
        const lng = Number(lngRaw);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const payload: GeoResponse = {
            lat,
            lng,
            city: String(d3?.city || "").trim() || undefined,
            stateCode: String(d3?.region || "").trim().toLowerCase() || undefined,
            countryCode: String(d3?.country || "").trim().toLowerCase() || undefined,
          };
          return res.status(200).json(payload);
        }
      }
    }

    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
}

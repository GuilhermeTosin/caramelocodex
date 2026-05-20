import type { VercelRequest, VercelResponse } from "@vercel/node";

type GeoResponse = {
  lat: number;
  lng: number;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cache CDN/browser para reduzir custo e rate-limit
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    // 1) Preferência: ipapi (server-to-server evita CORS do browser)
    const r1 = await fetch("https://ipapi.co/json/");
    if (r1.ok) {
      const d1 = await r1.json();
      const lat = Number(d1?.latitude);
      const lng = Number(d1?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const payload: GeoResponse = { lat, lng };
        return res.status(200).json(payload);
      }
    }

    // 2) Fallback: ipwho.is
    const r2 = await fetch("https://ipwho.is/");
    if (r2.ok) {
      const d2 = await r2.json();
      const lat = Number(d2?.latitude);
      const lng = Number(d2?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const payload: GeoResponse = { lat, lng };
        return res.status(200).json(payload);
      }
    }

    // 3) Fallback: ipinfo
    const r3 = await fetch("https://ipinfo.io/json");
    if (r3.ok) {
      const d3 = await r3.json();
      const loc = String(d3?.loc || "");
      const [latRaw, lngRaw] = loc.split(",");
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const payload: GeoResponse = { lat, lng };
        return res.status(200).json(payload);
      }
    }

    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
}
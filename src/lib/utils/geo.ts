import { utf8Fetch } from "@/lib/http/utf8";

/**
 * Calcula a distÃ¢ncia entre dois pontos (lat/lng) em quilÃ´metros usando a fÃ³rmula de Haversine.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * ObtÃ©m a localizaÃ§Ã£o atual do usuÃ¡rio via API do Navegador.
 */
export function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      { timeout: 10000 }
    );
  });
}

/**
 * ObtÃ©m localizaÃ§Ã£o aproximada por IP (fallback quando geolocalizaÃ§Ã£o do navegador falha).
 */
export async function getApproxPositionByIp(): Promise<{ lat: number; lng: number } | null> {
  const endpoint = (import.meta.env.VITE_GEOIP_ENDPOINT || "").trim();
  if (!endpoint) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await utf8Fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();

    const directLat = Number(data?.lat ?? data?.latitude);
    const directLng = Number(data?.lng ?? data?.longitude);
    if (Number.isFinite(directLat) && Number.isFinite(directLng)) {
      return { lat: directLat, lng: directLng };
    }

    const loc = String(data?.loc || "");
    if (loc.includes(",")) {
      const [latRaw, lngRaw] = loc.split(",");
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }

    return null;
  } catch {
    return null;
  }
}


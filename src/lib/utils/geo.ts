import { utf8Fetch } from "@/lib/http/utf8";

/**
 * Calcula a distância entre dois pontos (lat/lng) em quilômetros usando a fórmula de Haversine.
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
 * Obtém a localização atual do usuário via API do Navegador.
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
 * Obtém localização aproximada por IP (fallback quando geolocalização do navegador falha).
 */
export async function getApproxPositionByIp(): Promise<{ lat: number; lng: number } | null> {
  const providers: Array<() => Promise<{ lat: number; lng: number } | null>> = [
    async () => {
      const res = await utf8Fetch("https://ipapi.co/json/");
      if (!res.ok) return null;
      const data = await res.json();
      const lat = Number(data?.latitude);
      const lng = Number(data?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    },
    async () => {
      const res = await utf8Fetch("https://ipwho.is/");
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.success === false) return null;
      const lat = Number(data?.latitude);
      const lng = Number(data?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    },
    async () => {
      const res = await utf8Fetch("https://ipinfo.io/json");
      if (!res.ok) return null;
      const data = await res.json();
      const loc = String(data?.loc || "");
      const [latRaw, lngRaw] = loc.split(",");
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    },
  ];

  for (const provider of providers) {
    try {
      const coords = await provider();
      if (coords) return coords;
    } catch {
      // tenta próximo provedor
    }
  }
  return null;
}

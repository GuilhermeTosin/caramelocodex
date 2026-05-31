import { utf8Fetch } from "@/lib/http/utf8";

const GEOIP_CACHE_KEY = "caramelinho_geoip_v1";
const GEOIP_DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export type ApproxGeo = {
  lat: number;
  lng: number;
  city?: string;
  stateCode?: string;
  countryCode?: string;
  source?: "ip" | "cache" | "fallback";
};

type GeoipCachePayload = {
  lat: number;
  lng: number;
  city?: string;
  stateCode?: string;
  countryCode?: string;
  ts: number;
};

function readGeoipCache(maxAgeMs: number): ApproxGeo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GEOIP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeoipCachePayload;
    if (!Number.isFinite(parsed?.lat) || !Number.isFinite(parsed?.lng) || !Number.isFinite(parsed?.ts)) return null;
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      city: parsed.city,
      stateCode: parsed.stateCode,
      countryCode: parsed.countryCode,
      source: "cache",
    };
  } catch {
    return null;
  }
}

function writeGeoipCache(value: ApproxGeo): void {
  if (typeof window === "undefined") return;
  try {
    const payload: GeoipCachePayload = {
      lat: value.lat,
      lng: value.lng,
      city: value.city,
      stateCode: value.stateCode,
      countryCode: value.countryCode,
      ts: Date.now(),
    };
    window.localStorage.setItem(GEOIP_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // sem falhar a UX se o storage estiver indisponível
  }
}

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

async function getCurrentPositionWithOptions(
  options: PositionOptions
): Promise<{ lat: number; lng: number } | null> {
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
      () => resolve(null),
      options
    );
  });
}

export async function getCurrentPositionRobust(): Promise<{
  coords: { lat: number; lng: number } | null;
  source: "gps_precise" | "gps_fast" | "none";
}> {
  const precise = await getCurrentPositionWithOptions({
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0,
  });
  if (precise) return { coords: precise, source: "gps_precise" };

  const fast = await getCurrentPositionWithOptions({
    enableHighAccuracy: false,
    timeout: 9000,
    maximumAge: 120000,
  });
  if (fast) return { coords: fast, source: "gps_fast" };

  return { coords: null, source: "none" };
}

/**
 * Obtém localização aproximada por IP (fallback quando geolocalização do navegador falha).
 */
export async function getApproxPositionByIp(): Promise<{ lat: number; lng: number } | null> {
  const geo = await getApproxGeoByIp();
  if (!geo) return null;
  return { lat: geo.lat, lng: geo.lng };
}

export async function getApproxGeoByIp(options?: {
  timeoutMs?: number;
  maxAgeMs?: number;
  fallback?: {
    lat: number;
    lng: number;
    city?: string;
    stateCode?: string;
    countryCode?: string;
  };
  forceRefresh?: boolean;
}): Promise<ApproxGeo | null> {
  const timeoutMs = Math.max(500, options?.timeoutMs ?? 3000);
  const maxAgeMs = Math.max(60_000, options?.maxAgeMs ?? GEOIP_DEFAULT_TTL_MS);

  if (!options?.forceRefresh) {
    const cached = readGeoipCache(maxAgeMs);
    if (cached) return cached;
  }

  const endpoint = (import.meta.env.VITE_GEOIP_ENDPOINT || "").trim();
  if (!endpoint) {
    if (options?.fallback) {
      return { ...options.fallback, source: "fallback" };
    }
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await utf8Fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      if (options?.fallback) return { ...options.fallback, source: "fallback" };
      return null;
    }
    const data = await res.json();

    const directLat = Number(data?.lat ?? data?.latitude);
    const directLng = Number(data?.lng ?? data?.longitude);
    const city = String(data?.city || data?.city_name || "").trim() || undefined;
    const stateCode =
      String(data?.state_code || data?.region_code || data?.subdivision_code || "").trim().toLowerCase() || undefined;
    const countryCodeRaw = String(data?.country_code || data?.countryCode || "").trim().toLowerCase();
    const countryCode = countryCodeRaw || undefined;
    if (Number.isFinite(directLat) && Number.isFinite(directLng)) {
      const out: ApproxGeo = { lat: directLat, lng: directLng, city, stateCode, countryCode, source: "ip" };
      writeGeoipCache(out);
      return out;
    }

    const loc = String(data?.loc || "");
    if (loc.includes(",")) {
      const [latRaw, lngRaw] = loc.split(",");
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const out: ApproxGeo = { lat, lng, city, stateCode, countryCode, source: "ip" };
        writeGeoipCache(out);
        return out;
      }
    }

    if (options?.fallback) return { ...options.fallback, source: "fallback" };
    return null;
  } catch {
    if (options?.fallback) return { ...options.fallback, source: "fallback" };
    return null;
  }
}

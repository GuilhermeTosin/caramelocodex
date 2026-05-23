/**
 * Google Maps API loader — carrega dinamicamente a API e retorna os namespaces.
 *
 * Uso:
 *   const { maps } = await loadGoogleMapsApi();
 *   const map = new maps.Map(el, { center: { lat, lng }, zoom: 12 });
 */

let loadPromise: Promise<typeof google.maps> | null = null;
const GEOCODE_CACHE_KEY = "caramelinho:geocode-cache:v1";
const GEOCODE_SESSION_COUNT_KEY = "caramelinho:geocode-count:v1";
const GEOCODE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias
const GEOCODE_MAX_PER_SESSION = 40;

export function getMapsApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
}

export function isMapsApiAvailable(): boolean {
  return !!getMapsApiKey();
}

export async function loadGoogleMapsApi(): Promise<typeof google.maps> {
  if (loadPromise) return loadPromise;
  if (typeof google !== "undefined" && google.maps) {
    loadPromise = Promise.resolve(google.maps);
    return loadPromise;
  }

  const key = getMapsApiKey();
  if (!key) {
    loadPromise = Promise.reject(new Error("Chave da API Google Maps não configurada."));
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]',
    );
    if (existing) {
      // Se o script já existe, espera o callback
      const check = setInterval(() => {
        if (typeof google !== "undefined" && google.maps) {
          clearInterval(check);
          resolve(google.maps);
        }
      }, 200);
      return;
    }

    const callbackName = `_googleMapsInit_${Date.now()}`;
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      if (google?.maps) {
        resolve(google.maps);
      } else {
        reject(new Error("Google Maps falhou ao carregar."));
      }
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,marker&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete (window as any)[callbackName];
      reject(new Error("Falha ao carregar script do Google Maps."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface PlaceResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  street: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  postalCode: string;
}

function normalizeGeocodeKey(address: string): string {
  return address.toLowerCase().trim();
}

function readGeocodeCache(): Record<string, { lat: number; lng: number; ts: number }> {
  try {
    const raw = sessionStorage.getItem(GEOCODE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeGeocodeCache(cache: Record<string, { lat: number; lng: number; ts: number }>): void {
  try {
    sessionStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // noop
  }
}

function getCachedGeocode(address: string): { lat: number; lng: number } | null {
  const key = normalizeGeocodeKey(address);
  if (!key) return null;
  const cache = readGeocodeCache();
  const hit = cache[key];
  if (!hit) return null;
  if (Date.now() - hit.ts > GEOCODE_CACHE_TTL_MS) {
    delete cache[key];
    writeGeocodeCache(cache);
    return null;
  }
  return { lat: hit.lat, lng: hit.lng };
}

function setCachedGeocode(address: string, coords: { lat: number; lng: number }): void {
  const key = normalizeGeocodeKey(address);
  if (!key) return;
  const cache = readGeocodeCache();
  cache[key] = { ...coords, ts: Date.now() };
  writeGeocodeCache(cache);
}

function canRunGeocodeRequest(): boolean {
  try {
    const raw = sessionStorage.getItem(GEOCODE_SESSION_COUNT_KEY);
    const current = Number(raw || "0");
    if (!Number.isFinite(current)) return true;
    if (current >= GEOCODE_MAX_PER_SESSION) return false;
    sessionStorage.setItem(GEOCODE_SESSION_COUNT_KEY, String(current + 1));
    return true;
  } catch {
    return true;
  }
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const normalized = address.trim();
  if (!normalized) return null;

  const cached = getCachedGeocode(normalized);
  if (cached) return cached;

  if (!canRunGeocodeRequest()) return null;

  try {
    const maps = await loadGoogleMapsApi();
    const geocoder = new maps.Geocoder();
    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ address: normalized }, (results, status) => {
        if (status === "OK" && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocode falhou: ${status}`));
        }
      });
    });
    if (result.length > 0) {
      const coords = {
        lat: result[0].geometry.location.lat(),
        lng: result[0].geometry.location.lng(),
      };
      setCachedGeocode(normalized, coords);
      return coords;
    }
    return null;
  } catch {
    return null;
  }
}

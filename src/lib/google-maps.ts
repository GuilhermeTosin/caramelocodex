/**
 * Google Maps API loader — carrega dinamicamente a API e retorna os namespaces.
 *
 * Uso:
 *   const { maps } = await loadGoogleMapsApi();
 *   const map = new maps.Map(el, { center: { lat, lng }, zoom: 12 });
 */

let loadPromise: Promise<typeof google.maps> | null = null;

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

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const maps = await loadGoogleMapsApi();
    const geocoder = new maps.Geocoder();
    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocode falhou: ${status}`));
        }
      });
    });
    if (result.length > 0) {
      return {
        lat: result[0].geometry.location.lat(),
        lng: result[0].geometry.location.lng(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

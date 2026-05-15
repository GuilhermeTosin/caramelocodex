import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isMapsApiAvailable, loadGoogleMapsApi } from "@/lib/google-maps";
import { COUNTRIES } from "@/services/businesses";

export interface AddressResult {
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

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelected: (place: AddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Mapa de nomes de estados brasileiros (longos) para siglas */
const BR_STATE_NAMES: Record<string, string> = {
  "acre": "ac",
  "alagoas": "al",
  "amapá": "ap",
  "amazonas": "am",
  "bahia": "ba",
  "ceará": "ce",
  "distrito federal": "df",
  "espírito santo": "es",
  "goiás": "go",
  "maranhão": "ma",
  "mato grosso": "mt",
  "mato grosso do sul": "ms",
  "minas gerais": "mg",
  "pará": "pa",
  "paraíba": "pb",
  "paraná": "pr",
  "pernambuco": "pe",
  "piauí": "pi",
  "rio de janeiro": "rj",
  "rio grande do norte": "rn",
  "rio grande do sul": "rs",
  "rondônia": "ro",
  "roraima": "rr",
  "santa catarina": "sc",
  "são paulo": "sp",
  "sergipe": "se",
  "tocantins": "to",
};

/** Tenta extrair sigla de estado (província) de um componente do Google Places.
 * Recebe um array de address_components e retorna { stateCode, state }
 */
function extractState(
  components: google.maps.GeocoderAddressComponent[],
  countryCode: string,
): { stateCode: string; state: string } {
  const knownState = findKnownState(components, countryCode);
  if (knownState) return knownState;
  const hasKnownStateList = !!COUNTRIES[countryCode.toLowerCase()]?.states;

  // Prioridade 1: administrative_area_level_1 (Província/Estado)
  const level1 = components.find(c => c.types.includes("administrative_area_level_1"));
  if (level1) {
    const name = level1.short_name || level1.long_name;
    const long = level1.long_name?.toLowerCase() || "";
    
    if (name?.length === 2) {
      return { stateCode: name.toLowerCase(), state: level1.long_name || name };
    }
    if (BR_STATE_NAMES[long]) {
      return { stateCode: BR_STATE_NAMES[long], state: level1.long_name || name! };
    }
    return {
      stateCode: (name || long).slice(0, 3).toLowerCase(),
      state: level1.long_name || name || "",
    };
  }

  if (hasKnownStateList) {
    return { stateCode: "", state: "" };
  }

  // Fallback para level 2 se não encontrar level 1
  const level2 = components.find(c => c.types.includes("administrative_area_level_2"));
  if (level2) {
    const name = level2.short_name || level2.long_name;
    return {
      stateCode: (name || "").slice(0, 3).toLowerCase(),
      state: level2.long_name || name || "",
    };
  }

  return { stateCode: "", state: "" };
}

/** Extrai país do address_components */
function extractCountry(
  components: google.maps.GeocoderAddressComponent[],
): { countryCode: string; country: string } {
  for (const comp of components) {
    if (comp.types.includes("country")) {
      return {
        countryCode: (comp.short_name || "").toLowerCase(),
        country: comp.long_name || "",
      };
    }
  }
  return { countryCode: "", country: "" };
}

function findKnownState(
  components: google.maps.GeocoderAddressComponent[],
  countryCode: string,
): { stateCode: string; state: string } | null {
  const states = COUNTRIES[countryCode.toLowerCase()]?.states;
  if (!states) return null;

  const stateEntries = Object.entries(states).map(([code, name]) => ({
    code,
    name,
    normalizedCode: normalizeAddressPart(code),
    normalizedName: normalizeAddressPart(name),
  }));

  const level1 = components.find((component) => component.types.includes("administrative_area_level_1"));
  const candidates = level1 ? [level1, ...components.filter((component) => component !== level1)] : components;

  for (const component of candidates) {
    const normalizedLong = normalizeAddressPart(component.long_name || "");
    const normalizedShort = normalizeAddressPart(component.short_name || "");
    const match = stateEntries.find((entry) =>
      entry.normalizedCode === normalizedShort ||
      entry.normalizedCode === normalizedLong ||
      entry.normalizedName === normalizedLong ||
      entry.normalizedName === normalizedShort
    );

    if (match) {
      return { stateCode: match.code, state: match.name };
    }
  }

  return null;
}

function normalizeAddressPart(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Extrai cidade */
function extractCity(
  components: google.maps.GeocoderAddressComponent[],
): string {
  // Prioridade 1: locality (Geralmente a cidade real)
  const locality = components.find(c => c.types.includes("locality"));
  if (locality) return locality.long_name || "";

  // Prioridade 2: administrative_area_level_2 (Muitas vezes a cidade em certos países)
  const admin2 = components.find(c => c.types.includes("administrative_area_level_2"));
  if (admin2) return admin2.long_name || "";

  // Prioridade 3: sublocality / neighborhood (Bairro)
  const sublocality = components.find(c => 
    c.types.includes("sublocality") || 
    c.types.includes("sublocality_level_1") || 
    c.types.includes("neighborhood")
  );
  if (sublocality) return sublocality.long_name || "";

  // Prioridade 4: administrative_area_level_1 (Caso seja uma cidade-estado como Tokyo ou Singapore)
  const admin1 = components.find(c => c.types.includes("administrative_area_level_1"));
  if (admin1) return admin1.long_name || "";

  // Prioridade 5: postal_town
  const postalTown = components.find(c => c.types.includes("postal_town"));
  if (postalTown) return postalTown.long_name || "";

  return "";
}

/** Extrai CEP / postal code */
function extractPostalCode(
  components: google.maps.GeocoderAddressComponent[],
): string {
  for (const comp of components) {
    if (comp.types.includes("postal_code")) {
      return comp.long_name || "";
    }
  }
  return "";
}

/** Extrai nome da rua + número */
function extractStreet(
  components: google.maps.GeocoderAddressComponent[],
): string {
  const route = components.find((c) => c.types.includes("route"));
  const streetNumber = components.find((c) => c.types.includes("street_number"));
  const parts: string[] = [];
  if (route) parts.push(route.long_name || "");
  if (streetNumber) parts.push(streetNumber.long_name || "");
  return parts.join(", ") || "";
}

/** Converte resultado do Google Place em AddressResult */
function placeToAddressResult(
  place: google.maps.places.PlaceResult,
): AddressResult {
  const components = place.address_components || [];
  const { countryCode, country } = extractCountry(components);
  const { stateCode, state } = extractState(components, countryCode);

  return {
    formattedAddress: place.formatted_address || "",
    lat: place.geometry?.location?.lat() || 0,
    lng: place.geometry?.location?.lng() || 0,
    street: extractStreet(components),
    city: extractCity(components),
    state,
    stateCode,
    country,
    countryCode,
    postalCode: extractPostalCode(components),
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Digite o endereço do seu negócio…",
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const apiAvailable = isMapsApiAvailable();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!apiAvailable) return;

    loadGoogleMapsApi()
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, [apiAvailable]);

  useEffect(() => {
    if (!ready || !inputRef.current) return;
    
    // Limpar se já existir (para evitar duplicidade em re-renders ou trocas de modal)
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    autocompleteRef.current =
      new google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: undefined,
        fields: [
          "address_components",
          "formatted_address",
          "geometry",
          "name",
        ],
      });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place || !place.geometry) return;

      const result = placeToAddressResult(place);
      
      // Atualizar o valor do input fisicamente e disparar evento para o React
      if (inputRef.current) {
        inputRef.current.value = result.formattedAddress;
        inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      onChange(result.formattedAddress);
      onPlaceSelected(result);

      // Esconder dropdown do Google imediatamente após seleção
      const pacContainers = document.querySelectorAll(".pac-container");
      pacContainers.forEach((container) => {
        (container as HTMLElement).style.display = "none";
      });
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      // Limpeza agressiva ao desmontar (mudar de página)
      const pacContainers = document.querySelectorAll(".pac-container");
      pacContainers.forEach((container) => {
        container.remove();
      });
    };
  }, [ready]);

  // Sincronizar valor externo com o input interno (importante para modais)
  useEffect(() => {
    if (inputRef.current && value !== undefined && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  if (!apiAvailable) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled
          className="pl-10"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Configure a chave Google Maps para ativar o autocomplete de endereço.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {!ready ? (
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled
            className="pl-10"
          />
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10 google-places-input"
          />
        </div>
      )}
    </div>
  );
}

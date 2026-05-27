import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/services/businesses";
import { getMapsApiKey, isMapsApiAvailable } from "@/lib/google-maps";

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
  mode?: "address" | "city";
}

interface PlacesPrediction {
  place: string;
  text: string;
  secondaryText?: string;
}

type AddressComponentLike = {
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
  types?: string[];
};

const BR_STATE_NAMES: Record<string, string> = {
  acre: "ac",
  alagoas: "al",
  amapa: "ap",
  amazonas: "am",
  bahia: "ba",
  ceara: "ce",
  "distrito federal": "df",
  "espirito santo": "es",
  goias: "go",
  maranhao: "ma",
  "mato grosso": "mt",
  "mato grosso do sul": "ms",
  "minas gerais": "mg",
  para: "pa",
  paraiba: "pb",
  parana: "pr",
  pernambuco: "pe",
  piaui: "pi",
  "rio de janeiro": "rj",
  "rio grande do norte": "rn",
  "rio grande do sul": "rs",
  rondonia: "ro",
  roraima: "rr",
  "santa catarina": "sc",
  "sao paulo": "sp",
  sergipe: "se",
  tocantins: "to",
};

function normalizeAddressPart(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, "")
    .trim();
}

function compLong(component: AddressComponentLike): string {
  return component.long_name || component.longText || "";
}

function compShort(component: AddressComponentLike): string {
  return component.short_name || component.shortText || "";
}

function findKnownState(
  components: AddressComponentLike[],
  countryCode: string
): { stateCode: string; state: string } | null {
  const states = COUNTRIES[(countryCode || "").toLowerCase()]?.states;
  if (!states) return null;

  const entries = Object.entries(states).map(([code, name]) => ({
    code,
    name,
    normalizedCode: normalizeAddressPart(code),
    normalizedName: normalizeAddressPart(name),
  }));

  for (const component of components) {
    const normalizedLong = normalizeAddressPart(compLong(component));
    const normalizedShort = normalizeAddressPart(compShort(component));
    const match = entries.find(
      (entry) =>
        entry.normalizedCode === normalizedLong ||
        entry.normalizedCode === normalizedShort ||
        entry.normalizedName === normalizedLong ||
        entry.normalizedName === normalizedShort
    );
    if (match) return { stateCode: match.code, state: match.name };
  }
  return null;
}

function extractCountry(components: AddressComponentLike[]): { countryCode: string; country: string } {
  const country = components.find((comp) => (comp.types || []).includes("country"));
  if (!country) return { countryCode: "", country: "" };
  return {
    countryCode: compShort(country).toLowerCase(),
    country: compLong(country),
  };
}

function extractState(
  components: AddressComponentLike[],
  countryCode: string
): { stateCode: string; state: string } {
  const known = findKnownState(components, countryCode);
  if (known) return known;

  const level1 = components.find((comp) => (comp.types || []).includes("administrative_area_level_1"));
  if (!level1) return { stateCode: "", state: "" };

  const long = normalizeAddressPart(compLong(level1));
  const short = compShort(level1);
  if (short && short.length <= 3) {
    return { stateCode: short.toLowerCase(), state: compLong(level1) || short };
  }
  if (BR_STATE_NAMES[long]) {
    return { stateCode: BR_STATE_NAMES[long], state: compLong(level1) };
  }
  return {
    stateCode: (short || long).slice(0, 3).toLowerCase(),
    state: compLong(level1) || short || "",
  };
}

function extractCity(components: AddressComponentLike[]): string {
  const byType = (type: string) => components.find((comp) => (comp.types || []).includes(type));
  return (
    compLong(byType("locality") || {}) ||
    compLong(byType("postal_town") || {}) ||
    compLong(byType("administrative_area_level_2") || {}) ||
    compLong(byType("sublocality") || {}) ||
    compLong(byType("sublocality_level_1") || {}) ||
    ""
  );
}

function extractPostalCode(components: AddressComponentLike[]): string {
  const postal = components.find((comp) => (comp.types || []).includes("postal_code"));
  return postal ? compLong(postal) : "";
}

function extractStreet(components: AddressComponentLike[]): string {
  const route = components.find((comp) => (comp.types || []).includes("route"));
  const number = components.find((comp) => (comp.types || []).includes("street_number"));
  const parts = [route ? compLong(route) : "", number ? compLong(number) : ""].filter(Boolean);
  return parts.join(", ");
}

function mapPlaceDetailsToAddress(details: any): AddressResult {
  const components = (details?.addressComponents || []) as AddressComponentLike[];
  const { countryCode, country } = extractCountry(components);
  const { stateCode, state } = extractState(components, countryCode);

  return {
    formattedAddress: String(details?.formattedAddress || ""),
    lat: Number(details?.location?.latitude || 0),
    lng: Number(details?.location?.longitude || 0),
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
  placeholder = "Digite o endereço...",
  disabled = false,
  mode = "address",
}: AddressAutocompleteProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [suggestions, setSuggestions] = useState<PlacesPrediction[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const key = getMapsApiKey();
  const apiAvailable = isMapsApiAvailable();
  const abortRef = useRef<AbortController | null>(null);

  const canAutocomplete = useMemo(() => apiAvailable && !!key && !disabled, [apiAvailable, key, disabled]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!canAutocomplete) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const query = (value || "").trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask":
              "suggestions.placePrediction.place,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
          },
          body: JSON.stringify({
            input: query,
            languageCode: "pt-BR",
            includeQueryPredictions: false,
            ...(mode === "city" ? { includedPrimaryTypes: ["(cities)"] } : {}),
          }),
        });

        if (!response.ok) throw new Error("autocomplete_failed");
        const data = await response.json();
        const list: PlacesPrediction[] = (data?.suggestions || [])
          .map((item: any) => item?.placePrediction)
          .filter(Boolean)
          .map((prediction: any) => ({
            place: String(prediction?.place || ""),
            text:
              String(prediction?.text?.text || "").trim() ||
              String(prediction?.structuredFormat?.mainText?.text || "").trim(),
            secondaryText: String(prediction?.structuredFormat?.secondaryText?.text || "").trim(),
          }))
          .filter((item: PlacesPrediction) => !!item.place && !!item.text)
          .slice(0, 6);

        setSuggestions(list);
        setOpen(hasInteracted && list.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, canAutocomplete, key, mode, hasInteracted]);

  const handleSelectPrediction = async (prediction: PlacesPrediction) => {
    const label = [prediction.text, prediction.secondaryText].filter(Boolean).join(", ");
    setHasInteracted(false);
    setSuggestions([]);
    onChange(label);
    setOpen(false);
    setLoading(true);

    try {
      const placePath = prediction.place;
      const response = await fetch(`https://places.googleapis.com/v1/${placePath}`, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "formattedAddress,location,addressComponents",
        },
      });

      if (!response.ok) throw new Error("place_details_failed");
      const details = await response.json();
      const parsed = mapPlaceDetailsToAddress(details);
      const cityLabel = [parsed.city, parsed.stateCode?.toUpperCase(), parsed.countryCode?.toUpperCase()]
        .filter(Boolean)
        .join(", ");
      const withFallbackAddress: AddressResult = {
        ...parsed,
        formattedAddress:
          mode === "city"
            ? cityLabel || parsed.city || parsed.formattedAddress || label
            : parsed.formattedAddress || label,
      };
      onChange(withFallbackAddress.formattedAddress);
      onPlaceSelected(withFallbackAddress);
      inputRef.current?.blur();
    } catch {
      // mantém ao menos o texto selecionado, sem quebrar o formulário.
      onChange(label);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setHasInteracted(true);
          onChange(e.target.value);
          if (!open && (e.target.value || "").trim().length >= 3) setOpen(true);
        }}
        onFocus={() => {
          setHasInteracted(true);
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && suggestions.length > 0) {
            e.preventDefault();
            void handleSelectPrediction(suggestions[0]);
          }
        }}
        placeholder={placeholder}
        disabled={disabled || !apiAvailable}
        className="pl-10"
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
      ) : null}

      {open && suggestions.length > 0 ? (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border shadow-xl rounded-xl overflow-hidden z-[10000]">
          <ul className="py-1">
            {suggestions.map((item) => (
              <li key={item.place}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void handleSelectPrediction(item)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors"
                >
                  <p className="text-sm text-foreground">{item.text}</p>
                  {item.secondaryText ? (
                    <p className="text-xs text-muted-foreground truncate">{item.secondaryText}</p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!apiAvailable ? (
        <p className="text-xs text-muted-foreground mt-1">
          Configure a chave Google Maps para ativar o autocomplete de endereço.
        </p>
      ) : null}
    </div>
  );
}

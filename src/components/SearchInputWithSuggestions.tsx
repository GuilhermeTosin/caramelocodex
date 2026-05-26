import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "./ui/input";
import { Search, MapPin, X } from "lucide-react";
import { isMapsApiAvailable, loadGoogleMapsApi } from "@/lib/google-maps";

interface SearchInputWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder: string;
  icon: "search" | "location";
  onSubmit?: (
    value?: string,
    meta?: {
      lat?: number;
      lng?: number;
      city?: string;
      stateCode?: string;
      countryCode?: string;
      placeId?: string;
    }
  ) => void;
  className?: string;
  inputClassName?: string;
  useGooglePlaces?: boolean;
  locationBias?: { lat: number; lng: number } | null;
  disableLocalSuggestions?: boolean;
  onUseCurrentLocation?: () => void | Promise<void>;
}

function extractCityFromPlace(place: google.maps.places.PlaceResult): string {
  const components = place.address_components || [];

  const byType = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name || "";

  return (
    byType("locality") ||
    byType("postal_town") ||
    byType("administrative_area_level_2") ||
    byType("sublocality") ||
    byType("sublocality_level_1") ||
    place.name ||
    ""
  ).trim();
}

export default function SearchInputWithSuggestions({
  value,
  onChange,
  suggestions,
  placeholder,
  icon,
  onSubmit,
  className = "",
  inputClassName = "",
  useGooglePlaces = false,
  locationBias = null,
  disableLocalSuggestions = false,
  onUseCurrentLocation,
}: SearchInputWithSuggestionsProps) {
  const suggestionsDisabled = disableLocalSuggestions;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const locateActionLockRef = useRef(false);
  const canUseGooglePlaces = !suggestionsDisabled && useGooglePlaces && icon === "location" && isMapsApiAvailable();

  const filteredSuggestions = useMemo(() => {
    if (suggestionsDisabled) return [];
    if (canUseGooglePlaces) return [];
    if (value.length < 2) return [];
    const query = value.toLowerCase();
    return suggestions
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .filter((s) => s.toLowerCase().includes(query))
      .slice(0, 6);
  }, [suggestions, value, canUseGooglePlaces, suggestionsDisabled]);

  const showLocateAction = icon === "location" && typeof onUseCurrentLocation === "function";
  const showSuggestions = isOpen && (filteredSuggestions.length > 0 || showLocateAction);

  useEffect(() => {
    if (!canUseGooglePlaces || !inputRef.current) return;

    let mounted = true;
    const inputEl = inputRef.current;

    const syncFromNativeInput = () => {
      const currentValue = inputEl.value || "";
      if (currentValue !== value) {
        onChange(currentValue);
      }
    };

    inputEl.addEventListener("input", syncFromNativeInput);

    loadGoogleMapsApi()
      .then(() => {
        if (!mounted || !inputRef.current) return;

        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }

        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "name", "address_components", "geometry", "place_id"],
          types: ["geocode"],
        });

        if (locationBias) {
          const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(locationBias.lat - 2, locationBias.lng - 2),
            new google.maps.LatLng(locationBias.lat + 2, locationBias.lng + 2)
          );
          ac.setBounds(bounds);
          ac.setOptions({ strictBounds: false });
        }

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const selected = place.formatted_address || inputRef.current?.value || "";
          const extractedCity = extractCityFromPlace(place);
          const components = place.address_components || [];
          const stateCode = components.find((c) => c.types.includes("administrative_area_level_1"))?.short_name || "";
          const countryCode = components.find((c) => c.types.includes("country"))?.short_name || "";
          const lat = place.geometry?.location?.lat?.();
          const lng = place.geometry?.location?.lng?.();
          onChange(selected);
          setIsOpen(false);
          if (onSubmit) {
            onSubmit(selected, {
              lat,
              lng,
              city: extractedCity,
              stateCode: stateCode.toLowerCase(),
              countryCode: countryCode.toLowerCase(),
              placeId: place.place_id,
            });
          }
        });

        autocompleteRef.current = ac;
      })
      .catch(() => {
        // fallback silencioso para sugestões locais
      });

    return () => {
      mounted = false;
      inputEl.removeEventListener("input", syncFromNativeInput);
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [canUseGooglePlaces, onChange, onSubmit, locationBias, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    if (onSubmit) onSubmit(suggestion);
  };

  const triggerUseCurrentLocation = () => {
    if (locateActionLockRef.current) return;
    locateActionLockRef.current = true;
    // Fecha após o ciclo do click para evitar "click-through" no botão do formulário.
    window.setTimeout(() => setIsOpen(false), 0);
    void Promise.resolve(onUseCurrentLocation?.()).finally(() => {
      window.setTimeout(() => {
        locateActionLockRef.current = false;
      }, 120);
    });
  };

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      {icon === "search" ? (
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
      ) : (
        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
      )}
      
      <Input
        ref={inputRef}
        value={value}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          onChange(e.target.value);
          if (!canUseGooglePlaces) {
            setIsOpen(showLocateAction || e.target.value.length >= 2);
          }
        }}
        onBlur={() => {
          if (canUseGooglePlaces && inputRef.current) {
            const currentValue = inputRef.current.value || "";
            if (currentValue !== value) {
              onChange(currentValue);
            }
          }
        }}
        onFocus={() => {
          if (canUseGooglePlaces) return;
          if (showLocateAction || (value.length >= 2 && filteredSuggestions.length > 0)) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        className={`h-full pl-14 pr-12 text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/85 w-full ${inputClassName}`}
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setIsOpen(false);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border shadow-2xl rounded-2xl overflow-hidden z-[10000] animate-in fade-in slide-in-from-top-2 duration-200">
          <ul
            className="py-2"
            onMouseDown={(e) => {
              if (
                e.target === e.currentTarget &&
                filteredSuggestions.length === 1 &&
                !showLocateAction
              ) {
                e.preventDefault();
                handleSelect(filteredSuggestions[0]);
              }
            }}
          >
            {showLocateAction && (
              <li onMouseDown={(e) => e.preventDefault()}>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    triggerUseCurrentLocation();
                  }}
                  className="w-full min-h-12 text-left px-5 py-3 hover:bg-secondary flex items-center gap-3 transition-colors border-b border-border/60"
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-semibold">Usar minha localização</span>
                </button>
              </li>
            )}
            {filteredSuggestions.map((suggestion, index) => (
              <li key={index} onMouseDown={(e) => e.preventDefault()}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(suggestion);
                  }}
                  onClick={() => handleSelect(suggestion)}
                  className="w-full min-h-12 text-left px-5 py-3 hover:bg-secondary flex items-center gap-3 transition-colors"
                >
                  {icon === "search" ? (
                    <Search className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-foreground font-medium">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

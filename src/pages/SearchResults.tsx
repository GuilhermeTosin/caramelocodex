import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Star, SlidersHorizontal, PawPrint, Map as MapIcon, List, MessageCircle, X, Navigation, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  getAllBusinesses, 
  buildBusinessUrl, 
  BUSINESS_CATEGORIES, 
  getCategoryLabel,
  getAvailableLocations,
  getSearchSuggestions
} from "@/services/businesses";
import type { BusinessFrontend } from "@/types/database";
import MapView from "@/components/MapView";
import { useAuth } from "@/contexts/AuthContext";
import { calculateDistance, getApproxPositionByIp, getCurrentPosition } from "@/lib/utils/geo";
import { geocodeAddress } from "@/lib/google-maps";
import SearchInputWithSuggestions from "@/components/SearchInputWithSuggestions";
import SiteFooter from "@/components/SiteFooter";
import { setSeoMeta } from "@/lib/seo";

const SEARCH_SYNONYMS: Record<string, string[]> = {
  dentista: ["Saúde & Beleza", "Clínica Dental", "Odontologia", "Dente"],
  mecanico: ["Serviços Automotivos", "Oficina", "Centro Automotivo", "Carro", "Auto"],
  mecanica: ["Serviços Automotivos", "Oficina", "Centro Automotivo", "Carro", "Auto"],
  comida: ["Alimentação", "Restaurante", "Lanche", "Marmita"],
  restaurante: ["Alimentação"],
  padaria: ["Alimentação"],
  doce: ["Alimentação", "Confeitaria"],
  advogado: ["Advocacia & Consultoria", "Jurídico", "Lei"],
  tradutor: ["Advocacia & Consultoria", "Tradução", "Imigração"],
  traducao: ["Advocacia & Consultoria", "Tradução", "Imigração"],
  imigracao: ["Advocacia & Consultoria", "Imigração", "Visto"],
  obra: ["Construção & Reformas"],
  reforma: ["Construção & Reformas"],
  pintor: ["Construção & Reformas"],
  casa: ["Construção & Reformas", "Imobiliária"],
  aluguel: ["Imobiliária"],
  venda: ["Comércio & Varejo", "Imobiliária"],
  medico: ["Saúde & Beleza"],
  unha: ["Saúde & Beleza", "Manicure"],
  cabelo: ["Saúde & Beleza", "Cabeleireiro"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Alimentação (Restaurantes, Padarias, Cafés)": [
    "restaurante", "lanchonete", "lanches", "padaria", "comida", 
    "gastronomia", "cafe", "almoco", "jantar", "marmita"
  ],
  "Serviços Automotivos": [
    "mecanico", "oficina", "carro", "conserto", "pneu", 
    "oleo", "auto", "manutencao", "reparo"
  ],
  "Saúde & Beleza": [
    "dentista", "medico", "clinica", "estetica", "salao", 
    "cabelo", "unha", "manicure", "pedicure", "terapia", "psicologo"
  ],
  "Construção & Reformas": [
    "obra", "reforma", "pintor", "pedreiro", "eletricista", 
    "encanador", "casa", "apartamento", "telhado"
  ],
  "Advocacia & Consultoria": [
    "advogado", "juridico", "lei", "processo", "visto", 
    "imigracao", "consultor", "tradutor", "traducao", "traducoes", "documentos"
  ],
  "Contabilidade & Finanças": [
    "contador", "imposto", "tax", "financas", "investimento", 
    "dinheiro", "empresa"
  ],
  "Educação & Idiomas": [
    "escola", "curso", "professor", "aula", "ingles", 
    "frances", "portugues", "aprendizado"
  ],
  "Tecnologia & TI": [
    "programador", "software", "computador", "celular", 
    "site", "desenvolvimento", "suporte"
  ],
  "Comércio & Varejo": [
    "loja", "venda", "produto", "mercado", "roupa", "acessorios"
  ],
  "Transporte & Mudança": [
    "mudanca", "frete", "entrega", "logistica", "caminhao", "envio"
  ],
  "Serviços para Pets": [
    "pet", "pets", "cachorro", "gato", "banho", "tosa", "veterinario"
  ],
  "Cuidados Infantis e de Idosos": [
    "baba", "babysitter", "acompanhante", "cuidadora", "cuidador", "crianca"
  ],
  "Diaristas": [
    "diarista", "faxina", "limpeza", "limpar", "casa"
  ],
  "Imobiliária": [
    "casa", "apartamento", "aluguel", "venda", "imovel", "corretor"
  ],
  "Turismo & Viagens": [
    "viagem", "passagem", "hotel", "turismo", "guia", "excursao"
  ],
};

const CATEGORY_FILTER_ALIASES: Record<string, string[]> = {
  "alimentacao": ["Alimentação", "Alimentacao"],
  "alimentacao (restaurantes, padarias, cafes)": ["Alimentação", "Alimentacao"],
  "saude & beleza": ["Saúde & Beleza", "Saude e Beleza"],
  "saude e beleza": ["Saúde & Beleza", "Saude e Beleza"],
  "automotivo": ["Automotivo", "Serviços Automotivos", "Servicos Automotivos"],
  "servicos automotivos": ["Automotivo", "Serviços Automotivos", "Servicos Automotivos"],
  "construcao": ["Construção", "Construcao", "Construção & Reformas", "Construcao & Reformas"],
  "construcao & reformas": ["Construção", "Construcao", "Construção & Reformas", "Construcao & Reformas"],
  "advocacia": ["Advocacia", "Advocacia & Consultoria"],
  "advocacia & consultoria": ["Advocacia", "Advocacia & Consultoria"],
  "educacao": ["Educação", "Educacao", "Educação & Idiomas", "Educacao & Idiomas"],
  "educacao & idiomas": ["Educação", "Educacao", "Educação & Idiomas", "Educacao & Idiomas"],
  "transporte & mudanca": ["Transporte & Mudança", "Transporte & Mudanca", "Transporte & Mudancas"],
  "transporte & mudancas": ["Transporte & Mudança", "Transporte & Mudanca", "Transporte & Mudancas"],
  "servicos para pets": ["Serviços para Pets", "Servicos para Pets", "Pet", "Pets"],
  "cuidados infantis e de idosos": ["Cuidados Infantis e de Idosos", "Babás & Acompanhantes", "Babá", "Acompanhante", "Cuidadora", "Cuidador", "Idosos", "Infantil"],
  "diaristas": ["Diaristas", "Diarista", "Faxina", "Limpeza"],
};

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 250];

const CATEGORY_SEO_TEXT: Record<string, string> = {
  "Alimentação (Restaurantes, Padarias, Cafés)": "restaurantes, padarias e cafés",
  "Serviços Automotivos": "oficinas e serviços automotivos",
  "Saúde & Beleza": "serviços de saúde e beleza",
  "Construção & Reformas": "serviços de construção e reformas",
  "Advocacia & Consultoria": "advocacia, traduções e consultoria de imigração",
  "Contabilidade & Finanças": "contabilidade e finanças",
  "Educação & Idiomas": "educação e idiomas",
  "Tecnologia & TI": "tecnologia e TI",
  "Comércio & Varejo": "comércio e varejo",
  "Transporte & Mudança": "transporte e mudança",
  "Serviços para Pets": "serviços para pets",
  "Cuidados Infantis e de Idosos": "cuidados infantis e de idosos",
  "Diaristas": "diaristas e serviços de limpeza",
  "Imobiliária": "imobiliárias e corretores",
  "Turismo & Viagens": "turismo e viagens",
  "Outros": "serviços diversos",
};

export default function SearchResults() {
  const navigate = useNavigate();
  const { session, unreadMessages } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("categoria") || "";
  const cityFilter = searchParams.get("cidade") || "";
  const locationFilter = searchParams.get("local") || cityFilter;
  const countryFilter = searchParams.get("pais") || "";
  const stateFilter = searchParams.get("estado") || "";
  const radiusFilter = searchParams.get("raio") || "";
  const originLatParam = searchParams.get("origem_lat") || "";
  const originLngParam = searchParams.get("origem_lng") || "";
  const originLocalParam = searchParams.get("origem_local") || "";
  const radiusKm = radiusFilter ? Number(radiusFilter) : null;
  const hasLocationContext = !!(cityFilter.trim() || locationFilter.trim());
  const effectiveRadiusKm = radiusKm ?? (hasLocationContext ? 50 : null);

  const [searchInput, setSearchInput] = useState(query);
  const [locationInput, setLocationInput] = useState(locationFilter);
  const [showMap, setShowMap] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState<BusinessFrontend[]>([]);
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [locatingMe, setLocatingMe] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    getAllBusinesses().then(setAllBusinesses);
    getAvailableLocations().then(locations => {
      setAvailableLocations(locations);
      const cities = new Set<string>();
      locations.forEach(l => {
        l.states.forEach((s: any) => {
          s.cities.forEach((c: string) => cities.add(c));
        });
      });
      setCitySuggestions(Array.from(cities));
    });
    getSearchSuggestions().then(setSearchSuggestions);
    getCurrentPosition().then(async (coords) => {
      if (coords) {
        setUserCoords(coords);
        return;
      }
      const approx = await getApproxPositionByIp();
      if (approx) setUserCoords(approx);
    });
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => setSearchInput(query));
  }, [query]);

  useEffect(() => {
    Promise.resolve().then(() => setLocationInput(locationFilter));
  }, [locationFilter]);

  const selectedCountryData = useMemo(() => {
    return availableLocations.find(l => l.countryCode === countryFilter);
  }, [availableLocations, countryFilter]);

  const selectedStateData = useMemo(() => {
    if (!selectedCountryData) return null;
    return selectedCountryData.states.find((s: any) => s.code === stateFilter);
  }, [selectedCountryData, stateFilter]);

  const matchedLocationCoords = useMemo(() => {
    if (!cityFilter) return null;
    const matching = allBusinesses.filter(
      (biz) => cityMatches(biz.address.city, cityFilter)
    );
    if (matching.length === 0) return null;

    return {
      lat: matching.reduce((sum, biz) => sum + biz.address.lat, 0) / matching.length,
      lng: matching.reduce((sum, biz) => sum + biz.address.lng, 0) / matching.length,
    };
  }, [allBusinesses, cityFilter]);

  const selectedOriginCoords = useMemo(() => {
    const lat = Number(originLatParam);
    const lng = Number(originLngParam);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const normalizedLocation = normalizeText(locationFilter || cityFilter);
    const normalizedOriginLocal = normalizeText(originLocalParam);

    // Prevent stale origin reuse: only use URL origin when it matches current location.
    if (normalizedLocation && (!normalizedOriginLocal || normalizedLocation !== normalizedOriginLocal)) {
      return null;
    }

    return { lat, lng };
  }, [originLatParam, originLngParam, originLocalParam, locationFilter, cityFilter]);

  useEffect(() => {
    let canceled = false;
    const referenceText = (locationFilter || cityFilter || "").trim();

    if (!referenceText || matchedLocationCoords) {
      Promise.resolve().then(() => {
        if (!canceled) {
          setLocationCoords(matchedLocationCoords);
          setResolvingLocation(false);
        }
      });
      return;
    }

    Promise.resolve().then(() => {
      if (!canceled) setResolvingLocation(true);
    });
    geocodeAddress(referenceText).then((coords) => {
      if (canceled) return;
      setLocationCoords(coords);
      setResolvingLocation(false);
    });

    return () => {
      canceled = true;
    };
  }, [cityFilter, locationFilter, matchedLocationCoords]);

  // Regra de prioridade para distancia:
  // 1) Se o usuario definiu cidade, usamos apenas essa referencia (sem fallback para GPS).
  // 2) Se nao definiu cidade, usamos a localizacao atual do usuario.
  const hasTypedLocation = !!locationFilter.trim();
  const distanceOrigin = hasTypedLocation ? (selectedOriginCoords || locationCoords) : userCoords;
  const hasActiveFilters = !!(query || categoryFilter || cityFilter || countryFilter || stateFilter || radiusFilter);
  const emptyStateMessage = useMemo(() => {
    const parts: string[] = [];
    if (categoryFilter) {
      parts.push(`para ${categoryFilter.split("(")[0].trim().toLowerCase()}`);
    }
    const cityOrLocal = cityFilter.trim() || locationFilter.trim();
    if (cityOrLocal) {
      parts.push(`em ${cityOrLocal}`);
    }

    if (parts.length > 0) {
      return `Não encontramos resultados ${parts.join(" ")}.`;
    }

    return "O Caramelinho não achou nada com esses critérios.";
  }, [categoryFilter, cityFilter, locationFilter]);


  useEffect(() => {
    const baseTitle = "Buscar negócios brasileiros";
    const cityText = cityFilter ? ` em ${cityFilter}` : "";
    const categoryText = categoryFilter ? (CATEGORY_SEO_TEXT[categoryFilter] || categoryFilter.toLowerCase()) : "negócios e serviços";
    const queryPart = query ? ` para ${query}` : "";

    setSeoMeta(
      `${baseTitle}${cityText} | Caramelinho.com`,
      `Encontre ${categoryText}${cityText}${queryPart}. Compare opções perto de você e fale direto com os negócios.`
    );
  }, [query, categoryFilter, cityFilter]);

  const results = useMemo(() => {
    let filtered = allBusinesses;
    const baseBusinesses = allBusinesses;

    if (query) {
      const q = normalizeText(query);
      // Buscar sinanimos e palavras-chave da categoria
      const relatedTerms = SEARCH_SYNONYMS[q] || [];
      
      filtered = filtered.filter(
        (b) => {
          const catKeywords = CATEGORY_KEYWORDS[b.category] || [];
          
          return (
            matchesBusinessTextQuery(b, q) ||
            // Checar contra palavras-chave automaticas da categoria
            catKeywords.some(kw => normalizeText(kw).includes(q)) ||
            // Checar contra o mapa de sinanimos (termo buscado -> termos relacionados)
            relatedTerms.some(term => 
              matchesBusinessTextQuery(b, normalizeText(term))
            )
          );
        }
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((b) => matchesCategoryFilter(b.category, categoryFilter));
    }

    // Se ha referencia geografica (origem + raio efetivo), a cidade vira ponto de origem
    // e nao filtro estrito por nome. Sem origem, mantemos o filtro por cidade.
    if (cityFilter && !(distanceOrigin && effectiveRadiusKm)) {
      filtered = filtered.filter(
        (b) => cityMatches(b.address.city || "", cityFilter)
      );
    }

    if (countryFilter) {
      filtered = filtered.filter((b) => b.address.countryCode.toLowerCase() === countryFilter.toLowerCase());
    }

    if (stateFilter) {
      filtered = filtered.filter((b) => b.address.stateCode.toLowerCase() === stateFilter.toLowerCase());
    }


    if (effectiveRadiusKm && distanceOrigin) {
      filtered = filtered.filter((b) => {
        const distance = calculateDistance(distanceOrigin.lat, distanceOrigin.lng, b.address.lat, b.address.lng);
        return distance <= effectiveRadiusKm;
      });
    }

    // Expansão progressiva quando zera: 50km (padrão) -> 150km -> estado/província.
    if (filtered.length === 0 && distanceOrigin && hasLocationContext && !radiusKm) {
      const baseScoped = baseBusinesses.filter((b) => {
        const passesQuery = !query || matchesBusinessTextQuery(b, normalizeText(query));
        const passesCategory = !categoryFilter || matchesCategoryFilter(b.category, categoryFilter);
        const passesCountry = !countryFilter || b.address.countryCode.toLowerCase() === countryFilter.toLowerCase();
        const passesState = !stateFilter || b.address.stateCode.toLowerCase() === stateFilter.toLowerCase();
        return passesQuery && passesCategory && passesCountry && passesState;
      });

      const within = (km) => baseScoped.filter((b) => calculateDistance(distanceOrigin.lat, distanceOrigin.lng, b.address.lat, b.address.lng) <= km);

      const near150 = within(150);
      if (near150.length > 0) {
        filtered = near150;
      } else {
        const sameState = baseScoped.filter((b) => {
          const ref = baseBusinesses.find((x) => cityMatches(x.address.city || "", cityFilter || locationFilter));
          if (!ref) return false;
          return (
            b.address.countryCode.toLowerCase() === ref.address.countryCode.toLowerCase() &&
            b.address.stateCode.toLowerCase() === ref.address.stateCode.toLowerCase()
          );
        });
        if (sameState.length > 0) {
          filtered = sameState;
        }
      }
    }

    if (filtered.length === 0) {
      const hasHardFilters = !!(
        categoryFilter ||
        query ||
        cityFilter ||
        countryFilter ||
        stateFilter ||
        radiusKm
      );

      // Sa aplicamos fallback amplo quando nao ha filtros "duros".
      // Assim evitamos transformar uma categoria sem resultados em "todas as categorias".
      if (!hasHardFilters && locationFilter.trim()) {
        const normalizedLocal = normalizeText(locationFilter);
        const localFallback = baseBusinesses.filter((b) => {
          const city = normalizeText(b.address.city || "");
          const state = normalizeText(b.address.state || "");
          const country = normalizeText(b.address.country || "");
          return (
            city.includes(normalizedLocal) ||
            normalizedLocal.includes(city) ||
            state.includes(normalizedLocal) ||
            country.includes(normalizedLocal)
          );
        });
        if (localFallback.length > 0) {
          return localFallback;
        }
      }
    }
    // Se tiver coordenadas de referencia, ordena por proximidade sem alterar a contagem.
    if (distanceOrigin) {
      return [...filtered].sort((a, b) => {
        const distA = calculateDistance(distanceOrigin.lat, distanceOrigin.lng, a.address.lat, a.address.lng);
        const distB = calculateDistance(distanceOrigin.lat, distanceOrigin.lng, b.address.lat, b.address.lng);
        return distA - distB;
      });
    }

    return filtered;
  }, [query, categoryFilter, cityFilter, locationFilter, countryFilter, stateFilter, radiusKm, effectiveRadiusKm, hasLocationContext, allBusinesses, distanceOrigin]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) params.set("q", searchInput.trim());
    else params.delete("q");
    if (locationInput.trim()) {
      params.set("local", locationInput.trim());
      if (!cityFilter.trim()) params.delete("cidade");
      // Cidade escolhida no campo principal deve prevalecer sobre filtros laterais antigos.
      params.delete("pais");
      params.delete("estado");
      params.delete("categoria");
      params.delete("brasileiro");
      params.delete("portugues");
      if (normalizeText(locationInput) !== normalizeText(cityFilter)) {
        params.delete("origem_lat");
        params.delete("origem_lng");
        params.delete("origem_local");
      }
    } else {
      params.delete("local");
      params.delete("cidade");
      params.delete("raio");
      params.delete("origem_lat");
      params.delete("origem_lng");
      params.delete("origem_local");
    }
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    navigate("/buscar");
  };

  const handleLocateMe = async () => {
    setLocatingMe(true);
    let geoError: GeolocationPositionError | null = null;
    let coords = await getCurrentPosition();
    if (!coords && navigator.geolocation) {
      coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          (err) => {
            geoError = err;
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      });
    }
    setLocatingMe(false);
    if (!coords) {
      const approx = await getApproxPositionByIp();
      if (approx) {
        setUserCoords(approx);
        setLocationInput("");
        const params = new URLSearchParams(searchParams);
        params.delete("local");
        params.delete("cidade");
        params.delete("origem_lat");
        params.delete("origem_lng");
        params.delete("origem_local");
        params.set("raio", "50");
        setSearchParams(params);
        setShowMap(true);
        window.alert("Localização exata bloqueada. Usei localização aproximada por IP.");
        return;
      }
      if (!window.isSecureContext) {
        window.alert("Geolocalização exige contexto seguro. Abra em localhost ou HTTPS.");
        return;
      }
      if (geoError?.code === 1) {
        window.alert("Permissão de localização negada pelo navegador/dispositivo.");
        return;
      }
      if (geoError?.code === 2) {
        window.alert("Localização indisponível no momento. Tente novamente em alguns segundos.");
        return;
      }
      if (geoError?.code === 3) {
        window.alert("Tempo esgotado para obter localização. Tente novamente.");
        return;
      }
      window.alert("Não consegui acessar sua localização. Verifique bloqueadores/extensões e permissões do navegador.");
      return;
    }

    setUserCoords(coords);
    setLocationInput("");

    const params = new URLSearchParams(searchParams);
    params.delete("local");
    params.delete("cidade");
    params.delete("origem_lat");
    params.delete("origem_lng");
    params.delete("origem_local");
    params.set("raio", "50");
    setSearchParams(params);
    setShowMap(true);
  };

  const getDistanceLabel = (biz: BusinessFrontend): string | null => {
    if (!distanceOrigin) return null;
    const distance = calculateDistance(distanceOrigin.lat, distanceOrigin.lng, biz.address.lat, biz.address.lng);
    return `${distance.toFixed(distance < 10 ? 1 : 0)} km`;
  };

  const getParamsWithCurrentLocation = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    const committedCity = cityFilter.trim();
    const draftCity = locationInput.trim();
    const localToKeep = draftCity || locationFilter.trim();

    if (localToKeep) params.set("local", localToKeep);
    else params.delete("local");
    if (committedCity) params.set("cidade", committedCity);
    else params.delete("cidade");
    if (!localToKeep && !committedCity) {
      params.delete("origem_lat");
      params.delete("origem_lng");
      params.delete("origem_local");
    } else if (
      searchParams.get("origem_local") &&
      localToKeep &&
      normalizeText(searchParams.get("origem_local") || "") !== normalizeText(localToKeep)
    ) {
      params.delete("origem_lat");
      params.delete("origem_lng");
      params.delete("origem_local");
    }
    return params;
  }, [searchParams, cityFilter, locationInput, locationFilter]);

  const renderFilterControls = () => (
    <div className="space-y-3">
      <Select
        value={categoryFilter || "all"}
        onValueChange={(v) => {
          const params = getParamsWithCurrentLocation();
          if (v === "all") params.delete("categoria");
          else params.set("categoria", v);
          setSearchParams(params);
        }}
      >
        <SelectTrigger className="w-full h-9 text-sm">
          <SelectValue placeholder="Todas as categorias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {BUSINESS_CATEGORIES.filter((cat) => cat !== "Turismo & Viagens").map((cat) => (
              <SelectItem key={cat} value={cat}>
               {cat.startsWith("Advocacia & Consultoria") ? "Advocacia & Traduções" : cat.split("(")[0].trim()}
              </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={countryFilter || "all"}
        onValueChange={(v) => {
          const params = getParamsWithCurrentLocation();
          if (v === "all") {
            params.delete("pais");
            params.delete("estado");
            params.delete("cidade");
          } else {
            params.set("pais", v);
            params.delete("estado");
            params.delete("cidade");
          }
          setSearchParams(params);
        }}
      >
        <SelectTrigger className="w-full h-9 text-sm">
          <SelectValue placeholder="Paí­s" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os paí­ses</SelectItem>
          {availableLocations.map((loc) => (
            <SelectItem key={loc.countryCode} value={loc.countryCode}>{loc.countryName}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCountryData && (
        <Select
          value={searchParams.get("estado") || "all"}
          onValueChange={(v) => {
            const params = getParamsWithCurrentLocation();
            if (v === "all") {
              params.delete("estado");
              params.delete("cidade");
            } else {
              params.set("estado", v);
              params.delete("cidade");
            }
            setSearchParams(params);
          }}
        >
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue placeholder="Estado/Província" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {selectedCountryData.states.map((s: any) => (
              <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedStateData && (
        <Select
          value={cityFilter || "all"}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams);
            if (v === "all") params.delete("cidade");
            else params.set("cidade", v);
            setSearchParams(params);
          }}
        >
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {selectedStateData.cities.map((city: string) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={radiusFilter || "50"}
        onValueChange={(v) => {
          const params = getParamsWithCurrentLocation();
          params.set("raio", v);
          setSearchParams(params);
        }}
      >
        <SelectTrigger className="w-full h-9 text-sm">
          <Navigation className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Distância" />
        </SelectTrigger>
        <SelectContent>
          {RADIUS_OPTIONS.map((radius) => (
            <SelectItem key={radius} value={String(radius)}>
              Até {radius} km
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" className="h-9 w-full justify-start text-muted-foreground" onClick={handleClearFilters}>
          <X className="w-4 h-4 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <img src="/logo.png" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-xl sm:text-2xl tracking-tight caramelo-text-gradient">Caramelinho</div>
                <div className="text-xs sm:text-sm font-semibold text-foreground/75">{"O SEU FARO FORA DO BRASIL"}</div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {session ? (
                <div className="flex items-center gap-2">
                  <Link to="/perfil?tab=mensagens" className="relative group">
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-secondary">
                      <MessageCircle className="w-4 h-4" />
                      {unreadMessages > 0 && (
                        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/perfil">
                    <Button variant="outline" size="sm" className="rounded-full border-border hover:bg-secondary gap-2 px-4">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="font-medium">{session.name.split(" ")[0]}</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/entrar">
                    <Button variant="ghost" size="sm" className="rounded-full">Entrar</Button>
                  </Link>
                  <Link to="/cadastro">
                    <Button size="sm" className="!rounded-xl px-5 caramelo-gradient text-white border-0">
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center bg-white rounded-xl border-2 border-border shadow-sm focus-within:ring-2 ring-primary/20 transition-all w-full overflow-visible">
            <SearchInputWithSuggestions
              value={searchInput}
              onChange={setSearchInput}
              suggestions={searchSuggestions}
              placeholder="Buscar por nome, serviço..."
              icon="search"
              onSubmit={(selectedValue) => {
                const nextValue = selectedValue ?? searchInput;
                const params = new URLSearchParams(searchParams);
                if (nextValue.trim()) params.set("q", nextValue.trim());
                else params.delete("q");
                setSearchParams(params);
              }}
              className="!h-12"
            />
            <div className="hidden lg:block w-px h-8 bg-border" />
            <SearchInputWithSuggestions
              value={locationInput}
              onChange={setLocationInput}
              suggestions={citySuggestions}
              placeholder="Onde? Cidade, bairro ou endereço"
              icon="location"
              onSubmit={(selectedValue, meta) => {
                const nextValue = selectedValue ?? locationInput;
                setLocationInput(nextValue);
                const params = new URLSearchParams(searchParams);
                if (nextValue.trim()) {
                  params.set("local", nextValue.trim());
                  params.set("cidade", nextValue.trim());
                  // A cidade da barra principal nao deve impor filtros administrativos,
                  // pois o cadastro historico pode usar codigos diferentes (ex.: lau vs qc).
                  params.delete("pais");
                  params.delete("estado");
                  params.delete("categoria");
                  params.delete("brasileiro");
                  params.delete("portugues");
                  if (typeof meta?.lat === "number" && typeof meta?.lng === "number") {
                    params.set("origem_lat", String(meta.lat));
                    params.set("origem_lng", String(meta.lng));
                    params.set("origem_local", nextValue.trim());
                  } else {
                    params.delete("origem_lat");
                    params.delete("origem_lng");
                    params.delete("origem_local");
                  }
                } else {
                  params.delete("local");
                  params.delete("cidade");
                  params.delete("raio");
                  params.delete("origem_lat");
                  params.delete("origem_lng");
                  params.delete("origem_local");
                }
                setSearchParams(params);
              }}
              className="!h-12"
            />
            <div className="p-2">
              <Button type="submit" size="sm" className="caramelo-gradient text-white border-0 w-full lg:w-auto !rounded-xl">
                Farejar
              </Button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between gap-2 mb-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLocateMe} className="h-9" disabled={locatingMe}>
              <Navigation className="w-4 h-4 mr-1" />
              {locatingMe ? "Localizando..." : "Me localizar"}
            </Button>
            <Button variant={showMap ? "default" : "outline"} size="sm" onClick={() => setShowMap(true)} className="h-9">
              <MapIcon className="w-4 h-4 mr-1" />
              Mapa
            </Button>
            <Button variant={!showMap ? "default" : "outline"} size="sm" onClick={() => setShowMap(false)} className="h-9">
              <List className="w-4 h-4 mr-1" />
              Lista
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {results.length} negacio{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
          {query && <> para "<strong>{query}</strong>"</>}
          {locationFilter && <> perto de <strong>{locationFilter}</strong></>}
          {effectiveRadiusKm && <> em ata <strong>{effectiveRadiusKm} km</strong></>}
          {effectiveRadiusKm && !distanceOrigin && !resolvingLocation && <> informe um local ou permita sua localização para usar raio</>}
          {resolvingLocation && <> localizando referência...</>}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-4">
              {renderFilterControls()}
            </div>
          </aside>

          <div>
            {results.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                  <PawPrint className="w-14 h-14 text-muted-foreground/25 mx-auto lg:mx-0 shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-2">Nenhum resultado encontrado</h2>
                    <p className="text-muted-foreground mb-6">{emptyStateMessage}</p>
                    <div className="flex flex-col sm:flex-row gap-3 lg:justify-start justify-center">
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={handleClearFilters}>
                          <X className="w-4 h-4 mr-2" />
                          Limpar filtros
                        </Button>
                      )}
                      <Button onClick={() => navigate("/")}>
                        <PawPrint className="w-4 h-4 mr-2" />
                        Voltar ao Início
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <>
            {showMap && (
              <div className="mb-8 rounded-xl overflow-hidden border border-border h-[400px]">
                <MapView
                  businesses={results}
                  center={
                    distanceOrigin
                      ? distanceOrigin
                      : results.length > 0
                      ? { lat: results[0].address.lat, lng: results[0].address.lng }
                      : { lat: 45.5, lng: -73.6 }
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map((biz) => (
                <Link key={biz.id} to={buildBusinessUrl(biz)} className="group h-full">
                  <Card className="overflow-hidden border-border card-hover h-full">
                    <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                      <img
                        src={biz.heroImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"}
                        alt={biz.name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                      <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground border-0">
                        {biz.category.split("(")[0].trim()}
                      </Badge>
                      {biz.averageRating > 0 && (
                        <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-0 gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {biz.averageRating.toFixed(1)}
                        </Badge>
                      )}
                      {distanceOrigin && (
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {getDistanceLabel(biz)}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        {biz.logoUrl && (
                          <img src={biz.logoUrl} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-border" />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors leading-tight">
                            {biz.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {biz.address.city}, {biz.address.country}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">{biz.description}</p>
                      {biz.services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {biz.services.slice(0, 3).map((svc) => (
                            <span key={svc} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {svc}
                            </span>
                          ))}
                          {biz.services.length > 3 && (
                            <span className="text-[11px] text-muted-foreground font-medium flex items-center">+ {biz.services.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            </>
            )}
          </div>
        </div>

        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filtros</DialogTitle>
            </DialogHeader>
            {renderFilterControls()}
          </DialogContent>
        </Dialog>
      </div>
      <SiteFooter />
    </div>
  );
}

function matchesCategoryFilter(category: string, filter: string): boolean {
  const normalizedCategory = normalizeText(getCategoryLabel(category));
  const terms = CATEGORY_FILTER_ALIASES[normalizeText(filter)] || [filter];

  return terms.some((term) => normalizedCategory.includes(normalizeText(term)));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cityMatches(businessCity: string, selectedCity: string): boolean {
  const normalizedBusinessCity = normalizeText(businessCity);
  const normalizedSelectedCity = normalizeText(selectedCity);
  if (!normalizedBusinessCity || !normalizedSelectedCity) return false;

  return (
    normalizedBusinessCity === normalizedSelectedCity ||
    normalizedBusinessCity.includes(normalizedSelectedCity) ||
    normalizedSelectedCity.includes(normalizedBusinessCity)
  );
}

function getBusinessSearchBlob(b: BusinessFrontend): string {
  const menuText = (b.menu || [])
    .map((item) => `${item?.name || ""} ${item?.description || ""}`)
    .join(" ");

  return normalizeText(
    [
      b.name || "",
      b.description || "",
      b.category || "",
      b.address?.city || "",
      ...(b.services || []),
      ...(b.keywords || []),
      menuText,
    ].join(" ")
  );
}

function matchesBusinessTextQuery(b: BusinessFrontend, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const blob = getBusinessSearchBlob(b);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return terms.every((term) => blob.includes(term));
}
































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
  dentista: ["Sa\u00fade & Beleza", "Cl\u00ednica Dental", "Odontologia", "Dente"],
  mecanico: ["Servi\u00e7os Automotivos", "Oficina", "Centro Automotivo", "Carro", "Auto"],
  mecanica: ["Servi\u00e7os Automotivos", "Oficina", "Centro Automotivo", "Carro", "Auto"],
  comida: ["Alimenta\u00e7\u00e3o", "Restaurante", "Lanche", "Marmita"],
  restaurante: ["Alimenta\u00e7\u00e3o"],
  padaria: ["Alimenta\u00e7\u00e3o"],
  doce: ["Alimenta\u00e7\u00e3o", "Confeitaria"],
  advogado: ["Advocacia & Consultoria", "Jur\u00eddico", "Lei"],
  tradutor: ["Advocacia & Consultoria", "Tradu\u00e7\u00e3o", "Imigra\u00e7\u00e3o"],
  traducao: ["Advocacia & Consultoria", "Tradu\u00e7\u00e3o", "Imigra\u00e7\u00e3o"],
  tradu\u00e7\u00e3o: ["Advocacia & Consultoria", "Tradu\u00e7\u00e3o", "Imigra\u00e7\u00e3o"],
  imigracao: ["Advocacia & Consultoria", "Imigra\u00e7\u00e3o", "Visto"],
  imigra\u00e7\u00e3o: ["Advocacia & Consultoria", "Imigra\u00e7\u00e3o", "Visto"],
  obra: ["Constru\u00e7\u00e3o & Reformas"],
  reforma: ["Constru\u00e7\u00e3o & Reformas"],
  pintor: ["Constru\u00e7\u00e3o & Reformas"],
  casa: ["Constru\u00e7\u00e3o & Reformas", "Imobili\u00e1ria"],
  aluguel: ["Imobili\u00e1ria"],
  venda: ["Com\u00e9rcio & Varejo", "Imobili\u00e1ria"],
  medico: ["Sa\u00fade & Beleza"],
  m\u00e9dico: ["Sa\u00fade & Beleza"],
  unha: ["Sa\u00fade & Beleza", "Manicure"],
  cabelo: ["Sa\u00fade & Beleza", "Cabeleireiro"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Alimenta\u00e7\u00e3o (Restaurantes, Padarias, Caf\u00e9s)": ["restaurante", "lanchonete", "lanches", "padaria", "comida", "gastronomia", "caf\u00e9", "almo\u00e7o", "jantar", "marmita"],
  "Servi\u00e7os Automotivos": ["mecanico", "oficina", "carro", "conserto", "pneu", "\u00f3leo", "auto", "manuten\u00e7\u00e3o", "reparo"],
  "Sa\u00fade & Beleza": ["dentista", "m\u00e9dico", "cl\u00ednica", "est\u00e9tica", "sal\u00e3o", "cabelo", "unha", "manicure", "pedicure", "terapia", "psic\u00f3logo"],
  "Constru\u00e7\u00e3o & Reformas": ["obra", "reforma", "pintor", "pedreiro", "eletricista", "encanador", "casa", "apartamento", "telhado"],
  "Advocacia & Consultoria": ["advogado", "jur\u00eddico", "lei", "processo", "visto", "imigra\u00e7\u00e3o", "consultor", "tradutor", "tradu\u00e7\u00e3o", "traducoes", "tradu\u00e7\u00f5es", "documentos"],
  "Contabilidade & Finan\u00e7as": ["contador", "imposto", "tax", "finan\u00e7as", "investimento", "dinheiro", "empresa"],
  "Educa\u00e7\u00e3o & Idiomas": ["escola", "curso", "professor", "aula", "ingl\u00eas", "franc\u00eas", "portugu\u00eas", "aprendizado"],
  "Tecnologia & TI": ["programador", "software", "computador", "celular", "site", "desenvolvimento", "suporte"],
  "Com\u00e9rcio & Varejo": ["loja", "venda", "produto", "mercado", "roupa", "acess\u00f3rios"],
  "Transporte & Mudan\u00e7a": ["mudan\u00e7a", "frete", "entrega", "log\u00edstica", "caminh\u00e3o", "envio"],
  "Servi\u00e7os para Pets": ["pet", "pets", "cachorro", "gato", "banho", "tosa", "veterinario", "veterin\u00e1rio"],
  "Cuidados Infantis e de Idosos": ["bab\u00e1", "baba", "babysitter", "acompanhante", "cuidadora", "cuidador", "crian\u00e7a", "crian\u00e7as"],
  "Diaristas": ["diarista", "diaristas", "faxina", "limpeza", "limpar", "casa"],
  "Imobili\u00e1ria": ["casa", "apartamento", "aluguel", "venda", "im\u00f3vel", "corretor"],
  "Turismo & Viagens": ["viagem", "passagem", "hotel", "turismo", "guia", "excursao"],
};

const CATEGORY_FILTER_ALIASES: Record<string, string[]> = {
  [normalizeText("Alimenta\u00e7\u00e3o")]: ["Alimenta\u00e7\u00e3o", "Alimentacao"],
  [normalizeText("Alimenta\u00e7\u00e3o (Restaurantes, Padarias, Caf\u00e9s)")]: ["Alimenta\u00e7\u00e3o", "Alimentacao"],
  [normalizeText("Sa\u00fade & Beleza")]: ["Sa\u00fade & Beleza", "Saude e Beleza"],
  [normalizeText("Saude e Beleza")]: ["Sa\u00fade & Beleza", "Saude e Beleza"],
  [normalizeText("Automotivo")]: ["Automotivo", "Servi\u00e7os Automotivos", "Servicos Automotivos"],
  [normalizeText("Servi\u00e7os Automotivos")]: ["Automotivo", "Servi\u00e7os Automotivos", "Servicos Automotivos"],
  [normalizeText("Constru\u00e7\u00e3o")]: ["Constru\u00e7\u00e3o", "Construcao", "Constru\u00e7\u00e3o & Reformas", "Construcao & Reformas"],
  [normalizeText("Constru\u00e7\u00e3o & Reformas")]: ["Constru\u00e7\u00e3o", "Construcao", "Constru\u00e7\u00e3o & Reformas", "Construcao & Reformas"],
  [normalizeText("Advocacia")]: ["Advocacia", "Advocacia & Consultoria"],
  [normalizeText("Advocacia & Consultoria")]: ["Advocacia", "Advocacia & Consultoria"],
  [normalizeText("Educa\u00e7\u00e3o")]: ["Educa\u00e7\u00e3o", "Educacao", "Educa\u00e7\u00e3o & Idiomas", "Educacao & Idiomas"],
  [normalizeText("Educa\u00e7\u00e3o & Idiomas")]: ["Educa\u00e7\u00e3o", "Educacao", "Educa\u00e7\u00e3o & Idiomas", "Educacao & Idiomas"],
  [normalizeText("Transporte & Mudan\u00e7a")]: ["Transporte & Mudan\u00e7a", "Transporte & Mudanca", "Transporte & Mudancas"],
  [normalizeText("Transporte & Mudancas")]: ["Transporte & Mudan\u00e7a", "Transporte & Mudanca", "Transporte & Mudancas"],
  [normalizeText("Servi\u00e7os para Pets")]: ["Servi\u00e7os para Pets", "Servicos para Pets", "Pet", "Pets"],
  [normalizeText("Cuidados Infantis e de Idosos")]: ["Cuidados Infantis e de Idosos", "Cuidados Infantis e de Idosos", "Babas & Acompanhantes", "Babas & Acompanhantes", "Baba", "Baba", "Acompanhante", "Cuidadora", "Cuidador", "Idosos", "Infantil"],
  [normalizeText("Diaristas")]: ["Diaristas", "Diarista", "Faxina", "Limpeza"],
};

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 250];

const CATEGORY_SEO_TEXT: Record<string, string> = {
  "Alimenta\u00e7\u00e3o (Restaurantes, Padarias, Caf\u00e9s)": "restaurantes, padarias e caf\u00e9s",
  "Servi\u00e7os Automotivos": "oficinas e servi\u00e7os automotivos",
  "Sa\u00fade & Beleza": "servi\u00e7os de sa\u00fade e beleza",
  "Constru\u00e7\u00e3o & Reformas": "servi\u00e7os de constru\u00e7\u00e3o e reformas",
  "Advocacia & Consultoria": "advocacia, tradu\u00e7\u00f5es e consultoria de imigra\u00e7\u00e3o",
  "Contabilidade & Finan\u00e7as": "contabilidade e finan\u00e7as",
  "Educa\u00e7\u00e3o & Idiomas": "educa\u00e7\u00e3o e idiomas",
  "Tecnologia & TI": "tecnologia e TI",
  "Com\u00e9rcio & Varejo": "com\u00e9rcio e varejo",
  "Transporte & Mudan\u00e7a": "transporte e mudan\u00e7a",
  "Servi\u00e7os para Pets": "servi\u00e7os para pets",
  "Cuidados Infantis e de Idosos": "cuidados infantis e de idosos",
  "Diaristas": "diaristas e servi\u00e7os de limpeza",
  "Imobili\u00e1ria": "imobili\u00e1rias e corretores",
  "Turismo & Viagens": "turismo e viagens",
  "Outros": "servi\u00e7os diversos",
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
      return `N\u00E3o encontramos resultados ${parts.join(" ")}.`;
    }

    return "O Caramelinho n\u00E3o achou nada com esses crit\u00E9rios.";
  }, [categoryFilter, cityFilter, locationFilter]);


  useEffect(() => {
    const baseTitle = "Buscar neg\u00f3cios brasileiros";
    const cityText = cityFilter ? ` em ${cityFilter}` : "";
    const categoryText = categoryFilter ? (CATEGORY_SEO_TEXT[categoryFilter] || categoryFilter.toLowerCase()) : "neg\u00f3cios e servi\u00e7os";
    const queryPart = query ? ` para ${query}` : "";

    setSeoMeta(
      `${baseTitle}${cityText} | Caramelinho.com`,
      `Encontre ${categoryText}${cityText}${queryPart}. Compare op\u00e7\u00f5es perto de voc\u00ea e fale direto com os neg\u00f3cios.`
    );
  }, [query, categoryFilter, cityFilter]);

  const results = useMemo(() => {
    let filtered = allBusinesses;
    const baseBusinesses = allBusinesses;

    if (query) {
      const q = query.toLowerCase();
      // Buscar sinanimos e palavras-chave da categoria
      const relatedTerms = SEARCH_SYNONYMS[q] || [];
      
      filtered = filtered.filter(
        (b) => {
          const catKeywords = CATEGORY_KEYWORDS[b.category] || [];
          
          return (
            b.name.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q) ||
            b.services.some((s) => s.toLowerCase().includes(q)) ||
            b.keywords?.some((k) => k.toLowerCase().includes(q)) ||
            b.address.city.toLowerCase().includes(q) ||
            // Checar contra palavras-chave automaticas da categoria
            catKeywords.some(kw => kw.toLowerCase().includes(q)) ||
            // Checar contra o mapa de sinanimos (termo buscado -> termos relacionados)
            relatedTerms.some(term => 
              b.category.toLowerCase().includes(term.toLowerCase()) ||
              b.name.toLowerCase().includes(term.toLowerCase()) ||
              b.keywords?.some(k => k.toLowerCase().includes(term.toLowerCase()))
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

    // Expans?o progressiva quando zera: 50km (padr?o) -> 150km -> estado/prov?ncia.
    if (filtered.length === 0 && distanceOrigin && hasLocationContext && !radiusKm) {
      const baseScoped = baseBusinesses.filter((b) => {
        const passesQuery = !query || (
          b.name.toLowerCase().includes(query.toLowerCase()) ||
          b.description.toLowerCase().includes(query.toLowerCase()) ||
          b.category.toLowerCase().includes(query.toLowerCase()) ||
          b.services.some((sv) => sv.toLowerCase().includes(query.toLowerCase())) ||
          b.keywords?.some((k) => k.toLowerCase().includes(query.toLowerCase()))
        );
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
        window.alert("Localiza\u00e7\u00e3o exata bloqueada. Usei localiza\u00e7\u00e3o aproximada por IP.");
        return;
      }
      if (!window.isSecureContext) {
        window.alert("Geolocaliza\u00e7\u00e3o exige contexto seguro. Abra em localhost ou HTTPS.");
        return;
      }
      if (geoError?.code === 1) {
        window.alert("Permiss\u00e3o de localiza\u00e7\u00e3o negada pelo navegador/dispositivo.");
        return;
      }
      if (geoError?.code === 2) {
        window.alert("Localizaaao indisponavel no momento. Tente novamente em alguns segundos.");
        return;
      }
      if (geoError?.code === 3) {
        window.alert("Tempo esgotado para obter localiza\u00e7\u00e3o. Tente novamente.");
        return;
      }
      window.alert("N\u00e3o consegui acessar sua localiza\u00e7\u00e3o. Verifique bloqueadores/extens\u00f5es e permiss\u00f5es do navegador.");
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
               {cat.startsWith("Advocacia & Consultoria") ? "Advocacia & TraduÃ§Ãµes" : cat.split("(")[0].trim()}
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
          <SelectValue placeholder="PaÃ­s" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os paÃ­ses</SelectItem>
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
            <SelectValue placeholder="Estado/ProvÃ­ncia" />
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
          <SelectValue placeholder="DistÃ¢ncia" />
        </SelectTrigger>
        <SelectContent>
          {RADIUS_OPTIONS.map((radius) => (
            <SelectItem key={radius} value={String(radius)}>
              AtÃ© {radius} km
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
              placeholder="Buscar por nome, serviÃ§o..."
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
              placeholder="Onde? Cidade, bairro ou endereÃ§o"
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
          {effectiveRadiusKm && !distanceOrigin && !resolvingLocation && <> informe um local ou permita sua localiza\u00e7\u00e3o para usar raio</>}
          {resolvingLocation && <> localizando refer\u00eancia...</>}
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
                        Voltar ao Inacio
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




































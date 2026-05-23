import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useRef } from "react";
import { MapPin, Star, SlidersHorizontal, PawPrint, Map as MapIcon, List, MessageCircle, X, Navigation, User, Lock, CalendarDays, Ticket, PartyPopper, Leaf, WheatOff, ChevronLeft, ChevronRight } from "lucide-react";
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
  getBusinessesByRadiusRpc,
  buildBusinessUrl, 
  BUSINESS_CATEGORIES, 
  getCategoryLabel,
  getCategoryId,
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
import { getPublishedCommunityEvents } from "@/services/events";
import { getCategorySynonymsConfig, getGlobalCategorySynonymsConfig } from "@/services/searchPreferences";
import type { CommunityEvent } from "@/types/database";
import { buildCityAliases, cityMatches, filterBusinesses, normalizeText } from "@/lib/search/businessSearch";
import { buildEventResults } from "@/lib/search/eventSearch";

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
const RESULTS_PER_PAGE = 6;
const STRICT_SEARCH_MODE = (import.meta.env.VITE_STRICT_SEARCH_MODE ?? "1") !== "0";
const STRICT_SEARCH_MIN_SCORE = Number(import.meta.env.VITE_STRICT_SEARCH_MIN_SCORE ?? "3");
const SEARCH_BACKEND = (import.meta.env.VITE_SEARCH_BACKEND ?? "client").toLowerCase();

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

// Equivalências de cidades para busca multilíngue (pt/en e variações comuns).
const CITY_ALIAS_GROUPS: string[][] = [
  // América do Norte
  ["montreal", "montréal", "montreal city"],
  ["quebec", "québec", "cidade de quebec", "quebec city"],
  ["toronto"],
  ["vancouver"],
  ["calgary"],
  ["edmonton"],
  ["ottawa", "otava"],
  ["winnipeg"],
  ["halifax"],
  ["victoria"],
  ["new york", "nova york", "nyc"],
  ["los angeles", "los angeles", "la"],
  ["san francisco", "sao francisco", "são francisco"],
  ["washington", "washington dc"],
  ["miami"],
  ["orlando"],
  ["boston"],
  ["chicago"],
  ["seattle"],
  ["houston"],
  ["dallas"],
  ["las vegas"],
  ["philadelphia", "filadelfia", "filadélfia"],
  ["mexico city", "cidade do mexico", "cidade do méxico", "ciudad de mexico", "ciudad de méxico"],
  ["guadalajara"],
  ["monterrey"],
  ["tijuana"],
  // América do Sul
  ["sao paulo", "são paulo"],
  ["rio de janeiro"],
  ["belo horizonte"],
  ["brasilia", "brasília"],
  ["curitiba"],
  ["porto alegre"],
  ["salvador"],
  ["recife"],
  ["fortaleza"],
  ["manaus"],
  ["bogota", "bogotá", "bogota d.c"],
  ["medellin", "medellín"],
  ["cali"],
  ["buenos aires"],
  ["cordoba", "córdoba"],
  ["rosario"],
  ["santiago"],
  ["valparaiso", "valparaíso"],
  ["lima"],
  ["arequipa"],
  ["quito"],
  ["guayaquil"],
  ["montevideo"],
  ["asuncion", "asunción"],
  ["la paz"],
  ["santa cruz de la sierra", "santa cruz"],
  ["caracas"],
  // Europa
  ["london", "londres"],
  ["manchester"],
  ["birmingham"],
  ["dublin", "dublim"],
  ["lisbon", "lisboa"],
  ["porto", "oporto"],
  ["madrid"],
  ["barcelona"],
  ["seville", "sevilla", "sevilha"],
  ["valencia", "valência"],
  ["paris", "paris"],
  ["lyon", "lião", "lyon"],
  ["marseille", "marselha"],
  ["brussels", "bruxelas", "brussel", "bruxelles"],
  ["amsterdam", "amsterda", "amsterdã"],
  ["rotterdam", "rotterda", "rotterdam"],
  ["berlin", "berlim"],
  ["munich", "munique", "muenchen", "münchen"],
  ["frankfurt", "frankfurt am main"],
  ["hamburg", "hamburgo"],
  ["cologne", "koln", "köln", "colonia", "colônia"],
  ["vienna", "viena", "wien"],
  ["zurich", "zuerich", "zürich", "zurique"],
  ["geneva", "genebra", "genève"],
  ["rome", "roma"],
  ["milan", "milao", "milão", "milano"],
  ["naples", "napoli", "nápoles"],
  ["venice", "venezia", "veneza", "veneza"],
  ["athens", "atenas"],
  ["thessaloniki", "salonica", "salônica"],
  ["warsaw", "varsovia", "varsóvia", "warszawa"],
  ["prague", "praga", "praha"],
  ["budapest", "budapeste"],
  ["bucharest", "bucareste", "bucuresti", "bucurești"],
  ["copenhagen", "copenhague", "kobenhavn", "københavn"],
  ["stockholm", "estocolmo"],
  ["oslo"],
  ["helsinki", "helsinquia", "helsínquia"],
  ["reykjavik", "reiquiavique", "reykjavík"],
  ["moscow", "moscou", "moskva"],
  ["saint petersburg", "sao petersburgo", "são petersburgo", "sankt-peterburg"],
  ["istanbul", "istambul"],
  // Ásia
  ["tokyo", "toquio", "tóquio"],
  ["kyoto", "quioto", "kyoto-shi"],
  ["osaka"],
  ["nagoya"],
  ["sapporo"],
  ["fukuoka"],
  ["hiroshima"],
  ["seoul", "seul"],
  ["busan", "pusan"],
  ["incheon", "incheon"],
  ["beijing", "pequim"],
  ["shanghai", "xangai"],
  ["guangzhou", "cantao", "cantão"],
  ["shenzhen"],
  ["hong kong", "hong kong", "hong kong sar"],
  ["macau", "macao", "macau sar"],
  ["taipei", "taipé"],
  ["kaohsiung"],
  ["singapore", "singapura"],
  ["bangkok", "banguecoque"],
  ["kuala lumpur"],
  ["jakarta"],
  ["bali", "denpasar"],
  ["manila"],
  ["ho chi minh city", "cidade de ho chi minh", "saigon", "saigao", "saigão"],
  ["hanoi", "hanói", "hanoi"],
  ["phnom penh", "pnom penh"],
  ["yangon", "rangum"],
  ["new delhi", "nova delhi", "delhi"],
  ["mumbai", "bombaim"],
  ["bangalore", "bengaluru", "bangalore"],
  ["chennai", "madras"],
  ["kolkata", "calcuta"],
  ["hyderabad"],
  ["karachi"],
  ["lahore"],
  ["islamabad"],
  ["dubai", "dubai"],
  ["abu dhabi", "abu dabi", "abu dhabi"],
  ["doha"],
  ["riyadh", "riad"],
  ["jeddah", "jedah"],
  ["tel aviv", "tel avive"],
  ["jerusalem", "jerusalem", "jerusalém"],
  ["tehran", "teera", "teerã", "tehran"],
  // Oceania
  ["sydney", "sidney", "sidnei"],
  ["melbourne", "melburne"],
  ["brisbane"],
  ["perth"],
  ["adelaide"],
  ["auckland"],
  ["wellington"],
  ["christchurch"],
  // África
  ["cairo", "cairo"],
  ["alexandria", "alexandria", "alexandria"],
  ["casablanca"],
  ["rabat"],
  ["marrakesh", "marrakech", "marraquexe"],
  ["algiers", "argel", "alger"],
  ["tunis", "tunis", "tunis"],
  ["lagos"],
  ["abuja"],
  ["nairobi"],
  ["addis ababa", "adis abeba"],
  ["johannesburg", "joanesburgo"],
  ["cape town", "cidade do cabo", "cidade do cabo"],
  ["durban"],
  ["luanda"],
  ["maputo"],
];

const CITY_ALIASES: Record<string, string[]> = buildCityAliases(CITY_ALIAS_GROUPS);

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
  const autoRadiusFilter = searchParams.get("auto_raio") || "";
  const eventsFilter = searchParams.get("eventos") || "";
  const pageParam = Number(searchParams.get("pagina") || "1");
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const isEventMode = eventsFilter === "1";
  const originLatParam = searchParams.get("origem_lat") || "";
  const originLngParam = searchParams.get("origem_lng") || "";
  const originLocalParam = searchParams.get("origem_local") || "";
  const originSourceParam = searchParams.get("origem_source") || "";
  const radiusKm = radiusFilter ? Number(radiusFilter) : null;
  const isAutoRadiusMode = autoRadiusFilter === "1";
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
  const [approxCoords, setApproxCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [locatingMe, setLocatingMe] = useState(false);
  const [geoLookupComplete, setGeoLookupComplete] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [categorySynonymsMap, setCategorySynonymsMap] = useState<Record<string, string[]>>(
    getCategorySynonymsConfig()
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const [rpcTotalCount, setRpcTotalCount] = useState<number | null>(null);
  const effectivePage = currentPage;

  const canUseRpcRadiusMode = useMemo(() => {
    const initialRadius = radiusFilter ? Number(radiusFilter) : null;
    const initialLat = Number(originLatParam);
    const initialLng = Number(originLngParam);
    const cityContext = (cityFilter || locationFilter || "").trim();
    const normalizedCityContext = normalizeText(cityContext);
    const normalizedOriginLocal = normalizeText(originLocalParam || "");
    const hasCityContext = !!normalizedCityContext;
    const hasCityAlignedOrigin =
      hasCityContext &&
      originSourceParam === "city" &&
      normalizedOriginLocal === normalizedCityContext;
    return (
      SEARCH_BACKEND === "rpc" &&
      !isEventMode &&
      Number.isFinite(initialLat) &&
      Number.isFinite(initialLng) &&
      !!initialRadius &&
      initialRadius > 0 &&
      (!hasCityContext || hasCityAlignedOrigin)
    );
  }, [
    radiusFilter,
    originLatParam,
    originLngParam,
    cityFilter,
    locationFilter,
    originLocalParam,
    originSourceParam,
    isEventMode,
  ]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const initialRadius = radiusFilter ? Number(radiusFilter) : null;
        const initialLat = Number(originLatParam);
        const initialLng = Number(originLngParam);
        const canUseRpcRadius = canUseRpcRadiusMode;
        const rpcCityFilter =
          canUseRpcRadius
            ? undefined // com raio, cidade é origem; não deve restringir só à cidade
            : ((cityFilter || locationFilter) || undefined);

        const pageForRpc = Math.max(1, currentPage);
        const offset = (pageForRpc - 1) * RESULTS_PER_PAGE;

        const businessesPromise = canUseRpcRadius
          ? getBusinessesByRadiusRpc({
              originLat: initialLat,
              originLng: initialLng,
              radiusKm: initialRadius as number,
              limit: RESULTS_PER_PAGE,
              offset,
              categoryId: categoryFilter ? getCategoryId(categoryFilter) : undefined,
              countryCode: countryFilter || undefined,
              stateCode: stateFilter || undefined,
              query: query || undefined,
              city: rpcCityFilter,
            })
          : getAllBusinesses();

        const [businessesRes, locationsRes, suggestionsRes, eventsRes] = await Promise.allSettled([
          businessesPromise,
          getAvailableLocations(),
          getSearchSuggestions(),
          getPublishedCommunityEvents(),
        ]);

        if (businessesRes.status === "fulfilled") {
          if (canUseRpcRadius) {
            setAllBusinesses(businessesRes.value.items);
            setRpcTotalCount(businessesRes.value.totalCount);
          } else {
            setAllBusinesses(businessesRes.value);
            setRpcTotalCount(null);
          }
        } else if (canUseRpcRadius) {
          const fallbackBusinesses = await getAllBusinesses();
          setAllBusinesses(fallbackBusinesses);
          setRpcTotalCount(null);
        } else {
          setRpcTotalCount(null);
        }

        if (locationsRes.status === "fulfilled") {
          const locations = locationsRes.value;
          setAvailableLocations(locations);
          const cities = new Set<string>();
          locations.forEach((l) => {
            l.states.forEach((s: any) => {
              s.cities.forEach((c: string) => cities.add(c));
            });
          });
          setCitySuggestions(Array.from(cities));
        }

        if (suggestionsRes.status === "fulfilled") {
          setSearchSuggestions(suggestionsRes.value);
        }

        if (eventsRes.status === "fulfilled") {
          setCommunityEvents(eventsRes.value);
        }
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitialData();
  }, [radiusFilter, originLatParam, originLngParam, originLocalParam, originSourceParam, categoryFilter, countryFilter, stateFilter, query, cityFilter, locationFilter, currentPage, canUseRpcRadiusMode]);

  // Geolocalização em segundo plano: não deve bloquear a renderização inicial dos resultados.
  useEffect(() => {
    let cancelled = false;
    setGeoLookupComplete(false);
    (async () => {
      const coords = await getCurrentPosition();
      if (cancelled) return;
      if (coords) {
        setUserCoords(coords);
        setGeoLookupComplete(true);
        return;
      }
      const approx = await getApproxPositionByIp();
      if (cancelled) return;
      if (approx) setApproxCoords(approx);
      setGeoLookupComplete(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAutoRadiusMode || originLatParam || originLngParam || hasLocationContext) return;
    if (!userCoords) return;

    const params = new URLSearchParams(searchParams);
    params.set("origem_lat", String(userCoords.lat));
    params.set("origem_lng", String(userCoords.lng));
    params.set("origem_source", "gps");
    params.set("raio", radiusFilter || "50");
    setSearchParams(params, { replace: true });
  }, [
    isAutoRadiusMode,
    originLatParam,
    originLngParam,
    hasLocationContext,
    userCoords,
    searchParams,
    setSearchParams,
    radiusFilter,
  ]);

  useEffect(() => {
    if (!isAutoRadiusMode || hasLocationContext || userCoords || !geoLookupComplete) {
      return;
    }

    if (originSourceParam === "gps" || originSourceParam === "ip") {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.delete("auto_raio");
    params.delete("raio");
    setSearchParams(params, { replace: true });
  }, [
    isAutoRadiusMode,
    hasLocationContext,
    userCoords,
    geoLookupComplete,
    originSourceParam,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    let alive = true;
    getGlobalCategorySynonymsConfig().then((cfg) => {
      if (alive) setCategorySynonymsMap(cfg);
    });
    const sync = () => setCategorySynonymsMap(getCategorySynonymsConfig());
    window.addEventListener("storage", sync);
    return () => {
      alive = false;
      window.removeEventListener("storage", sync);
    };
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
      (biz) => cityMatches(biz.address.city, cityFilter, CITY_ALIASES)
    );
    if (matching.length === 0) return null;

    return {
      lat: matching.reduce((sum, biz) => sum + biz.address.lat, 0) / matching.length,
      lng: matching.reduce((sum, biz) => sum + biz.address.lng, 0) / matching.length,
    };
  }, [allBusinesses, cityFilter]);

  const resolveCoordsFromBusinesses = useCallback((cityText: string) => {
    const term = cityText.trim();
    if (!term) return null;
    const matching = allBusinesses.filter((biz) => cityMatches(biz.address.city, term, CITY_ALIASES));
    if (matching.length === 0) return null;
    return {
      lat: matching.reduce((sum, biz) => sum + biz.address.lat, 0) / matching.length,
      lng: matching.reduce((sum, biz) => sum + biz.address.lng, 0) / matching.length,
    };
  }, [allBusinesses]);

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

  const approximateMapCoords = useMemo(() => {
    const lat = Number(originLatParam);
    const lng = Number(originLngParam);
    if (originSourceParam !== "ip") return approxCoords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return approxCoords;
    return { lat, lng };
  }, [originLatParam, originLngParam, originSourceParam, approxCoords]);

  useEffect(() => {
    setLocationCoords(matchedLocationCoords);
    setResolvingLocation(false);
  }, [matchedLocationCoords]);

  // Regra de prioridade para distancia:
  // 1) Se o usuario definiu cidade, usamos apenas essa referencia (sem fallback para GPS).
  // 2) Se não definiu cidade, usamos a localizacao atual do usuario.
  const hasTypedLocation = !!locationFilter.trim();
  const distanceOrigin = hasTypedLocation
    ? (selectedOriginCoords || locationCoords)
    : (selectedOriginCoords || userCoords);
  const isResolvingDistanceOrigin = !!effectiveRadiusKm && !distanceOrigin && !hasTypedLocation && !geoLookupComplete;
  const hasActiveFilters = !!(query || categoryFilter || cityFilter || countryFilter || stateFilter || radiusFilter || eventsFilter);
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
    return filterBusinesses({
      allBusinesses,
      query,
      categoryFilter,
      cityFilter,
      locationFilter,
      countryFilter,
      stateFilter,
      eventsFilter,
      radiusKm,
      effectiveRadiusKm,
      hasLocationContext,
      hasTypedLocation,
      distanceOrigin,
      categorySynonymsMap,
      searchSynonyms: SEARCH_SYNONYMS,
      categoryKeywords: CATEGORY_KEYWORDS,
      categoryFilterAliases: CATEGORY_FILTER_ALIASES,
      cityAliases: CITY_ALIASES,
      strictSearchMode: STRICT_SEARCH_MODE,
      strictSearchMinScore: STRICT_SEARCH_MIN_SCORE,
      getCategoryLabel,
    });
  }, [query, categoryFilter, cityFilter, locationFilter, countryFilter, stateFilter, radiusKm, effectiveRadiusKm, hasLocationContext, allBusinesses, distanceOrigin, eventsFilter, categorySynonymsMap]);

  const mapCenter =
    distanceOrigin ||
    userCoords ||
    approximateMapCoords ||
    (results.length > 0 && results[0].address?.lat && results[0].address?.lng
      ? { lat: results[0].address.lat, lng: results[0].address.lng }
      : { lat: 45.5, lng: -73.6 });

  const eventResults = useMemo(() => {
    return buildEventResults({
      isEventMode,
      query,
      results,
      communityEvents,
      allBusinesses,
    });
  }, [isEventMode, results, communityEvents, query, allBusinesses]);

  const totalResults = isEventMode
    ? eventResults.length
    : canUseRpcRadiusMode && rpcTotalCount !== null
    ? rpcTotalCount
    : results.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));
  const safeCurrentPage = Math.min(effectivePage, totalPages);
  const pageStart = (safeCurrentPage - 1) * RESULTS_PER_PAGE;
  const pageEnd = pageStart + RESULTS_PER_PAGE;

  const paginatedBusinesses = useMemo(
    () => (canUseRpcRadiusMode ? results : results.slice(pageStart, pageEnd)),
    [results, pageStart, pageEnd, canUseRpcRadiusMode]
  );

  const paginatedEvents = useMemo(
    () => eventResults.slice(pageStart, pageEnd),
    [eventResults, pageStart, pageEnd]
  );

  useEffect(() => {
    if (initialLoading) return;
    if (canUseRpcRadiusMode && rpcTotalCount === null) return;
    if (safeCurrentPage === effectivePage) return;
    const params = new URLSearchParams(searchParams);
    if (safeCurrentPage <= 1) params.delete("pagina");
    else params.set("pagina", String(safeCurrentPage));
    setSearchParams(params, { replace: true });
  }, [safeCurrentPage, effectivePage, searchParams, setSearchParams, initialLoading, canUseRpcRadiusMode, rpcTotalCount]);

  useEffect(() => {
    if (safeCurrentPage <= 1) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [safeCurrentPage]);

  const goToPage = useCallback((page: number) => {
    const nextPage = Math.max(1, page);
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete("pagina");
    else params.set("pagina", String(nextPage));
    setSearchParams(params, { replace: true });

    const scrollToResultsTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    requestAnimationFrame(() => {
      scrollToResultsTop();
      setTimeout(scrollToResultsTop, 80);
      setTimeout(scrollToResultsTop, 180);
    });
  }, [searchParams, setSearchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.delete("auto_raio");
    params.delete("pagina");
    if (searchInput.trim()) params.set("q", searchInput.trim());
    else params.delete("q");
    if (locationInput.trim()) {
      const typedLocation = locationInput.trim();
      params.set("local", typedLocation);
      params.set("cidade", typedLocation);
      // Cidade escolhida no campo principal deve prevalecer sobre filtros laterais antigos.
      params.delete("pais");
      params.delete("estado");
      params.delete("categoria");
      params.delete("brasileiro");
      params.delete("portugues");

      let coords = resolveCoordsFromBusinesses(typedLocation);
      if (!coords && typedLocation.length >= 3) {
        setResolvingLocation(true);
        coords = await geocodeAddress(typedLocation);
        setResolvingLocation(false);
      }
      if (coords) {
        params.set("origem_lat", String(coords.lat));
        params.set("origem_lng", String(coords.lng));
        params.set("origem_local", typedLocation);
        params.set("origem_source", "city");
      } else {
        params.delete("origem_lat");
        params.delete("origem_lng");
        params.delete("origem_local");
        params.delete("origem_source");
      }
    } else {
      params.delete("local");
      params.delete("cidade");
      params.delete("raio");
      params.delete("origem_lat");
      params.delete("origem_lng");
      params.delete("origem_local");
      params.delete("origem_source");
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
        setApproxCoords(approx);
        setLocationInput("");

        const params = new URLSearchParams(searchParams);
        params.delete("pagina");
        params.delete("local");
        params.delete("cidade");
        params.delete("origem_local");
        params.set("raio", "50");
        params.set("auto_raio", "1");
        params.set("origem_lat", String(approx.lat));
        params.set("origem_lng", String(approx.lng));
        params.set("origem_source", "ip");
        setSearchParams(params);
        setShowMap(true);
        window.alert("Não consegui acessar sua localização exata. Centralizei o mapa usando uma localização aproximada por IP.");
        return;
      }

      if (!window.isSecureContext) {
        window.alert("Geolocalização bloqueada e a localização aproximada por IP não está disponível agora.");
        return;
      }
      if (geoError?.code === 1) {
        window.alert("Permissão de localização negada e não foi possível obter localização aproximada por IP.");
        return;
      }
      if (geoError?.code === 2) {
        window.alert("Localização indisponível no momento e não foi possível obter localização aproximada por IP.");
        return;
      }
      if (geoError?.code === 3) {
        window.alert("Tempo esgotado para obter localização e não foi possível obter localização aproximada por IP.");
        return;
      }
      window.alert("Não consegui acessar sua localização e o fallback por IP também falhou.");
      return;
    }

    setUserCoords(coords);
    setLocationInput("");

    const params = new URLSearchParams(searchParams);
    params.delete("pagina");
    params.delete("local");
    params.delete("cidade");
    params.set("origem_lat", String(coords.lat));
    params.set("origem_lng", String(coords.lng));
    params.delete("origem_local");
    params.set("origem_source", "gps");
    params.set("raio", "50");
    params.set("auto_raio", "1");
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
    if (
      localToKeep &&
      searchParams.get("origem_local") &&
      normalizeText(searchParams.get("origem_local") || "") !== normalizeText(localToKeep)
    ) {
      params.delete("origem_lat");
      params.delete("origem_lng");
      params.delete("origem_local");
      params.delete("origem_source");
    }
    return params;
  }, [searchParams, cityFilter, locationInput, locationFilter]);

  const handleToggleEventsMode = (enabled: boolean) => {
    const params = getParamsWithCurrentLocation();
    params.delete("pagina");
    if (enabled) params.set("eventos", "1");
    else params.delete("eventos");
    setSearchParams(params);
  };

  const renderFilterControls = () => (
    <div className="space-y-3">
      <Select
        value={categoryFilter || "all"}
        onValueChange={(v) => {
          const params = getParamsWithCurrentLocation();
          params.delete("pagina");
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
          params.delete("pagina");
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
          <SelectValue placeholder="País" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os países</SelectItem>
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
            params.delete("pagina");
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
            params.delete("pagina");
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
          params.delete("pagina");
          params.set("raio", v);
          params.delete("auto_raio");
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
      <div
        className={`h-9 rounded-md px-3 flex items-center justify-between border transition-colors ${
          isEventMode ? "bg-amber-100 border-amber-500" : "bg-amber-50 border-amber-300"
        }`}
      >
        <div className="inline-flex items-center gap-2 text-sm">
          <PartyPopper className={`w-3.5 h-3.5 ${isEventMode ? "text-amber-700" : "text-amber-600"}`} />
          <span>Buscar festas e eventos</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEventMode}
          onClick={() => handleToggleEventsMode(!isEventMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEventMode ? "bg-amber-500" : "bg-muted"
          }`}
          title={isEventMode ? "Filtro de eventos ativo" : "Filtro de eventos desativado"}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              isEventMode ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>
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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-24">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
                <img src="/logo.png" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="font-extrabold text-lg sm:text-2xl tracking-tight caramelo-text-gradient truncate">Caramelinho</div>
                <div className="text-[10px] sm:text-sm font-semibold text-foreground/75 whitespace-nowrap overflow-hidden text-ellipsis">{"O SEU FARO FORA DO BRASIL"}</div>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-4">
              {session ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link to="/perfil?tab=mensagens" className="relative group">
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-secondary w-9 h-9 sm:w-10 sm:h-10">
                      <MessageCircle className="w-5 h-5" />
                      {unreadMessages > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/perfil">
                    <Button variant="outline" size="sm" className="rounded-full border-border hover:bg-secondary gap-1.5 sm:gap-2 px-2.5 sm:px-4 h-9 sm:h-10">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="font-medium max-w-[90px] sm:max-w-none truncate">{session.name.split(" ")[0]}</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/entrar">
                    <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">Entrar</Button>
                  </Link>
                  <Link to="/cadastro">
                    <Button size="sm" className="px-6 caramelo-gradient text-white border-0" style={{ borderRadius: "12px" }}>
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
        <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-0 rounded-2xl lg:rounded-xl border border-border lg:border-2 bg-white shadow-xl lg:shadow-sm focus-within:ring-2 ring-primary/20 transition-all w-full overflow-visible p-2 lg:p-0">
            <SearchInputWithSuggestions
              value={searchInput}
              onChange={setSearchInput}
              suggestions={searchSuggestions}
              disableLocalSuggestions
              placeholder="Buscar por produto ou serviço (Ex: coxinha)"
              icon="search"
              onSubmit={(selectedValue) => {
                const nextValue = selectedValue ?? searchInput;
                const params = new URLSearchParams(searchParams);
                params.delete("pagina");
                if (nextValue.trim()) params.set("q", nextValue.trim());
                else params.delete("q");
                setSearchParams(params);
              }}
              className="rounded-xl lg:rounded-none lg:!h-12"
              inputClassName="h-12 text-base lg:text-lg placeholder:text-[11px] lg:placeholder:text-sm"
            />
            <div className="hidden lg:block w-px h-8 bg-border self-center" />
            <div className="lg:hidden h-px bg-border/50 mx-1" />
            <SearchInputWithSuggestions
              value={locationInput}
              onChange={setLocationInput}
              suggestions={citySuggestions}
              placeholder="Em qual cidade?"
              icon="location"
              onSubmit={(selectedValue, meta) => {
                (async () => {
                  const nextValue = selectedValue ?? locationInput;
                  setLocationInput(nextValue);
                  const params = new URLSearchParams(searchParams);
                  params.delete("pagina");
                  if (nextValue.trim()) {
                    const typedLocation = nextValue.trim();
                    params.set("local", typedLocation);
                    params.set("cidade", typedLocation);
                    // A cidade da barra principal não deve impor filtros administrativos,
                    // pois o cadastro historico pode usar codigos diferentes (ex.: lau vs qc).
                    params.delete("pais");
                    params.delete("estado");
                    params.delete("categoria");
                    params.delete("brasileiro");
                    params.delete("portugues");

                    let coords =
                      typeof meta?.lat === "number" && typeof meta?.lng === "number"
                        ? { lat: meta.lat, lng: meta.lng }
                        : resolveCoordsFromBusinesses(typedLocation);

                    if (!coords && typedLocation.length >= 3) {
                      setResolvingLocation(true);
                      coords = await geocodeAddress(typedLocation);
                      setResolvingLocation(false);
                    }

                    if (coords) {
                      params.set("origem_lat", String(coords.lat));
                      params.set("origem_lng", String(coords.lng));
                      params.set("origem_local", typedLocation);
                      params.set("origem_source", "city");
                    } else {
                      params.delete("origem_lat");
                      params.delete("origem_lng");
                      params.delete("origem_local");
                      params.delete("origem_source");
                    }
                  } else {
                    params.delete("local");
                    params.delete("cidade");
                    params.delete("raio");
                    params.delete("origem_lat");
                    params.delete("origem_lng");
                    params.delete("origem_local");
                    params.delete("origem_source");
                  }
                  setSearchParams(params);
                })();
              }}
              className="rounded-xl lg:rounded-none lg:!h-12"
              inputClassName="h-12 text-base lg:text-lg placeholder:text-[11px] lg:placeholder:text-sm"
            />
            <div className="pt-2 lg:p-2 flex items-center">
              <Button type="submit" size="sm" className="w-full lg:w-auto caramelo-gradient text-white border-0 !rounded-xl">
                Farejar
              </Button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 mb-6">
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
          <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLocateMe} className="h-9 flex-1 sm:flex-none" disabled={locatingMe}>
              <Navigation className="w-4 h-4 mr-1" />
              {locatingMe ? "Localizando..." : "Me localizar"}
            </Button>
            <Button variant={showMap ? "default" : "outline"} size="sm" onClick={() => setShowMap(true)} className="h-9 flex-1 sm:flex-none">
              <MapIcon className="w-4 h-4 mr-1" />
              Mapa
            </Button>
            <Button variant={!showMap ? "default" : "outline"} size="sm" onClick={() => setShowMap(false)} className="h-9 flex-1 sm:flex-none">
              <List className="w-4 h-4 mr-1" />
              Lista
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {initialLoading || isResolvingDistanceOrigin
            ? "Carregando resultados..."
            : isEventMode
            ? `${eventResults.length} evento${eventResults.length !== 1 ? "s" : ""} encontrado${eventResults.length !== 1 ? "s" : ""}`
            : `${totalResults} negócio${totalResults !== 1 ? "s" : ""} encontrado${totalResults !== 1 ? "s" : ""}`}
          {query && <> para "<strong>{query}</strong>"</>}
          {locationFilter && <> perto de <strong>{locationFilter}</strong></>}
          {effectiveRadiusKm && <> em até <strong>{effectiveRadiusKm} km</strong></>}
          {effectiveRadiusKm && !distanceOrigin && !resolvingLocation && !isResolvingDistanceOrigin && <> informe um local ou permita sua localização para usar raio</>}
          {resolvingLocation && <> localizando referência...</>}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-4">
              {renderFilterControls()}
            </div>
          </aside>

          <div ref={resultsTopRef}>
            {!initialLoading && !isResolvingDistanceOrigin && !showMap && (isEventMode ? eventResults.length === 0 : results.length === 0) ? (
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
            ) : initialLoading || isResolvingDistanceOrigin ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                  <PawPrint className="w-14 h-14 text-muted-foreground/25 mx-auto lg:mx-0 shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-2">Carregando resultados...</h2>
                    <p className="text-muted-foreground">Aguarde um instante enquanto preparamos os negócios para você.</p>
                  </div>
                </div>
              </div>
            ) : (
            <>
            {showMap && (
              <div className="mb-8 rounded-xl overflow-hidden border border-border h-[400px]">
                <MapView
                  businesses={results}
                  center={mapCenter}
                />
              </div>
            )}

            {isEventMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedEvents.map((item) => (
                  <Link
                    key={item.key}
                    to={
                      item.type === "business"
                        ? `${buildBusinessUrl(item.biz)}?tab=events`
                        : item.linkedBiz
                          ? `${buildBusinessUrl(item.linkedBiz)}?tab=events`
                          : `/eventos/${item.evt.id}`
                    }
                    onClick={(e) => {
                      if (item.type === "community" && !item.evt.id) e.preventDefault();
                    }}
                    className="group h-full"
                  >
                    <Card className="overflow-hidden border-border h-full">
                      <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                        <img
                          src={
                            (item.type === "business"
                              ? item.evt.flyerUrl || item.biz.heroImage
                              : item.evt.flyer_url) || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                          }
                          alt={item.evt.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                        <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground border-0">
                          Evento
                        </Badge>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-foreground text-lg line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                          {item.evt.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.evt.description || "Sem descrição."}</p>
                        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                          <p className="inline-flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4 text-amber-600" />
                            {new Date(`${item.evt.date}T00:00:00`).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="inline-flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-amber-600" />
                            {item.evt.location}
                          </p>
                          <p className="inline-flex items-center gap-1.5">
                            <Ticket className="w-4 h-4 text-amber-600" />
                            {item.type === "business"
                              ? (item.evt.isFree ? "Entrada franca" : (item.evt.price || "Evento pago"))
                              : (item.evt.is_free ? "Entrada franca" : (item.evt.price || "Evento pago"))}
                          </p>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Organizado por{" "}
                          <strong>{item.type === "business" ? item.biz.name : "Membro da comunidade"}</strong>
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedBusinesses.map((biz) => (
                <Link key={biz.id} to={buildBusinessUrl(biz)} className="group h-full">
                  <Card className="overflow-hidden border-border h-full">
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
                      {biz.ownerVerified ? (
                        <div className="absolute bottom-3 right-3 bg-emerald-600/95 text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Verificado
                        </div>
                      ) : null}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        {biz.logoUrl && (
                          <img src={biz.logoUrl} alt="" loading="lazy" className="w-11 h-11 rounded-full object-cover ring-2 ring-border" />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors leading-tight">
                            <span className="truncate">{biz.name}</span>
                          </h3>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {biz.address.city}, {biz.address.country}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">{biz.description}</p>
                      {biz.categoryId === "food" && (biz.isVeganFriendly || biz.isVegetarianFriendly || biz.isGlutenFreeFriendly) ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {biz.isVeganFriendly ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <Leaf className="w-3 h-3" />
                              Vegan
                            </span>
                          ) : null}
                          {biz.isVegetarianFriendly ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-lime-100 text-lime-800">
                              <Leaf className="w-3 h-3" />
                              Vegetariano
                            </span>
                          ) : null}
                          {biz.isGlutenFreeFriendly ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              <WheatOff className="w-3 h-3" />
                              Gluten Free
                            </span>
                          ) : null}
                        </div>
                      ) : null}
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
            )}
            {totalResults > RESULTS_PER_PAGE && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(safeCurrentPage - 1)}
                  disabled={safeCurrentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    type="button"
                    variant={page === safeCurrentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="min-w-9"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
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









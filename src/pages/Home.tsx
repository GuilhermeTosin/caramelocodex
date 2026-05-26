import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Star, Store, Briefcase, ChevronRight, PawPrint, MessageCircle, User, Utensils, HeartPulse, Car, Hammer, Scale, GraduationCap, Landmark, ShoppingBag, Truck, Building2, Music, SprayCan, MoreHorizontal, Lock, Leaf, WheatOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteContent, MASCOT_PHRASES } from "@/data/siteContent";
import { getAllBusinesses, buildBusinessUrl, getAvailableLocations, getSearchSuggestions } from "@/services/businesses";
import { getFeaturedBusinessesForRegion, type FeaturedRegion } from "@/services/featured";
import type { BusinessFrontend } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { calculateDistance, getApproxPositionByIp, getCurrentPosition } from "@/lib/utils/geo";
import SearchInputWithSuggestions from "@/components/SearchInputWithSuggestions";
import SiteFooter from "@/components/SiteFooter";
import { setSeoMeta } from "@/lib/seo";
import { getOptimizedImageSrcSet, getOptimizedImageUrl } from "@/lib/images";

const CATEGORIES = [
  { name: "Alimentação", icon: Utensils, aliases: ["Alimentação", "Alimentacao"] },
  { name: "Saúde & Beleza", icon: HeartPulse, aliases: ["Saúde & Beleza", "Saude e Beleza"] },
  { name: "Automotivo", icon: Car, aliases: ["Automotivo", "Serviços Automotivos", "Servicos Automotivos"] },
  { name: "Construção", icon: Hammer, aliases: ["Construção", "Construcao", "Construção & Reformas", "Construcao & Reformas"] },
  { name: "Advocacia & Traduções", icon: Scale, aliases: ["Advocacia", "Advocacia & Consultoria"] },
  { name: "Educação", icon: GraduationCap, aliases: ["Educação", "Educacao", "Educação & Idiomas", "Educacao & Idiomas"] },
  { name: "Contabilidade", icon: Landmark, aliases: ["Contabilidade & Finanças", "Contabilidade", "Finanças", "Financas"] },
  { name: "Comércio", icon: ShoppingBag, aliases: ["Comércio & Varejo", "Comercio & Varejo", "Comércio", "Comercio"] },
  { name: "Transporte & Mudança", icon: Truck, aliases: ["Transporte & Mudança", "Transporte & Mudancas", "Transporte & Mudanças", "Transporte"] },
  { name: "Imobiliária", icon: Building2, aliases: ["Imobiliária", "Imobiliaria"] },
  { name: "Artistas", icon: Music, aliases: ["Artistas", "Arte", "Música", "Musica"] },
  { name: "Serviços para Pets", icon: PawPrint, aliases: ["Serviços para Pets", "Servicos para Pets", "Pet", "Pets"] },
  { name: "Cuidados Infantis e de Idosos", icon: User, aliases: ["Cuidados Infantis e de Idosos", "Babas & Acompanhantes", "Babá", "Baba", "Acompanhante", "Cuidadora", "Cuidador"] },
  { name: "Diaristas", icon: SprayCan, aliases: ["Diaristas", "Diarista", "Faxina", "Limpeza"] },
  { name: "Outros", icon: MoreHorizontal, aliases: ["Outros"] },
];

const countryCodeToFlag = (countryCode: string) => {
  const normalized = (countryCode || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return String.fromCodePoint(0x1F30E);

  const A = 65;
  const REGIONAL_INDICATOR_A = 0x1F1E6;
  return String.fromCodePoint(...normalized.split("").map((char) => REGIONAL_INDICATOR_A + char.charCodeAt(0) - A));
};

export default function Home() {
  const navigate = useNavigate();
  const { session, unreadMessages } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [allBusinesses, setAllBusinesses] = useState<BusinessFrontend[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<BusinessFrontend[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmittingSearch, setIsSubmittingSearch] = useState(false);
  const [secretActive, setSecretActive] = useState(false);
  const progressRef = useRef(0);
  const previousSearchRef = useRef({ query: "", location: "" });

  useEffect(() => {
    setSeoMeta(
      "Caramelinho.com | Encontre negócios brasileiros no exterior",
      "Encontre negócios brasileiros no mundo todo: alimentação, saúde, advocacia, educação e muito mais perto de você."
    );
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const combo = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "b", "a"];

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const activeElement = document.activeElement as HTMLElement | null;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable)
      ) {
        return;
      }

      const pressedKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const expectedKey = combo[progressRef.current];

      if (pressedKey === expectedKey) {
        progressRef.current += 1;
        if (progressRef.current === combo.length) {
          progressRef.current = 0;
          previousSearchRef.current = { query: searchQuery, location: locationQuery };
          setSearchQuery("Castlevania");
          setLocationQuery("Valáquia");
          setSecretActive(true);
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setSearchQuery(previousSearchRef.current.query);
            setLocationQuery(previousSearchRef.current.location);
            setSecretActive(false);
          }, 800);
          const audio = new Audio("/thecode.mp3");
          audio.volume = 0.85;
          void audio.play().catch(() => {});
        }
      } else {
        progressRef.current = pressedKey === combo[0] ? 1 : 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const businesses = await getAllBusinesses();
      const coords = await getApproxPositionByIp();
      let regionalBusinesses = [...businesses];
      let region: FeaturedRegion | null = null;
      
      if (coords) {
        setUserCoords(coords);
        // Ordenar por distância
        regionalBusinesses = [...businesses].sort((a, b) => {
          const distA = calculateDistance(coords.lat, coords.lng, a.address.lat, a.address.lng);
          const distB = calculateDistance(coords.lat, coords.lng, b.address.lat, b.address.lng);
          return distA - distB;
        });
        const nearest = regionalBusinesses[0];
        if (nearest) {
          region = {
            countryCode: nearest.address.countryCode,
            stateCode: nearest.address.stateCode,
            city: nearest.address.city,
          };
        }
      }

      const regionalFeatured = await getFeaturedBusinessesForRegion(region, 6);
      
      setAllBusinesses(regionalBusinesses);
      setFeaturedBusinesses(regionalFeatured);
    };

    loadData();
    getAvailableLocations().then(locations => {
      const cities = new Set<string>();
      locations.forEach(l => {
        l.states.forEach((s) => {
          s.cities.forEach((c: string) => cities.add(c));
        });
      });
      setCitySuggestions(Array.from(cities));
    });
    getSearchSuggestions().then(setSearchSuggestions);
  }, []);

  const handleUseCurrentLocationInput = async () => {
    const coords = await getCurrentPosition();
    if (!coords) {
      window.alert("Para usar esta funcionalidade, habilite a localização no navegador/dispositivo.");
      return;
    }
    setUserCoords(coords);
    setLocationQuery("");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (secretActive) return;
    setIsSubmittingSearch(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (locationQuery.trim()) {
      params.set("cidade", locationQuery.trim());
      params.set("local", locationQuery.trim());
    }
    if (!locationQuery.trim()) {
      const coords = userCoords || (await getCurrentPosition());
      if (coords) {
        setUserCoords(coords);
        params.set("raio", "50");
        params.set("auto_raio", "1");
        params.set("origem_lat", String(coords.lat));
        params.set("origem_lng", String(coords.lng));
        params.set("origem_source", "gps");
      } else {
        const approx = await getApproxPositionByIp();
        if (approx) {
          params.set("raio", "50");
          params.set("auto_raio", "1");
          params.set("origem_lat", String(approx.lat));
          params.set("origem_lng", String(approx.lng));
          params.set("origem_source", "ip");
        }
      }
    } else {
      params.set("raio", "50");
    }

    // Se o usuário selecionou uma cidade que sabemos o país/estado, podemos ser mais específicos
    // Mas por simplicidade no momento, passamos apenas como query de cidade
    navigate(`/buscar?${params.toString()}`);
    setIsSubmittingSearch(false);
  };

  const handleQuickTagSearch = async (tag: string) => {
    setIsSubmittingSearch(true);
    const params = new URLSearchParams();
    params.set("q", tag.trim());

    const coords = userCoords || (await getCurrentPosition());
    if (coords) {
      setUserCoords(coords);
      params.set("raio", "50");
      params.set("auto_raio", "1");
      params.set("origem_lat", String(coords.lat));
      params.set("origem_lng", String(coords.lng));
      params.set("origem_source", "gps");
    } else {
      const approx = await getApproxPositionByIp();
      if (approx) {
        params.set("raio", "50");
        params.set("auto_raio", "1");
        params.set("origem_lat", String(approx.lat));
        params.set("origem_lng", String(approx.lng));
        params.set("origem_source", "ip");
      }
    }

    navigate(`/buscar?${params.toString()}`);
    setIsSubmittingSearch(false);
  };

  const handleCategorySearch = async (category: string) => {
    setIsSubmittingSearch(true);
    const params = new URLSearchParams();
    params.set("categoria", category);

    const coords = userCoords || (await getCurrentPosition());
    if (coords) {
      setUserCoords(coords);
      params.set("raio", "50");
      params.set("auto_raio", "1");
      params.set("origem_lat", String(coords.lat));
      params.set("origem_lng", String(coords.lng));
      params.set("origem_source", "gps");
    } else {
      const approx = await getApproxPositionByIp();
      if (approx) {
        params.set("raio", "50");
        params.set("auto_raio", "1");
        params.set("origem_lat", String(approx.lat));
        params.set("origem_lng", String(approx.lng));
        params.set("origem_source", "ip");
      }
    }

    navigate(`/buscar?${params.toString()}`);
    setIsSubmittingSearch(false);
  };

  const [mascotPhrase] = useState(() => MASCOT_PHRASES[Math.floor(Math.random() * MASCOT_PHRASES.length)]);
  const categories = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      count: allBusinesses.filter((biz) => {
        const category = normalizeText(biz.category);
        return cat.aliases.some((alias) => category.includes(normalizeText(alias)));
      }).length,
    }));
  }, [allBusinesses]);

  const popularCities = useMemo(() => {
    const cityCounts = new Map<string, { name: string; countryCode: string; count: number }>();

    allBusinesses.forEach((biz) => {
      const city = biz.address.city?.trim();
      if (!city) return;

      const countryCode = biz.address.countryCode?.toLowerCase() || "";
      const key = `${normalizeText(city)}-${countryCode}`;
      const current = cityCounts.get(key);

      cityCounts.set(key, {
        name: current?.name || city,
        countryCode,
        count: (current?.count || 0) + 1,
      });
    });

    return Array.from(cityCounts.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 6)
      .map((city) => ({
        ...city,
        flag: countryCodeToFlag(city.countryCode),
      }));
  }, [allBusinesses]);

  return (
    <div className="min-h-screen">
      {/* Header/Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-24">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
                <img
                  src="/logo.webp"
                  alt="Caramelinho logo"
                  width={112}
                  height={112}
                  decoding="async"
                  fetchPriority="high"
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                />
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 caramelo-gradient opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <PawPrint className="w-4 h-4 mr-1.5 inline-block text-amber-600" />
              {mascotPhrase}
            </Badge>
            <h1
              className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground transition-all duration-500 ${
                secretActive ? "scale-[1.01]" : ""
              }`}
            >
              <span>Encontre </span>
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #15803d 0%, #eab308 50%, #1d4ed8 100%)" }}
              >
                negócios brasileiros
              </span>
              <span> no mundo todo</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
              {siteContent.heroSubtitle}
            </p>

            {/* Dual Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 sm:mt-10 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-0 rounded-2xl sm:rounded-3xl border border-border bg-white shadow-xl focus-within:ring-2 ring-primary/20 transition-all h-auto sm:h-24 p-2 sm:p-0">
                <SearchInputWithSuggestions
                  className="sm:flex-[1.6] rounded-xl sm:rounded-none"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  suggestions={searchSuggestions}
                  disableLocalSuggestions
                  placeholder="Buscar por produto ou serviço (Ex: coxinha)"
                  icon="search"
                  inputClassName="h-12 sm:h-full text-base sm:text-2xl placeholder:text-[11px] sm:placeholder:text-sm"
                />
                <div className="hidden sm:block w-px h-10 bg-border/50 self-center" />
                <div className="sm:hidden h-px bg-border/50 mx-1" />
                <SearchInputWithSuggestions
                  className="sm:flex-[0.9] rounded-xl sm:rounded-none"
                  value={locationQuery}
                  onChange={setLocationQuery}
                  suggestions={citySuggestions}
                  onUseCurrentLocation={handleUseCurrentLocationInput}
                  placeholder="Em qual cidade?"
                  icon="location"
                  inputClassName="h-12 sm:h-full text-base sm:text-2xl placeholder:text-[11px] sm:placeholder:text-sm"
                />
                <div className="pt-2 sm:p-3 flex items-center">
                  <Button type="submit" size="lg" disabled={isSubmittingSearch} className="w-full sm:w-auto h-11 sm:h-14 px-6 sm:px-10 caramelo-gradient hover:opacity-90 text-white border-0 font-bold text-sm sm:text-base" style={{ borderRadius: "12px" }}>
                    {isSubmittingSearch ? "Farejando..." : "Farejar"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Quick tags */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["Padaria", "Mecânico", "Dentista", "Advogado", "Restaurante", "Cabeleireiro"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    void handleQuickTagSearch(tag);
                  }}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary text-secondary-foreground hover:bg-amber-100 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Negócios Cadastrados", value: "350+", icon: Store },
              { label: "Cidades Atendidas", value: "120+", icon: MapPin },
              { label: "Países", value: "15+", icon: Briefcase },
              { label: "Avaliações", value: "2.5K+", icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <stat.icon className="w-5 h-5 text-amber-600" />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Categorias</h2>
          <p className="mt-3 text-muted-foreground">Navegue por categoria para encontrar o que precisa</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => void handleCategorySearch(cat.name)}
              className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border card-hover"
            >
              <cat.icon className="w-7 h-7 text-primary" />
              <span className="font-medium text-sm">{cat.name}</span>
              <span className="text-xs text-muted-foreground">{formatBusinessCount(cat.count)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Businesses */}
      {featuredBusinesses.length > 0 && (
      <section className="bg-secondary/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Negócios em Destaque</h2>
              <p className="mt-2 text-muted-foreground">Recomendados pelo Caramelinho</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/buscar")}>
              Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBusinesses.slice(0, 6).map((biz) => (
              <Link
                key={biz.id}
                to={buildBusinessUrl(biz)}
                className="group"
              >
                <Card className="overflow-hidden border-border h-full">
                  <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(
                        biz.heroImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
                        { width: 768, quality: 80, format: "webp" }
                      )}
                      srcSet={
                        getOptimizedImageSrcSet(
                          biz.heroImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
                          [480, 768, 1024],
                          80
                        ) || undefined
                      }
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
                      alt={biz.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                      loading="lazy"
                      decoding="async"
                    />
                    <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground border-0">
                      {biz.category.split("(")[0].trim()}
                    </Badge>
                    {biz.averageRating > 0 && (
                      <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-0 gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {biz.averageRating.toFixed(1)}
                      </Badge>
                    )}
                    {userCoords && (
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {calculateDistance(userCoords.lat, userCoords.lng, biz.address.lat, biz.address.lng).toFixed(1)} km
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
                    <div className="flex items-center gap-3 mb-3">
                      {biz.logoUrl && (
                        <img src={biz.logoUrl} alt="" loading="lazy" className="w-10 h-10 rounded-full object-cover ring-2 ring-border" />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-amber-600 transition-colors">
                          <span className="truncate">{biz.name}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {biz.attendanceType === "online"
                            ? "Atendimento online"
                            : `${biz.address.city}, ${biz.address.country}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {biz.description}
                    </p>
                    {biz.categoryId === "food" && (biz.isVeganFriendly || biz.isVegetarianFriendly || biz.isGlutenFreeFriendly) ? (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {biz.isVeganFriendly ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <Leaf className="w-3 h-3" />
                            Vegano
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
                            Sem Glúten
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {biz.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {biz.services.slice(0, 3).map((svc) => (
                          <span key={svc} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {svc}
                          </span>
                        ))}
                        {biz.services.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{biz.services.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {featuredBusinesses.length === 0 && (
            <div className="text-center py-12">
              <PawPrint className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum negócio encontrado ainda.</p>
              <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a cadastrar!</p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Cities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Cidades Populares</h2>
          <p className="mt-3 text-muted-foreground">Descubra negócios brasileiros pelo mundo</p>
        </div>
        <div className="w-full flex flex-wrap justify-center gap-4">
          {popularCities.map((city) => (
            <button
              key={`${city.countryCode}-${city.name}`}
              onClick={() => navigate(`/buscar?cidade=${encodeURIComponent(city.name)}`)}
              className="w-[160px] sm:w-[170px] lg:w-[180px] min-h-[128px] flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-card border border-border card-hover"
            >
              <img
                src={`https://flagcdn.com/w40/${city.countryCode.toLowerCase()}.png`}
                alt={`Bandeira de ${city.countryCode.toUpperCase()}`}
                className="h-5 w-7 object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "inline";
                }}
              />
              <span className="text-2xl hidden">{city.flag}</span>
              <span className="font-medium text-sm">{city.name}</span>
              <span className="text-xs text-muted-foreground">{formatBusinessCount(city.count)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted text-foreground py-20 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mx-auto mb-6">
            <img
              src="/brazil-map-pin.webp"
              alt="Ícone de localização com bandeira do Brasil"
              width={112}
              height={112}
              loading="lazy"
              decoding="async"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            <span className="text-foreground">Tem um </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #15803d 0%, #eab308 50%, #1d4ed8 100%)" }}
            >
              negócio brasileiro
            </span>
            <span className="text-foreground"> no exterior?</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Cadastre seu negócio no Caramelinho e seja encontrado por milhares de brasileiros espalhados pelo mundo!
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="caramelo-gradient text-white border-0 font-bold" onClick={() => navigate("/cadastro")}>
              Criar Conta Gratuita
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function normalizeText(value?: string | null): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatBusinessCount(count: number): string {
  return `${count} ${count === 1 ? "negócio" : "negócios"}`;
}














































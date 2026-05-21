import { supabase } from "@/lib/supabase";
import type { Business, BusinessFrontend, Review } from "@/types/database";
import type { CommunityEvent } from "@/types/database";

export const BUSINESS_CATEGORY_OPTIONS = [
  { id: "food", label: "Alimentação (Restaurantes, Padarias, Cafés)" },
  { id: "auto", label: "Serviços Automotivos" },
  { id: "health_beauty", label: "Saúde & Beleza" },
  { id: "construction", label: "Construção & Reformas" },
  { id: "legal_consulting", label: "Advocacia & Consultoria" },
  { id: "accounting_finance", label: "Contabilidade & Finanças" },
  { id: "education", label: "Educação & Idiomas" },
  { id: "retail", label: "Comércio & Varejo" },
  { id: "transport_moving", label: "Transporte & Mudança" },
  { id: "pets", label: "Serviços para Pets" },
  { id: "child_elder_care", label: "Cuidados Infantis e de Idosos" },
  { id: "cleaning", label: "Diaristas" },
  { id: "real_estate", label: "Imobiliária" },
  { id: "tourism", label: "Turismo & Viagens" },
  { id: "artists", label: "Artistas" },
  { id: "other", label: "Outros" },
] as const;

const CATEGORY_LABEL_BY_ID: Record<string, string> = {
  food: "Alimentação (Restaurantes, Padarias, Cafés)",
  auto: "Serviços Automotivos",
  health_beauty: "Saúde & Beleza",
  construction: "Construção & Reformas",
  legal_consulting: "Advocacia & Consultoria",
  accounting_finance: "Contabilidade & Finanças",
  education: "Educação & Idiomas",
  retail: "Comércio & Varejo",
  transport_moving: "Transporte & Mudança",
  pets: "Serviços para Pets",
  child_elder_care: "Cuidados Infantis e de Idosos",
  cleaning: "Diaristas",
  real_estate: "Imobiliária",
  tourism: "Turismo & Viagens",
  artists: "Artistas",
  other: "Outros",
};

export const BUSINESS_CATEGORIES = BUSINESS_CATEGORY_OPTIONS.map(
  (c) => CATEGORY_LABEL_BY_ID[c.id] || c.label
) as readonly string[];

const CATEGORY_ID_BY_LABEL: Record<string, string> = Object.fromEntries(
  BUSINESS_CATEGORY_OPTIONS.flatMap((c) => {
    const canonicalLabel = CATEGORY_LABEL_BY_ID[c.id] || c.label;
    return [
      [canonicalLabel.toLowerCase(), c.id],
      [c.label.toLowerCase(), c.id],
    ];
  })
);

export function getCategoryId(value: string): string {
  if (!value) return "other";
  return CATEGORY_LABEL_BY_ID[value] ? value : (CATEGORY_ID_BY_LABEL[value.toLowerCase()] || "other");
}

export function getCategoryLabel(value: string): string {
  if (!value) return value;
  const categoryId = getCategoryId(value);
  return CATEGORY_LABEL_BY_ID[categoryId] || "Outros";
}

export function isFoodCategory(value: string): boolean {
  return getCategoryId(value) === "food";
}

export const COUNTRIES: Record<string, { name: string; states: Record<string, string> }> = {
  ca: {
    name: "Canadá",
    states: {
      qc: "Quebec",
      on: "Ontário",
      bc: "Colúmbia Britânica",
      ab: "Alberta",
      mb: "Manitoba",
      sk: "Saskatchewan",
      ns: "Nova Escócia",
      nb: "Nova Brunswick",
      nl: "Terra Nova e Labrador",
      pe: "Ilha do Príncipe Eduardo",
      yt: "Yukon",
      nt: "Territórios do Noroeste",
      nu: "Nunavut",
    },
  },
  us: {
    name: "Estados Unidos",
    states: {
      al: "Alabama",
      ak: "Alasca",
      az: "Arizona",
      ar: "Arkansas",
      ca: "Califórnia",
      co: "Colorado",
      ct: "Connecticut",
      de: "Delaware",
      fl: "Flórida",
      ga: "Geórgia",
      hi: "Havaí",
      id: "Idaho",
      il: "Illinois",
      in: "Indiana",
      ia: "Iowa",
      ks: "Kansas",
      ky: "Kentucky",
      la: "Louisiana",
      me: "Maine",
      md: "Maryland",
      ma: "Massachusetts",
      mi: "Michigan",
      mn: "Minnesota",
      ms: "Mississippi",
      mo: "Missouri",
      mt: "Montana",
      ne: "Nebraska",
      nv: "Nevada",
      nh: "New Hampshire",
      nj: "Nova Jersey",
      nm: "Novo México",
      ny: "Nova York",
      nc: "Carolina do Norte",
      nd: "Dakota do Norte",
      oh: "Ohio",
      ok: "Oklahoma",
      or: "Oregon",
      pa: "Pensilvânia",
      ri: "Rhode Island",
      sc: "Carolina do Sul",
      sd: "Dakota do Sul",
      tn: "Tennessee",
      tx: "Texas",
      ut: "Utah",
      vt: "Vermont",
      va: "Virgínia",
      wv: "Virgínia Ocidental",
      wi: "Wisconsin",
      wy: "Wyoming",
    },
  },
  pt: {
    name: "Portugal",
    states: {
      li: "Lisboa",
      po: "Porto",
      br: "Braga",
      co: "Coimbra",
      av: "Aveiro",
      fa: "Faro",
      se: "Setúbal",
      le: "Leiria",
      ev: "Évora",
      be: "Beja",
      vi: "Viana do Castelo",
      vr: "Vila Real",
      brg: "Bragança",
      gu: "Guarda",
      ca: "Castelo Branco",
      pa: "Portalegre",
      sa: "Santarém",
      vb: "Viseu",
    },
  },
  gb: {
    name: "Reino Unido",
    states: {
      eng: "Inglaterra",
      sct: "Escócia",
      wls: "Pa?s de Gales",
      nir: "Irlanda do Norte",
    },
  },
  jp: {
    name: "Japão",
    states: {
      tk: "Tóquio",
      os: "Osaka",
      ky: "Quioto",
      hk: "Hokkaido",
      fk: "Fukuoka",
      ai: "Aichi",
      kn: "Kanagawa",
      st: "Saitama",
    },
  },
  au: {
    name: "Austrália",
    states: {
      nsw: "Nova Gales do Sul",
      vic: "Vitória",
      qld: "Queensland",
      wa: "Austrália Ocidental",
      sa: "Austrália do Sul",
      tas: "Tasmânia",
    },
  },
};

export function toFrontend(b: Business, ownerName?: string): BusinessFrontend {
  const categoryId = getCategoryId((b as any).category_id || "");
  const verifiedUntil = b.owner_verified_until || null;
  const isVerifiedByDate =
    !!b.owner_verified &&
    (!verifiedUntil || new Date(verifiedUntil).getTime() >= Date.now());
  return {
    id: b.id,
    ownerId: b.owner_id,
    ownerName: ownerName || "Proprietário",
    name: b.name,
    slug: b.slug,
    categoryId,
    category: getCategoryLabel(categoryId),
    description: b.description,
    heroImage: b.hero_image || "",
    logoUrl: b.logo_url || "",
    address: {
      street: b.street || "",
      city: b.city || "",
      state: b.state || "",
      country: b.country || "",
      countryCode: b.country_code || "",
      stateCode: b.state_code || "",
      postalCode: b.postal_code || "",
      lat: b.lat,
      lng: b.lng,
    },
    services: b.services || [],
    serviceItems: b.service_items || [],
    keywords: b.keywords || [],
    menu: b.menu || [],
    menuPdfUrl: b.menu_pdf_url || "",
    isBrazilianOwned: !!b.is_brazilian_owned,
    servesPortuguese: !!b.serves_portuguese,
    photos: b.photos || [],
    phone: b.phone || "",
    email: b.email || "",
    website: b.website || "",
    instagram: b.instagram || undefined,
    facebook: b.facebook || undefined,
    whatsapp: b.whatsapp || undefined,
    reviews: (b.reviews || []).map((r: any) => ({
      id: r.id,
      business_id: r.business_id || r.businessId,
      user_id: r.user_id || r.userId,
      user_name: r.user_name || r.userName || "Usuário",
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at || r.createdAt,
    })) as Review[],
    averageRating: b.average_rating || 0,
    ownerVerified: isVerifiedByDate,
    ownerVerifiedUntil: verifiedUntil || undefined,
    openingHours: b.opening_hours || [],
    promotions: b.promotions || [],
    events: b.events || [],
    createdAt: b.created_at,
  };
}

function mergeBusinessEvents(
  legacyEvents: Business["events"] | undefined,
  linkedEvents: CommunityEvent[]
) {
  const fromLinked = linkedEvents.map((evt) => ({
    title: evt.title,
    description: evt.description || "",
    date: evt.date,
    location: evt.location,
    isFree: !!evt.is_free,
    price: evt.price || "",
    flyerUrl: evt.flyer_url || "",
    ticketUrl: evt.ticket_url || "",
  }));

  const safeLegacy = (legacyEvents || []).filter(
    (evt): evt is NonNullable<typeof evt> =>
      !!evt && typeof evt === "object"
  );
  const merged = [...safeLegacy, ...fromLinked];
  const seen = new Set<string>();
  return merged
    .filter((evt) => !!evt && typeof evt === "object")
    .filter((evt) => {
      const key = `${(evt.title || "").trim().toLowerCase()}|${evt.date || ""}|${(evt.location || "").trim().toLowerCase()}`;
      if (!key.replace(/\|/g, "").trim()) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((evt) => ({
      title: String(evt.title || "").trim(),
      description: String(evt.description || "").trim(),
      date: String(evt.date || "").trim(),
      location: String(evt.location || "").trim(),
      isFree: Boolean(evt.isFree),
      price: String(evt.price || "").trim(),
      flyerUrl: String(evt.flyerUrl || "").trim(),
      ticketUrl: String(evt.ticketUrl || "").trim(),
    }))
    .filter((evt) => evt.title || evt.date || evt.location);
}

export async function getAllBusinesses(): Promise<BusinessFrontend[]> {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (!data) return [];

  // Buscar nomes dos proprietarios
  const ownerIds = [...new Set(data.map((b: Business) => b.owner_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", ownerIds);

  const ownerNames = new Map(
    (profiles || []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  const businessRows = data as Business[];
  const businessIds = businessRows.map((b) => b.id);
  const { data: linkedEventsRows } = await supabase
    .from("events")
    .select("*")
    .in("business_id", businessIds)
    .eq("status", "published");

  const linkedEventsByBusinessId = (linkedEventsRows || []).reduce((acc, evt: any) => {
    const key = evt.business_id as string;
    const list = acc.get(key) || [];
    list.push(evt as CommunityEvent);
    acc.set(key, list);
    return acc;
  }, new Map<string, CommunityEvent[]>());

  return businessRows.map((b) =>
    toFrontend(
      {
        ...b,
        events: mergeBusinessEvents(b.events, linkedEventsByBusinessId.get(b.id) || []),
      } as Business,
      ownerNames.get(b.owner_id)
    )
  );
}

export async function getBusinessBySlug(
  countryCode: string,
  stateCode: string,
  city: string,
  slug: string
): Promise<BusinessFrontend | null> {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("country_code", countryCode.toLowerCase())
    .eq("state_code", stateCode.toLowerCase())
    // Removemos o filtro exato de cidade pois o slug ja a anico e a cidade na URL pode estar slugificada
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  const biz = data as Business;
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", biz.owner_id)
    .maybeSingle();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", biz.id)
    .order("created_at", { ascending: false });

  const reviewUserIds = Array.from(
    new Set((reviews || []).map((r: any) => r.user_id).filter((id: any) => typeof id === "string" && id.length > 0))
  ) as string[];
  const { data: reviewProfiles } =
    reviewUserIds.length > 0
      ? await supabase.from("profiles").select("id, avatar").in("id", reviewUserIds)
      : { data: [] as Array<{ id: string; avatar: string | null }> };
  const reviewAvatarByUserId = new Map(
    (reviewProfiles || []).map((p: { id: string; avatar: string | null }) => [p.id, p.avatar || null])
  );

  biz.reviews = (reviews || []).map(r => ({
    id: r.id,
    business_id: r.business_id,
    user_id: r.user_id,
    user_name: r.user_name || "Usuário",
    user_avatar: r.user_id ? (reviewAvatarByUserId.get(r.user_id) || null) : null,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
  })) as Review[];

  const { data: linkedEventsRows } = await supabase
    .from("events")
    .select("*")
    .eq("business_id", biz.id)
    .eq("status", "published");

  biz.events = mergeBusinessEvents(biz.events, (linkedEventsRows || []) as CommunityEvent[]);

  return toFrontend(biz, profile?.name);
}

export async function getBusinessesByOwner(ownerId: string): Promise<BusinessFrontend[]> {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!data) return [];
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", ownerId)
    .maybeSingle();

  const businessIds = (data as Business[]).map((b) => b.id);
  let reviewsByBusinessId = new Map<string, Review[]>();

  if (businessIds.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("*")
      .in("business_id", businessIds)
      .order("created_at", { ascending: false });

    if (reviews) {
      reviewsByBusinessId = reviews.reduce((acc, r: any) => {
        const review: Review = {
          id: r.id,
          business_id: r.business_id,
          user_id: r.user_id,
          user_name: r.user_name || "Usuário",
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
        };
        const list = acc.get(r.business_id) || [];
        list.push(review);
        acc.set(r.business_id, list);
        return acc;
      }, new Map<string, Review[]>());
    }
  }

  const businessRows = data as Business[];
  const { data: linkedEventsRows } = businessIds.length > 0
    ? await supabase.from("events").select("*").in("business_id", businessIds)
    : { data: [] as any[] };

  const linkedEventsByBusinessId = (linkedEventsRows || []).reduce((acc, evt: any) => {
    const key = evt.business_id as string;
    const list = acc.get(key) || [];
    list.push(evt as CommunityEvent);
    acc.set(key, list);
    return acc;
  }, new Map<string, CommunityEvent[]>());

  return businessRows.map((b) => {
    const withReviews: Business = {
      ...b,
      reviews: reviewsByBusinessId.get(b.id) || [],
      events: mergeBusinessEvents(b.events, linkedEventsByBusinessId.get(b.id) || []),
    };
    return toFrontend(withReviews, profile?.name);
  });
}

export async function createBusiness(
  ownerId: string,
  data: {
    name: string;
    slug?: string;
    categoryId: string;
    description: string;
    heroImage?: string;
    logoUrl?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    countryCode?: string;
    stateCode?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
    services?: string[];
    serviceItems?: { name: string; description: string; price: string }[];
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    menu?: { name: string; description: string; price: string }[];
    menuPdfUrl?: string;
    isBrazilianOwned?: boolean;
    servesPortuguese?: boolean;
    keywords?: string[];
    photos?: string[];
    openingHours?: string[];
    promotions?: { title: string; description: string; code: string; expiresAt: string }[];
    events?: { title: string; description: string; date: string; location: string; isFree: boolean; price: string; flyerUrl?: string; ticketUrl?: string }[];
  }
): Promise<BusinessFrontend | null> {
  if (!data.phone?.trim() || !data.email?.trim()) {
    return null;
  }
  const safeSlug = slugify(data.slug?.trim() || data.name);

  const { data: newBiz, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: ownerId,
      name: data.name,
      slug: safeSlug,
      category_id: getCategoryId(data.categoryId),
      description: data.description,
      hero_image: data.heroImage || null,
      logo_url: data.logoUrl || null,
      street: data.street || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      country_code: data.countryCode || null,
      state_code: data.stateCode || null,
      postal_code: data.postalCode || null,
      lat: data.lat || 0,
      lng: data.lng || 0,
      services: data.services || [],
      service_items: data.serviceItems || [],
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      whatsapp: data.whatsapp || null,
      menu: data.menu || [],
      menu_pdf_url: data.menuPdfUrl || null,
      is_brazilian_owned: !!data.isBrazilianOwned,
      serves_portuguese: !!data.servesPortuguese,
      keywords: data.keywords || [],
      photos: data.photos || [],
      opening_hours: data.openingHours || [],
      events: data.events || [],
    })
    .select()
    .maybeSingle();

  if (error || !newBiz) return null;
  return toFrontend(newBiz as Business);
}

export async function updateBusiness(
  id: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  const normalizedUpdates = { ...updates };
  const slugValue = typeof normalizedUpdates.slug === "string" ? normalizedUpdates.slug : "";
  const nameValue = typeof normalizedUpdates.name === "string" ? normalizedUpdates.name : "";

  if (!slugValue.trim() && nameValue.trim()) {
    normalizedUpdates.slug = slugify(nameValue);
  } else if (slugValue.trim()) {
    normalizedUpdates.slug = slugify(slugValue);
  }

  // Mapear camelCase para snake_case (colunas do banco)
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(normalizedUpdates)) {
    if (key === "categoryId" || key === "category") {
      mapped["category_id"] = getCategoryId(String(value || ""));
      continue;
    }
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    mapped[snakeKey] = value;
  }
  const { error } = await supabase
    .from("businesses")
    .update(mapped)
    .eq("id", id);
  if (error) {
    console.error("[updateBusiness] Supabase error code:", error.code, "message:", error.message, "details:", error.details, "hint:", error.hint);
  }
  return !error;
}

export async function deleteBusiness(id: string): Promise<boolean> {
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  return !error;
}

export async function addReview(
  businessId: string,
  review: {
    userId: string | null;
    userName: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comment: string;
  }
): Promise<boolean> {
  if (review.userId) {
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", review.userId)
      .maybeSingle();

    if (existing) {
      return false;
    }
  }

  const { error } = await supabase
    .from("reviews")
    .insert({
      business_id: businessId,
      user_id: review.userId,
      user_name: review.userName,
      rating: review.rating,
      comment: review.comment,
    });

  return !error;
}

export async function updateReview(
  reviewId: string,
  updates: { rating?: 1 | 2 | 3 | 4 | 5; comment?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from("reviews")
    .update(updates)
    .eq("id", reviewId);

  return !error;
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  return !error;
}

export async function getReviewsByUser(userId: string): Promise<(Review & { businessName: string; businessSlug: string })[]> {
  const { data } = await supabase
    .from("reviews")
    .select(`
      *,
      business:businesses(name, slug, country_code, state_code, city)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((r: any) => ({
    id: r.id,
    business_id: r.business_id,
    user_id: r.user_id,
    user_name: r.user_name || "Usuário",
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    businessName: r.business?.name || "Negócio",
    businessSlug: `/${r.business?.country_code}/${r.business?.state_code}/${slugify(r.business?.city || "")}/${r.business?.slug}`,
  })) as any[];
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, "-")           // Substitui espaços por -
    .replace(/[^\w-]+/g, "")        // Remove caracteres nao-alfanuméricos
    .replace(/--+/g, "-")           // Remove hifens duplicados
    .replace(/^-+/, "")             // Remove hifens no início
    .replace(/-+$/, "");            // Remove hifens no final
}

export function buildBusinessUrl(biz: BusinessFrontend): string {
  const citySlug = slugify(biz.address.city);
  const stateSlug = biz.address.stateCode.toLowerCase();
  return `/${biz.address.countryCode}/${stateSlug}/${citySlug}/${biz.slug}`;
}

export function getCountryName(code: string): string {
  return COUNTRIES[code.toLowerCase()]?.name || code;
}

export async function getAvailableLocations(): Promise<{ countryCode: string, countryName: string, states: { code: string, name: string, cities: string[] }[] }[]> {
  const { data } = await supabase
    .from("businesses")
    .select("country_code, state_code, city");

  if (!data) return [];

  const locations: any[] = [];

  data.forEach(item => {
    let country = locations.find(l => l.countryCode === item.country_code);
    if (!country) {
      country = { 
        countryCode: item.country_code, 
        countryName: getCountryName(item.country_code), 
        states: [] 
      };
      locations.push(country);
    }

    let state = country.states.find((s: any) => s.code === item.state_code);
    if (!state) {
      state = { 
        code: item.state_code, 
        name: getStateName(item.country_code, item.state_code), 
        cities: [] 
      };
      country.states.push(state);
    }

    if (!state.cities.includes(item.city)) {
      state.cities.push(item.city);
    }
  });

  return locations;
}

export function getStateName(countryCode: string, stateCode: string): string {
  if (!countryCode || !stateCode) return stateCode || "";
  return COUNTRIES[countryCode.toLowerCase()]?.states[stateCode.toLowerCase()] || stateCode;
}

export async function getSearchSuggestions(): Promise<string[]> {
  const { data } = await supabase
    .from("businesses")
    .select("name, keywords, services, city, menu");

  if (!data) return [];

  const terms = new Map<string, number>();
  const STOP_WORDS = new Set([
    "un", "und", "unid", "unidade", "unidades",
    "kg", "g", "gr", "grama", "gramas",
    "ml", "l", "lt", "litro", "litros",
    "porcao", "porcoes", "porção", "porções",
    "combo", "kit",
  ]);

  const addRelevantTokens = (raw: string) => {
    if (!raw) return;
    const cleaned = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ");

    const tokens = cleaned
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => !/\d/.test(t))
      .filter((t) => t.length >= 3)
      .filter((t) => !STOP_WORDS.has(t));

    tokens.forEach((t) => terms.set(t, (terms.get(t) || 0) + 1));
  };

  const addRawTerm = (raw: string) => {
    const normalized = (raw || "").trim();
    if (!normalized) return;
    const words = normalized.split(/\s+/).filter(Boolean);
    const limited = words.slice(0, 5).join(" ").trim();
    if (!limited || limited.length < 2) return;
    if (/\d/.test(limited)) return; // evita "Coxinha 6 Unidades" como sugestão literal
    terms.set(limited, (terms.get(limited) || 0) + 1);
  };

  data.forEach((b: any) => {
    if (b.city) addRawTerm(b.city);
    if (b.keywords && Array.isArray(b.keywords)) {
      b.keywords.forEach((k: string) => {
        addRawTerm(k);
        addRelevantTokens(k);
      });
    }
    if (b.services && Array.isArray(b.services)) {
      b.services.forEach((s: string) => {
        addRawTerm(s);
        addRelevantTokens(s);
      });
    }
    if (b.menu && Array.isArray(b.menu)) {
      b.menu.forEach((item: any) => {
        if (item?.name) {
          addRawTerm(String(item.name));
          addRelevantTokens(String(item.name));
        }
        if (item?.description) {
          addRawTerm(String(item.description));
          addRelevantTokens(String(item.description));
        }
      });
    }
  });

  // Retornar por frequência (mais recorrentes primeiro)
  return Array.from(terms.entries())
    .filter(([t]) => t && t.length >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([t]) => t);
}

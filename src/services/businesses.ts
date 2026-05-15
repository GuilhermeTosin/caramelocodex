import { supabase } from "@/lib/supabase";
import type { Business, BusinessFrontend, Review } from "@/types/database";

export const BUSINESS_CATEGORIES = [
  "Alimentaaao (Restaurantes, Padarias, Cafas)",
  "Servi?os Automotivos",
  "Saade & Beleza",
  "Constru??o & Reformas",
  "Advocacia & Consultoria",
  "Contabilidade & Finanaas",
  "Educaaao & Idiomas",
  "Comarcio & Varejo",
  "Transporte & Mudanaa",
  "Servi?os para Pets",
  "Cuidados Infantis e de Idosos",
  "Diaristas",
  "Imobiliaria",
  "Turismo & Viagens",
  "Artistas",
  "Outros",
] as const;

export const COUNTRIES: Record<string, { name: string; states: Record<string, string> }> = {
  ca: {
    name: "Canada",
    states: {
      qc: "Quebec",
      on: "Ontario",
      bc: "Col?mbia Britanica",
      ab: "Alberta",
      mb: "Manitoba",
      sk: "Saskatchewan",
      ns: "Nova Esc?cia",
      nb: "Nova Brunswick",
      nl: "Terra Nova e Labrador",
      pe: "Ilha do Pr?ncipe Eduardo",
      yt: "Yukon",
      nt: "Territ?rios do Noroeste",
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
      ca: "Califarnia",
      co: "Colorado",
      ct: "Connecticut",
      de: "Delaware",
      fl: "Fl?rida",
      ga: "Ge?rgia",
      hi: "Hava?",
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
      nm: "Novo M?xico",
      ny: "Nova York",
      nc: "Carolina do Norte",
      nd: "Dakota do Norte",
      oh: "Ohio",
      ok: "Oklahoma",
      or: "Oregon",
      pa: "Pensilvania",
      ri: "Rhode Island",
      sc: "Carolina do Sul",
      sd: "Dakota do Sul",
      tn: "Tennessee",
      tx: "Texas",
      ut: "Utah",
      vt: "Vermont",
      va: "Virg?nia",
      wv: "Virg?nia Ocidental",
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
      se: "Set?bal",
      le: "Leiria",
      ev: "?vora",
      be: "Beja",
      vi: "Viana do Castelo",
      vr: "Vila Real",
      brg: "Bragan?a",
      gu: "Guarda",
      ca: "Castelo Branco",
      pa: "Portalegre",
      sa: "Santar?m",
      vb: "Viseu",
    },
  },
  gb: {
    name: "Reino Unido",
    states: {
      eng: "Inglaterra",
      sct: "Esc?cia",
      wls: "Pa?s de Gales",
      nir: "Irlanda do Norte",
    },
  },
  jp: {
    name: "Jap?o",
    states: {
      tk: "T?quio",
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
    name: "Austr?lia",
    states: {
      nsw: "Nova Gales do Sul",
      vic: "Vit?ria",
      qld: "Queensland",
      wa: "Austr?lia Ocidental",
      sa: "Austr?lia do Sul",
      tas: "Tasmania",
    },
  },
};

export function toFrontend(b: Business, ownerName?: string): BusinessFrontend {
  return {
    id: b.id,
    ownerId: b.owner_id,
    ownerName: ownerName || "Propriet?rio",
    name: b.name,
    slug: b.slug,
    category: b.category,
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
      user_name: r.user_name || r.userName || "Usu?rio",
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at || r.createdAt,
    })) as Review[],
    averageRating: b.average_rating || 0,
    ownerVerified: b.owner_verified || false,
    openingHours: b.opening_hours || [],
    createdAt: b.created_at,
  };
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

  return (data as Business[]).map((b) =>
    toFrontend(b, ownerNames.get(b.owner_id))
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

  biz.reviews = (reviews || []).map(r => ({
    id: r.id,
    business_id: r.business_id,
    user_id: r.user_id,
    user_name: r.user_name || "Usu?rio",
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
  })) as Review[];

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
  return (data as Business[]).map((b) => toFrontend(b, profile?.name));
}

export async function createBusiness(
  ownerId: string,
  data: {
    name: string;
    slug?: string;
    category: string;
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
  }
): Promise<BusinessFrontend | null> {
  const safeSlug = slugify(data.slug?.trim() || data.name);

  const { data: newBiz, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: ownerId,
      name: data.name,
      slug: safeSlug,
      category: data.category,
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
    user_name: r.user_name || "Usu?rio",
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    businessName: r.business?.name || "Neg?cio",
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
    .replace(/\s+/g, "-")           // Substitui espaaos por -
    .replace(/[^\w-]+/g, "")        // Remove caracteres nao-alfanumaricos
    .replace(/--+/g, "-")           // Remove hifens duplicados
    .replace(/^-+/, "")             // Remove hifens no inacio
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
    .select("name, category, keywords, services, city");

  if (!data) return [];

  const terms = new Set<string>();
  data.forEach((b: any) => {
    if (b.city) terms.add(b.city);
    if (b.keywords && Array.isArray(b.keywords)) {
      b.keywords.forEach((k: string) => terms.add(k));
    }
    if (b.services && Array.isArray(b.services)) {
      b.services.forEach((s: string) => terms.add(s));
    }
  });

  // Retornar lista anica, filtrando termos muito curtos
  return Array.from(terms).filter((t) => t && t.length >= 2);
}








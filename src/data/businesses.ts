export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
}

export interface MenuItem {
  name: string;
  price: string;
  description: string;
}

export interface Business {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  heroImage: string;
  logoUrl: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    countryCode: string;
    stateCode: string;
    postalCode: string;
    lat: number;
    lng: number;
  };
  services: string[];
  menu?: MenuItem[];
  photos: string[];
  phone: string;
  email: string;
  website: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  reviews: Review[];
  averageRating: number;
  createdAt: string;
}

export const BUSINESS_CATEGORIES = [
  "Alimentação (Restaurantes, Padarias, Cafés)",
  "Serviços Automotivos",
  "Saúde & Beleza",
  "Construção & Reformas",
  "Advocacia & Consultoria",
  "Contabilidade & Finanças",
  "Educação & Idiomas",
  "Tecnologia & TI",
  "Comércio & Varejo",
  "Transporte & Mudanças",
  "Imobiliária",
  "Turismo & Viagens",
  "Outros",
] as const;

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
      nb: "New Brunswick",
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
      nj: "New Jersey",
      nm: "New Mexico",
      ny: "Nova York",
      nc: "Carolina do Norte",
      nd: "Carolina do Norte",
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
      wa: "Washington",
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
      pt: "Portalegre",
      sa: "Santarém",
    },
  },
  es: {
    name: "Espanha",
    states: {
      an: "Andaluzia",
      ct: "Catalunha",
      md: "Madrid",
      vc: "Comunidade Valenciana",
      ga: "Galícia",
      pv: "País Basco",
      cl: "Castela e Leão",
      ib: "Ilhas Baleares",
      cn: "Ilhas Canárias",
    },
  },
  uk: {
    name: "Reino Unido",
    states: {
      en: "Inglaterra",
      sc: "Escócia",
      wa: "País de Gales",
      ni: "Irlanda do Norte",
    },
  },
  it: {
    name: "Itália",
    states: {
      la: "Lácio",
      lo: "Lombardia",
      ca: "Campânia",
      ve: "Vêneto",
      si: "Sicília",
      to: "Toscana",
    },
  },
  fr: {
    name: "França",
    states: {
      idf: "Île-de-France",
      paca: "Provença-Alpes-Costa Azul",
      occ: "Occitânia",
      naq: "Nova Aquitânia",
      ara: "Auvérnia-Ródano-Alpes",
    },
  },
  de: {
    name: "Alemanha",
    states: {
      be: "Berlim",
      by: "Baviera",
      hh: "Hamburgo",
      he: "Hesse",
      nw: "Renânia do Norte-Vestfália",
      sn: "Saxônia",
    },
  },
  jp: {
    name: "Japão",
    states: {
      tk: "Tóquio",
      os: "Osaka",
      ky: "Quioto",
      hk: "Hokkaido",
      fn: "Fukuoka",
      ai: "Aichi",
    },
  },
  au: {
    name: "Austrália",
    states: {
      nsw: "Nova Gales do Sul",
      vic: "Vitória",
      qld: "Queenslândia",
      wa: "Austrália Ocidental",
      sa: "Austrália do Sul",
    },
  },
  br: {
    name: "Brasil",
    states: {
      ac: "Acre",
      al: "Alagoas",
      ap: "Amapá",
      am: "Amazonas",
      ba: "Bahia",
      ce: "Ceará",
      df: "Distrito Federal",
      es: "Espírito Santo",
      go: "Goiás",
      ma: "Maranhão",
      mt: "Mato Grosso",
      ms: "Mato Grosso do Sul",
      mg: "Minas Gerais",
      pa: "Pará",
      pb: "Paraíba",
      pr: "Paraná",
      pe: "Pernambuco",
      pi: "Piauí",
      rj: "Rio de Janeiro",
      rn: "Rio Grande do Norte",
      rs: "Rio Grande do Sul",
      ro: "Rondônia",
      rr: "Roraima",
      sc: "Santa Catarina",
      sp: "São Paulo",
      se: "Sergipe",
      to: "Tocantins",
    },
  },
};

export function getCountryName(code: string): string {
  return COUNTRIES[code.toLowerCase()]?.name ?? code.toUpperCase();
}

export function getStateName(countryCode: string, stateCode: string): string {
  return COUNTRIES[countryCode.toLowerCase()]?.states[stateCode.toLowerCase()] ?? stateCode.toUpperCase();
}

export function buildBusinessUrl(business: Pick<Business, "address" | "slug">): string {
  const { address, slug } = business;
  return `/${address.countryCode.toLowerCase()}/${address.stateCode.toLowerCase()}/${address.city.toLowerCase()}/${slug}`;
}

// Sample businesses
const sampleReviews: Review[] = [
  { id: "r1", userId: "u1", userName: "Ana Souza", rating: 5, comment: "Comida incrível! Lembra a casa da vó. Super recomendo!", createdAt: "2025-02-15" },
  { id: "r2", userId: "u2", userName: "Carlos Mendes", rating: 4, comment: "Ótimo atendimento e preço justo. Volto sempre.", createdAt: "2025-03-01" },
  { id: "r3", userId: "u3", userName: "Juliana Lima", rating: 5, comment: "Melhor padaria brasileira da cidade! O pão de queijo é sensacional.", createdAt: "2025-03-20" },
  { id: "r4", userId: "u4", userName: "Rafael Costa", rating: 3, comment: "Bom lugar, mas o serviço demorou um pouco.", createdAt: "2025-04-01" },
];

const sampleReviews2: Review[] = [
  { id: "r5", userId: "u5", userName: "Patrícia Oliveira", rating: 5, comment: "Mecânico honesto e competente! Raro de encontrar.", createdAt: "2025-01-10" },
  { id: "r6", userId: "u6", userName: "Fernando Santos", rating: 4, comment: "Resolveu o problema do meu carro rapidamente.", createdAt: "2025-02-28" },
];

const sampleReviews3: Review[] = [
  { id: "r7", userId: "u7", userName: "Luciana Alves", rating: 5, comment: "Dra. Mariana é maravilhosa! Me salvou com uma consulta de urgência.", createdAt: "2025-03-05" },
];

const sampleMenu: MenuItem[] = [
  { name: "Pão de Queijo (6 unid)", price: "$8.00", description: "Pão de queijo tradicional mineiro" },
  { name: "Coxinha de Frango", price: "$5.50", description: "Coxinha cremosa com catupiry" },
  { name: "Pastel de Carne", price: "$6.00", description: "Pastel frito na hora, recheio generoso" },
  { name: "Brigadeiro (unid)", price: "$2.50", description: "Brigadeiro gourmet com chocolate belga" },
  { name: "Quibe", price: "$5.00", description: "Quibe frito crocante" },
  { name: "Esfiha de Carne", price: "$4.50", description: "Esfiha aberta com carne temperada" },
  { name: "Açaí na Tigela", price: "$12.00", description: "Açaí com granola, banana e leite condensado" },
  { name: "Suco de Maracujá", price: "$5.00", description: "Suco natural fresco" },
];

export const sampleBusinesses: Business[] = [
  {
    id: "b1",
    ownerId: "owner1",
    ownerName: "Maria Silva",
    name: "Brasil Tropical Bakery",
    slug: "brasil-tropical-bakery",
    category: "Alimentação (Restaurantes, Padarias, Cafés)",
    description: "Padaria e confeitaria brasileira autêntica no coração de Montreal. Aqui você encontra pão de queijo, coxinha, brigadeiro, e muito mais. Todos os produtos são feitos artesanalmente com ingredientes frescos e importados do Brasil sempre que possível.",
    heroImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&q=80",
    address: {
      street: "1234 Rue Sainte-Catherine O",
      city: "Montreal",
      state: "Quebec",
      country: "Canadá",
      countryCode: "ca",
      stateCode: "qc",
      postalCode: "H3G 1P7",
      lat: 45.4908,
      lng: -73.5692,
    },
    services: ["Padaria", "Confeitaria", "Salgados", "Bolos", "Doces", "Catering", "Delivery"],
    menu: sampleMenu,
    photos: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80",
      "https://images.unsplash.com/photo-1608198093002-ad4e0055b83d?w=800&q=80",
      "https://images.unsplash.com/photo-1486427944544-d2c246c4a8e4?w=800&q=80",
    ],
    phone: "+1 (514) 555-0198",
    email: "contato@brasiltropicalbakery.com",
  website: "https://brasiltropicalbakery.com",
  instagram: "https://instagram.com/brasiltropicalbakery",
  facebook: "https://facebook.com/brasiltropicalbakery",
  whatsapp: "+15145550198",
  reviews: sampleReviews,
  averageRating: 4.25,
  createdAt: "2024-08-15",
  },
  {
    id: "b2",
    ownerId: "owner2",
    ownerName: "João Pereira",
    name: "AutoMec BR",
    slug: "automec-br",
    category: "Serviços Automotivos",
    description: "Oficina mecânica especializada em veículos brasileiros e importados. Diagnóstico computadorizado, troca de óleo, freios, suspensão, elétrica, e muito mais. Atendimento em português com preço justo e garantia.",
    heroImage: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1632934620893-fda9c7c0b5f8?w=200&q=80",
    address: {
      street: "5678 Rue Wellington",
      city: "Montreal",
      state: "Quebec",
      country: "Canadá",
      countryCode: "ca",
      stateCode: "qc",
      postalCode: "H3C 1T4",
      lat: 45.4773,
      lng: -73.5645,
    },
    services: ["Troca de Óleo", "Freios", "Suspensão", "Motor", "Elétrica", "Ar Condicionado", "Diagnóstico", "Revisão Completa"],
    photos: [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80",
    ],
    phone: "+1 (514) 555-0234",
    email: "automecbr@gmail.com",
  website: "https://automecbr.ca",
  instagram: "https://instagram.com/automecbr",
  whatsapp: "+15145550234",
  reviews: sampleReviews2,
  averageRating: 4.5,
  createdAt: "2024-06-20",
  },
  {
    id: "b3",
    ownerId: "owner3",
    ownerName: "Dra. Mariana Costa",
    name: "Clínica Dental Brasil",
    slug: "clinica-dental-brasil",
    category: "Saúde & Beleza",
    description: "Clínica odontológica brasileira em Toronto. Atendimento humanizado com profissionais formados no Brasil e revalidados no Canadá. Oferecemos limpeza, clareamento, implantes, ortodontia e estética dental.",
    heroImage: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=200&q=80",
    address: {
      street: "789 Yonge Street",
      city: "Toronto",
      state: "Ontário",
      country: "Canadá",
      countryCode: "ca",
      stateCode: "on",
      postalCode: "M4W 2G8",
      lat: 43.6713,
      lng: -79.3896,
    },
    services: ["Limpeza", "Clareamento", "Implantes", "Ortodontia", "Estética", "Canal", "Extração", "Próteses"],
    photos: [
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80",
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80",
    ],
    phone: "+1 (416) 555-0456",
    email: "contato@clinicadentalbrasil.ca",
  website: "https://clinicadentalbrasil.ca",
  facebook: "https://facebook.com/clinicadentalbrasil",
  whatsapp: "+14165550456",
  reviews: sampleReviews3,
  averageRating: 5,
  createdAt: "2024-10-01",
  },
];

export function getAllBusinesses(): Business[] {
  return sampleBusinesses;
}

export function getBusinessBySlug(countryCode: string, stateCode: string, city: string, slug: string): Business | undefined {
  return sampleBusinesses.find(
    (b) =>
      b.address.countryCode.toLowerCase() === countryCode.toLowerCase() &&
      b.address.stateCode.toLowerCase() === stateCode.toLowerCase() &&
      b.address.city.toLowerCase() === city.toLowerCase() &&
      b.slug === slug
  );
}

export function searchBusinesses(query: string, countryCode?: string): Business[] {
  const q = query.toLowerCase().trim();
  return sampleBusinesses.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.services.some((s) => s.toLowerCase().includes(q)) ||
      b.address.city.toLowerCase().includes(q) ||
      b.address.state.toLowerCase().includes(q);
    if (!countryCode) return matchSearch;
    return matchSearch && b.address.countryCode.toLowerCase() === countryCode.toLowerCase();
  });
}

export function getRatingStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

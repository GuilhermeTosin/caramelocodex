import { describe, expect, it } from "vitest";
import type { BusinessFrontend } from "@/types/database";
import { buildCityAliases, filterBusinesses } from "@/lib/search/businessSearch";

const categoryFilterAliases: Record<string, string[]> = {
  alimentacao: ["Alimentação"],
  "advocacia & consultoria": ["Advocacia & Consultoria"],
};

const searchSynonyms: Record<string, string[]> = {
  advogado: ["Advocacia & Consultoria"],
};

const categoryKeywords: Record<string, string[]> = {
  "Alimentação": ["coxinha", "salgado", "catupiry"],
  "Advocacia & Consultoria": ["advogado", "juridico"],
};

const cityAliases = buildCityAliases([
  ["tokyo", "toquio", "tóquio"],
  ["sainte-eustache", "sainte eustache"],
  ["mirabel"],
]);

function createBusiness(overrides: Partial<BusinessFrontend>): BusinessFrontend {
  return {
    id: "biz-default",
    ownerId: "owner-1",
    ownerName: "Owner",
    name: "Negócio",
    slug: "negocio",
    categoryId: "cat-1",
    category: "Alimentação",
    description: "Descrição",
    heroImage: "",
    logoUrl: "",
    address: {
      street: "Rua",
      city: "Mirabel",
      state: "Quebec",
      country: "Canada",
      countryCode: "CA",
      stateCode: "QC",
      postalCode: "00000",
      lat: 45.6794,
      lng: -74.0036,
    },
    services: [],
    serviceItems: [],
    keywords: [],
    menu: [],
    menuPdfUrl: "",
    isBrazilianOwned: false,
    servesPortuguese: false,
    isVeganFriendly: false,
    isVegetarianFriendly: false,
    isGlutenFreeFriendly: false,
    photos: [],
    phone: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    reviews: [],
    averageRating: 0,
    ownerVerified: false,
    ownerVerifiedUntil: "",
    openingHours: [],
    promotions: [],
    events: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function runSearch(options: {
  allBusinesses: BusinessFrontend[];
  query?: string;
  cityFilter?: string;
  locationFilter?: string;
  radiusKm?: number | null;
  distanceOrigin?: { lat: number; lng: number } | null;
}): BusinessFrontend[] {
  return filterBusinesses({
    allBusinesses: options.allBusinesses,
    query: options.query || "",
    categoryFilter: "",
    cityFilter: options.cityFilter || "",
    locationFilter: options.locationFilter || "",
    countryFilter: "",
    stateFilter: "",
    eventsFilter: "",
    radiusKm: options.radiusKm ?? null,
    effectiveRadiusKm: options.radiusKm ?? null,
    hasLocationContext: !!(options.cityFilter || options.locationFilter),
    hasTypedLocation: !!(options.locationFilter || "").trim(),
    distanceOrigin: options.distanceOrigin ?? null,
    categorySynonymsMap: {},
    searchSynonyms,
    categoryKeywords,
    categoryFilterAliases,
    cityAliases,
    strictSearchMode: true,
    strictSearchMinScore: 3,
    getCategoryLabel: (value) => value,
  });
}

describe("businessSearch", () => {
  it("respeita raio de 5km para coxinha em Mirabel", () => {
    const mirabel = createBusiness({
      id: "mirabel",
      name: "Coxinha Mirabel",
      menu: [{ name: "Coxinha", description: "", price: "5" }],
      address: { ...createBusiness({}).address, city: "Mirabel", lat: 45.6794, lng: -74.0036 },
    });
    const sainteEustache = createBusiness({
      id: "sainte-eustache",
      name: "Coxinha Catupiry",
      menu: [{ name: "Coxinha cremosa com catupiry", description: "", price: "8" }],
      address: { ...createBusiness({}).address, city: "Sainte-Eustache", lat: 45.565, lng: -73.9055 },
    });

    const results = runSearch({
      allBusinesses: [mirabel, sainteEustache],
      query: "coxinha",
      radiusKm: 5,
      distanceOrigin: { lat: 45.6794, lng: -74.0036 },
    });

    expect(results.map((b) => b.id)).toEqual(["mirabel"]);
  });

  it("inclui Sainte-Eustache ao aumentar raio para 50km", () => {
    const mirabel = createBusiness({
      id: "mirabel",
      name: "Coxinha Mirabel",
      menu: [{ name: "Coxinha", description: "", price: "5" }],
      address: { ...createBusiness({}).address, city: "Mirabel", lat: 45.6794, lng: -74.0036 },
    });
    const sainteEustache = createBusiness({
      id: "sainte-eustache",
      name: "Coxinha Catupiry",
      menu: [{ name: "Coxinha cremosa com catupiry", description: "", price: "8" }],
      address: { ...createBusiness({}).address, city: "Sainte-Eustache", lat: 45.565, lng: -73.9055 },
    });

    const results = runSearch({
      allBusinesses: [mirabel, sainteEustache],
      query: "coxinha",
      radiusKm: 50,
      distanceOrigin: { lat: 45.6794, lng: -74.0036 },
    });

    expect(results.map((b) => b.id)).toEqual(["mirabel", "sainte-eustache"]);
  });

  it("reconhece cidade em português para cadastro em inglês (Tóquio/Tokyo)", () => {
    const tokyoBiz = createBusiness({
      id: "tokyo-1",
      name: "Loja em Tokyo",
      address: { ...createBusiness({}).address, city: "Tokyo", state: "Tokyo", stateCode: "13", lat: 35.6762, lng: 139.6503 },
    });

    const results = runSearch({
      allBusinesses: [tokyoBiz],
      cityFilter: "Tóquio",
      locationFilter: "Tóquio",
    });

    expect(results.map((b) => b.id)).toEqual(["tokyo-1"]);
  });
});

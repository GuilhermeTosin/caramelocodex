import { describe, expect, it } from "vitest";
import type { BusinessFrontend, CommunityEvent } from "@/types/database";
import { buildEventResults } from "@/lib/search/eventSearch";

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

function createCommunityEvent(overrides: Partial<CommunityEvent>): CommunityEvent {
  return {
    id: "evt-1",
    owner_id: "owner-1",
    business_id: null,
    title: "Evento comunidade",
    description: "Descrição",
    date: "2026-07-10",
    location: "Montreal",
    is_free: true,
    price: "",
    flyer_url: null,
    ticket_url: null,
    status: "published",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("eventSearch", () => {
  it("retorna eventos de negócio e comunidade publicados/futuros", () => {
    const business = createBusiness({
      id: "biz-1",
      name: "Padaria",
      events: [
        {
          title: "Festa Junina",
          description: "Comida típica",
          date: "2026-07-01",
          location: "Mirabel",
          isFree: false,
          price: "10",
          flyerUrl: "",
        },
      ],
    });

    const community = createCommunityEvent({
      id: "ce-1",
      title: "Arraiá da Comunidade",
      date: "2026-07-10",
      location: "Montreal",
    });

    const results = buildEventResults({
      isEventMode: true,
      query: "",
      results: [business],
      communityEvents: [community],
      allBusinesses: [business],
      today: "2026-06-01",
    });

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.type)).toEqual(["business", "community"]);
  });

  it("filtra por texto do evento", () => {
    const business = createBusiness({
      id: "biz-1",
      events: [
        {
          title: "Noite de Forró",
          description: "Música brasileira",
          date: "2026-07-01",
          location: "Mirabel",
          isFree: false,
          price: "20",
          flyerUrl: "",
        },
        {
          title: "Aula de Inglês",
          description: "Grupo de estudos",
          date: "2026-07-02",
          location: "Mirabel",
          isFree: true,
          price: "",
          flyerUrl: "",
        },
      ],
    });

    const results = buildEventResults({
      isEventMode: true,
      query: "forro musica",
      results: [business],
      communityEvents: [],
      allBusinesses: [business],
      today: "2026-06-01",
    });

    expect(results).toHaveLength(1);
    expect(results[0].evt.title).toBe("Noite de Forró");
  });
});

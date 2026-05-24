import { calculateDistance } from "@/lib/utils/geo";
import type { BusinessFrontend } from "@/types/database";

export type DistanceOrigin = { lat: number; lng: number } | null;

export type BusinessSearchInput = {
  allBusinesses: BusinessFrontend[];
  query: string;
  categoryFilter: string;
  cityFilter: string;
  locationFilter: string;
  countryFilter: string;
  stateFilter: string;
  eventsFilter: string;
  radiusKm: number | null;
  effectiveRadiusKm: number | null;
  hasLocationContext: boolean;
  hasTypedLocation: boolean;
  distanceOrigin: DistanceOrigin;
  categorySynonymsMap: Record<string, string[]>;
  searchSynonyms: Record<string, string[]>;
  categoryKeywords: Record<string, string[]>;
  categoryFilterAliases: Record<string, string[]>;
  cityAliases: Record<string, string[]>;
  strictSearchMode: boolean;
  strictSearchMinScore: number;
  getCategoryLabel: (category: string) => string;
};

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function cityMatches(
  businessCity: string,
  selectedCity: string,
  cityAliases: Record<string, string[]>
): boolean {
  const normalizedBusinessCity = normalizeText(businessCity);
  const normalizedSelectedCity = normalizeText(selectedCity);
  if (!normalizedBusinessCity || !normalizedSelectedCity) return false;

  const businessTerms = expandCityTerms(normalizedBusinessCity, cityAliases);
  const selectedTerms = expandCityTerms(normalizedSelectedCity, cityAliases);
  const hasAliasIntersection = businessTerms.some((term) => selectedTerms.includes(term));
  if (hasAliasIntersection) return true;

  return (
    normalizedBusinessCity === normalizedSelectedCity ||
    normalizedBusinessCity.includes(normalizedSelectedCity) ||
    normalizedSelectedCity.includes(normalizedBusinessCity)
  );
}

export function buildCityAliases(groups: string[][]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  groups.forEach((group) => {
    const normalized = Array.from(new Set(group.map((c) => normalizeText(c))));
    normalized.forEach((name) => {
      map[name] = normalized.filter((other) => other !== name);
    });
  });
  return map;
}

export function filterBusinesses(input: BusinessSearchInput): BusinessFrontend[] {
  const {
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
    searchSynonyms,
    categoryKeywords,
    categoryFilterAliases,
    cityAliases,
    strictSearchMode,
    strictSearchMinScore,
    getCategoryLabel,
  } = input;

  let filtered = allBusinesses;
  const baseBusinesses = allBusinesses;
  const scoreByBusinessId = new Map<string, number>();

  if (query) {
    const q = normalizeText(query);
    const relatedTerms = Array.from(
      new Set([
        ...(searchSynonyms[q] || []),
        ...getCategoryTermsMatchedBySynonym(q, categorySynonymsMap),
      ])
    );

    filtered = filtered.filter((b) => {
      const effectiveKeywords = getEffectiveCategoryKeywords(
        b.category,
        categorySynonymsMap,
        categoryKeywords,
        categoryFilterAliases,
        getCategoryLabel
      );
      const score = getBusinessMatchScore(
        b,
        q,
        effectiveKeywords,
        relatedTerms,
        categoryFilterAliases,
        getCategoryLabel
      );
      scoreByBusinessId.set(b.id, score);
      return strictSearchMode ? score >= strictSearchMinScore : score > 0;
    });
  }

  if (categoryFilter) {
    filtered = filtered.filter((b) =>
      matchesCategoryFilter(b.category, categoryFilter, categoryFilterAliases, getCategoryLabel)
    );
  }

  if (eventsFilter === "1") {
    const today = new Date().toISOString().slice(0, 10);
    filtered = filtered.filter((b) => (b.events || []).some((event) => !!event?.date && event.date >= today));
  }

  if (cityFilter && !(distanceOrigin && effectiveRadiusKm)) {
    filtered = filtered.filter((b) => cityMatches(b.address.city || "", cityFilter, cityAliases));
  }

  if (countryFilter) {
    filtered = filtered.filter((b) => b.address.countryCode.toLowerCase() === countryFilter.toLowerCase());
  }

  if (stateFilter) {
    filtered = filtered.filter((b) => b.address.stateCode.toLowerCase() === stateFilter.toLowerCase());
  }

  if (effectiveRadiusKm && !distanceOrigin && !hasTypedLocation) {
    filtered = [];
  } else if (effectiveRadiusKm && distanceOrigin) {
    filtered = filtered.filter((b) => {
      const distance = calculateDistance(distanceOrigin.lat, distanceOrigin.lng, b.address.lat, b.address.lng);
      return distance <= effectiveRadiusKm;
    });
  }

  if (filtered.length === 0 && distanceOrigin && hasLocationContext && !radiusKm) {
    const normalizedQuery = normalizeText(query);
    const baseScoped = baseBusinesses.filter((b) => {
      const passesQuery = !query || matchesBusinessTextQuery(b, normalizedQuery);
      const passesCategory =
        !categoryFilter ||
        matchesCategoryFilter(b.category, categoryFilter, categoryFilterAliases, getCategoryLabel);
      const passesCountry = !countryFilter || b.address.countryCode.toLowerCase() === countryFilter.toLowerCase();
      const passesState = !stateFilter || b.address.stateCode.toLowerCase() === stateFilter.toLowerCase();
      return passesQuery && passesCategory && passesCountry && passesState;
    });

    const within = (km: number) =>
      baseScoped.filter((b) => calculateDistance(distanceOrigin.lat, distanceOrigin.lng, b.address.lat, b.address.lng) <= km);

    const near150 = within(150);
    if (near150.length > 0) {
      filtered = near150;
    } else {
      const sameState = baseScoped.filter((b) => {
        const ref = baseBusinesses.find((x) => cityMatches(x.address.city || "", cityFilter || locationFilter, cityAliases));
        if (!ref) return false;
        return (
          b.address.countryCode.toLowerCase() === ref.address.countryCode.toLowerCase() &&
          b.address.stateCode.toLowerCase() === ref.address.stateCode.toLowerCase()
        );
      });
      if (sameState.length > 0) filtered = sameState;
    }
  }

  if (filtered.length === 0) {
    const hasHardFilters = !!(categoryFilter || query || cityFilter || countryFilter || stateFilter || radiusKm);

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
      if (localFallback.length > 0) return localFallback;
    }
  }

  if (query && filtered.length > 0) {
    if (distanceOrigin) {
      return [...filtered].sort((a, b) => {
        const scoreA = scoreByBusinessId.get(a.id) || 0;
        const scoreB = scoreByBusinessId.get(b.id) || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        const distA = calculateDistance(distanceOrigin.lat, distanceOrigin.lng, a.address.lat, a.address.lng);
        const distB = calculateDistance(distanceOrigin.lat, distanceOrigin.lng, b.address.lat, b.address.lng);
        return distA - distB;
      });
    }

    return [...filtered].sort((a, b) => {
      const scoreA = scoreByBusinessId.get(a.id) || 0;
      const scoreB = scoreByBusinessId.get(b.id) || 0;
      return scoreB - scoreA;
    });
  }

  if (distanceOrigin) {
    return [...filtered].sort((a, b) => {
      const distA = calculateDistance(distanceOrigin.lat, distanceOrigin.lng, a.address.lat, a.address.lng);
      const distB = calculateDistance(distanceOrigin.lat, distanceOrigin.lng, b.address.lat, b.address.lng);
      return distA - distB;
    });
  }

  return filtered;
}

function getCategoryTermsMatchedBySynonym(
  normalizedQuery: string,
  categorySynonymsMap: Record<string, string[]>
): string[] {
  if (!normalizedQuery) return [];
  const terms: string[] = [];

  for (const [categoryLabel, synonyms] of Object.entries(categorySynonymsMap || {})) {
    const hasMatch = (synonyms || []).some((syn) => {
      const normalizedSyn = normalizeText(syn || "");
      if (!normalizedSyn) return false;
      return (
        normalizedSyn === normalizedQuery ||
        matchesNormalizedQueryTokens(normalizedSyn, normalizedQuery) ||
        matchesNormalizedQueryTokens(normalizedQuery, normalizedSyn)
      );
    });
    if (hasMatch) terms.push(categoryLabel);
  }

  return terms;
}

function expandCityTerms(normalizedCity: string, cityAliases: Record<string, string[]>): string[] {
  const base = normalizedCity.trim();
  if (!base) return [];
  const aliasList = cityAliases[base] || [];
  return Array.from(new Set([base, ...aliasList.map((a) => normalizeText(a))]));
}

function matchesCategoryFilter(
  category: string,
  filter: string,
  categoryFilterAliases: Record<string, string[]>,
  getCategoryLabel: (category: string) => string
): boolean {
  const normalizedCategory = normalizeText(getCategoryLabel(category));
  const terms = categoryFilterAliases[normalizeText(filter)] || [filter];
  return terms.some((term) => normalizedCategory.includes(normalizeText(term)));
}

function getBusinessSearchBlob(b: BusinessFrontend): string {
  const menuText = (b.menu || []).map((item) => `${item?.name || ""} ${item?.description || ""}`).join(" ");
  return normalizeText(
    [
      b.name || "",
      b.description || "",
      b.category || "",
      b.address?.city || "",
      ...(b.services || []),
      ...(b.keywords || []),
      b.isVeganFriendly ? "vegano vegan" : "",
      b.isVegetarianFriendly ? "vegetariano vegetarian" : "",
      b.isGlutenFreeFriendly ? "sem gluten gluten free sem trigo" : "",
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

function getEffectiveCategoryKeywords(
  businessCategoryLabel: string,
  categorySynonymsMap: Record<string, string[]>,
  categoryKeywords: Record<string, string[]>,
  categoryFilterAliases: Record<string, string[]>,
  getCategoryLabel: (category: string) => string
): string[] {
  if (!businessCategoryLabel) return [];
  const direct = categorySynonymsMap[businessCategoryLabel];
  if (direct && direct.length > 0) return direct;

  const matchedEntry = Object.entries(categorySynonymsMap).find(([configuredCategory]) =>
    matchesCategoryFilter(businessCategoryLabel, configuredCategory, categoryFilterAliases, getCategoryLabel)
  );
  if (matchedEntry && matchedEntry[1].length > 0) return matchedEntry[1];

  return categoryKeywords[businessCategoryLabel] || [];
}

function matchesNormalizedQueryTokens(targetNormalizedText: string, queryNormalizedText: string): boolean {
  if (!targetNormalizedText || !queryNormalizedText) return false;
  const targetTokens = new Set(targetNormalizedText.split(/\s+/).filter(Boolean));
  const queryTokens = queryNormalizedText.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return false;
  return queryTokens.every((token) => targetTokens.has(token));
}

function getBusinessMatchScore(
  b: BusinessFrontend,
  normalizedQuery: string,
  categoryKeywords: string[],
  relatedTerms: string[],
  categoryFilterAliases: Record<string, string[]>,
  getCategoryLabel: (category: string) => string
): number {
  if (!normalizedQuery) return 1;
  const directTextMatch = matchesBusinessTextQuery(b, normalizedQuery);
  const categoryKeywordMatch = (categoryKeywords || []).some((kw) =>
    matchesNormalizedQueryTokens(normalizeText(kw), normalizedQuery)
  );
  const synonymCategoryMatch = (relatedTerms || []).some((term) =>
    matchesCategoryFilter(b.category, term, categoryFilterAliases, getCategoryLabel)
  );

  let score = 0;
  if (directTextMatch) score += 5;
  if (categoryKeywordMatch) score += 3;
  if (synonymCategoryMatch) score += 2;
  return score;
}

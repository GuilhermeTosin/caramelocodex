import type { BusinessFrontend, CommunityEvent } from "@/types/database";
import { normalizeText } from "@/lib/search/businessSearch";

export type BusinessBackedEventResult = {
  type: "business";
  biz: BusinessFrontend;
  evt: BusinessFrontend["events"][number];
  key: string;
};

export type CommunityEventResult = {
  type: "community";
  evt: CommunityEvent;
  linkedBiz: BusinessFrontend | null;
  key: string;
};

export type EventSearchResult = BusinessBackedEventResult | CommunityEventResult;

export function buildEventResults(input: {
  isEventMode: boolean;
  query: string;
  results: BusinessFrontend[];
  communityEvents: CommunityEvent[];
  allBusinesses: BusinessFrontend[];
  today?: string;
}): EventSearchResult[] {
  const { isEventMode, query, results, communityEvents, allBusinesses } = input;
  if (!isEventMode) return [];

  const today = input.today || new Date().toISOString().slice(0, 10);
  const q = normalizeText(query);
  const matchesEventQuery = (evt: { title: string; description: string; location: string }) => {
    if (!q) return true;
    const blob = normalizeText(`${evt.title || ""} ${evt.description || ""} ${evt.location || ""}`);
    return q.split(/\s+/).filter(Boolean).every((term) => blob.includes(term));
  };

  const businessBacked: BusinessBackedEventResult[] = results.flatMap((biz) =>
    (biz.events || [])
      .filter((evt) => !!evt?.date && evt.date >= today)
      .filter(matchesEventQuery)
      .map((evt, idx) => ({
        type: "business" as const,
        biz,
        evt,
        key: `${biz.id}-${evt.title}-${evt.date}-${idx}`,
      }))
  );

  const standalone: CommunityEventResult[] = communityEvents
    .filter((evt) => !evt.business_id)
    .filter((evt) => !!evt?.date && evt.date >= today)
    .filter((evt) => matchesEventQuery({ title: evt.title, description: evt.description, location: evt.location }))
    .map((evt) => ({
      type: "community" as const,
      evt,
      linkedBiz: evt.business_id ? allBusinesses.find((b) => b.id === evt.business_id) || null : null,
      key: `community-${evt.id}`,
    }));

  return [...businessBacked, ...standalone].sort((a, b) => a.evt.date.localeCompare(b.evt.date));
}

import { supabase } from "@/lib/supabase";
import { toFrontend } from "@/services/businesses";
import type {
  Business,
  BusinessFrontend,
  FeaturedPlacement,
  FeaturedPlacementFrontend,
  FeaturedPlacementStatus,
  FeaturedScopeType,
} from "@/types/database";

export interface FeaturedRegion {
  countryCode?: string;
  stateCode?: string;
  city?: string;
}

export interface FeaturedPlacementInput {
  businessId: string;
  scopeType: FeaturedScopeType;
  countryCode?: string;
  stateCode?: string;
  city?: string;
  category?: string;
  startsAt: string;
  endsAt: string;
  priority?: number;
  status?: FeaturedPlacementStatus;
  notes?: string;
  priceCents?: number;
}

export async function getFeaturedBusinessesForRegion(
  region: FeaturedRegion | null,
  limit = 6
): Promise<BusinessFrontend[]> {
  const placements = await getActiveFeaturedPlacements();
  const matching = placements
    .filter((placement) => matchesRegion(placement, region))
    .sort(compareFeaturedPlacements);

  return uniqueBusinesses(matching)
    .slice(0, limit)
    .map((placement) => placement.business)
    .filter(Boolean) as BusinessFrontend[];
}

export async function getFeaturedPlacementsForAdmin(): Promise<FeaturedPlacementFrontend[]> {
  const { data, error } = await supabase
    .from("featured_placements")
    .select("*, business:businesses(*)")
    .order("status", { ascending: true })
    .order("priority", { ascending: false })
    .order("ends_at", { ascending: true });

  if (error || !data) return [];
  return (data as FeaturedPlacement[]).map(toFeaturedFrontend);
}

export async function createFeaturedPlacement(
  input: FeaturedPlacementInput
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("featured_placements").insert({
    business_id: input.businessId,
    scope_type: input.scopeType,
    country_code: input.countryCode || "",
    state_code: input.stateCode || "",
    city: input.city || "",
    category: input.category || "",
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    priority: input.priority || 0,
    status: input.status || "active",
    notes: input.notes || "",
    price_cents: input.priceCents || 0,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateFeaturedPlacementStatus(
  id: string,
  status: FeaturedPlacementStatus
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("featured_placements")
    .update({ status })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteFeaturedPlacement(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("featured_placements")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function getActiveFeaturedPlacements(): Promise<FeaturedPlacementFrontend[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("featured_placements")
    .select("*, business:businesses(*)")
    .eq("status", "active")
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as FeaturedPlacement[]).map(toFeaturedFrontend);
}

function toFeaturedFrontend(placement: FeaturedPlacement): FeaturedPlacementFrontend {
  return {
    id: placement.id,
    businessId: placement.business_id,
    business: placement.business ? toFrontend(placement.business as Business) : undefined,
    scopeType: placement.scope_type,
    countryCode: placement.country_code || "",
    stateCode: placement.state_code || "",
    city: placement.city || "",
    category: placement.category || "",
    startsAt: placement.starts_at,
    endsAt: placement.ends_at,
    priority: placement.priority || 0,
    status: placement.status,
    notes: placement.notes || "",
    priceCents: placement.price_cents || 0,
  };
}

function matchesRegion(placement: FeaturedPlacementFrontend, region: FeaturedRegion | null): boolean {
  if (placement.scopeType === "global") return true;
  if (!region) return false;

  const countryMatches = sameRegionPart(placement.countryCode, region.countryCode);
  const stateMatches = sameRegionPart(placement.stateCode, region.stateCode);
  const cityMatches = sameRegionPart(placement.city, region.city);

  if (placement.scopeType === "country") return countryMatches;
  if (placement.scopeType === "state") return countryMatches && stateMatches;
  if (placement.scopeType === "city") return countryMatches && stateMatches && cityMatches;

  return false;
}

function compareFeaturedPlacements(
  a: FeaturedPlacementFrontend,
  b: FeaturedPlacementFrontend
): number {
  const priority = b.priority - a.priority;
  if (priority !== 0) return priority;
  return a.endsAt.localeCompare(b.endsAt);
}

function uniqueBusinesses(placements: FeaturedPlacementFrontend[]): FeaturedPlacementFrontend[] {
  const seen = new Set<string>();
  return placements.filter((placement) => {
    if (!placement.business || seen.has(placement.businessId)) return false;
    seen.add(placement.businessId);
    return true;
  });
}

function sameRegionPart(a?: string, b?: string): boolean {
  return normalizeRegionPart(a || "") === normalizeRegionPart(b || "");
}

function normalizeRegionPart(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

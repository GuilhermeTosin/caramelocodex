import { supabase } from "@/lib/supabase";
import type { BusinessEvent, CommunityEvent } from "@/types/database";

export type CommunityEventInput = {
  businessId?: string | null;
  title: string;
  description: string;
  date: string;
  location: string;
  isFree: boolean;
  price: string;
  flyerUrl?: string | null;
  ticketUrl?: string | null;
  status?: "draft" | "published" | "archived";
};

export async function getPublishedCommunityEvents(): Promise<CommunityEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error || !data) return [];
  return data as CommunityEvent[];
}

export async function getCommunityEventsByOwner(ownerId: string): Promise<CommunityEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("owner_id", ownerId)
    .order("date", { ascending: true });

  if (error || !data) return [];
  return data as CommunityEvent[];
}

export async function getCommunityEventsByOwnerAndBusiness(
  ownerId: string,
  businessId: string
): Promise<CommunityEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("business_id", businessId)
    .order("date", { ascending: true });

  if (error || !data) return [];
  return data as CommunityEvent[];
}

export async function getCommunityEventById(id: string): Promise<CommunityEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as CommunityEvent;
}

export async function createCommunityEvent(
  ownerId: string,
  input: CommunityEventInput
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("events").insert({
    owner_id: ownerId,
    business_id: input.businessId || null,
    title: input.title.trim(),
    description: input.description.trim(),
    date: input.date,
    location: input.location.trim(),
    is_free: input.isFree,
    price: (input.price || "").trim(),
    flyer_url: input.flyerUrl || null,
    ticket_url: input.ticketUrl || null,
    status: input.status || "published",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteCommunityEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data: target, error: targetError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (targetError) return { ok: false, error: targetError.message };
  if (!target) return { ok: false, error: "Evento não encontrado." };

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Sincroniza legado: remove também do JSON businesses.events, se estiver vinculado.
  if (target.business_id) {
    const { data: biz, error: bizError } = await supabase
      .from("businesses")
      .select("id, events")
      .eq("id", target.business_id)
      .maybeSingle();

    if (!bizError && biz) {
      const legacyEvents = Array.isArray((biz as any).events) ? (biz as any).events : [];
      const filtered = legacyEvents.filter((evt: any) => {
        const sameTitle = String(evt?.title || "").trim() === String(target.title || "").trim();
        const sameDate = String(evt?.date || "") === String(target.date || "");
        const sameLocation = String(evt?.location || "").trim() === String(target.location || "").trim();
        return !(sameTitle && sameDate && sameLocation);
      });

      await supabase
        .from("businesses")
        .update({ events: filtered })
        .eq("id", target.business_id);
    }
  }

  return { ok: true };
}

export async function updateCommunityEvent(
  id: string,
  input: CommunityEventInput
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("events")
    .update({
      business_id: input.businessId || null,
      title: input.title.trim(),
      description: input.description.trim(),
      date: input.date,
      location: input.location.trim(),
      is_free: input.isFree,
      price: (input.price || "").trim(),
      flyer_url: input.flyerUrl || null,
      ticket_url: input.ticketUrl || null,
      status: input.status || "published",
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function replaceBusinessLinkedEvents(
  ownerId: string,
  businessId: string,
  events: BusinessEvent[]
): Promise<{ ok: boolean; error?: string }> {
  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("owner_id", ownerId)
    .eq("business_id", businessId);

  if (deleteError) return { ok: false, error: deleteError.message };

  if (events.length === 0) return { ok: true };

  const rows = events.map((evt) => ({
    owner_id: ownerId,
    business_id: businessId,
    title: evt.title.trim(),
    description: (evt.description || "").trim(),
    date: evt.date,
    location: evt.location.trim(),
    is_free: !!evt.isFree,
    price: evt.isFree ? "" : (evt.price || "").trim(),
    flyer_url: evt.flyerUrl || null,
    ticket_url: evt.ticketUrl || null,
    status: "published",
  }));

  const { error: insertError } = await supabase.from("events").insert(rows);
  if (insertError) return { ok: false, error: insertError.message };
  return { ok: true };
}

import { supabase } from "@/lib/supabase";

export type BusinessClickEventType =
  | "whatsapp"
  | "phone"
  | "email"
  | "website"
  | "internal_message"
  | "route";

export async function trackBusinessClick(
  businessId: string,
  eventType: BusinessClickEventType,
  userId?: string | null
): Promise<void> {
  await supabase.from("business_click_events").insert({
    business_id: businessId,
    event_type: eventType,
    user_id: userId || null,
  });
}

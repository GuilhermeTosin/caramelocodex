import { supabase } from "@/lib/supabase";
import type { BusinessReport } from "@/types/database";

export async function createBusinessReport(payload: {
  businessId: string;
  reason: BusinessReport["reason"];
  details?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("reports").insert({
    business_id: payload.businessId,
    reporter_user_id: null,
    reporter_email: null,
    reason: payload.reason,
    details: payload.details?.trim() || null,
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getReportsForAdmin(
  mode: "active" | "archived" = "active"
): Promise<BusinessReport[]> {
  const query = supabase
    .from("reports")
    .select("*, business:businesses(id,name,slug,city,state_code,country_code)")
    .order("created_at", { ascending: false });

  const { data, error } =
    mode === "archived" ? await query.not("archived_at", "is", null) : await query.is("archived_at", null);

  if (error || !data) return [];
  return data as BusinessReport[];
}

export async function updateReportStatus(
  id: string,
  status: BusinessReport["status"]
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("reports").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function archiveReport(
  id: string,
  archivedBy: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("reports")
    .update({ archived_at: new Date().toISOString(), archived_by: archivedBy })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function unarchiveReport(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("reports")
    .update({ archived_at: null, archived_by: null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}





import { supabase } from "@/lib/supabase";
import type { CommunityFindReport } from "@/types/database";

export async function createCommunityFindReport(payload: {
  findId: string;
  reportedMessageId?: string | null;
  reason: CommunityFindReport["reason"];
  details?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, error: "Faça login para denunciar." };
  }

  const { error } = await supabase.from("community_find_reports").insert({
    find_id: payload.findId,
    reported_message_id: payload.reportedMessageId || null,
    reporter_user_id: authData.user.id,
    reason: payload.reason,
    details: payload.details?.trim() || null,
    status: "pending",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getCommunityFindReportsForAdmin(
  mode: "active" | "archived" = "active"
): Promise<CommunityFindReport[]> {
  const query = supabase
    .from("community_find_reports")
    .select("*, find:community_finds(id,product_name,location_name), message:community_find_messages(id,message)")
    .order("created_at", { ascending: false });

  const { data, error } =
    mode === "archived" ? await query.not("archived_at", "is", null) : await query.is("archived_at", null);

  if (error || !data) return [];
  return data as CommunityFindReport[];
}

export async function updateCommunityFindReportStatus(
  id: string,
  status: CommunityFindReport["status"]
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("community_find_reports").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function archiveCommunityFindReport(
  id: string,
  archivedBy: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("community_find_reports")
    .update({ archived_at: new Date().toISOString(), archived_by: archivedBy })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function unarchiveCommunityFindReport(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("community_find_reports")
    .update({ archived_at: null, archived_by: null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

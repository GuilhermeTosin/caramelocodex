import { supabase } from "@/lib/supabase";
import type { BusinessVerificationRequest } from "@/types/database";

export async function requestBusinessVerification(payload: {
  businessId: string;
  ownerId: string;
  instagramPostUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("business_verification_requests").insert({
    business_id: payload.businessId,
    owner_id: payload.ownerId,
    instagram_post_url: payload.instagramPostUrl.trim(),
    status: "pending",
  });
  if (error) {
    const raw = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`;
    if (raw.includes("uq_bvr_pending_per_business") || raw.toLowerCase().includes("duplicate key value")) {
      return { ok: false, error: "Já existe uma solicitação de verificação pendente para este negócio." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getPendingVerificationRequestsForAdmin(): Promise<BusinessVerificationRequest[]> {
  const { data, error } = await supabase
    .from("business_verification_requests")
    .select("*, business:businesses(id,name,city,country_code,owner_verified,owner_verified_until)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as BusinessVerificationRequest[];
}

export async function getVerificationRequestsByOwner(ownerId: string): Promise<BusinessVerificationRequest[]> {
  const { data, error } = await supabase
    .from("business_verification_requests")
    .select("*, business:businesses(id,name,city,country_code,owner_verified,owner_verified_until)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as BusinessVerificationRequest[];
}

export async function setVerificationRequestStatus(
  id: string,
  status: "approved" | "rejected",
  reviewerId: string,
  notes?: string
): Promise<{ ok: boolean; error?: string; businessId?: string }> {
  const { data, error } = await supabase
    .from("business_verification_requests")
    .update({
      status,
      notes: notes?.trim() || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("business_id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, businessId: data?.business_id };
}

export async function setBusinessVerifiedFlag(
  businessId: string,
  verified: boolean,
  verifiedUntil?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const payload: { owner_verified: boolean; owner_verified_until?: string | null } = {
    owner_verified: verified,
  };
  if (verified) {
    payload.owner_verified_until = verifiedUntil || null;
  } else {
    payload.owner_verified_until = null;
  }

  const { data, error } = await supabase
    .from("businesses")
    .update(payload)
    .eq("id", businessId)
    .select("id, owner_verified, owner_verified_until")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) {
    return { ok: false, error: "Nenhum registro foi atualizado. Verifique permissões de admin (RLS) para este negócio." };
  }
  if (Boolean(data.owner_verified) !== Boolean(verified)) {
    return { ok: false, error: "A alteração foi bloqueada por regra de consistência do banco para este negócio." };
  }

  return { ok: true };
}

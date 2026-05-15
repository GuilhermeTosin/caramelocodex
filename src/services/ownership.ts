import { supabase } from "@/lib/supabase";
import type { BusinessFrontend, OwnerClaimRequest } from "@/types/database";

export async function requestBusinessOwnership(
  businessId: string,
  message: string
): Promise<{ ok: boolean; requestId?: string; error?: string }> {
  const { data, error } = await supabase.rpc("request_business_ownership", {
    p_business_id: businessId,
    p_message: message,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, requestId: data as string };
}

export async function getMyOwnershipRequests(): Promise<OwnerClaimRequest[]> {
  const { data, error } = await supabase
    .from("owner_claim_requests")
    .select(`
      *,
      business:businesses(id, name, city, country_code, owner_id)
    `)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as OwnerClaimRequest[];
}

export async function getPendingOwnershipRequests(): Promise<OwnerClaimRequest[]> {
  const { data, error } = await supabase
    .from("owner_claim_requests")
    .select(`
      *,
      business:businesses(id, name, city, country_code, owner_id)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as OwnerClaimRequest[];
}

export async function approveOwnershipRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("approve_business_ownership_request", {
    p_request_id: requestId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function rejectOwnershipRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("reject_business_ownership_request", {
    p_request_id: requestId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function transferBusinessOwnershipByEmail(
  businessId: string,
  newOwnerEmail: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("transfer_business_ownership_by_email", {
    p_business_id: businessId,
    p_new_owner_email: newOwnerEmail,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function hasPendingClaimForBusiness(
  requests: OwnerClaimRequest[],
  business: BusinessFrontend
): boolean {
  return requests.some(
    (request) => request.business_id === business.id && request.status === "pending"
  );
}

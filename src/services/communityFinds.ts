import { supabase } from "@/lib/supabase";
import type { CommunityFind, CommunityFindCategory, CommunityFindWithVote } from "@/types/database";

export type CreateCommunityFindInput = {
  productName: string;
  locationName: string;
  category: CommunityFindCategory;
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
  photoUrl?: string | null;
};

type VoteDirection = -1 | 0 | 1;

export async function createCommunityFind(
  input: CreateCommunityFindInput
): Promise<{ ok: boolean; error?: string }> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, error: "Faça login para publicar um achadinho." };
  }

  const { error } = await supabase.from("community_finds").insert({
    user_id: authData.user.id,
    product_name: input.productName.trim(),
    location_name: input.locationName.trim(),
    category: input.category,
    lat: input.lat,
    lng: input.lng,
    accuracy_meters: input.accuracyMeters ?? null,
    photo_url: input.photoUrl ?? null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getActiveCommunityFinds(): Promise<CommunityFindWithVote[]> {
  const nowIso = new Date().toISOString();
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData.user?.id || null;

  const { data, error } = await supabase
    .from("community_finds")
    .select("*")
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const finds = (data as CommunityFind[]).filter((find) => find.upvotes - find.downvotes >= -3);
  if (!currentUserId || finds.length === 0) return finds;

  const ids = finds.map((f) => f.id);
  const { data: votesRows } = await supabase
    .from("community_find_votes")
    .select("find_id, vote")
    .eq("user_id", currentUserId)
    .in("find_id", ids);

  const voteByFindId = new Map<string, -1 | 1>(
    (votesRows || []).map((row: any) => [row.find_id as string, row.vote as -1 | 1])
  );

  return finds.map((find) => ({
    ...find,
    user_vote: voteByFindId.get(find.id) ?? null,
  }));
}

export async function voteCommunityFind(
  findId: string,
  vote: VoteDirection
): Promise<{ ok: boolean; upvotes?: number; downvotes?: number; userVote?: -1 | 1 | null; error?: string }> {
  const { data, error } = await supabase.rpc("vote_community_find", {
    p_find_id: findId,
    p_vote: vote,
  });

  if (error) return { ok: false, error: error.message };
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return { ok: false, error: "Não foi possível processar seu voto." };

  return {
    ok: true,
    upvotes: Number(row.upvotes || 0),
    downvotes: Number(row.downvotes || 0),
    userVote: row.user_vote === 1 || row.user_vote === -1 ? row.user_vote : null,
  };
}

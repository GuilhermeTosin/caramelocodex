import { supabase } from "@/lib/supabase";
import type {
  CommunityFind,
  CommunityFindCategory,
  CommunityFindMessage,
  CommunityFindWithVote,
} from "@/types/database";

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

export async function getCommunityFindsByOwner(ownerId: string): Promise<CommunityFind[]> {
  const { data, error } = await supabase
    .from("community_finds")
    .select("*")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as CommunityFind[];
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

export async function getCommunityFindMessages(findId: string): Promise<CommunityFindMessage[]> {
  const { data, error } = await supabase
    .from("community_find_messages")
    .select("id, find_id, user_id, parent_message_id, message, created_at, updated_at")
    .eq("find_id", findId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const rows = data as CommunityFindMessage[];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  if (userIds.length === 0) return rows;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar")
    .in("id", userIds);

  const profileById = new Map<string, { name: string; avatar: string | null }>(
    (profiles || []).map((p: any) => [p.id as string, { name: p.name || "Usuário", avatar: p.avatar || null }])
  );

  return rows.map((row) => ({
    ...row,
    user_name: profileById.get(row.user_id)?.name || "Usuário",
    user_avatar: profileById.get(row.user_id)?.avatar || null,
  }));
}

export async function addCommunityFindMessage(
  findId: string,
  message: string,
  parentMessageId?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const text = message.trim();
  if (!text) return { ok: false, error: "Digite uma mensagem." };
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, error: "Faça login para comentar." };
  }

  const { error } = await supabase.from("community_find_messages").insert({
    find_id: findId,
    user_id: authData.user.id,
    parent_message_id: parentMessageId || null,
    message: text,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateCommunityFindMessage(
  messageId: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const text = message.trim();
  if (!text) return { ok: false, error: "A mensagem não pode ficar vazia." };

  const { error } = await supabase
    .from("community_find_messages")
    .update({ message: text })
    .eq("id", messageId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteCommunityFindMessage(
  messageId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("community_find_messages").delete().eq("id", messageId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteCommunityFind(findId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("community_finds").delete().eq("id", findId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateCommunityFind(
  findId: string,
  payload: { productName: string; locationName: string; category: CommunityFindCategory }
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("community_finds")
    .update({
      product_name: payload.productName.trim(),
      location_name: payload.locationName.trim(),
      category: payload.category,
    })
    .eq("id", findId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

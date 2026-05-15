import { supabase } from "@/lib/supabase";
import type { Profile, UserFrontend } from "@/types/database";

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, "name" | "bio" | "phone" | "location" | "avatar">>
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id, ...updates });
  return !error;
}

export async function getProfileToFrontend(id: string): Promise<UserFrontend | null> {
  const profile = await getProfileById(id);
  if (!profile) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    id: profile.id,
    email: user?.email || "",
    name: profile.name,
    bio: profile.bio || "",
    phone: profile.phone || "",
    location: profile.location || "",
    avatar: profile.avatar || "",
    role: profile.role || "user",
    createdAt: profile.created_at,
  };
}

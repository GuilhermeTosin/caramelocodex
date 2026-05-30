import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommunityFindWithVote } from "@/types/database";
import { getActiveCommunityFinds, voteCommunityFind } from "@/services/communityFinds";

export function useCommunityFinds() {
  const [finds, setFinds] = useState<CommunityFindWithVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getActiveCommunityFinds();
      setFinds(rows);
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar os achadinhos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void reload();
    });
    return () => {
      active = false;
    };
  }, [reload]);

  const vote = useCallback(
    async (findId: string, direction: "upvote" | "downvote" | "clear") => {
      const desiredVote = direction === "upvote" ? 1 : direction === "downvote" ? -1 : 0;
      const result = await voteCommunityFind(findId, desiredVote);
      if (!result.ok) {
        return { ok: false as const, error: result.error || "Não foi possível votar." };
      }

      setFinds((prev) =>
        prev.map((find) =>
          find.id === findId
            ? {
                ...find,
                upvotes: result.upvotes ?? find.upvotes,
                downvotes: result.downvotes ?? find.downvotes,
                user_vote: result.userVote ?? null,
              }
            : find
        )
      );

      return { ok: true as const };
    },
    []
  );

  const activeFinds = useMemo(() => finds, [finds]);

  return {
    finds: activeFinds,
    loading,
    error,
    reload,
    vote,
  };
}

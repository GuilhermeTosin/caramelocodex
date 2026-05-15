import { useEffect, useState } from "react";
import { loadGoogleMapsApi, isMapsApiAvailable } from "@/lib/google-maps";

/** Hook que carrega a API do Google Maps e retorna o estado de carregamento. */
export function useGoogleMaps() {
  const available = isMapsApiAvailable();
  const [maps, setMaps] = useState<typeof google.maps | null>(null);
  const [error, setError] = useState<string | null>(
    available ? null : "API key não configurada",
  );
  const [loading, setLoading] = useState(available);

  useEffect(() => {
    if (!available) return;

    let cancelled = false;

    loadGoogleMapsApi()
      .then((m) => {
        if (!cancelled) {
          setMaps(m);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar Google Maps");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [available]);

  return { maps, loading, error, available };
}

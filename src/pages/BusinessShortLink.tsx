import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { getBusinessByShortSlug, buildBusinessUrl } from "@/services/businesses";
import { Button } from "@/components/ui/button";

export default function BusinessShortLink() {
  const navigate = useNavigate();
  const { businessSlug = "" } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const business = await getBusinessByShortSlug(businessSlug);
        if (cancelled) return;
        if (!business) {
          setLoading(false);
          return;
        }
        navigate(buildBusinessUrl(business), { replace: true });
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businessSlug, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <PawPrint className="w-10 h-10 mx-auto text-muted-foreground/60 animate-pulse" />
          <p className="mt-3 text-muted-foreground">Abrindo o negócio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-foreground">Negócio não encontrado</h1>
        <p className="mt-2 text-muted-foreground">Esse link curto não está mais disponível.</p>
        <div className="mt-6">
          <Link to="/">
            <Button>
              <PawPrint className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


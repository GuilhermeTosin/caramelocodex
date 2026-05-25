import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, MapPin, Ticket, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SiteFooter from "@/components/SiteFooter";
import { getCommunityEventById } from "@/services/events";
import type { CommunityEvent } from "@/types/database";
import { setSeoMeta } from "@/lib/seo";

export default function EventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    getCommunityEventById(eventId).then((data) => {
      setEvent(data);
      setLoading(false);
      if (data) {
        setSeoMeta(
          `${data.title} | Evento | Caramelinho.com`,
          `${data.title} em ${data.location}. Veja data, detalhes e informações do evento.`
        );
      } else {
        setSeoMeta("Evento | Caramelinho.com", "Detalhes de evento da comunidade.");
      }
    });
  }, [eventId]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando evento...</div>;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Evento não encontrado</h1>
          <p className="text-muted-foreground mt-2">Esse evento não está disponível no momento.</p>
          <Button className="mt-6" onClick={() => navigate("/buscar")}>Voltar para busca</Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
              <img src="/logo.png" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-extrabold text-lg sm:text-2xl tracking-tight caramelo-text-gradient truncate">Caramelinho</div>
              <div className="text-[10px] sm:text-sm font-semibold text-foreground/75 whitespace-nowrap overflow-hidden text-ellipsis">O SEU FARO FORA DO BRASIL</div>
            </div>
          </Link>
          <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Card className="overflow-hidden border-border">
          <div className="aspect-[16/8] bg-muted">
            <img
              src={event.flyer_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground mt-3 whitespace-pre-line">{event.description || "Sem descrição."}</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
                <CalendarDays className="w-4 h-4 text-amber-600" />
                {new Date(`${event.date}T00:00:00`).toLocaleDateString("pt-BR")}
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 hover:bg-secondary/80"
              >
                <MapPin className="w-4 h-4 text-amber-600" />
                {event.location}
              </a>
              <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
                <Ticket className="w-4 h-4 text-amber-600" />
                {event.is_free ? "Entrada franca" : (event.price || "Evento pago")}
              </div>
              <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
                <User className="w-4 h-4 text-amber-600" />
                Publicado por membro da comunidade
              </div>
            </div>

            {event.ticket_url ? (
              <div className="mt-6">
                <a href={event.ticket_url} target="_blank" rel="noopener noreferrer nofollow">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                    Comprar ingressos
                  </Button>
                </a>
              </div>
            ) : null}
          </div>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { buildBusinessUrl } from "@/services/businesses";
import type { BusinessFrontend } from "@/types/database";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MapViewProps {
  businesses: BusinessFrontend[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function MapView({ businesses, center, zoom = 11 }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<GoogleMapMarker[]>([]);
  const navigate = useNavigate();
  const { maps, loading, error, available } = useGoogleMaps();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Calcular centro automático baseado nos negócios
  const autoCenter = useCallback((): { lat: number; lng: number } => {
    if (center) return center;
    if (businesses.length === 0) return { lat: 45.5017, lng: -73.5673 }; // Montreal
    const avgLat = businesses.reduce((s, b) => s + b.address.lat, 0) / businesses.length;
    const avgLng = businesses.reduce((s, b) => s + b.address.lng, 0) / businesses.length;
    return { lat: avgLat, lng: avgLng };
  }, [businesses, center]);

  useEffect(() => {
    if (!maps || !mapRef.current || mapInstanceRef.current) return;

    const loc = autoCenter();
    mapInstanceRef.current = new maps.Map(mapRef.current, {
      center: loc,
      zoom,
      mapId: "caramelinho_map",
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: true,
    });

    return () => {
      mapInstanceRef.current = null;
    };
  }, [autoCenter, maps, zoom]);

  // Atualizar markers quando businesses mudar
  useEffect(() => {
    if (!maps || !mapInstanceRef.current) return;

    // Limpar markers antigos
    markersRef.current.forEach(clearMarker);
    markersRef.current = [];

    if (!maps.marker?.AdvancedMarkerElement) {
      // Fallback para markers tradicionais se AdvancedMarkerElement não existir
      businesses.forEach((biz) => {
        if (!biz.address.lat || !biz.address.lng) return;
        const marker = new maps.Marker({
          position: { lat: biz.address.lat, lng: biz.address.lng },
          map: mapInstanceRef.current!,
          title: biz.name,
          animation: google.maps.Animation.DROP,
          icon: {
            url: svgToDataUrl(getBrazilFlagPinSvg(false)),
            scaledSize: new google.maps.Size(44, 54),
            anchor: new google.maps.Point(22, 52),
          },
        });
        marker.addListener("click", () => {
          navigate(buildMarkerUrl(biz));
        });
        markersRef.current.push(marker);
      });

      // Ajustar bounds ou centro
      if (businesses.length > 0) {
        if (businesses.length === 1) {
          const biz = businesses[0];
          mapInstanceRef.current.setCenter({ lat: biz.address.lat, lng: biz.address.lng });
          mapInstanceRef.current.setZoom(14);
        } else {
          const bounds = new maps.LatLngBounds();
          businesses.forEach((biz) => {
            if (biz.address.lat && biz.address.lng) {
              bounds.extend({ lat: biz.address.lat, lng: biz.address.lng });
            }
          });
          mapInstanceRef.current.fitBounds(bounds, 50);
        }
      }
      return;
    }

    // Usar AdvancedMarkerElement com pins estilizados com a bandeira do Brasil
    businesses.forEach((biz) => {
      if (!biz.address.lat || !biz.address.lng) return;

      const pinElement = document.createElement("div");
      pinElement.className = "cursor-pointer transition-transform hover:scale-110";
      
      const isSelected = selectedId === biz.id;
      
      pinElement.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3));">
          ${getBrazilFlagPinSvg(isSelected)}
          <!-- Nome do negócio -->
          <div style="
            margin-top: -4px;
            background: white;
            color: #1f2937;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            border: 1px solid rgba(0,0,0,0.08);
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            position: relative;
            z-index: 1;
          ">
            ${escapeHtml(biz.name.length > 18 ? biz.name.slice(0, 16) + '...' : biz.name)}
          </div>
        </div>
      `;

      const marker = new maps.marker.AdvancedMarkerElement({
        position: { lat: biz.address.lat, lng: biz.address.lng },
        map: mapInstanceRef.current!,
        content: pinElement,
        title: biz.name,
      });

      const handleMarkerClick = () => {
        setSelectedId(biz.id);
        navigate(buildMarkerUrl(biz));
      };

      if (typeof marker.addEventListener === "function") {
        marker.addEventListener("gmp-click", handleMarkerClick);
      }
      if (typeof (marker as any).addListener === "function") {
        (marker as any).addListener("click", handleMarkerClick);
      }
      pinElement.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleMarkerClick();
      });

      markersRef.current.push(marker);
    });

    // Ajustar zoom para mostrar todos ou focar em um
    if (businesses.length > 0) {
      if (businesses.length === 1) {
        const biz = businesses[0];
        mapInstanceRef.current.setCenter({ lat: biz.address.lat, lng: biz.address.lng });
        mapInstanceRef.current.setZoom(14);
      } else {
        const bounds = new maps.LatLngBounds();
        businesses.forEach((biz) => {
          if (biz.address.lat && biz.address.lng) {
            bounds.extend({ lat: biz.address.lat, lng: biz.address.lng });
          }
        });
        mapInstanceRef.current.fitBounds(bounds, 50);
      }
    }
  }, [maps, businesses, selectedId, navigate]);

  if (!available) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center p-8">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Mapa indisponível</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Configure a chave da API Google Maps nas variáveis de ambiente para ativar o mapa.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-xl bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando mapa…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-xl bg-destructive/5 border border-destructive/20 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive/60 mx-auto mb-3" />
          <p className="text-destructive font-medium">Erro ao carregar mapa</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden" />;
}

function buildMarkerUrl(biz: BusinessFrontend): string {
  return buildBusinessUrl(biz);
}

type GoogleMapMarker = google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

function clearMarker(marker: GoogleMapMarker): void {
  if ("setMap" in marker) {
    marker.setMap(null);
    return;
  }

  marker.map = null;
}

function getBrazilFlagPinSvg(isSelected: boolean): string {
  const outerFill = isSelected ? "#0f4f9f" : "#2563eb";
  const rimFill = isSelected ? "#dbeafe" : "#f8fafc";

  return `
    <svg width="44" height="54" viewBox="0 0 44 54" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M22 2C11.5 2 3 10.2 3 20.3c0 13.4 16.1 29.5 18.2 31.5.5.5 1.1.5 1.6 0C24.9 49.8 41 33.7 41 20.3 41 10.2 32.5 2 22 2Z" fill="${outerFill}" stroke="#ffffff" stroke-width="2.5"/>
      <circle cx="22" cy="20" r="14.8" fill="${rimFill}"/>
      <circle cx="22" cy="20" r="12.6" fill="#009739"/>
      <path d="M22 9.6 34.4 20 22 30.4 9.6 20 22 9.6Z" fill="#FEDD00"/>
      <circle cx="22" cy="20" r="6.3" fill="#002776"/>
      <path d="M16.8 18.7c3.8-1.3 7.4-.6 10.6 2.1" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="20.2" cy="16.8" r="0.9" fill="#ffffff"/>
      <circle cx="24.8" cy="17.7" r="0.8" fill="#ffffff"/>
      <circle cx="18.8" cy="21.5" r="0.75" fill="#ffffff"/>
      <circle cx="23" cy="23.4" r="0.7" fill="#ffffff"/>
      <circle cx="26.1" cy="21.3" r="0.65" fill="#ffffff"/>
    </svg>
  `;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

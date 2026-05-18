import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  BadgeCheck,
  Clock,
  MapPin,
  Navigation,
  Car,
  Star,
  Phone,
  Mail,
  Globe,
  PawPrint,
  ThumbsUp,
  Send,
  MessageCircle,
  Instagram,
  Facebook,
  User,
  Share2,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getAllBusinesses, getBusinessBySlug, getCountryName, getStateName, addReview, updateReview, deleteReview, buildBusinessUrl, getCategoryId, getCategoryLabel } from "@/services/businesses";
import { getOrCreateConversation } from "@/services/messages";
import { getMyOwnershipRequests, hasPendingClaimForBusiness, requestBusinessOwnership } from "@/services/ownership";
import { trackBusinessClick } from "@/services/analytics";
import type { BusinessFrontend } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { Store } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { setSeoMeta } from "@/lib/seo";

export default function BusinessPage() {
  const { countryCode, stateCode, city, businessName } = useParams();
  const navigate = useNavigate();
  const { session, user, refreshUnread, unreadMessages } = useAuth();

  const [business, setBusiness] = useState<BusinessFrontend | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");
  const [sendingReview, setSendingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editComment, setEditComment] = useState("");
  const [savingEditReview, setSavingEditReview] = useState(false);
  const [hasPendingOwnershipRequest, setHasPendingOwnershipRequest] = useState(false);
  const [requestingOwnership, setRequestingOwnership] = useState(false);
  const [similarBusinesses, setSimilarBusinesses] = useState<BusinessFrontend[]>([]);
  const activePromotions = (business?.promotions || []).filter((promotion) => {
    if (!promotion?.expiresAt) return false;
    return promotion.expiresAt >= new Date().toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (countryCode && stateCode && city && businessName) {
      getBusinessBySlug(countryCode, stateCode, city, businessName).then((biz) => {
        setBusiness(biz);
        setLoading(false);
        if (biz) {
          getAllBusinesses().then((businesses) => {
            setSimilarBusinesses(
              businesses
                .filter((item) => item.id !== biz.id)
                .filter((item) =>
                  item.address.countryCode === biz.address.countryCode &&
                  (item.address.city === biz.address.city || item.category === biz.category)
                )
                .slice(0, 3)
            );
          });
        }
      });
    }
  }, [countryCode, stateCode, city, businessName]);

  useEffect(() => {
    if (!business) {
      setSeoMeta(
        "Negócio brasileiro | Caramelinho.com",
        "Encontre negócios perto de você."
      );
      return;
    }

    const categoryLabel = business.category.split("(")[0].trim();
    const keywordSnippet = (business.keywords || []).filter(Boolean).slice(0, 3).join(", ");
    const serviceSnippet = (business.services || []).filter(Boolean).slice(0, 3).join(", ");
    const details = keywordSnippet || serviceSnippet;
    setSeoMeta(
      `${business.name} em ${business.address.city} | ${categoryLabel} | Caramelinho.com`,
      `${business.name} em ${business.address.city}. ${details ? `Especialidades: ${details}. ` : ""}Veja avaliações, contato e localização para escolher com confiança.`
    );
  }, [business]);

  useEffect(() => {
    if (!session || !business || session.userId === business.ownerId) {
      return;
    }

    getMyOwnershipRequests().then((requests) => {
      setHasPendingOwnershipRequest(hasPendingClaimForBusiness(requests, business));
    });
  }, [business, session]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0) {
      toast.error("Selecione uma avaliação de 1 a 5 estrelas");
      return;
    }
    if (!business || !session) {
      toast.error("Faça login para avaliar");
      navigate(`/entrar?redirect=/${countryCode}/${stateCode}/${city}/${businessName}`);
      return;
    }
    if ((business.reviews || []).some((r) => r.user_id === session.userId)) {
      toast.error("Você já avaliou este negócio. Edite sua avaliação existente.");
      return;
    }

    setSendingReview(true);

    const reviewData = {
      userId: session.userId,
      userName: session.name,
      rating: reviewRating as 1 | 2 | 3 | 4 | 5,
      comment: reviewComment,
    };

    const success = await addReview(business.id, reviewData);
    if (success) {
      // Recarregar o negócio para mostrar a nova avaliação
      const updated = await getBusinessBySlug(
        countryCode || "",
        stateCode || "",
        city || "",
        businessName || ""
      );
      if (updated) setBusiness(updated);
      toast.success("Avaliação enviada com sucesso!");
    } else {
      toast.error("Erro ao enviar avaliação.");
    }

    setSendingReview(false);
    setReviewRating(0);
    setReviewComment("");
  };

  const handleSendMessage = async () => {
    if (!session) {
      toast.info("Faça login para enviar mensagem");
      navigate(`/entrar?redirect=/${countryCode}/${stateCode}/${city}/${businessName}`);
      return;
    }
    if (!business) return;
    trackBusinessClick(business.id, "internal_message", session.userId);
    
    if (session.userId === business.ownerId) {
      toast.info("Este é o seu próprio negócio!");
      navigate("/perfil?tab=mensagens");
      return;
    }

    const conv = await getOrCreateConversation(
      session.userId,
      business.ownerId,
      business.id,
      business.name
    );
    if (conv) {
      refreshUnread();
      navigate("/perfil?tab=mensagens");
      toast.success(`Conversa com ${business.ownerName} iniciada!`);
    } else {
      toast.error("Erro ao iniciar conversa.");
    }
  };

  const startEditReview = (review: BusinessFrontend["reviews"][0]) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment("");
  };

  const handleSaveEditReview = async () => {
    if (!editingReviewId) return;
    if (editRating === 0) {
      toast.error("Selecione uma avaliação de 1 a 5 estrelas");
      return;
    }
    setSavingEditReview(true);
    const ok = await updateReview(editingReviewId, {
      rating: editRating as 1 | 2 | 3 | 4 | 5,
      comment: editComment,
    });
    if (ok) {
      const updated = await getBusinessBySlug(
        countryCode || "",
        stateCode || "",
        city || "",
        businessName || ""
      );
      if (updated) setBusiness(updated);
      toast.success("Avaliação atualizada!");
      cancelEditReview();
    } else {
      toast.error("Erro ao atualizar avaliação.");
    }
    setSavingEditReview(false);
  };

  const handleDeleteOwnReview = async (reviewId: string) => {
    if (!confirm("Tem certeza que deseja remover sua avaliação?")) return;
    const ok = await deleteReview(reviewId);
    if (ok) {
      const updated = await getBusinessBySlug(
        countryCode || "",
        stateCode || "",
        city || "",
        businessName || ""
      );
      if (updated) setBusiness(updated);
      toast.success("Avaliação removida!");
      if (editingReviewId === reviewId) cancelEditReview();
    } else {
      toast.error("Erro ao remover avaliação.");
    }
  };

  const handleWhatsApp = () => {
    if (!business?.whatsapp) return;
    trackBusinessClick(business.id, "whatsapp", session?.userId);
    const wpp = business.whatsapp.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    const text = encodeURIComponent(`Olá! Vi seu negócio no Caramelinho.com: ${business.name}`);
    window.open(`https://wa.me/${wpp}?text=${text}`, "_blank");
  };

  const handleRoute = () => {
    if (!business) return;
    trackBusinessClick(business.id, "route", session?.userId);
    const query = business.address.lat && business.address.lng
      ? `${business.address.lat},${business.address.lng}`
      : `${business.address.street}, ${business.address.city}, ${business.address.country}`;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`, "_blank");
  };

  const handleExternalClick = (type: "phone" | "email" | "website") => {
    if (!business) return;
    trackBusinessClick(business.id, type, session?.userId);
  };

  const handleRequestOwnership = async () => {
    if (!session) {
      toast.info("Crie uma conta ou entre para reivindicar este negócio.");
      navigate(`/entrar?redirect=/${countryCode}/${stateCode}/${city}/${businessName}`);
      return;
    }
    if (!business || session.userId === business.ownerId) return;

    setRequestingOwnership(true);
    const result = await requestBusinessOwnership(
      business.id,
      `Solicitação enviada pela página pública do negócio ${business.name}.`
    );
    setRequestingOwnership(false);

    if (result.ok) {
      setHasPendingOwnershipRequest(true);
      toast.success("Solicitação enviada. Vamos revisar e transferir o negócio quando confirmado.");
    } else {
      toast.error(result.error || "Não foi possível enviar a solicitação.");
    }
  };

  const shareUrl = business ? `${window.location.origin}${buildBusinessUrl(business)}` : "";

  const handleCopyLink = async () => {
    if (!business) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share || !business) return;
    try {
      await navigator.share({
        title: business.name,
        text: `Confira este negócio no Caramelinho: ${business.name}`,
        url: shareUrl,
      });
    } catch {
      // cancelado pelo usuário
    }
  };

  const canRequestOwnership =
    !!session &&
    !!business &&
    session.userId !== business.ownerId &&
    !business.ownerVerified;
  const reviewBreakdown = getReviewBreakdown(business?.reviews || []);
  const primaryCta = business?.whatsapp ? "whatsapp" : "message";
  const hasUserReview =
    !!session?.userId &&
    (business?.reviews || []).some((r) => r.user_id === session.userId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Negócio não encontrado</h1>
          <p className="text-muted-foreground mb-6">O Caramelinho não achou esse negócio.</p>
          <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <img src="/logo.png" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-xl sm:text-2xl tracking-tight caramelo-text-gradient">Caramelinho</div>
                <div className="text-xs sm:text-sm font-semibold text-foreground/75">{"O SEU FARO FORA DO BRASIL"}</div>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {session ? (
                <div className="flex items-center gap-2">
                  <Link to="/perfil?tab=mensagens" className="relative group">
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-secondary">
                      <MessageCircle className="w-4 h-4" />
                      {unreadMessages > 0 && (
                        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/perfil">
                    <Button variant="outline" size="sm" className="rounded-full border-border hover:bg-secondary gap-2 px-4">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="font-medium">{session.name.split(" ")[0]}</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/entrar">
                    <Button variant="ghost" size="sm" className="rounded-full">Entrar</Button>
                  </Link>
                  <Link to="/cadastro">
                    <Button size="sm" className="rounded-full px-5 caramelo-gradient text-white border-0">
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative h-[400px] sm:h-[500px] overflow-hidden">
        <img src={business.heroImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80"} alt={business.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-end gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white bg-white shrink-0">
              <img src={business.logoUrl || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&q=80"} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-white mb-2">
              <Badge className="mb-3 bg-white/20 text-white border-0 hover:bg-white/30 rounded-lg px-3 py-1">
                {getCategoryLabel(business.category)}
              </Badge>
              {business.ownerVerified && (
                <Badge className="mb-3 ml-2 bg-blue-600 text-white border-0 rounded-lg px-3 py-1">
                  <BadgeCheck className="w-3.5 h-3.5 mr-1" />
                  Verificado
                </Badge>
              )}
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2">{business.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-white/90">
                <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
                  <MapPin className="w-4 h-4 text-primary" />
                  {business.address.city}
                </div>
                {business.averageRating > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-500 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold">{business.averageRating.toFixed(1)}</span>
                    <span className="text-white/80 font-normal">({business.reviews.length} {business.reviews.length === 1 ? "avaliação" : "avaliações"})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
                <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                  Sobre
                </TabsTrigger>
                {getCategoryId(business.category) !== "food" && (
                  <TabsTrigger value="services" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                    Serviços
                  </TabsTrigger>
                )}
                {(business.menu && business.menu.length > 0) || !!business.menuPdfUrl ? (
                  <TabsTrigger value="menu" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                    Cardápio
                  </TabsTrigger>
                ) : null}
                <TabsTrigger value="photos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                  Fotos
                </TabsTrigger>
                {activePromotions.length > 0 && (
                  <TabsTrigger value="promotions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                    Promoções
                  </TabsTrigger>
                )}
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                  Avaliações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <h2 className="text-xl font-bold text-foreground mb-3">Sobre {business.name}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{business.description}</p>
                {business.ownerVerified && (
                  <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                    <BadgeCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p>Este negócio foi reivindicado e confirmado pelo proprietário.</p>
                  </div>
                )}
              </TabsContent>

              {getCategoryId(business.category) !== "food" && (
                <TabsContent value="services" className="mt-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Serviços</h2>
                  {business.services.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhum serviço listado.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {business.services.map((service) => (
                        <div key={service} className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                          <ThumbsUp className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span className="text-sm font-medium">{service}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}

              {(business.menu && business.menu.length > 0) || !!business.menuPdfUrl ? (
                <TabsContent value="menu" className="mt-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Cardápio</h2>
                  {business.menuPdfUrl && (
                    <div className="mb-4">
                      <a href={business.menuPdfUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline">Acessar cardápio completo</Button>
                      </a>
                    </div>
                  )}
                  {business.menu && business.menu.length > 0 ? (
                    <div className="space-y-3">
                      {business.menu.map((item) => (
                        <div key={item.name} className="flex items-start justify-between p-5 rounded-lg border border-border bg-card">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          </div>
                          <span className="font-bold text-primary ml-4 flex-shrink-0">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </TabsContent>
              ) : null}

              <TabsContent value="photos" className="mt-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Fotos</h2>
                {business.photos.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma foto disponível.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {business.photos.slice(0, 8).map((photo) => (
                      <button
                        key={photo}
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                      >
                        <img
                          src={photo}
                          alt={`Foto de ${business.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {selectedPhoto && (
                  <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    <img
                      src={selectedPhoto}
                      alt="Foto ampliada"
                      className="max-w-full max-h-full rounded-lg object-contain"
                    />
                  </div>
                )}
              </TabsContent>

              {activePromotions.length > 0 && (
                <TabsContent value="promotions" className="mt-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Promoções</h2>
                  <div className="space-y-3">
                    {activePromotions.map((promotion, idx) => (
                      <Card key={`${promotion.code}-${idx}`} className="p-5 border-border">
                        <h3 className="font-semibold text-lg">{promotion.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{promotion.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-900 px-3 py-1 text-sm font-bold">
                            Cupom: {promotion.code}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Válido até: {new Date(`${promotion.expiresAt}T00:00:00`).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="reviews" className="mt-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Avaliações</h2>
                <Card className="p-5 mb-6 border-border">
                  <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                    <div className="text-center sm:w-32">
                      <div className="text-4xl font-bold">{business.averageRating.toFixed(1)}</div>
                      <div className="flex justify-center text-amber-500 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(business.averageRating) ? "fill-current" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{business.reviews.length} {business.reviews.length === 1 ? "avaliação" : "avaliações"}</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-2 text-xs">
                          <span className="w-16 flex items-center gap-1 whitespace-nowrap">
                            <span className="w-2 text-right tabular-nums">{rating}</span>
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          </span>
                          <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${business.reviews.length ? (reviewBreakdown[rating] / business.reviews.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="w-5 text-right text-muted-foreground">{reviewBreakdown[rating]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="p-5 mb-6 border-border bg-secondary/30">
                  <h3 className="font-semibold text-sm mb-3">Deixe sua avaliação</h3>
                  {hasUserReview && (
                    <p className="text-sm text-muted-foreground mb-3">
                      Você já avaliou este negócio. Para alterar, use "Editar minha avaliação" na sua avaliação abaixo.
                    </p>
                  )}
                  <form onSubmit={handleReviewSubmit}>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          disabled={hasUserReview}
                          className={`p-1 transition-colors ${
                            star <= reviewRating ? "text-amber-500" : "text-muted-foreground/30"
                          } hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                          aria-label={`${star} estrelas`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                      {reviewRating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {reviewRating} de 5 estrelas
                        </span>
                      )}
                    </div>
                    <Textarea
                      placeholder="Conte sua experiência..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="mb-3 min-h-[80px]"
                      disabled={hasUserReview}
                    />
                    <Button type="submit" size="sm" className="caramelo-gradient text-white border-0" disabled={sendingReview || hasUserReview}>
                      {sendingReview ? "Enviando..." : "Enviar Avaliação"}
                    </Button>
                  </form>
                </Card>

                <div className="space-y-4">
                  {business.reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhuma avaliação ainda. Seja o primeiro!</p>
                  ) : (
                    business.reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-lg border border-border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                              {review.user_id === session?.userId && user?.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                review.user_name.charAt(0)
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-sm">{review.user_name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(review.created_at || (review as any).createdAt).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-amber-500 text-sm">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating ? "fill-current" : "text-muted-foreground/20"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {editingReviewId === review.id ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditRating(star)}
                                  className={`p-1 transition-colors ${
                                    star <= editRating ? "text-amber-500" : "text-muted-foreground/30"
                                  } hover:text-amber-400`}
                                  aria-label={`${star} estrelas`}
                                >
                                  <Star className="w-5 h-5 fill-current" />
                                </button>
                              ))}
                            </div>
                            <Textarea
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEditReview} disabled={savingEditReview}>
                                {savingEditReview ? "Salvando..." : "Salvar"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditReview} disabled={savingEditReview}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                            {session?.userId && review.user_id === session.userId && (
                              <div className="mt-3 flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => startEditReview(review)}>
                                  Editar minha avaliação
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => handleDeleteOwnReview(review.id)}
                                >
                                  Remover minha avaliação
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <Card className="p-5 border-border">
                <h3 className="font-semibold mb-4">Informações de Contato</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p>{business.address.street}</p>
                      <p className="text-muted-foreground">
                        {business.address.city}, {getStateName(business.address.countryCode, business.address.stateCode)}
                      </p>
                      <p className="text-muted-foreground">{getCountryName(business.address.countryCode)} &mdash; {business.address.postalCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${business.phone}`} onClick={() => handleExternalClick("phone")} className="text-sm text-primary hover:underline">
                      {business.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${business.email}`} onClick={() => handleExternalClick("email")} className="text-sm text-primary hover:underline truncate">
                      {business.email}
                    </a>
                  </div>
                  {business.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleExternalClick("website")}
                        className="text-sm text-primary hover:underline truncate"
                      >
                        {business.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-5 border-t border-border space-y-3">
                  {primaryCta === "whatsapp" && (
                    <Button 
                      onClick={handleWhatsApp} 
                      className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-0 gap-2 font-bold h-11"
                    >
                      <MessageCircle className="w-5 h-5 fill-current" />
                      WhatsApp
                    </Button>
                  )}
                  <Button 
                    onClick={handleSendMessage} 
                    variant={primaryCta === "message" ? "default" : "outline"}
                    className={`w-full gap-2 font-bold h-11 ${primaryCta === "message" ? "caramelo-gradient text-white border-0" : "border-border hover:bg-secondary"}`}
                  >
                    <Send className="w-4 h-4" />
                    Mensagem Interna
                  </Button>
                  <Button onClick={handleRoute} variant="outline" className="w-full border-border hover:bg-secondary gap-2 h-11">
                    <Car className="w-4 h-4" />
                    Ver rota
                  </Button>
                </div>
              </Card>

              <Card className="p-5 border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Horários
                </h3>
                {business.openingHours.length > 0 ? (
                  <div className="space-y-2">
                    {business.openingHours.map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Horários ainda não informados.</p>
                )}
              </Card>

              {/* Social Media */}
              {(business.instagram || business.facebook) && (
                <Card className="p-5 border-border">
                  <h3 className="font-semibold mb-4">Redes Sociais</h3>
                  <div className="space-y-3">
                    {business.instagram && (
                      <a
                        href={`https://instagram.com/${business.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Instagram className="w-4 h-4 text-pink-600" />
                        {business.instagram}
                      </a>
                    )}
                    {business.facebook && (
                      <a
                        href={`https://facebook.com/${business.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Facebook className="w-4 h-4 text-blue-600" />
                        {business.facebook}
                      </a>
                    )}
                  </div>
                </Card>
              )}


              <Card className="p-5 border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  Compartilhar página
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      const text = encodeURIComponent(`Confira ${business.name} no Caramelinho: ${shareUrl}`);
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      const url = encodeURIComponent(shareUrl);
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
                    }}
                  >
                    <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                    Facebook
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={handleCopyLink}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Copiar link
                  </Button>
                  {navigator.share && (
                    <Button variant="ghost" className="justify-start text-muted-foreground" onClick={handleNativeShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Mais opções
                    </Button>
                  )}
                </div>
              </Card>

              {canRequestOwnership && (
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={handleRequestOwnership}
                    disabled={requestingOwnership || hasPendingOwnershipRequest}
                  >
                    <Store className="w-4 h-4 mr-2" />
                    {hasPendingOwnershipRequest
                      ? "Solicitação de ownership enviada"
                      : requestingOwnership
                        ? "Enviando solicitação..."
                        : "Sou dono deste negócio"}
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>

        {similarBusinesses.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold mb-6">Negócios similares na região</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {similarBusinesses.map((item) => (
                <Link key={item.id} to={buildBusinessUrl(item)} className="group">
                  <Card className="overflow-hidden border-border card-hover h-full">
                    <div className="aspect-[16/10] bg-muted overflow-hidden">
                      <img src={item.heroImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" />
                    </div>
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-2">{item.category.split("(")[0].trim()}</Badge>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.address.city}, {item.address.country}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function getReviewBreakdown(reviews: BusinessFrontend["reviews"]): Record<number, number> {
  return reviews.reduce<Record<number, number>>(
    (acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );
}


















import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  PawPrint,
  User,
  Store,
  Star,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  Edit3,
  Save,
  LogOut,
  Clock,
  Search,
  Plus,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SiteFooter from "@/components/SiteFooter";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/profiles";
import { uploadImage, generateImagePath } from "@/services/storage";
import {
  getConversationsForUser,
  getMessagesForConversation,
  sendMessage,
  markConversationAsRead,
  subscribeToMessages,
  deleteConversation,
} from "@/services/messages";
import {
  getBusinessesByOwner,
  getAllBusinesses,
  getReviewsByUser,
  buildBusinessUrl,
  updateReview,
  deleteReview,
  updateBusiness,
  deleteBusiness,
  BUSINESS_CATEGORY_OPTIONS,
  slugify,
  getCategoryId,
  getCategoryLabel,
} from "@/services/businesses";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import type { AddressResult } from "@/components/AddressAutocomplete";
import type { BusinessFrontend, ConversationFrontend, MessageFrontend, Review } from "@/types/database";

export default function UserProfile() {
  type BusinessHour = {
    day: string;
    enabled: boolean;
    open: string;
    close: string;
  };
  const navigate = useNavigate();
  const { session, user, isLoading, logout, refreshUnread, unreadMessages, refreshSession } = useAuth();
  const isAdmin = session?.role === "admin" || user?.role === "admin";
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "perfil");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Messages
  const [conversations, setConversations] = useState<ConversationFrontend[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationFrontend | null>(null);
  const [messages, setMessages] = useState<MessageFrontend[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Businesses
  const [myBusinesses, setMyBusinesses] = useState<BusinessFrontend[]>([]);
  const [editingBusiness, setEditingBusiness] = useState<BusinessFrontend | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    street: "",
    city: "",
    state: "",
    stateCode: "",
    country: "",
    countryCode: "",
    postalCode: "",
    services: "",
    lat: 0,
    lng: 0,
    instagram: "",
    facebook: "",
    whatsapp: "",
    menu: [] as { name: string; description: string; price: string }[],
    menuPdfUrl: "",
    isBrazilianOwned: false,
    servesPortuguese: true,
    keywords: "",
  });
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editHeroFile, setEditHeroFile] = useState<File | null>(null);
  const [editPhotoFiles, setEditPhotoFiles] = useState<File[]>([]);
  const [editMenuPdfFile, setEditMenuPdfFile] = useState<File | null>(null);
  const [editBusinessHours, setEditBusinessHours] = useState<BusinessHour[]>(createDefaultBusinessHours());
  const [myReviews, setMyReviews] = useState<(BusinessFrontend["reviews"][0] & { businessName: string; businessSlug: string; businessId: string })[]>([]);

  // Reviews I made (on any business)
  const [givenReviews, setGivenReviews] = useState<(Review & { businessName: string; businessSlug: string; businessId: string })[]>([]);
  const [subAvaliacoesTab, setSubAvaliacoesTab] = useState("recebidas");

  // Edit review state
  const [editingReview, setEditingReview] = useState<{
    review: Review & { businessName: string; businessSlug: string; businessId: string };
    rating: number;
    comment: string;
    saving: boolean;
  } | null>(null);

  // Confirm delete review
  const [confirmDeleteReview, setConfirmDeleteReview] = useState<{
    reviewId: string;
    businessId: string;
  } | null>(null);

  useEffect(() => {
    if (!session) {
      navigate("/entrar?redirect=/perfil");
      return;
    }

    // Load conversations
    getConversationsForUser(session.userId).then(setConversations);

    // Load businesses owned by user
    getBusinessesByOwner(session.userId).then((bizs) => {
      setMyBusinesses(bizs);
      const reviews = bizs.flatMap((b) =>
        b.reviews.map((r) => ({
          ...r,
          businessName: b.name,
          businessSlug: buildBusinessUrl(b),
          businessId: b.id,
        }))
      );
      setMyReviews(reviews);
    });

    // Load reviews made by this user
    getReviewsByUser(session.userId).then((reviews) => {
      setGivenReviews(reviews as any);
    });
  }, [session, user, navigate]);

  const handleSaveProfile = async () => {
    if (!session) return;
    setIsUploading(true);

    let avatarUrl = user?.avatar || "";
    if (avatarFile) {
      const path = generateImagePath(session.userId, "photo", avatarFile.name);
      const url = await uploadImage("business-images", path, avatarFile);
      if (url) avatarUrl = url;
    }

    const success = await updateProfile(session.userId, {
      name: editName,
      bio: editBio,
      phone: editPhone,
      location: editLocation,
      avatar: avatarUrl,
    });

    if (success) {
      setIsEditing(false);
      setAvatarFile(null);
      toast.success("Perfil atualizado!");
      await refreshSession(); // Atualiza os dados sem recarregar a página
    } else {
      toast.error("Erro ao atualizar perfil.");
    }
    setIsUploading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("Você saiu da sua conta.");
  };

  const handleSelectConversation = async (conv: ConversationFrontend) => {
    if (activeSubscription) {
      activeSubscription.unsubscribe();
    }

    setSelectedConv(conv);
    const msgs = await getMessagesForConversation(conv.id);
    setMessages(msgs);

    const sub = subscribeToMessages(conv.id, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });
    setActiveSubscription(sub);

    if (session) {
      await markConversationAsRead(conv.id, session.userId);
      refreshUnread();
    }
  };

  const handleSendMessage = async () => {
    if (!session || !selectedConv || !messageText.trim()) return;
    setSendingMsg(true);
    const msg = await sendMessage(selectedConv.id, session.userId, messageText.trim());
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setMessageText("");
      const convs = await getConversationsForUser(session.userId);
      setConversations(convs);
    }
    setSendingMsg(false);
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm("Tem certeza que deseja apagar esta conversa?")) return;
    
    const ok = await deleteConversation(convId);
    if (ok) {
      toast.success("Conversa apagada");
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (selectedConv?.id === convId) {
        setSelectedConv(null);
        setMessages([]);
      }
    } else {
      toast.error("Erro ao apagar conversa");
    }
  };

  // --- Review handlers ---

  const handleStartEditReview = (
    review: Review & { businessName: string; businessSlug: string; businessId: string }
  ) => {
    setEditingReview({
      review,
      rating: review.rating,
      comment: review.comment,
      saving: false,
    });
  };

  const handleSaveEditReview = async () => {
    if (!editingReview) return;
    setEditingReview({ ...editingReview, saving: true });
    const ok = await updateReview(editingReview.review.id, {
      rating: editingReview.rating as 1 | 2 | 3 | 4 | 5,
      comment: editingReview.comment,
    });
    if (ok) {
      setGivenReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.review.id
            ? { ...r, rating: editingReview.rating as 1 | 2 | 3 | 4 | 5, comment: editingReview.comment }
            : r
        )
      );
      toast.success("Avaliação atualizada!");
      setEditingReview(null);
    } else {
      toast.error("Erro ao atualizar avaliação.");
      setEditingReview({ ...editingReview, saving: false });
    }
  };

  const handleDeleteReview = async () => {
    if (!confirmDeleteReview) return;
    const ok = await deleteReview(confirmDeleteReview.reviewId);
    if (ok) {
      setGivenReviews((prev) => prev.filter((r) => r.id !== confirmDeleteReview.reviewId));
      toast.success("Avaliação removida!");
      setConfirmDeleteReview(null);
    } else {
      toast.error("Erro ao remover avaliação.");
      setConfirmDeleteReview(null);
    }
  };

  const handleStartEditBusiness = (biz: BusinessFrontend) => {
    setEditFormData({
      name: biz.name,
      category: biz.categoryId,
      description: biz.description,
      phone: biz.phone || "",
      email: biz.email || "",
      website: biz.website || "",
      street: biz.address.street,
      city: biz.address.city,
      state: biz.address.state,
      stateCode: biz.address.stateCode,
      country: biz.address.country,
      countryCode: biz.address.countryCode,
      postalCode: biz.address.postalCode,
      services: biz.services.join("\n"),
      lat: biz.address.lat,
      lng: biz.address.lng,
      instagram: biz.instagram || "",
      facebook: biz.facebook || "",
      whatsapp: biz.whatsapp || "",
      menu: biz.menu || [],
      menuPdfUrl: biz.menuPdfUrl || "",
      isBrazilianOwned: !!biz.isBrazilianOwned,
      servesPortuguese: !!biz.servesPortuguese,
      keywords: (biz.keywords || []).join(", "),
    });
    setEditBusinessHours(parseBusinessHours(biz.openingHours || []));
    setEditingBusiness(biz);
    setExistingPhotos(biz.photos || []);
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "hero", isEdit: boolean) => {
    const file = e.target.files?.[0] || null;
    if (isEdit) {
      if (type === "logo") setEditLogoFile(file);
      else setEditHeroFile(file);
    }
  };

  const handleRemoveNewPhoto = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditPhotoFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleRemoveExistingPhoto = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(f.type)) {
        toast.error(`Formato inválido: ${f.name}. Use JPG, PNG ou WEBP.`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`Arquivo muito grande: ${f.name}. Limite de 5MB.`);
        return false;
      }
      return true;
    });
    if (isEdit) {
      setEditPhotoFiles(prev => {
        const existingCount = existingPhotos.length;
        const total = prev.length + validFiles.length + existingCount;
        if (total > 8) {
          toast.error("Limite máximo de 8 fotos no total.");
          return [...prev, ...validFiles].slice(0, 8 - existingCount - prev.length);
        }
        return [...prev, ...validFiles];
      });
    }
  };

  const handleMenuPdfChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      if (isEdit) setEditMenuPdfFile(null);
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Formato inválido. O cardápio completo deve ser um arquivo PDF.");
      e.target.value = "";
      return;
    }
    if (isEdit) setEditMenuPdfFile(file);
  };

  const updateBusinessHour = (
    day: string,
    changes: Partial<BusinessHour>,
    isEdit: boolean
  ) => {
    const setter = isEdit ? setEditBusinessHours : setEditBusinessHours;
    setter((prev) =>
      prev.map((entry) => (entry.day === day ? { ...entry, ...changes } : entry))
    );
  };

  const handleEditPlaceSelected = (place: AddressResult) => {
    setEditFormData((prev) => ({
      ...prev,
      street: place.formattedAddress,
      city: place.city,
      state: place.state,
      stateCode: place.stateCode,
      country: place.country,
      countryCode: place.countryCode,
      postalCode: place.postalCode,
      lat: place.lat,
      lng: place.lng,
    }));
  };

  const handleSaveBusiness = async () => {
    if (!editingBusiness || !session) return;
    if (!editFormData.name || !editFormData.category || !editFormData.description) {
      toast.error("Preencha os campos obrigatórios: Nome, Categoria e Descrição");
      return;
    }
    if (!editFormData.city || !editFormData.stateCode) {
      toast.error("O endereço (Cidade e Estado) é obrigatório.");
      return;
    }
    const services = editFormData.services
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const updates: any = {
      name: editFormData.name,
      slug: slugify(editFormData.name),
      categoryId: editFormData.category,
      description: editFormData.description,
      street: editFormData.street,
      city: editFormData.city,
      state: editFormData.state,
      stateCode: editFormData.stateCode,
      country: editFormData.country,
      countryCode: editFormData.countryCode,
      postalCode: editFormData.postalCode,
      lat: editFormData.lat,
      lng: editFormData.lng,
      services,
      phone: editFormData.phone,
      email: editFormData.email,
      website: editFormData.website,
      instagram: editFormData.instagram,
      facebook: editFormData.facebook,
      whatsapp: editFormData.whatsapp,
      menu: getCategoryId(editFormData.category) === "food" ? editFormData.menu : [],
      menuPdfUrl: getCategoryId(editFormData.category) === "food" ? editFormData.menuPdfUrl : "",
      isBrazilianOwned: false,
      servesPortuguese: false,
      keywords: editFormData.keywords.split(",").map(k => k.trim()).filter(Boolean),
      openingHours: serializeBusinessHours(editBusinessHours),
    };
    setIsUploading(true);
    if (editLogoFile) {
      const path = generateImagePath(editingBusiness.id, "logo", editLogoFile.name);
      const url = await uploadImage("business-images", path, editLogoFile);
      if (url) updates.logoUrl = url;
    }
    if (editHeroFile) {
      const path = generateImagePath(editingBusiness.id, "hero", editHeroFile.name);
      const url = await uploadImage("business-images", path, editHeroFile);
      if (url) updates.heroImage = url;
    }
    updates.photos = existingPhotos;
    if (editPhotoFiles.length > 0) {
      const uploadedPhotos: string[] = [];
      for (const file of editPhotoFiles) {
        const path = generateImagePath(editingBusiness.id, "photo", file.name);
        const url = await uploadImage("business-images", path, file);
        if (url) uploadedPhotos.push(url);
      }
      updates.photos = [...existingPhotos, ...uploadedPhotos];
    }
    if (getCategoryId(editFormData.category) === "food" && editMenuPdfFile) {
      const path = generateImagePath(editingBusiness.id, "menu", editMenuPdfFile.name);
      const url = await uploadImage("business-images", path, editMenuPdfFile);
      if (url) updates.menuPdfUrl = url;
    }
    const ok = await updateBusiness(editingBusiness.id, {
      ...updates,
    });
    if (ok) {
      toast.success(`"${editFormData.name}" atualizado com sucesso!`);
      setEditingBusiness(null);
      setEditLogoFile(null);
      setEditHeroFile(null);
      setEditPhotoFiles([]);
      setEditMenuPdfFile(null);
      getBusinessesByOwner(session.userId).then(setMyBusinesses);
    } else {
      toast.error("Erro ao atualizar negócio.");
    }
    setIsUploading(false);
  };

  const handleDeleteMyBusiness = async (biz: BusinessFrontend) => {
    if (!confirm(`Tem certeza que deseja excluir "${biz.name}"?`)) return;
    const ok = await deleteBusiness(biz.id);
    if (ok) {
      setMyBusinesses((prev) => prev.filter((b) => b.id !== biz.id));
      toast.success("Negócio removido com sucesso!");
      return;
    }
    toast.error("Erro ao remover negócio.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Se tem sessão mas não tem perfil (ex: erro no banco), mostra erro
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Ops! Perfil não encontrado</h1>
          <p className="text-muted-foreground mb-6">Não conseguimos carregar suas informações. Isso pode acontecer se seu perfil ainda não foi criado no banco de dados.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="w-full caramelo-gradient text-white border-0">
              Tentar Novamente
            </Button>
            <Button variant="ghost" onClick={logout} className="w-full">
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="rounded-full">
                  <Store className="w-3.5 h-3.5 mr-1.5" />
                  Administração
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={logout} className="rounded-full text-muted-foreground">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 lg:w-72 shrink-0">
            <div className="sticky top-24">
              <Card className="p-2 border border-border bg-card">
                <TabsList className="flex flex-col h-auto bg-transparent gap-1">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard")}
                      className="flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary transition-all w-full"
                    >
                      <Store className="w-4 h-4" />
                      Administração
                    </button>
                  )}
                  <TabsTrigger value="perfil" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </TabsTrigger>
                  <TabsTrigger value="negocios" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                    <Store className="w-4 h-4" />
                    Meus Negócios
                  </TabsTrigger>
                  <TabsTrigger value="avaliacoes" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                    <Star className="w-4 h-4" />
                    Avaliações
                  </TabsTrigger>
                  <TabsTrigger value="mensagens" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                    <div className="relative">
                      <MessageCircle className="w-4 h-4" />
                      {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    Mensagens
                  </TabsTrigger>
                </TabsList>
              </Card>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Tab: Profile */}
            <TabsContent value="perfil" className="mt-0">
            <Card className="p-6 border-border max-w-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{user.name}</h1>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditing(true);
                    setEditName(user.name);
                    setEditBio(user.bio);
                    setEditPhone(user.phone);
                    setEditLocation(user.location);
                  }}>
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-secondary/20 rounded-xl border border-border/50">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                      {avatarFile ? (
                        <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="avatar" className="text-sm font-medium">Foto de Perfil</Label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="editName">Nome</Label>
                    <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="editBio">Biografia</Label>
                    <Textarea id="editBio" value={editBio} onChange={(e) => setEditBio(e.target.value)} className="mt-1" rows={3} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editPhone">Telefone</Label>
                      <Input id="editPhone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="editLocation">Localização</Label>
                      <Input id="editLocation" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 justify-end">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isUploading}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveProfile} className="caramelo-gradient text-white border-0" disabled={isUploading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isUploading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.bio && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Biografia</span>
                      <p className="text-foreground">{user.bio}</p>
                    </div>
                  )}
                  <div className="pt-4 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Membro desde {new Date(user.createdAt).toLocaleDateString("pt-BR", { year: "numeric", month: "long" })}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: My Businesses */}
          <TabsContent value="negocios">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Meus Negócios</h2>
              <Button size="sm" onClick={() => navigate("/dashboard")}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Gerenciar Negócios
              </Button>
            </div>

            {myBusinesses.length === 0 ? (
              <Card className="p-8 text-center border-border">
                <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Você ainda não cadastrou nenhum negócio.</p>
                <Button onClick={() => navigate("/dashboard")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Negócio
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {myBusinesses.map((biz) => (
                  <Card key={biz.id} className="p-4 border-border flex items-start gap-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                      <img
                        src={biz.logoUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=60"}
                        alt={biz.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={buildBusinessUrl(biz)} className="font-bold text-foreground hover:text-primary transition-colors">
                        {biz.name}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {biz.address.city}, {biz.address.countryCode.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          {biz.averageRating.toFixed(1)} ({biz.reviews.length} avaliações)
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary" className="flex-shrink-0">
                        {getCategoryLabel(biz.category).split(" (")[0]}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEditBusiness(biz)}
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleDeleteMyBusiness(biz)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Reviews */}
          <TabsContent value="avaliacoes">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-lg font-bold">Avaliações</h2>
              <Tabs value={subAvaliacoesTab} onValueChange={setSubAvaliacoesTab} className="ml-auto">
                <TabsList>
                  <TabsTrigger value="recebidas" className="text-sm">
                    Recebidas ({myReviews.length})
                  </TabsTrigger>
                  <TabsTrigger value="feitas" className="text-sm">
                    Feitas ({givenReviews.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {subAvaliacoesTab === "recebidas" && (
              <>
                {myReviews.length === 0 ? (
                  <Card className="p-8 text-center border-border">
                    <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Seus negócios ainda não receberam avaliações.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myReviews.map((review) => (
                      <Card key={review.id} className="p-4 border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                {((review as any).user_name || "Usuário").charAt(0)}
                              </div>
                              <span className="font-medium">{(review as any).user_name || "Usuário"}</span>
                              <span className="text-muted-foreground">em</span>
                              <Link to={review.businessSlug} className="text-primary hover:underline font-medium">
                                {review.businessName}
                                <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                              </Link>
                            </div>
                          </div>
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-muted-foreground/20"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at || (review as any).createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {subAvaliacoesTab === "feitas" && (
              <>
                {givenReviews.length === 0 ? (
                  <Card className="p-8 text-center border-border">
                    <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Você ainda não avaliou nenhum negócio.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {givenReviews.map((review) => (
                      <Card key={review.id} className="p-4 border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                {(user?.name || "U").charAt(0)}
                              </div>
                              <span className="font-medium">Você</span>
                              <span className="text-muted-foreground">em</span>
                              <Link to={review.businessSlug} className="text-primary hover:underline font-medium">
                                {review.businessName}
                                <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                              </Link>
                            </div>
                          </div>
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-muted-foreground/20"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at || (review as any).createdAt).toLocaleDateString("pt-BR")}
                        </p>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEditReview(review)}
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() =>
                              setConfirmDeleteReview({
                                reviewId: review.id,
                                businessId: review.businessId,
                              })
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Remover
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab: Messages */}
          <TabsContent value="mensagens">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversation List */}
              <div className="lg:col-span-1">
                <h2 className="text-lg font-bold mb-4">Conversas</h2>
                {conversations.length === 0 ? (
                  <Card className="p-6 text-center border-border">
                    <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedConv?.id === conv.id
                            ? "bg-amber-100"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <p className="font-medium text-sm truncate">
                          {conv.businessName || "Conversa"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.lastMessage || "Clique para ver mensagens"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="lg:col-span-2">
                {selectedConv ? (
                  <Card className="border-border h-[500px] flex flex-col">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <p className="font-semibold text-sm">
                        {selectedConv.businessName || "Conversa"}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 -my-2"
                        onClick={() => handleDeleteConversation(selectedConv.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === session.userId ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg text-sm ${
                              msg.senderId === session.userId
                                ? "bg-amber-500 text-white rounded-br-sm"
                                : "bg-secondary rounded-bl-sm"
                            }`}
                          >
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.senderId === session.userId ? "text-white/70" : "text-muted-foreground"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                          Nenhuma mensagem ainda. Envie a primeira!
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-border">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Digite sua mensagem..."
                          className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={!messageText.trim() || sendingMsg}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </Card>
                ) : (
                  <Card className="border-border h-[500px] flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Selecione uma conversa</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </div> {/* flex-1 min-w-0 */}
      </Tabs>
    </main>

        {/* Edit Review Dialog */}
        <Dialog open={!!editingReview} onOpenChange={(open) => !open && setEditingReview(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Avaliação</DialogTitle>
            </DialogHeader>
            {editingReview && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Avaliação em <span className="font-medium text-foreground">{editingReview.review.businessName}</span>
                </p>

                <div>
                  <Label>Nota</Label>
                  <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setEditingReview({ ...editingReview, rating: star })
                        }
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= editingReview.rating
                              ? "fill-amber-500 text-amber-500"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-comment">Comentário</Label>
                  <Textarea
                    id="edit-comment"
                    value={editingReview.comment}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, comment: e.target.value })
                    }
                    placeholder="Escreva seu comentário..."
                    className="mt-1.5"
                    rows={4}
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingReview(null)}
                    disabled={editingReview.saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveEditReview}
                    disabled={editingReview.saving || !editingReview.comment.trim()}
                  >
                    {editingReview.saving ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Review Dialog */}
        <Dialog open={!!confirmDeleteReview} onOpenChange={(open) => !open && setConfirmDeleteReview(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover Avaliação</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Tem certeza que deseja remover esta avaliação? Esta ação não pode ser desfeita.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteReview(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteReview}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={!!editingBusiness} onOpenChange={(open) => !open && setEditingBusiness(null)}>
          <DialogContent
            className="max-w-2xl max-h-[85vh] overflow-y-auto"
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement;
              if (target?.closest(".pac-container")) {
                e.preventDefault();
              }
            }}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement;
              if (target?.closest(".pac-container")) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Editar {editFormData.name || "Negócio"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-4">
              <div className="sm:col-span-2 border-b border-border pb-2">
                <h3 className="text-base font-semibold">Dados principais</h3>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-name">Nome do Negócio *</Label>
                <Input id="edit-name" value={editFormData.name} onChange={(e) => handleEditInputChange("name", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="edit-category">Categoria *</Label>
                <Select value={editFormData.category} onValueChange={(val) => handleEditInputChange("category", val)}>
                  <SelectTrigger id="edit-category" className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{BUSINESS_CATEGORY_OPTIONS.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-description">Descrição *</Label>
                <Textarea id="edit-description" value={editFormData.description} onChange={(e) => handleEditInputChange("description", e.target.value)} className="mt-1.5 min-h-[160px]" />
              </div>
              <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/10 p-4">
                <Label htmlFor="edit-services">Serviços Oferecidos (um por linha)</Label>
                <Textarea id="edit-services" value={editFormData.services} onChange={(e) => handleEditInputChange("services", e.target.value)} className="mt-1.5" rows={4} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-keywords">Palavras-Chave</Label>
                <Input id="edit-keywords" value={editFormData.keywords} onChange={(e) => handleEditInputChange("keywords", e.target.value)} className="mt-1.5" />
              </div>
              <div><Label htmlFor="edit-phone">Telefone</Label><Input id="edit-phone" value={editFormData.phone} onChange={(e) => handleEditInputChange("phone", e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="edit-email">Email</Label><Input id="edit-email" value={editFormData.email} onChange={(e) => handleEditInputChange("email", e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="edit-website">Website</Label><Input id="edit-website" value={editFormData.website} onChange={(e) => handleEditInputChange("website", e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="edit-instagram">Instagram</Label><Input id="edit-instagram" value={editFormData.instagram} onChange={(e) => handleEditInputChange("instagram", e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="edit-facebook">Facebook</Label><Input id="edit-facebook" value={editFormData.facebook} onChange={(e) => handleEditInputChange("facebook", e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="edit-whatsapp">WhatsApp</Label><Input id="edit-whatsapp" value={editFormData.whatsapp} onChange={(e) => handleEditInputChange("whatsapp", e.target.value)} className="mt-1.5" /></div>
              <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/10 p-4">
                <Label>Horários de funcionamento</Label>
                <div className="mt-3 space-y-2">
                  {editBusinessHours.map((hour) => (
                    <div key={hour.day} className="grid grid-cols-[120px_90px_1fr_1fr] gap-2 items-center">
                      <span className="text-sm font-medium">{hour.day}</span>
                      <Button type="button" size="sm" variant={hour.enabled ? "default" : "outline"} onClick={() => updateBusinessHour(hour.day, { enabled: !hour.enabled }, true)}>{hour.enabled ? "Aberto" : "Fechado"}</Button>
                      <Input type="time" value={hour.open} disabled={!hour.enabled} onChange={(e) => updateBusinessHour(hour.day, { open: e.target.value }, true)} />
                      <Input type="time" value={hour.close} disabled={!hour.enabled} onChange={(e) => updateBusinessHour(hour.day, { close: e.target.value }, true)} />
                    </div>
                  ))}
                </div>
              </div>
              <div><Label htmlFor="edit-logo">Alterar Logo</Label><Input id="edit-logo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, "logo", true)} className="mt-1.5 cursor-pointer" /></div>
              <div><Label htmlFor="edit-hero">Alterar Capa (Banner)</Label><Input id="edit-hero" type="file" accept="image/*" onChange={(e) => handleFileChange(e, "hero", true)} className="mt-1.5 cursor-pointer" /></div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-photos">Adicionar Novas Fotos na Galeria</Label>
                <Input id="edit-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => handlePhotosChange(e, true)} className="mt-1.5 cursor-pointer" />
                <div className="text-xs text-muted-foreground mt-1 mb-2">Existentes: {existingPhotos.length}/8 | Novas: {editPhotoFiles.length}</div>
                {(existingPhotos.length > 0 || editPhotoFiles.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {existingPhotos.map((url, i) => <div key={`exist-${i}`} className="relative w-20 h-20 rounded-md overflow-hidden border border-border group"><img src={url} alt="preview" className="w-full h-full object-cover" /><button type="button" onClick={() => handleRemoveExistingPhoto(i)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button></div>)}
                    {editPhotoFiles.map((f, i) => <div key={`new-${i}`} className="relative w-20 h-20 rounded-md overflow-hidden border border-primary/50 group"><img src={URL.createObjectURL(f)} alt="preview" className="w-full h-full object-cover" /><button type="button" onClick={() => handleRemoveNewPhoto(i, true)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"><X className="w-3 h-3" /></button></div>)}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-menu-pdf">Cardápio completo (PDF, opcional)</Label>
                <Input id="edit-menu-pdf" type="file" accept="application/pdf" onChange={(e) => handleMenuPdfChange(e, true)} className="cursor-pointer mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label>Endereço</Label>
                <div className="mt-1.5">
                  <AddressAutocomplete key={editingBusiness?.id} value={editFormData.street} onChange={(val) => handleEditInputChange("street", val)} onPlaceSelected={handleEditPlaceSelected} />
                </div>
                {editFormData.street && <div className="mt-2 text-sm text-muted-foreground">{editFormData.street}, {editFormData.city}, {editFormData.stateCode?.toUpperCase()}</div>}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditingBusiness(null)} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBusiness} disabled={isUploading}>
                {isUploading ? "Enviando Imagens..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      <SiteFooter />
    </div>
  );
}

function createDefaultBusinessHours() {
  return [
    { day: "Segunda", enabled: true, open: "09:00", close: "18:00" },
    { day: "Terça", enabled: true, open: "09:00", close: "18:00" },
    { day: "Quarta", enabled: true, open: "09:00", close: "18:00" },
    { day: "Quinta", enabled: true, open: "09:00", close: "18:00" },
    { day: "Sexta", enabled: true, open: "09:00", close: "18:00" },
    { day: "Sábado", enabled: false, open: "10:00", close: "14:00" },
    { day: "Domingo", enabled: false, open: "10:00", close: "14:00" },
  ];
}

function serializeBusinessHours(hours: { day: string; enabled: boolean; open: string; close: string }[]) {
  return hours.map((hour) =>
    hour.enabled ? `${hour.day}: ${hour.open}-${hour.close}` : `${hour.day}: fechado`
  );
}

function parseBusinessHours(lines: string[]) {
  const defaults = createDefaultBusinessHours();
  const byDay = new Map(defaults.map((item) => [item.day.toLowerCase(), item]));
  for (const line of lines) {
    const [rawDay, rawValue] = line.split(":");
    if (!rawDay || !rawValue) continue;
    const entry = byDay.get(rawDay.trim().toLowerCase());
    if (!entry) continue;
    const normalized = rawValue.trim().toLowerCase();
    if (normalized.includes("fechado")) {
      entry.enabled = false;
      continue;
    }
    const match = normalized.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (match) {
      entry.enabled = true;
      entry.open = match[1];
      entry.close = match[2];
    }
  }
  return defaults;
}

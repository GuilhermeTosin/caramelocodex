import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PawPrint, Store, Plus, User, Edit, Star, MapPin, MessageCircle, Trash2, Eye, Save, X, ShieldCheck, CheckCircle, Ban, Megaphone, TicketPercent, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAllBusinesses, getBusinessesByOwner, createBusiness, updateBusiness, deleteBusiness, BUSINESS_CATEGORY_OPTIONS, buildBusinessUrl, slugify, getCategoryId, getCategoryLabel } from "@/services/businesses";
import {
  approveOwnershipRequest,
  getPendingOwnershipRequests,
  rejectOwnershipRequest,
  transferBusinessOwnershipByEmail,
} from "@/services/ownership";
import {
  createFeaturedPlacement,
  deleteFeaturedPlacement,
  getFeaturedPlacementsForAdmin,
  updateFeaturedPlacementStatus,
} from "@/services/featured";
import type { BusinessFrontend, FeaturedPlacementFrontend, FeaturedScopeType, OwnerClaimRequest, Promotion } from "@/types/database";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import type { AddressResult } from "@/components/AddressAutocomplete";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImage, generateImagePath } from "@/services/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getConversationsForUser,
  getMessagesForConversation,
  sendMessage,
  markConversationAsRead,
  subscribeToMessages,
  deleteConversation,
} from "@/services/messages";
import type { ConversationFrontend, MessageFrontend } from "@/types/database";
import { Send } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

type BusinessHour = {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { session, user, unreadMessages, refreshUnread } = useAuth();
  const [activeTab, setActiveTab] = useState("meus-negocios");
  const [myBusinesses, setMyBusinesses] = useState<BusinessFrontend[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "admin" || session?.role === "admin";

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

  const [formData, setFormData] = useState({
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
    country: "CanadÃ¡",
    countryCode: "ca",
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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [menuPdfFile, setMenuPdfFile] = useState<File | null>(null);

  const [editingBusiness, setEditingBusiness] = useState<BusinessFrontend | null>(null);
  const [couponBusiness, setCouponBusiness] = useState<BusinessFrontend | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [couponForm, setCouponForm] = useState<Promotion>({
    title: "",
    description: "",
    code: "",
    expiresAt: "",
  });
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
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

  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editHeroFile, setEditHeroFile] = useState<File | null>(null);
  const [editPhotoFiles, setEditPhotoFiles] = useState<File[]>([]);
  const [editMenuPdfFile, setEditMenuPdfFile] = useState<File | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(createDefaultBusinessHours());
  const [editBusinessHours, setEditBusinessHours] = useState<BusinessHour[]>(createDefaultBusinessHours());
  const [isUploading, setIsUploading] = useState(false);
  const [ownershipRequests, setOwnershipRequests] = useState<OwnerClaimRequest[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<BusinessFrontend[]>([]);
  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [transferBusinessId, setTransferBusinessId] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [featuredPlacements, setFeaturedPlacements] = useState<FeaturedPlacementFrontend[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredForm, setFeaturedForm] = useState({
    businessId: "",
    scopeType: "city" as FeaturedScopeType,
    countryCode: "",
    stateCode: "",
    city: "",
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: getDateInputDaysFromNow(30),
    priority: "0",
    priceCents: "",
    notes: "",
  });

  const loadOwnershipAdminData = useCallback(async () => {
    setOwnershipLoading(true);
    const [requests, businesses] = await Promise.all([
      getPendingOwnershipRequests(),
      getAllBusinesses(),
    ]);
    setOwnershipRequests(requests);
    setAllBusinesses(businesses);
    setOwnershipLoading(false);
  }, []);

  const loadFeaturedAdminData = useCallback(async () => {
    setFeaturedLoading(true);
    const [placements, businesses] = await Promise.all([
      getFeaturedPlacementsForAdmin(),
      getAllBusinesses(),
    ]);
    setFeaturedPlacements(placements);
    setAllBusinesses(businesses);
    setFeaturedLoading(false);
  }, []);

  useEffect(() => {
    if (session) {
      getBusinessesByOwner(session.userId)
        .then((bizs) => {
          setMyBusinesses(bizs);
        })
        .catch((err) => {
          console.error("Erro ao carregar negÃ³cios:", err);
          toast.error("NÃ£o foi possÃ­vel carregar seus negÃ³cios.");
        })
        .finally(() => {
          setLoading(false);
        });

      // Carregar conversas do dono do negÃ³cio
      getConversationsForUser(session.userId).then(setConversations);
    } else {
      Promise.resolve().then(() => setLoading(false));
    }
  }, [session]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.resolve().then(loadOwnershipAdminData);
    Promise.resolve().then(loadFeaturedAdminData);
  }, [isAdmin, loadFeaturedAdminData, loadOwnershipAdminData]);

  const handleFeaturedBusinessChange = (businessId: string) => {
    const biz = allBusinesses.find((item) => item.id === businessId);
    setFeaturedForm((prev) => ({
      ...prev,
      businessId,
      countryCode: biz?.address.countryCode || prev.countryCode,
      stateCode: biz?.address.stateCode || prev.stateCode,
      city: biz?.address.city || prev.city,
    }));
  };

  const handleCreateFeaturedPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featuredForm.businessId) {
      toast.error("Selecione um negÃ³cio para destacar.");
      return;
    }

    const result = await createFeaturedPlacement({
      businessId: featuredForm.businessId,
      scopeType: featuredForm.scopeType,
      countryCode: featuredForm.countryCode,
      stateCode: featuredForm.stateCode,
      city: featuredForm.city,
      startsAt: new Date(`${featuredForm.startsAt}T00:00:00`).toISOString(),
      endsAt: new Date(`${featuredForm.endsAt}T23:59:59`).toISOString(),
      priority: Number(featuredForm.priority) || 0,
      priceCents: Number(featuredForm.priceCents) || 0,
      notes: featuredForm.notes,
    });

    if (result.ok) {
      toast.success("Destaque criado com sucesso.");
      setFeaturedForm((prev) => ({
        ...prev,
        businessId: "",
        priority: "0",
        priceCents: "",
        notes: "",
      }));
      loadFeaturedAdminData();
    } else {
      toast.error(result.error || "Erro ao criar destaque.");
    }
  };

  const handleToggleFeaturedStatus = async (placement: FeaturedPlacementFrontend) => {
    const nextStatus = placement.status === "active" ? "paused" : "active";
    const result = await updateFeaturedPlacementStatus(placement.id, nextStatus);
    if (result.ok) {
      toast.success(nextStatus === "active" ? "Destaque ativado." : "Destaque pausado.");
      loadFeaturedAdminData();
    } else {
      toast.error(result.error || "Erro ao atualizar destaque.");
    }
  };

  const handleDeleteFeaturedPlacement = async (placement: FeaturedPlacementFrontend) => {
    if (!confirm(`Remover destaque de "${placement.business?.name || "negÃ³cio"}"?`)) return;
    const result = await deleteFeaturedPlacement(placement.id);
    if (result.ok) {
      toast.success("Destaque removido.");
      loadFeaturedAdminData();
    } else {
      toast.error(result.error || "Erro ao remover destaque.");
    }
  };

  const handleApproveOwnership = async (request: OwnerClaimRequest) => {
    const result = await approveOwnershipRequest(request.id);
    if (result.ok) {
      toast.success(`Ownership transferido para ${request.requester_name || request.requester_email}.`);
      loadOwnershipAdminData();
    } else {
      toast.error(result.error || "Erro ao aprovar solicitaÃ§Ã£o.");
    }
  };

  const handleRejectOwnership = async (request: OwnerClaimRequest) => {
    const result = await rejectOwnershipRequest(request.id);
    if (result.ok) {
      toast.success("SolicitaÃ§Ã£o recusada.");
      loadOwnershipAdminData();
    } else {
      toast.error(result.error || "Erro ao recusar solicitaÃ§Ã£o.");
    }
  };

  const handleDirectTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferBusinessId || !transferEmail.trim()) {
      toast.error("Selecione o negÃ³cio e informe o email do novo dono.");
      return;
    }

    const result = await transferBusinessOwnershipByEmail(transferBusinessId, transferEmail.trim());
    if (result.ok) {
      toast.success("Ownership transferido com sucesso.");
      setTransferBusinessId("");
      setTransferEmail("");
      loadOwnershipAdminData();
      if (session) getBusinessesByOwner(session.userId).then(setMyBusinesses);
    } else {
      toast.error(result.error || "Erro ao transferir ownership.");
    }
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceSelected = (place: AddressResult) => {
    setFormData((prev) => ({
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("FaÃ§a login para cadastrar um negÃ³cio");
      navigate("/entrar");
      return;
    }
    if (!formData.name || !formData.category || !formData.description) {
      toast.error("Preencha os campos obrigatÃ³rios: Nome, Categoria e DescriÃ§Ã£o");
      return;
    }
    if (!formData.street || !formData.city || !formData.stateCode) {
      toast.error("O endereÃ§o completo (Rua, Cidade e Estado) Ã© obrigatÃ³rio para que seu negÃ³cio seja encontrado.");
      return;
    }

    const slug = slugify(formData.name);

    const services = formData.services
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsUploading(true);
    let logoUrl = "";
    let heroImage = "";

    // Simular ID para o path (jÃ¡ que nÃ£o temos o ID do novo negÃ³cio ainda, usamos o ownerId + random)
    const tempId = `${session.userId}_${Date.now()}`;

    if (logoFile) {
      const path = generateImagePath(tempId, "logo", logoFile.name);
      logoUrl = await uploadImage("business-images", path, logoFile) || "";
    }

    if (heroFile) {
      const path = generateImagePath(tempId, "hero", heroFile.name);
      heroImage = await uploadImage("business-images", path, heroFile) || "";
    }

    const uploadedPhotos: string[] = [];
    for (const file of photoFiles) {
      const path = generateImagePath(tempId, "photo", file.name);
      const url = await uploadImage("business-images", path, file);
      if (url) uploadedPhotos.push(url);
    }

    let menuPdfUrl = formData.menuPdfUrl;
    if (getCategoryId(formData.category) === "food" && menuPdfFile) {
      const path = generateImagePath(tempId, "menu", menuPdfFile.name);
      menuPdfUrl = await uploadImage("business-images", path, menuPdfFile) || "";
    }

    const result = await createBusiness(session.userId, {
      name: formData.name,
      slug,
      categoryId: formData.category,
      description: formData.description,
      logoUrl,
      heroImage,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      countryCode: formData.countryCode,
      stateCode: formData.stateCode,
      postalCode: formData.postalCode,
      lat: formData.lat,
      lng: formData.lng,
      services,
      phone: formData.phone,
      email: formData.email,
      website: formData.website,
      instagram: formData.instagram,
      facebook: formData.facebook,
      whatsapp: formData.whatsapp,
      menu: getCategoryId(formData.category) === "food" ? formData.menu : [],
      menuPdfUrl: getCategoryId(formData.category) === "food" ? menuPdfUrl : "",
      isBrazilianOwned: false,
      servesPortuguese: false,
      keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
      openingHours: serializeBusinessHours(businessHours),
      photos: uploadedPhotos,
    });

    if (result) {
      toast.success("NegÃ³cio cadastrado com sucesso!");
      setMyBusinesses((prev) => [result, ...prev]);
      setFormData({
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
        country: "CanadÃ¡",
        countryCode: "ca",
        postalCode: "",
        services: "",
        lat: 0,
        lng: 0,
        instagram: "",
        facebook: "",
        whatsapp: "",
        menu: [],
        menuPdfUrl: "",
        isBrazilianOwned: false,
        servesPortuguese: true,
        keywords: "",
      });
      setBusinessHours(createDefaultBusinessHours());
      setLogoFile(null);
      setHeroFile(null);
      setPhotoFiles([]);
      setMenuPdfFile(null);
      setActiveTab("meus-negocios");
    } else {
      toast.error("Erro ao cadastrar negÃ³cio. Verifique as credenciais do Supabase.");
    }
    setIsUploading(false);
  };

  const handleRemoveBusiness = async (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleConfirmRemoveBusiness = async () => {
    if (!deleteTarget) return;
    const ok = await deleteBusiness(deleteTarget.id);
    if (ok) {
      toast.success(`"${deleteTarget.name}" removido com sucesso.`);
      setMyBusinesses((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      toast.error("Erro ao remover negÃ³cio. Tente novamente.");
    }
  };

  const handleOpenCouponModal = (biz: BusinessFrontend) => {
    const current = biz.promotions?.[0];
    setCouponForm({
      title: current?.title || "",
      description: current?.description || "",
      code: current?.code || "",
      expiresAt: current?.expiresAt || "",
    });
    setCouponBusiness(biz);
  };

  const handleSaveCoupon = async () => {
    if (!couponBusiness) return;
    if (!couponForm.title.trim() || !couponForm.description.trim() || !couponForm.code.trim() || !couponForm.expiresAt) {
      toast.error("Preencha todos os campos da promoção.");
      return;
    }
    setSavingCoupon(true);
    const ok = await updateBusiness(couponBusiness.id, {
      promotions: [{ ...couponForm, title: couponForm.title.trim(), description: couponForm.description.trim(), code: couponForm.code.trim() }],
    });
    setSavingCoupon(false);
    if (!ok) {
      toast.error("Não foi possível salvar a promoção. Verifique se a coluna 'promotions' existe na tabela businesses.");
      return;
    }
    setMyBusinesses((prev) =>
      prev.map((b) =>
        b.id === couponBusiness.id ? { ...b, promotions: [{ ...couponForm }] } : b
      )
    );
    toast.success("Promoção salva com sucesso.");
    setCouponBusiness(null);
  };

  const handleEditClick = (biz: BusinessFrontend) => {
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
    } else {
      if (type === "logo") setLogoFile(file);
      else setHeroFile(file);
    }
  };

  const handleRemoveNewPhoto = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditPhotoFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setPhotoFiles(prev => prev.filter((_, i) => i !== index));
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
        toast.error(`Formato invÃ¡lido: ${f.name}. Use JPG, PNG ou WEBP.`);
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
          toast.error("Limite mÃ¡ximo de 8 fotos no total.");
          return [...prev, ...validFiles].slice(0, 8 - existingCount - prev.length);
        }
        return [...prev, ...validFiles];
      });
    } else {
      setPhotoFiles(prev => {
        if (prev.length + validFiles.length > 8) {
          toast.error("Limite mÃ¡ximo de 8 fotos.");
          return [...prev, ...validFiles].slice(0, 8 - prev.length);
        }
        return [...prev, ...validFiles];
      });
    }
  };

  const handleMenuPdfChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      if (isEdit) setEditMenuPdfFile(null);
      else setMenuPdfFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Formato invÃ¡lido. O cardÃ¡pio completo deve ser um arquivo PDF.");
      e.target.value = "";
      return;
    }

    if (isEdit) setEditMenuPdfFile(file);
    else setMenuPdfFile(file);
  };

  const updateBusinessHour = (
    day: string,
    changes: Partial<BusinessHour>,
    isEdit: boolean
  ) => {
    const setter = isEdit ? setEditBusinessHours : setBusinessHours;
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

  const handleEditSave = async () => {
    if (!editingBusiness || !session) return;
    if (!editFormData.name || !editFormData.category || !editFormData.description) {
      toast.error("Preencha os campos obrigatÃ³rios: Nome, Categoria e DescriÃ§Ã£o");
      return;
    }
    if (!editFormData.street || !editFormData.city || !editFormData.stateCode) {
      toast.error("O endereÃ§o completo (Rua, Cidade e Estado) Ã© obrigatÃ³rio.");
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

    const ok = await updateBusiness(editingBusiness.id, updates);

    if (ok) {
      toast.success(`"${editFormData.name}" atualizado com sucesso!`);
      setEditingBusiness(null);
      setEditLogoFile(null);
      setEditHeroFile(null);
      setEditPhotoFiles([]);
      setEditMenuPdfFile(null);
      // Recarregar lista
      getBusinessesByOwner(session.userId).then(setMyBusinesses);
    } else {
      toast.error("Erro ao atualizar negÃ³cio. Tente novamente.");
    }
    setIsUploading(false);
  };

  const handleEditCancel = () => {
    setEditingBusiness(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b border-border">
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
            <div className="flex items-center gap-2">
              {session && (
                <button onClick={() => setActiveTab("mensagens")}>
                  <Button variant="ghost" size="sm" className="relative pointer-events-none">
                    <MessageCircle className="w-4 h-4" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Button>
                </button>
              )}
              {session ? (
                <Link to="/perfil">
                  <Button variant="outline" size="sm">
                    <User className="w-3.5 h-3.5 mr-1" />
                    Painel
                  </Button>
                </Link>
              ) : (
                <Link to="/entrar">
                  <Button variant="outline" size="sm">Entrar</Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <Store className="w-4 h-4 mr-2" />
                Ir para o site
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="p-5 border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{session?.name || "Visitante"}</p>
                    <p className="text-xs text-muted-foreground">EmpresÃ¡rio</p>
                  </div>
                </div>
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab("meus-negocios")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "meus-negocios"
                        ? "bg-amber-100 text-amber-800"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Meus NegÃ³cios
                    {!loading && (
                      <span className="ml-auto bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                        {myBusinesses.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("cadastrar")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "cadastrar"
                        ? "bg-amber-100 text-amber-800"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Novo
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setActiveTab("ownership")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "ownership"
                          ? "bg-amber-100 text-amber-800"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Ownership
                      {ownershipRequests.length > 0 && (
                        <span className="ml-auto bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                          {ownershipRequests.length}
                        </span>
                      )}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setActiveTab("destaques")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "destaques"
                          ? "bg-amber-100 text-amber-800"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <Megaphone className="w-4 h-4" />
                      Destaques
                    </button>
                  )}
                </nav>
              </Card>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="meus-negocios">Meus NegÃ³cios</TabsTrigger>
                  <TabsTrigger value="cadastrar">Cadastrar Novo</TabsTrigger>
                  <TabsTrigger value="mensagens" className="relative">
                    Mensagens
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="ownership" className="relative">
                      Ownership
                      {ownershipRequests.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger value="destaques">
                      Destaques
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="meus-negocios">
                <h2 className="text-2xl font-bold text-foreground mb-6">Meus NegÃ³cios</h2>

                {loading ? (
                  <div className="text-center py-12">
                    <PawPrint className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
                    <p className="text-muted-foreground">Carregando...</p>
                  </div>
                ) : myBusinesses.length === 0 ? (
                  <Card className="p-12 text-center border-border">
                    <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum negÃ³cio cadastrado</h3>
                    <p className="text-muted-foreground mb-6">
                      Cadastre seu primeiro negÃ³cio e comece a ser encontrado por milhares de brasileiros!
                    </p>
                    <Button onClick={() => setActiveTab("cadastrar")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Agora
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myBusinesses.map((biz) => (
                      <Card key={biz.id} className="p-5 border-border">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-white">
                            <img
                              src={biz.logoUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=60"}
                              alt={biz.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-bold text-foreground">{biz.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{biz.address.city}, {biz.address.countryCode.toUpperCase()}</span>
                                </div>
                              </div>
                              <Badge variant="secondary">{getCategoryLabel(biz.category).split(" (")[0]}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center text-amber-500 text-sm">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="ml-1 font-semibold text-foreground">{biz.averageRating.toFixed(1)}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{biz.reviews.length} avaliaÃ§Ãµes</span>
                            </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenCouponModal(biz)}
                                >
                                  <TicketPercent className="w-3.5 h-3.5 mr-1" />
                                  Cupons de desconto
                                </Button>
                                <Link to={buildBusinessUrl(biz)}>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    Ver
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditClick(biz)}
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => handleRemoveBusiness(biz.id, biz.name)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Remover
                                </Button>
                              </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cadastrar">
                <h2 className="text-2xl font-bold text-foreground mb-6">Cadastrar Novo NegÃ³cio</h2>

                <Card className="p-6 sm:p-8 border-border">
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2 border-b border-border pb-2">
                        <h3 className="text-base font-semibold">Dados principais</h3>
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="name">Nome do NegÃ³cio *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Ex: Brasil Tropical Bakery"
                          className="mt-1.5"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label htmlFor="category">Categoria *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(val) => handleInputChange("category", val)}
                        >
                          <SelectTrigger className="mt-1.5 w-full">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_CATEGORY_OPTIONS.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label htmlFor="description">DescriÃ§Ã£o *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          placeholder="Descreva seu negÃ³cio, o que oferece, diferenciais..."
                          className="mt-1.5 min-h-[160px]"
                        />
                      </div>

                      <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
                        <h3 className="text-base font-semibold">Oferta e conteÃºdo</h3>
                      </div>

                      {getCategoryId(formData.category) === "food" ? (
                        <div className="sm:col-span-2 space-y-4 rounded-lg border border-border bg-secondary/10 p-4">
                          <div className="flex items-center justify-between">
                            <Label>CardÃ¡pio</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                menu: [...prev.menu, { name: "", description: "", price: "" }]
                              }))}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Adicionar Item
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {formData.menu.map((item, index) => (
                              <div key={index} className="p-4 border border-border rounded-lg bg-secondary/10 space-y-3 relative group">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setFormData(prev => ({
                                    ...prev,
                                    menu: prev.menu.filter((_, i) => i !== index)
                                  }))}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="sm:col-span-2">
                                    <Label className="text-xs">Nome do Item</Label>
                                    <Input
                                      value={item.name}
                                      onChange={(e) => {
                                        const newMenu = [...formData.menu];
                                        newMenu[index].name = e.target.value;
                                        setFormData(prev => ({ ...prev, menu: newMenu }));
                                      }}
                                      placeholder="Ex: PÃ£o de Queijo"
                                      className="h-8 text-sm mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">PreÃ§o</Label>
                                    <Input
                                      value={item.price}
                                      onChange={(e) => {
                                        const newMenu = [...formData.menu];
                                        newMenu[index].price = e.target.value;
                                        setFormData(prev => ({ ...prev, menu: newMenu }));
                                      }}
                                      placeholder="Ex: $5.00"
                                      className="h-8 text-sm mt-1"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">DescriÃ§Ã£o</Label>
                                  <Input
                                    value={item.description}
                                    onChange={(e) => {
                                      const newMenu = [...formData.menu];
                                      newMenu[index].description = e.target.value;
                                      setFormData(prev => ({ ...prev, menu: newMenu }));
                                    }}
                                    placeholder="Ex: PorÃ§Ã£o com 6 unidades"
                                    className="h-8 text-sm mt-1"
                                  />
                                </div>
                              </div>
                            ))}
                            {formData.menu.length === 0 && (
                              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                                <p className="text-xs text-muted-foreground">Nenhum item no cardÃ¡pio. Adicione o seu primeiro!</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="menu-pdf">Cardápio completo (PDF, opcional)</Label>
                            <div className="mt-1.5">
                              <label
                                htmlFor="menu-pdf"
                                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary"
                              >
                                Escolher arquivo PDF
                              </label>
                            </div>
                            <Input
                              id="menu-pdf"
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => handleMenuPdfChange(e, false)}
                              className="hidden"
                            />
                            <p className="text-xs text-muted-foreground">
                              Envie um PDF para clientes acessarem o cardÃ¡pio completo.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/10 p-4">
                          <Label htmlFor="services">ServiÃ§os Oferecidos (um por linha)</Label>
                          <Textarea
                            id="services"
                            value={formData.services}
                            onChange={(e) => handleInputChange("services", e.target.value)}
                            placeholder="Padaria
Confeitaria
Salgados
Delivery"
                            className="mt-1.5"
                            rows={4}
                          />
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <Label htmlFor="keywords">Palavras-Chave (para busca, separadas por vÃ­rgula)</Label>
                        <Input
                          id="keywords"
                          value={formData.keywords}
                          onChange={(e) => handleInputChange("keywords", e.target.value)}
                          placeholder="Ex: dentista, clareamento, odontologia, aparelhos"
                          className="mt-1.5"
                        />
                      </div>

                      <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
                        <h3 className="text-base font-semibold">Contato e redes</h3>
                      </div>

                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="contato@exemplo.com"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => handleInputChange("website", e.target.value)}
                          placeholder="https://meusite.com"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.instagram}
                          onChange={(e) => handleInputChange("instagram", e.target.value)}
                          placeholder="@seuinstagram"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={formData.facebook}
                          onChange={(e) => handleInputChange("facebook", e.target.value)}
                          placeholder="seusite"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                          placeholder="+15551234567"
                          className="mt-1.5"
                        />
                      </div>

                      <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
                        <h3 className="text-base font-semibold">HorÃ¡rios</h3>
                      </div>

                      <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/10 p-4">
                        <Label>HorÃ¡rios de funcionamento</Label>
                        <div className="mt-3 space-y-2">
                          {businessHours.map((hour) => (
                            <div key={hour.day} className="grid grid-cols-[120px_90px_1fr_1fr] gap-2 items-center">
                              <span className="text-sm font-medium">{hour.day}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant={hour.enabled ? "default" : "outline"}
                                onClick={() => updateBusinessHour(hour.day, { enabled: !hour.enabled }, false)}
                              >
                                {hour.enabled ? "Aberto" : "Fechado"}
                              </Button>
                              <Input
                                type="time"
                                value={hour.open}
                                disabled={!hour.enabled}
                                onChange={(e) => updateBusinessHour(hour.day, { open: e.target.value }, false)}
                              />
                              <Input
                                type="time"
                                value={hour.close}
                                disabled={!hour.enabled}
                                onChange={(e) => updateBusinessHour(hour.day, { close: e.target.value }, false)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
                        <h3 className="text-base font-semibold">MÃ­dia</h3>
                      </div>

                      <div className="sm:col-span-1">
                        <Label htmlFor="logo">Logo do NegÃ³cio</Label>
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "logo", false)}
                          className="hidden"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Formatos aceitos: JPG, PNG e WEBP. Resolução ideal: 512x512 px. Tamanho máximo: 5MB.
                        </p>
                      </div>

                      <div className="sm:col-span-1">
                        <Label htmlFor="hero">Imagem de Capa (Banner)</Label>
                        <Input
                          id="hero"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "hero", false)}
                          className="hidden"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Formatos aceitos: JPG, PNG e WEBP. Resolução ideal: 1600x600 px. Tamanho máximo: 5MB.
                        </p>
                      </div>

                      <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
                        <h3 className="text-base font-semibold">Galeria</h3>
                      </div>

                      <div className="sm:col-span-2">
                        <Label htmlFor="photos">Galeria de Fotos (Máx. 8)</Label>
                        <div className="mt-1.5">
                          <label htmlFor="photos" className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary">
                            Escolher arquivos
                          </label>
                        </div>
                        <Input
                          id="photos"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={(e) => handlePhotosChange(e, false)}
                          className="hidden"
                        />
                        <div className="text-xs text-muted-foreground mt-1 mb-2">
                          Selecionadas: {photoFiles.length}/8 | Tamanho mÃ¡x: 5MB por imagem | Formatos: JPG, PNG, WEBP
                        </div>
                        {photoFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {photoFiles.map((f, i) => (
                              <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-border group">
                                <img src={URL.createObjectURL(f)} alt="preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => handleRemoveNewPhoto(i, false)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
                        <h3 className="text-base font-semibold">LocalizaÃ§Ã£o</h3>
                      </div>

                      <div className="sm:col-span-2">
                        <Label>EndereÃ§o</Label>
                        <div className="mt-1.5">
                          <AddressAutocomplete
                          value={formData.street}
                          onChange={(val) => handleInputChange("street", val)}
                          onPlaceSelected={handlePlaceSelected}
                        />
                        </div>
                        {formData.street && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {formData.street}, {formData.city}, {formData.stateCode?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button type="submit" className="w-full caramelo-gradient text-white border-0" disabled={isUploading}>
                      <Plus className="w-4 h-4 mr-2" />
                      {isUploading ? "Enviando Imagens..." : "Cadastrar NegÃ³cio"}
                    </Button>
                  </form>
                </Card>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="ownership">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Ownership</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Aprove solicitaÃ§Ãµes de donos ou transfira um negÃ³cio diretamente por email.
                      </p>
                    </div>

                    <Card className="p-6 border-border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        TransferÃªncia direta
                      </h3>
                      <form onSubmit={handleDirectTransfer} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3">
                        <Select value={transferBusinessId} onValueChange={setTransferBusinessId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o negÃ³cio" />
                          </SelectTrigger>
                          <SelectContent>
                            {allBusinesses.map((biz) => (
                              <SelectItem key={biz.id} value={biz.id}>
                                {biz.name} Â· {biz.address.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="email"
                          value={transferEmail}
                          onChange={(e) => setTransferEmail(e.target.value)}
                          placeholder="email do novo dono"
                        />
                        <Button type="submit">
                          Transferir
                        </Button>
                      </form>
                    </Card>

                    <Card className="border-border overflow-hidden">
                      <div className="p-5 border-b border-border flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">SolicitaÃ§Ãµes pendentes</h3>
                          <p className="text-sm text-muted-foreground">
                            Pedidos feitos pelo botÃ£o "Sou dono deste negÃ³cio".
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadOwnershipAdminData} disabled={ownershipLoading}>
                          Atualizar
                        </Button>
                      </div>

                      {ownershipLoading ? (
                        <div className="p-8 text-center text-muted-foreground">
                          Carregando solicitaÃ§Ãµes...
                        </div>
                      ) : ownershipRequests.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          Nenhuma solicitaÃ§Ã£o pendente.
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {ownershipRequests.map((request) => (
                            <div key={request.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold">
                                    {request.business?.name || "NegÃ³cio"}
                                  </h4>
                                  <Badge variant="secondary">
                                    {request.business?.city || "Cidade nÃ£o informada"}
                                    {request.business?.country_code ? `, ${request.business.country_code.toUpperCase()}` : ""}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Solicitado por {request.requester_name || "UsuÃ¡rio"}  {request.requester_email || "sem email"}
                                </p>
                                {request.message && (
                                  <p className="text-sm mt-2 text-foreground/80">
                                    {request.message}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(request.created_at).toLocaleString("pt-BR")}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleApproveOwnership(request)}>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => handleRejectOwnership(request)}
                                >
                                  <Ban className="w-3.5 h-3.5 mr-1" />
                                  Recusar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </TabsContent>
              )}

              {isAdmin && (
                <TabsContent value="destaques">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Destaques Regionais</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Gerencie campanhas de destaque por cidade, estado/provÃ­ncia, paÃ­s ou global.
                      </p>
                    </div>

                    <Card className="p-6 border-border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-primary" />
                        Novo destaque
                      </h3>
                      <form onSubmit={handleCreateFeaturedPlacement} className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>NegÃ³cio</Label>
                            <Select value={featuredForm.businessId} onValueChange={handleFeaturedBusinessChange}>
                              <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Selecione o negÃ³cio" />
                              </SelectTrigger>
                              <SelectContent>
                                {allBusinesses.map((biz) => (
                                  <SelectItem key={biz.id} value={biz.id}>
                                    {biz.name} Â· {biz.address.city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Escopo</Label>
                            <Select
                              value={featuredForm.scopeType}
                              onValueChange={(value) => setFeaturedForm((prev) => ({ ...prev, scopeType: value as FeaturedScopeType }))}
                            >
                              <SelectTrigger className="mt-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="city">Cidade</SelectItem>
                                <SelectItem value="state">Estado/ProvÃ­ncia</SelectItem>
                                <SelectItem value="country">PaÃ­s</SelectItem>
                                <SelectItem value="global">Global</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>PaÃ­s</Label>
                            <Input
                              value={featuredForm.countryCode}
                              onChange={(e) => setFeaturedForm((prev) => ({ ...prev, countryCode: e.target.value.toLowerCase() }))}
                              placeholder="ca"
                              className="mt-1.5"
                              disabled={featuredForm.scopeType === "global"}
                            />
                          </div>

                          <div>
                            <Label>Estado/ProvÃ­ncia</Label>
                            <Input
                              value={featuredForm.stateCode}
                              onChange={(e) => setFeaturedForm((prev) => ({ ...prev, stateCode: e.target.value.toLowerCase() }))}
                              placeholder="qc"
                              className="mt-1.5"
                              disabled={featuredForm.scopeType === "country" || featuredForm.scopeType === "global"}
                            />
                          </div>

                          <div>
                            <Label>Cidade</Label>
                            <Input
                              value={featuredForm.city}
                              onChange={(e) => setFeaturedForm((prev) => ({ ...prev, city: e.target.value }))}
                              placeholder="Montreal"
                              className="mt-1.5"
                              disabled={featuredForm.scopeType !== "city"}
                            />
                          </div>

                          <div>
                            <Label>Prioridade</Label>
                            <Input
                              type="number"
                              value={featuredForm.priority}
                              onChange={(e) => setFeaturedForm((prev) => ({ ...prev, priority: e.target.value }))}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <Label>InÃ­cio</Label>
                            <Input
                              type="date"
                              value={featuredForm.startsAt}
                              onChange={(e) => setFeaturedForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <Label>Fim</Label>
                            <Input
                              type="date"
                              value={featuredForm.endsAt}
                              onChange={(e) => setFeaturedForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <Label>PreÃ§o cobrado (centavos)</Label>
                            <Input
                              type="number"
                              value={featuredForm.priceCents}
                              onChange={(e) => setFeaturedForm((prev) => ({ ...prev, priceCents: e.target.value }))}
                              placeholder="9900"
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <Label>ObservaÃ§Ãµes</Label>
                            <Input
                              value={featuredForm.notes}
                              onChange={(e) => setFeaturedForm((prev) => ({ ...prev, notes: e.target.value }))}
                              placeholder="Ex: pago manualmente"
                              className="mt-1.5"
                            />
                          </div>
                        </div>

                        <Button type="submit" className="caramelo-gradient text-white border-0">
                          <Plus className="w-4 h-4 mr-2" />
                          Criar destaque
                        </Button>
                      </form>
                    </Card>

                    <Card className="border-border overflow-hidden">
                      <div className="p-5 border-b border-border flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">Campanhas</h3>
                          <p className="text-sm text-muted-foreground">Destaques ativos, pausados e expirados.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadFeaturedAdminData} disabled={featuredLoading}>
                          Atualizar
                        </Button>
                      </div>

                      {featuredLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Carregando destaques...</div>
                      ) : featuredPlacements.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhum destaque cadastrado.</div>
                      ) : (
                        <div className="divide-y divide-border">
                          {featuredPlacements.map((placement) => (
                            <div key={placement.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold">{placement.business?.name || "NegÃ³cio removido"}</h4>
                                  <Badge variant={placement.status === "active" ? "default" : "secondary"}>
                                    {placement.status}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {formatFeaturedScope(placement)}
                                  </Badge>
                                  {placement.priority > 0 && (
                                    <Badge variant="outline">prioridade {placement.priority}</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {new Date(placement.startsAt).toLocaleDateString("pt-BR")} atÃ© {new Date(placement.endsAt).toLocaleDateString("pt-BR")}
                                  {placement.priceCents > 0 ? ` Â· ${(placement.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "CAD" })}` : ""}
                                </p>
                                {placement.notes && <p className="text-sm mt-2">{placement.notes}</p>}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleToggleFeaturedStatus(placement)}>
                                  {placement.status === "active" ? "Pausar" : "Ativar"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => handleDeleteFeaturedPlacement(placement)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Remover
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </TabsContent>
              )}
              
              <TabsContent value="mensagens">
                <div className="flex flex-col md:flex-row gap-6 h-[600px]">
                  {/* Lista de Conversas */}
                  <Card className="w-full md:w-80 border-border overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border bg-secondary/10">
                      <h3 className="font-bold flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        Conversas
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-sm">Nenhuma conversa encontrada.</p>
                        </div>
                      ) : (
                        conversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv)}
                            className={`w-full text-left p-4 border-b border-border transition-colors hover:bg-secondary/20 ${
                              selectedConv?.id === conv.id ? "bg-secondary/40 border-r-4 border-r-primary" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                                {(conv.businessName || "C").charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm truncate">{conv.businessName || "Cliente"}</span>
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {conv.lastMessageAt && new Date(conv.lastMessageAt).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" }).split(",")[1]}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {conv.lastMessage || "Nenhuma mensagem"}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* Janela de Chat */}
                  <Card className="flex-1 border-border overflow-hidden flex flex-col">
                    {selectedConv ? (
                      <>
                        <div className="p-4 border-b border-border bg-secondary/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                              {(selectedConv.businessName || "C").charAt(0)}
                            </div>
                            <span className="font-bold text-sm">{selectedConv.businessName || "Conversa"}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteConversation(selectedConv.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/5">
                          {messages.map((m) => (
                            <div 
                              key={m.id} 
                              className={`flex ${m.senderId === session?.userId ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                                m.senderId === session?.userId 
                                  ? "bg-primary text-white rounded-tr-none" 
                                  : "bg-white text-foreground border border-border rounded-tl-none"
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                                <p className={`text-[10px] mt-1 text-right opacity-70`}>
                                  {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-border bg-white">
                          <form 
                            className="flex gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSendMessage();
                            }}
                          >
                            <Input 
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              placeholder="Digite sua resposta..."
                              className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={!messageText.trim() || sendingMsg}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-center p-8">
                        <div>
                          <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                          <p className="text-muted-foreground">Selecione uma conversa para responder seus clientes</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Edit Business Dialog */}
      <Dialog open={!!editingBusiness} onOpenChange={(open) => !open && setEditingBusiness(null)}>
        <DialogContent 
          className="max-w-2xl h-[85vh] flex flex-col overflow-hidden"
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
            <DialogTitle>Editar {editFormData.name || "NegÃ³cio"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-4">
            <div className="sm:col-span-2 border-b border-border pb-2">
              <h3 className="text-base font-semibold">Dados principais</h3>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="edit-name">Nome do NegÃ³cio *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => handleEditInputChange("name", e.target.value)}
                placeholder="Ex: Brasil Tropical Bakery"
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="edit-category">Categoria *</Label>
              <Select
                value={editFormData.category}
                onValueChange={(val) => handleEditInputChange("category", val)}
              >
                <SelectTrigger id="edit-category" className="mt-1.5 w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
                  {BUSINESS_CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="edit-description">DescriÃ§Ã£o *</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => handleEditInputChange("description", e.target.value)}
                placeholder="Descreva seu negÃ³cio..."
                className="mt-1.5 min-h-[160px]"
              />
            </div>

            <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
              <h3 className="text-base font-semibold">Oferta e conteÃºdo</h3>
            </div>

            {getCategoryId(editFormData.category) === "food" ? (
              <div className="sm:col-span-2 space-y-4 rounded-lg border border-border bg-secondary/10 p-4">
                <div className="flex items-center justify-between">
                  <Label>CardÃ¡pio</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditFormData(prev => ({
                      ...prev,
                      menu: [...prev.menu, { name: "", description: "", price: "" }]
                    }))}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {editFormData.menu.map((item, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-secondary/10 space-y-3 relative group">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditFormData(prev => ({
                          ...prev,
                          menu: prev.menu.filter((_, i) => i !== index)
                        }))}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Nome do Item</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const newMenu = [...editFormData.menu];
                              newMenu[index].name = e.target.value;
                              setEditFormData(prev => ({ ...prev, menu: newMenu }));
                            }}
                            placeholder="Ex: PÃ£o de Queijo"
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">PreÃ§o</Label>
                          <Input
                            value={item.price}
                            onChange={(e) => {
                              const newMenu = [...editFormData.menu];
                              newMenu[index].price = e.target.value;
                              setEditFormData(prev => ({ ...prev, menu: newMenu }));
                            }}
                            placeholder="Ex: $5.00"
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">DescriÃ§Ã£o</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const newMenu = [...editFormData.menu];
                            newMenu[index].description = e.target.value;
                            setEditFormData(prev => ({ ...prev, menu: newMenu }));
                          }}
                          placeholder="Ex: PorÃ§Ã£o com 6 unidades"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    </div>
                  ))}
                  {editFormData.menu.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-border rounded-lg">
                      <p className="text-xs text-muted-foreground">Nenhum item no cardÃ¡pio. Adicione o seu primeiro!</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-menu-pdf">Cardápio completo (PDF, opcional)</Label>
                  <div className="mt-1.5">
                    <label
                      htmlFor="edit-menu-pdf"
                      className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary"
                    >
                      Escolher arquivo PDF
                    </label>
                  </div>
                  <Input
                    id="edit-menu-pdf"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handleMenuPdfChange(e, true)}
                    className="hidden"
                  />
                  {editFormData.menuPdfUrl && (
                    <a
                      href={editFormData.menuPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Ver PDF atual
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/10 p-4">
                <Label htmlFor="edit-services">ServiÃ§os Oferecidos (um por linha)</Label>
                <Textarea
                  id="edit-services"
                  value={editFormData.services}
                  onChange={(e) => handleEditInputChange("services", e.target.value)}
                  placeholder="Padaria&#10;Confeitaria&#10;Delivery"
                  className="mt-1.5"
                  rows={4}
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <Label htmlFor="edit-keywords">Palavras-Chave (para busca, separadas por vÃ­rgula)</Label>
              <Input
                id="edit-keywords"
                value={editFormData.keywords}
                onChange={(e) => handleEditInputChange("keywords", e.target.value)}
                placeholder="Ex: dentista, clareamento, odontologia, aparelhos"
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
              <h3 className="text-base font-semibold">Contato e redes</h3>
            </div>

            <div>
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => handleEditInputChange("phone", e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={editFormData.email}
                onChange={(e) => handleEditInputChange("email", e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={editFormData.website}
                onChange={(e) => handleEditInputChange("website", e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-instagram">Instagram</Label>
              <Input
                id="edit-instagram"
                value={editFormData.instagram}
                onChange={(e) => handleEditInputChange("instagram", e.target.value)}
                placeholder="@seuinstagram"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-facebook">Facebook</Label>
              <Input
                id="edit-facebook"
                value={editFormData.facebook}
                onChange={(e) => handleEditInputChange("facebook", e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-whatsapp">WhatsApp</Label>
              <Input
                id="edit-whatsapp"
                value={editFormData.whatsapp}
                onChange={(e) => handleEditInputChange("whatsapp", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
              <h3 className="text-base font-semibold">HorÃ¡rios</h3>
            </div>

            <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/10 p-4">
              <Label>HorÃ¡rios de funcionamento</Label>
              <div className="mt-3 space-y-2">
                {editBusinessHours.map((hour) => (
                  <div key={hour.day} className="grid grid-cols-[120px_90px_1fr_1fr] gap-2 items-center">
                    <span className="text-sm font-medium">{hour.day}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={hour.enabled ? "default" : "outline"}
                      onClick={() => updateBusinessHour(hour.day, { enabled: !hour.enabled }, true)}
                    >
                      {hour.enabled ? "Aberto" : "Fechado"}
                    </Button>
                    <Input
                      type="time"
                      value={hour.open}
                      disabled={!hour.enabled}
                      onChange={(e) => updateBusinessHour(hour.day, { open: e.target.value }, true)}
                    />
                    <Input
                      type="time"
                      value={hour.close}
                      disabled={!hour.enabled}
                      onChange={(e) => updateBusinessHour(hour.day, { close: e.target.value }, true)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
              <h3 className="text-base font-semibold">MÃ­dia</h3>
            </div>

            <div>
              <Label htmlFor="edit-logo">Alterar Logo</Label>
              <div className="mt-1.5">
                <label htmlFor="edit-logo" className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary">
                  Escolher imagem
                </label>
              </div>
              <Input
                id="edit-logo"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "logo", true)}
                className="hidden"
              />
              {editingBusiness?.logoUrl && (
                <div className="mt-2">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
                    <img src={editingBusiness.logoUrl} alt="Logo atual" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG e WEBP. Resolução ideal: 512x512 px. Tamanho máximo: 5MB.
              </p>
            </div>

            <div>
              <Label htmlFor="edit-hero">Alterar Capa (Banner)</Label>
              <div className="mt-1.5">
                <label htmlFor="edit-hero" className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary">
                  Escolher imagem
                </label>
              </div>
              <Input
                id="edit-hero"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "hero", true)}
                className="hidden"
              />
              {editingBusiness?.heroImage && (
                <div className="mt-2">
                  <div className="relative w-32 h-20 rounded-md overflow-hidden border border-border">
                    <img src={editingBusiness.heroImage} alt="Capa atual" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG e WEBP. Resolução ideal: 1600x600 px. Tamanho máximo: 5MB.
              </p>
            </div>

            <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
              <h3 className="text-base font-semibold">Galeria</h3>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="edit-photos">Adicionar Novas Fotos na Galeria</Label>
              <div className="mt-1.5">
                <label htmlFor="edit-photos" className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary">
                  Escolher arquivos
                </label>
              </div>
              <Input
                id="edit-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => handlePhotosChange(e, true)}
                className="hidden"
              />
              <div className="text-xs text-muted-foreground mt-1 mb-2">
                Existentes: {existingPhotos.length}/8 | Novas selecionadas: {editPhotoFiles.length} | Tamanho mÃ¡x: 5MB | Formatos: JPG, PNG, WEBP
              </div>
              {(existingPhotos.length > 0 || editPhotoFiles.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {existingPhotos.map((url, i) => (
                    <div key={`exist-${i}`} className="relative w-20 h-20 rounded-md overflow-hidden border border-border group">
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveExistingPhoto(i)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {editPhotoFiles.map((f, i) => (
                    <div key={`new-${i}`} className="relative w-20 h-20 rounded-md overflow-hidden border border-primary/50 group">
                      <div className="absolute inset-0 bg-primary/10 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">NOVA</span>
                      </div>
                      <img src={URL.createObjectURL(f)} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveNewPhoto(i, true)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
              <h3 className="text-base font-semibold">LocalizaÃ§Ã£o</h3>
            </div>

            <div className="sm:col-span-2">
              <Label>EndereÃ§o</Label>
              <div className="mt-1.5">
                <AddressAutocomplete
                  key={editingBusiness?.id}
                  value={editFormData.street}
                  onChange={(val) => handleEditInputChange("street", val)}
                  onPlaceSelected={handleEditPlaceSelected}
                />
              </div>
              {editFormData.street && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {editFormData.street}, {editFormData.city}, {editFormData.stateCode?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-border bg-white px-1 pt-3 pb-1">
            <Button variant="outline" onClick={handleEditCancel} disabled={isUploading}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={handleEditSave} disabled={isUploading}>
              <Save className="w-4 h-4 mr-2" />
              {isUploading ? "Enviando Imagens..." : "Salvar AlteraÃ§Ãµes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!couponBusiness} onOpenChange={(open) => !open && setCouponBusiness(null)}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Cupons de desconto - {couponBusiness?.name || "Negócio"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-5 py-4">
              <div>
                <Label htmlFor="coupon-title">Título da promoção</Label>
                <Input
                  id="coupon-title"
                  className="mt-1.5"
                  value={couponForm.title}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: 15% OFF no fim de semana"
                />
              </div>
              <div>
                <Label htmlFor="coupon-description">Descrição da promoção</Label>
                <Textarea
                  id="coupon-description"
                  className="mt-1.5 min-h-[120px]"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Explique regras, itens participantes e condições."
                />
              </div>
              <div>
                <Label htmlFor="coupon-code">Código promocional / cupom</Label>
                <Input
                  id="coupon-code"
                  className="mt-1.5"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: CARAMELINHO15"
                />
              </div>
              <div>
                <Label htmlFor="coupon-expiry">Data limite da promoção</Label>
                <Input
                  id="coupon-expiry"
                  type="date"
                  className="mt-1.5"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end border-t border-border bg-white px-1 pt-3 pb-1">
            <Button variant="outline" onClick={() => setCouponBusiness(null)} disabled={savingCoupon}>
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={handleSaveCoupon} disabled={savingCoupon}>
              {savingCoupon ? "Salvando..." : "Salvar promoção"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ATENÇÃO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              Você está prestes a <strong>APAGAR DEFINITIVAMENTE</strong> o negócio{" "}
              <strong>"{deleteTarget?.name}"</strong>.
            </p>
            <p className="text-red-600 font-semibold">Esta ação é IRREVERSÍVEL e todos os dados relacionados serão perdidos.</p>
            <p>Deseja continuar mesmo assim?</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmRemoveBusiness}>
              Sim, apagar negócio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <SiteFooter />
    </div>
  );
}

function getDateInputDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatFeaturedScope(placement: FeaturedPlacementFrontend): string {
  if (placement.scopeType === "global") return "Global";
  if (placement.scopeType === "country") return `PaÃ­s: ${placement.countryCode.toUpperCase()}`;
  if (placement.scopeType === "state") {
    return `${placement.countryCode.toUpperCase()}/${placement.stateCode.toUpperCase()}`;
  }
  return `${placement.city}, ${placement.stateCode.toUpperCase()}`;
}

function createDefaultBusinessHours(): BusinessHour[] {
  return [
    { day: "Segunda", enabled: true, open: "09:00", close: "18:00" },
    { day: "TerÃ§a", enabled: true, open: "09:00", close: "18:00" },
    { day: "Quarta", enabled: true, open: "09:00", close: "18:00" },
    { day: "Quinta", enabled: true, open: "09:00", close: "18:00" },
    { day: "Sexta", enabled: true, open: "09:00", close: "18:00" },
    { day: "SÃ¡bado", enabled: false, open: "10:00", close: "14:00" },
    { day: "Domingo", enabled: false, open: "10:00", close: "14:00" },
  ];
}

function serializeBusinessHours(hours: BusinessHour[]): string[] {
  return hours.map((hour) =>
    hour.enabled
      ? `${hour.day}: ${hour.open}-${hour.close}`
      : `${hour.day}: fechado`
  );
}

function parseBusinessHours(lines: string[]): BusinessHour[] {
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








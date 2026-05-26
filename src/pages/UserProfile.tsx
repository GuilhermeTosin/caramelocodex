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
  Sparkles,
  Plus,
  ExternalLink,
  Trash2,
  X,
  TicketPercent,
  Eye,
  AlertTriangle,
  BadgeCheck,
  Megaphone,
  ShieldCheck,
  CheckCircle,
  Ban,
  Calendar,
  BookOpen,
  Flag,
  Lock,
  Leaf,
  WheatOff,
  ClipboardCheck,
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
  createBusiness,
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
  isBusinessSlugAvailable,
  getCategoryId,
  getCategoryLabel,
  getPendingBusinessesForAdmin,
  setBusinessModerationStatus,
} from "@/services/businesses";
import {
  createFeaturedPlacement,
  deleteFeaturedPlacement,
  getFeaturedPlacementsForAdmin,
  updateFeaturedPlacementStatus,
} from "@/services/featured";
import {
  approveOwnershipRequest,
  getPendingOwnershipRequests,
  rejectOwnershipRequest,
  transferBusinessOwnershipByEmail,
} from "@/services/ownership";
import { archiveReport, getReportsForAdmin, unarchiveReport, updateReportStatus } from "@/services/reports";
import {
  archiveCommunityFindReport,
  getCommunityFindReportsForAdmin,
  unarchiveCommunityFindReport,
  updateCommunityFindReportStatus,
} from "@/services/communityFindReports";
import { getCurrencyPrefixForCountry } from "@/lib/currency";
import {
  DEFAULT_CATEGORY_SYNONYMS,
  getCategorySynonymsConfig,
  getGlobalCategorySynonymsConfig,
  saveGlobalCategorySynonymsConfig,
} from "@/services/searchPreferences";
import {
  getVerificationRequestsByOwner,
  getPendingVerificationRequestsForAdmin,
  requestBusinessVerification,
  setBusinessVerifiedFlag,
  setVerificationRequestStatus,
} from "@/services/verification";
import { createCommunityEvent, deleteCommunityEvent, getCommunityEventsByOwner, getCommunityEventsByOwnerAndBusiness, replaceBusinessLinkedEvents, updateCommunityEvent } from "@/services/events";
import { deleteCommunityFind, getCommunityFindsByOwner, updateCommunityFind } from "@/services/communityFinds";
import AddCommunityFindForm from "@/components/AddCommunityFindForm";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import type { AddressResult } from "@/components/AddressAutocomplete";
import type {
  BusinessFrontend,
  ConversationFrontend,
  FeaturedPlacementFrontend,
  FeaturedScopeType,
  MessageFrontend,
  OwnerClaimRequest,
  BusinessReport,
  BusinessVerificationRequest,
  BusinessEvent,
  Promotion,
  Review,
  CommunityEvent,
  CommunityFindReport,
  CommunityFind,
} from "@/types/database";

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
  const [showMissingProfileError, setShowMissingProfileError] = useState(false);
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
  const couponDatePickerRef = useRef<HTMLInputElement>(null);
  const communityEventDatePickerRef = useRef<HTMLInputElement>(null);

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
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessFrontend | null>(null);
  const [couponBusiness, setCouponBusiness] = useState<BusinessFrontend | null>(null);
  const [menuBusiness, setMenuBusiness] = useState<BusinessFrontend | null>(null);
  const [serviceBusiness, setServiceBusiness] = useState<BusinessFrontend | null>(null);
  const [eventsBusiness, setEventsBusiness] = useState<BusinessFrontend | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [savingEvents, setSavingEvents] = useState(false);
  const [couponItems, setCouponItems] = useState<Promotion[]>([]);
  const [menuItems, setMenuItems] = useState<{ name: string; description: string; price: string }[]>([]);
  const [serviceItems, setServiceItems] = useState<{ name: string; description: string; price: string }[]>([]);
  const [menuNameErrors, setMenuNameErrors] = useState<Record<number, boolean>>({});
  const [serviceNameErrors, setServiceNameErrors] = useState<Record<number, boolean>>({});
  const [menuPdfUrl, setMenuPdfUrl] = useState("");
  const [menuPdfFile, setMenuPdfFile] = useState<File | null>(null);
  const [eventItems, setEventItems] = useState<BusinessEvent[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<BusinessFrontend | null>(null);
  const [couponForm, setCouponForm] = useState<Promotion>({
    title: "",
    description: "",
    code: "",
    expiresAt: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    shortSlug: "",
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
    isVeganFriendly: false,
    isVegetarianFriendly: false,
    isGlutenFreeFriendly: false,
    keywords: "",
  });
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editHeroFile, setEditHeroFile] = useState<File | null>(null);
  const [editPhotoFiles, setEditPhotoFiles] = useState<File[]>([]);
  const [editMenuPdfFile, setEditMenuPdfFile] = useState<File | null>(null);
  const [eventFlyerFiles, setEventFlyerFiles] = useState<Record<number, File>>({});
  const eventDatePickerRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [editBusinessHours, setEditBusinessHours] = useState<BusinessHour[]>(createDefaultBusinessHours());
  const [shortSlugStatus, setShortSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [shortSlugMessage, setShortSlugMessage] = useState("");
  const [myReviews, setMyReviews] = useState<(BusinessFrontend["reviews"][0] & { businessName: string; businessSlug: string; businessId: string })[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<BusinessFrontend[]>([]);
  const [ownershipRequests, setOwnershipRequests] = useState<OwnerClaimRequest[]>([]);
  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [transferBusinessId, setTransferBusinessId] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [featuredPlacements, setFeaturedPlacements] = useState<FeaturedPlacementFrontend[]>([]);
  const [reports, setReports] = useState<BusinessReport[]>([]);
  const [communityFindReports, setCommunityFindReports] = useState<CommunityFindReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsView, setReportsView] = useState<"active" | "archived">("active");
  const [reportsKind, setReportsKind] = useState<"negocios" | "achadinhos">("negocios");
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [verificationBusiness, setVerificationBusiness] = useState<BusinessFrontend | null>(null);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [instagramPostUrl, setInstagramPostUrl] = useState("");
  const [verificationRequests, setVerificationRequests] = useState<BusinessVerificationRequest[]>([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [myVerificationRequests, setMyVerificationRequests] = useState<BusinessVerificationRequest[]>([]);
  const [pendingModerationBusinesses, setPendingModerationBusinesses] = useState<BusinessFrontend[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationPreviewBusiness, setModerationPreviewBusiness] = useState<BusinessFrontend | null>(null);
  const [myCommunityEvents, setMyCommunityEvents] = useState<CommunityEvent[]>([]);
  const [myCommunityFinds, setMyCommunityFinds] = useState<CommunityFind[]>([]);
  const [showCommunityFindForm, setShowCommunityFindForm] = useState(false);
  const [editingCommunityFind, setEditingCommunityFind] = useState<CommunityFind | null>(null);
  const [editingCommunityFindSubmitting, setEditingCommunityFindSubmitting] = useState(false);
  const [editingCommunityFindForm, setEditingCommunityFindForm] = useState<{
    productName: string;
    locationName: string;
    category: CommunityFind["category"];
  }>({
    productName: "",
    locationName: "",
    category: "comida",
  });
  const [savingCommunityEvent, setSavingCommunityEvent] = useState(false);
  const [editingCommunityEventId, setEditingCommunityEventId] = useState<string | null>(null);
  const [communityEventFlyerFile, setCommunityEventFlyerFile] = useState<File | null>(null);
  const [communityEventForm, setCommunityEventForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    isFree: true,
    price: "",
    ticketUrl: "",
    flyerUrl: "",
    businessId: "none",
  });
  const [verificationAdminView, setVerificationAdminView] = useState<"pendentes" | "verificados">("pendentes");
  const [searchSynonymsConfig, setSearchSynonymsConfig] = useState<Record<string, string[]>>(getCategorySynonymsConfig());
  const [searchSynonymsCategory, setSearchSynonymsCategory] = useState<string>(Object.keys(getCategorySynonymsConfig())[0] || "");
  const [searchSynonymsDraft, setSearchSynonymsDraft] = useState("");
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

  useEffect(() => {
    let alive = true;
    getGlobalCategorySynonymsConfig().then((cfg) => {
      if (!alive) return;
      setSearchSynonymsConfig(cfg);
      const first = Object.keys(cfg)[0] || "";
      setSearchSynonymsCategory((prev) => prev || first);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!searchSynonymsCategory) return;
    setSearchSynonymsDraft((searchSynonymsConfig[searchSynonymsCategory] || []).join(", "));
  }, [searchSynonymsCategory, searchSynonymsConfig]);

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
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!session || user || isLoading) {
      setShowMissingProfileError(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowMissingProfileError(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [session, user, isLoading]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!session) {
      navigate("/entrar?redirect=/perfil");
      return;
    }

    // Load conversations
    getConversationsForUser(session.userId).then(setConversations);
    getVerificationRequestsByOwner(session.userId).then(setMyVerificationRequests);

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
    getCommunityEventsByOwner(session.userId).then(setMyCommunityEvents);
    getCommunityFindsByOwner(session.userId).then(setMyCommunityFinds);

    // Load reviews made by this user
    getReviewsByUser(session.userId).then((reviews) => {
      setGivenReviews(reviews as any);
    });
  }, [session, user, navigate, isLoading]);

  const handleCreateCommunityEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.userId) return;
    if (!communityEventForm.title.trim() || !communityEventForm.date || !communityEventForm.location.trim()) {
      toast.error("Preencha título, data e local do evento.");
      return;
    }
    const eventDateIso = parseBrDateToIso(communityEventForm.date);
    if (!eventDateIso) {
      toast.error("Data inválida. Use o formato dd-mm-yyyy.");
      return;
    }

    setSavingCommunityEvent(true);
    let flyerUrl = communityEventForm.flyerUrl || "";
    if (communityEventFlyerFile) {
      const ownerRef = communityEventForm.businessId !== "none" ? communityEventForm.businessId : session.userId;
      const path = generateImagePath(ownerRef, "event-flyer", communityEventFlyerFile.name);
      const uploaded = await uploadImage("business-images", path, communityEventFlyerFile);
      if (uploaded) flyerUrl = uploaded;
    }

    const payload = {
      title: communityEventForm.title,
      description: communityEventForm.description,
      date: eventDateIso,
      location: communityEventForm.location,
      isFree: communityEventForm.isFree,
      price: communityEventForm.isFree ? "" : communityEventForm.price,
      ticketUrl: communityEventForm.ticketUrl || null,
      flyerUrl: flyerUrl || null,
      businessId: communityEventForm.businessId === "none" ? null : communityEventForm.businessId,
      status: "published",
    };
    const result = editingCommunityEventId
      ? await updateCommunityEvent(editingCommunityEventId, payload)
      : await createCommunityEvent(session.userId, payload);
    setSavingCommunityEvent(false);

    if (!result.ok) {
      toast.error(result.error || "Não foi possível criar o evento.");
      return;
    }

    toast.success(editingCommunityEventId ? "Evento atualizado com sucesso." : "Evento publicado com sucesso.");
    setEditingCommunityEventId(null);
    setCommunityEventForm({
      title: "",
      description: "",
      date: "",
      location: "",
      isFree: true,
      price: "",
      ticketUrl: "",
      flyerUrl: "",
      businessId: "none",
    });
    setCommunityEventFlyerFile(null);
    const events = await getCommunityEventsByOwner(session.userId);
    setMyCommunityEvents(events);
    if (payload.businessId) {
      const linked = await getCommunityEventsByOwnerAndBusiness(session.userId, payload.businessId);
      await replaceBusinessLinkedEvents(
        session.userId,
        payload.businessId,
        linked.map((evt) => ({
          title: evt.title,
          description: evt.description || "",
          date: evt.date,
          location: evt.location,
          isFree: !!evt.is_free,
          price: evt.price || "",
          flyerUrl: evt.flyer_url || "",
          ticketUrl: evt.ticket_url || "",
        }))
      );
    }
    const businesses = await getBusinessesByOwner(session.userId);
    setMyBusinesses(businesses);
  };

  const handleStartEditCommunityEvent = (evt: CommunityEvent) => {
    setEditingCommunityEventId(evt.id);
    setCommunityEventForm({
      title: evt.title || "",
      description: evt.description || "",
      date: formatIsoToBr(evt.date || ""),
      location: evt.location || "",
      isFree: !!evt.is_free,
      price: evt.price || "",
      ticketUrl: evt.ticket_url || "",
      flyerUrl: evt.flyer_url || "",
      businessId: evt.business_id || "none",
    });
    setCommunityEventFlyerFile(null);
    setActiveTab("eventos");
  };

  const handleDeleteCommunityEvent = async (event: CommunityEvent) => {
    if (!confirm("Excluir este evento?")) return;
    const result = await deleteCommunityEvent(event.id);
    if (!result.ok) {
      toast.error(result.error || "Não foi possível excluir o evento.");
      return;
    }
    toast.success("Evento excluído.");
    setMyCommunityEvents((prev) => prev.filter((evt) => evt.id !== event.id));
    if (session?.userId) {
      if (event.business_id) {
        const linked = await getCommunityEventsByOwnerAndBusiness(session.userId, event.business_id);
        await replaceBusinessLinkedEvents(
          session.userId,
          event.business_id,
          linked.map((evt) => ({
            title: evt.title,
            description: evt.description || "",
            date: evt.date,
            location: evt.location,
            isFree: !!evt.is_free,
            price: evt.price || "",
            flyerUrl: evt.flyer_url || "",
            ticketUrl: evt.ticket_url || "",
          }))
        );
      }
      const businesses = await getBusinessesByOwner(session.userId);
      setMyBusinesses(businesses);
    }
  };

  const handleDeleteCommunityFind = async (findId: string) => {
    if (!confirm("Excluir este achadinho?")) return;
    const result = await deleteCommunityFind(findId);
    if (!result.ok) {
      toast.error(result.error || "Não foi possível excluir o achadinho.");
      return;
    }
    setMyCommunityFinds((prev) => prev.filter((find) => find.id !== findId));
    toast.success("Achadinho excluído.");
  };

  const handleStartEditCommunityFind = (find: CommunityFind) => {
    setEditingCommunityFind(find);
    setEditingCommunityFindForm({
      productName: find.product_name || "",
      locationName: find.location_name || "",
      category: find.category || "outros",
    });
  };

  const handleSaveCommunityFindEdit = async () => {
    if (!editingCommunityFind) return;
    if (!editingCommunityFindForm.productName.trim() || !editingCommunityFindForm.locationName.trim()) {
      toast.error("Preencha o nome do produto e o local.");
      return;
    }
    setEditingCommunityFindSubmitting(true);
    const result = await updateCommunityFind(editingCommunityFind.id, {
      productName: editingCommunityFindForm.productName,
      locationName: editingCommunityFindForm.locationName,
      category: editingCommunityFindForm.category,
    });
    setEditingCommunityFindSubmitting(false);
    if (!result.ok) {
      toast.error(result.error || "Não foi possível editar o achadinho.");
      return;
    }
    if (session?.userId) {
      const finds = await getCommunityFindsByOwner(session.userId);
      setMyCommunityFinds(finds);
    }
    setEditingCommunityFind(null);
    toast.success("Achadinho atualizado.");
  };

  const loadFeaturedAdminData = async () => {
    setFeaturedLoading(true);
    const [placements, businesses] = await Promise.all([
      getFeaturedPlacementsForAdmin(),
      getAllBusinesses(),
    ]);
    setFeaturedPlacements(placements);
    setAllBusinesses(businesses);
    setFeaturedLoading(false);
  };

  const loadOwnershipAdminData = async () => {
    setOwnershipLoading(true);
    const [requests, businesses] = await Promise.all([
      getPendingOwnershipRequests(),
      getAllBusinesses(),
    ]);
    setOwnershipRequests(requests);
    setAllBusinesses(businesses);
    setOwnershipLoading(false);
  };

  const loadReportsAdminData = async (mode: "active" | "archived" = reportsView) => {
    setReportsLoading(true);
    if (reportsKind === "negocios") {
      const data = await getReportsForAdmin(mode);
      setReports(data);
    } else {
      const data = await getCommunityFindReportsForAdmin(mode);
      setCommunityFindReports(data);
    }
    setReportsLoading(false);
  };

  const loadVerificationAdminData = async () => {
    setVerificationLoading(true);
    const data = await getPendingVerificationRequestsForAdmin();
    setVerificationRequests(data);
    setVerificationLoading(false);
  };

  const loadBusinessModerationData = async () => {
    setModerationLoading(true);
    const data = await getPendingBusinessesForAdmin();
    setPendingModerationBusinesses(data);
    setModerationLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadFeaturedAdminData();
    loadOwnershipAdminData();
    loadReportsAdminData();
    loadVerificationAdminData();
    loadBusinessModerationData();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadReportsAdminData(reportsView);
  }, [isAdmin, reportsView, reportsKind]);

  const handleReportStatus = async (id: string, status: BusinessReport["status"]) => {
    const result = await updateReportStatus(id, status);
    if (!result.ok) {
      toast.error(result.error || "Erro ao atualizar denúncia.");
      return;
    }
    toast.success("Denúncia atualizada.");
    loadReportsAdminData(reportsView);
  };

  const handleArchiveReport = async (report: BusinessReport) => {
    if (!session?.userId) {
      toast.error("Sessão inválida.");
      return;
    }
    if (report.status !== "resolved" && report.status !== "rejected") {
      toast.error("Só é possível arquivar denúncias resolvidas ou rejeitadas.");
      return;
    }
    const result = await archiveReport(report.id, session.userId);
    if (!result.ok) {
      toast.error(result.error || "Erro ao arquivar denúncia.");
      return;
    }
    toast.success("Denúncia arquivada.");
    loadReportsAdminData(reportsView);
  };

  const handleSaveSearchSynonyms = async () => {
    if (!searchSynonymsCategory) return;
    const next = { ...searchSynonymsConfig };
    next[searchSynonymsCategory] = searchSynonymsDraft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const ok = await saveGlobalCategorySynonymsConfig(next);
    if (!ok) {
      toast.error("Não foi possível salvar os sinônimos globais.");
      return;
    }
    setSearchSynonymsConfig(next);
    toast.success("Sinônimos globais da busca salvos.");
  };

  const handleResetSearchSynonyms = () => {
    setSearchSynonymsConfig(DEFAULT_CATEGORY_SYNONYMS);
    void saveGlobalCategorySynonymsConfig(DEFAULT_CATEGORY_SYNONYMS);
    const first = Object.keys(DEFAULT_CATEGORY_SYNONYMS)[0] || "";
    setSearchSynonymsCategory(first);
    setSearchSynonymsDraft((DEFAULT_CATEGORY_SYNONYMS[first] || []).join(", "));
    toast.success("Sinônimos restaurados para o padrão.");
  };

  const handleUnarchiveReport = async (report: BusinessReport) => {
    const result = await unarchiveReport(report.id);
    if (!result.ok) {
      toast.error(result.error || "Erro ao desarquivar denúncia.");
      return;
    }
    toast.success("Denúncia desarquivada.");
    loadReportsAdminData(reportsView);
  };

  const handleCommunityFindReportStatus = async (
    id: string,
    status: CommunityFindReport["status"]
  ) => {
    const result = await updateCommunityFindReportStatus(id, status);
    if (!result.ok) {
      toast.error(result.error || "Erro ao atualizar denúncia de achadinho.");
      return;
    }
    toast.success("Denúncia de achadinho atualizada.");
    loadReportsAdminData(reportsView);
  };

  const handleArchiveCommunityFindReport = async (report: CommunityFindReport) => {
    if (!session?.userId) {
      toast.error("Sessão inválida.");
      return;
    }
    if (report.status !== "resolved" && report.status !== "rejected") {
      toast.error("Só é possível arquivar denúncias resolvidas ou rejeitadas.");
      return;
    }
    const result = await archiveCommunityFindReport(report.id, session.userId);
    if (!result.ok) {
      toast.error(result.error || "Erro ao arquivar denúncia de achadinho.");
      return;
    }
    toast.success("Denúncia de achadinho arquivada.");
    loadReportsAdminData(reportsView);
  };

  const handleUnarchiveCommunityFindReport = async (report: CommunityFindReport) => {
    const result = await unarchiveCommunityFindReport(report.id);
    if (!result.ok) {
      toast.error(result.error || "Erro ao desarquivar denúncia de achadinho.");
      return;
    }
    toast.success("Denúncia de achadinho desarquivada.");
    loadReportsAdminData(reportsView);
  };

  const handleModerationDecision = async (
    business: BusinessFrontend,
    status: "approved" | "rejected"
  ) => {
    if (!session?.userId) {
      toast.error("Sessão inválida.");
      return;
    }
    const ok = await setBusinessModerationStatus(business.id, status, session.userId);
    if (!ok) {
      toast.error("Não foi possível atualizar o status deste negócio.");
      return;
    }
    toast.success(
      status === "approved"
        ? "negócio aprovado e publicado."
        : "negócio rejeitado."
    );
    setPendingModerationBusinesses((prev) => prev.filter((b) => b.id !== business.id));
  };

  const handleApproveOwnership = async (request: OwnerClaimRequest) => {
    const result = await approveOwnershipRequest(request.id);
    if (result.ok) {
      toast.success(`Ownership transferido para ${request.requester_name || request.requester_email}.`);
      loadOwnershipAdminData();
    } else {
      toast.error(result.error || "Erro ao aprovar solicitação.");
    }
  };

  const handleRejectOwnership = async (request: OwnerClaimRequest) => {
    const result = await rejectOwnershipRequest(request.id);
    if (result.ok) {
      toast.success("Solicitação recusada.");
      loadOwnershipAdminData();
    } else {
      toast.error(result.error || "Erro ao recusar solicitação.");
    }
  };

  const handleOpenVerificationModal = (biz: BusinessFrontend) => {
    if (getMyVerificationStatusByBusiness(biz.id) === "pending") {
      toast.info("Este negócio já possui uma solicitação de verificação pendente.");
      return;
    }
    setInstagramPostUrl("");
    setVerificationBusiness(biz);
  };

  const handleSubmitVerificationRequest = async () => {
    if (!verificationBusiness || !session?.userId) return;
    if (getMyVerificationStatusByBusiness(verificationBusiness.id) === "pending") {
      toast.info("Este negócio já possui uma solicitação de verificação pendente.");
      return;
    }
    if (verificationBusiness.reviews.length < 5) {
      toast.error("Seu negócio precisa ter pelo menos 5 avaliações para solicitar verificação.");
      return;
    }
    if (!verificationBusiness.instagram?.trim()) {
      toast.error("Adicione o Instagram do negócio antes de solicitar verificação.");
      return;
    }
    if (!instagramPostUrl.trim()) {
      toast.error("Informe o link do post no Instagram marcando o Caramelinho.");
      return;
    }
    setVerificationSubmitting(true);
    const result = await requestBusinessVerification({
      businessId: verificationBusiness.id,
      ownerId: session.userId,
      instagramPostUrl,
    });
    setVerificationSubmitting(false);
    if (!result.ok) {
      toast.error(result.error || "Não foi possível enviar a solicitação de verificação.");
      return;
    }
    if (session?.userId) {
      getVerificationRequestsByOwner(session.userId).then(setMyVerificationRequests);
    }
    toast.success("Solicitação de verificação enviada para análise.");
    setVerificationBusiness(null);
  };

  const getMyVerificationStatusByBusiness = (businessId: string): "pending" | "approved" | "rejected" | null => {
    const req = myVerificationRequests.find((r) => r.business_id === businessId);
    return req?.status || null;
  };

  const handleApproveVerification = async (request: BusinessVerificationRequest) => {
    if (!session?.userId) return;
    const statusResult = await setVerificationRequestStatus(request.id, "approved", session.userId);
    if (!statusResult.ok || !statusResult.businessId) {
      toast.error(statusResult.error || "Erro ao aprovar verificação.");
      return;
    }
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 12);
    const flagResult = await setBusinessVerifiedFlag(
      statusResult.businessId,
      true,
      validUntil.toISOString()
    );
    if (!flagResult.ok) {
      toast.error(flagResult.error || "Aprovado, mas falhou ao atualizar o badge de verificação.");
      return;
    }
    toast.success("negócio verificado com sucesso (validade de 12 meses).");
    loadVerificationAdminData();
  };

  const handleRejectVerification = async (request: BusinessVerificationRequest) => {
    if (!session?.userId) return;
    const result = await setVerificationRequestStatus(request.id, "rejected", session.userId);
    if (!result.ok) {
      toast.error(result.error || "Erro ao rejeitar verificação.");
      return;
    }
    toast.success("Solicitação de verificação rejeitada.");
    loadVerificationAdminData();
  };

  const handleRemoveBusinessVerification = async (biz: BusinessFrontend) => {
    if (!confirm(`Remover o selo de verificação de "${biz.name}"?`)) return;
    const result = await setBusinessVerifiedFlag(biz.id, false);
    if (!result.ok) {
      toast.error(result.error || "Não foi possível remover a verificação.");
      return;
    }
    toast.success("Verificação removida com sucesso.");
    const businesses = await getAllBusinesses();
    setAllBusinesses(businesses);
  };

  const handleDirectTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferBusinessId || !transferEmail.trim()) {
      toast.error("Selecione o negócio e informe o email do novo dono.");
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
      toast.error("Selecione um negócio para destacar.");
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
    if (!confirm(`Remover destaque de "${placement.business?.name || "negócio"}"?`)) return;
    const result = await deleteFeaturedPlacement(placement.id);
    if (result.ok) {
      toast.success("Destaque removido.");
      loadFeaturedAdminData();
    } else {
      toast.error(result.error || "Erro ao remover destaque.");
    }
  };

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
      shortSlug: biz.slug || "",
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
      isVeganFriendly: !!biz.isVeganFriendly,
      isVegetarianFriendly: !!biz.isVegetarianFriendly,
      isGlutenFreeFriendly: !!biz.isGlutenFreeFriendly,
      keywords: (biz.keywords || []).join(", "),
    });
    setEditBusinessHours(parseBusinessHours(biz.openingHours || []));
    setEditingBusiness(biz);
    setExistingPhotos(biz.photos || []);
  };

  const normalizeShortSlug = (value: string) =>
    (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

  const handleEditInputChange = (field: string, value: string) => {
    if (field === "shortSlug") {
      const normalized = normalizeShortSlug(value);
      setEditFormData((prev) => ({ ...prev, shortSlug: normalized }));
      return;
    }
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!creatingBusiness && !editingBusiness) return;
    const raw = (editFormData.shortSlug || "").trim();
    const normalized = normalizeShortSlug(raw);

    if (!normalized) {
      setShortSlugStatus("idle");
      setShortSlugMessage("Escolha um link curto para compartilhar seu negócio.");
      return;
    }

    if (normalized.includes("caramelinho")) {
      setShortSlugStatus("invalid");
      setShortSlugMessage('Não use "caramelinho" no link curto. Escolha algo único do seu negócio.');
      return;
    }

    if (normalized.length < 3) {
      setShortSlugStatus("invalid");
      setShortSlugMessage("Use pelo menos 3 caracteres.");
      return;
    }

    setShortSlugStatus("checking");
    setShortSlugMessage("Verificando disponibilidade...");

    let cancelled = false;
    const timer = setTimeout(async () => {
      const available = await isBusinessSlugAvailable(normalized, editingBusiness?.id);
      if (cancelled) return;
      if (available) {
        setShortSlugStatus("available");
        setShortSlugMessage("Disponível.");
      } else {
        setShortSlugStatus("taken");
        setShortSlugMessage("Indisponível. Esse link já está em uso.");
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editFormData.shortSlug, creatingBusiness, editingBusiness]);

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
    if (!session) return;
    const isCreateMode = creatingBusiness;
    if (!isCreateMode && !editingBusiness) return;
    if (!editFormData.name || !editFormData.category || !editFormData.description) {
      toast.error("Preencha os campos obrigatórios: Nome, Categoria e Descrição");
      return;
    }
    if (!editFormData.phone.trim() || !editFormData.email.trim()) {
      toast.error("Telefone e Email são obrigatórios.");
      return;
    }
    if (!editFormData.street || !editFormData.city || !editFormData.stateCode) {
      toast.error("O endereço completo (Rua, Cidade e Estado) é obrigatório.");
      return;
    }
    const services = editFormData.services
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const desiredSlug = slugify((editFormData.shortSlug || editFormData.name).trim());
    if (!desiredSlug) {
      toast.error("Defina um link curto válido para o negócio.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(desiredSlug)) {
      toast.error("Use apenas letras, números e hífen (-) no link curto.");
      return;
    }
    if (desiredSlug.includes("caramelinho")) {
      toast.error('Não use "caramelinho" no link curto. Escolha algo único do seu negócio.');
      return;
    }
    const slugAvailable = await isBusinessSlugAvailable(desiredSlug, editingBusiness?.id);
    if (!slugAvailable) {
      const baseCity = slugify(editFormData.city || "");
      const baseState = slugify(editFormData.stateCode || editFormData.state || "");
      const suggestion1 = `${desiredSlug}-${baseCity || "local"}`.replace(/-+$/g, "");
      const suggestion2 = `${desiredSlug}-${baseState || "oficial"}`.replace(/-+$/g, "");
      const suggestion3 = `${desiredSlug}-${Date.now().toString().slice(-4)}`;
      toast.error(`Esse link curto já está em uso. Tente: ${suggestion1}, ${suggestion2} ou ${suggestion3}.`);
      return;
    }
    const updates: any = {
      name: editFormData.name,
      slug: desiredSlug,
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
      isVeganFriendly: getCategoryId(editFormData.category) === "food" ? !!editFormData.isVeganFriendly : false,
      isVegetarianFriendly: getCategoryId(editFormData.category) === "food" ? !!editFormData.isVegetarianFriendly : false,
      isGlutenFreeFriendly: getCategoryId(editFormData.category) === "food" ? !!editFormData.isGlutenFreeFriendly : false,
      keywords: editFormData.keywords.split(",").map(k => k.trim()).filter(Boolean),
      openingHours: serializeBusinessHours(editBusinessHours),
    };

    setIsUploading(true);
    let targetBusinessId = editingBusiness?.id || "";
    let ok = false;

    if (isCreateMode) {
      const created = await createBusiness(session.userId, {
        ...updates,
        photos: existingPhotos,
      });
      if (!created) {
        toast.error("Erro ao criar negócio.");
        setIsUploading(false);
        return;
      }
      targetBusinessId = created.id;
      ok = true;
    }

    if (editLogoFile && targetBusinessId) {
      const path = generateImagePath(targetBusinessId, "logo", editLogoFile.name);
      const url = await uploadImage("business-images", path, editLogoFile);
      if (url) updates.logoUrl = url;
    }
    if (editHeroFile && targetBusinessId) {
      const path = generateImagePath(targetBusinessId, "hero", editHeroFile.name);
      const url = await uploadImage("business-images", path, editHeroFile);
      if (url) updates.heroImage = url;
    }
    updates.photos = existingPhotos;
    if (editPhotoFiles.length > 0 && targetBusinessId) {
      const uploadedPhotos: string[] = [];
      for (const file of editPhotoFiles) {
        const path = generateImagePath(targetBusinessId, "photo", file.name);
        const url = await uploadImage("business-images", path, file);
        if (url) uploadedPhotos.push(url);
      }
      updates.photos = [...existingPhotos, ...uploadedPhotos];
    }
    if (getCategoryId(editFormData.category) === "food" && editMenuPdfFile && targetBusinessId) {
      const path = generateImagePath(targetBusinessId, "menu", editMenuPdfFile.name);
      const url = await uploadImage("business-images", path, editMenuPdfFile);
      if (url) updates.menuPdfUrl = url;
    }

    if (isCreateMode) {
      ok = await updateBusiness(targetBusinessId, { ...updates });
    } else if (editingBusiness) {
      ok = await updateBusiness(editingBusiness.id, { ...updates });
    }

    if (ok) {
      toast.success(
        isCreateMode
          ? `"${editFormData.name}" enviado para análise. Esse processo pode levar até 24 horas.`
          : `"${editFormData.name}" atualizado com sucesso!`
      );
      setCreatingBusiness(false);
      setEditingBusiness(null);
      setEditLogoFile(null);
      setEditHeroFile(null);
      setEditPhotoFiles([]);
      setEditMenuPdfFile(null);
      getBusinessesByOwner(session.userId).then(setMyBusinesses);
    } else {
      toast.error(isCreateMode ? "Erro ao criar negócio." : "Erro ao atualizar negócio.");
    }
    setIsUploading(false);
  };

  const handleDeleteMyBusiness = async (biz: BusinessFrontend) => {
    setDeleteTarget(biz);
  };

  const handleConfirmDeleteMyBusiness = async () => {
    if (!deleteTarget) return;
    const ok = await deleteBusiness(deleteTarget.id);
    if (ok) {
      setMyBusinesses((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success("negócio removido com sucesso!");
      setDeleteTarget(null);
      return;
    }
    toast.error("Erro ao remover negócio.");
  };

  const handleOpenCouponModal = (biz: BusinessFrontend) => {
    const current = biz.promotions || [];
    setCouponForm({
      title: "",
      description: "",
      code: "",
      expiresAt: "",
    });
    setCouponItems(current);
    setCouponBusiness(biz);
  };

  const handleOpenMenuModal = (biz: BusinessFrontend) => {
    setMenuItems(biz.menu || []);
    setMenuPdfUrl(biz.menuPdfUrl || "");
    setMenuPdfFile(null);
    setMenuNameErrors({});
    setMenuBusiness(biz);
  };

  const handleSaveMenu = async () => {
    if (!menuBusiness) return;
    const nextErrors: Record<number, boolean> = {};
    const normalizedMenu: { name: string; description: string; price: string }[] = [];
    for (let i = 0; i < menuItems.length; i += 1) {
      const item = menuItems[i];
      const normalized = {
        name: (item.name || "").trim(),
        description: (item.description || "").trim(),
        price: (item.price || "").trim(),
      };
      const hasAnyData = !!normalized.name || !!normalized.description || !!normalized.price;
      if (!hasAnyData) continue;
      if (!normalized.name) {
        nextErrors[i] = true;
        continue;
      }
      normalizedMenu.push(normalized);
    }
    setMenuNameErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("No cardápio, o nome do item é obrigatório.");
      return;
    }

    setSavingMenu(true);
    let nextMenuPdfUrl = menuPdfUrl || "";
    if (menuPdfFile) {
      const path = generateImagePath(menuBusiness.id, "menu", menuPdfFile.name);
      const uploaded = await uploadImage("business-images", path, menuPdfFile);
      if (uploaded) nextMenuPdfUrl = uploaded;
    }

    const ok = await updateBusiness(menuBusiness.id, {
      menu: normalizedMenu,
      menuPdfUrl: nextMenuPdfUrl,
    });
    setSavingMenu(false);
    if (!ok) {
      toast.error("Não foi possível salvar o cardápio.");
      return;
    }

    setMyBusinesses((prev) =>
      prev.map((b) => (b.id === menuBusiness.id ? { ...b, menu: normalizedMenu, menuPdfUrl: nextMenuPdfUrl } : b))
    );
    toast.success("Cardápio salvo com sucesso.");
    setMenuBusiness(null);
  };

  const handleOpenServicesModal = (biz: BusinessFrontend) => {
    setServiceItems(biz.serviceItems || []);
    setServiceNameErrors({});
    setServiceBusiness(biz);
  };

  const handleSaveServices = async () => {
    if (!serviceBusiness) return;
    const nextErrors: Record<number, boolean> = {};
    const normalized: { name: string; description: string; price: string }[] = [];
    for (let i = 0; i < serviceItems.length; i += 1) {
      const item = serviceItems[i];
      const row = {
        name: (item.name || "").trim(),
        description: (item.description || "").trim(),
        price: (item.price || "").trim(),
      };
      const hasAnyData = !!row.name || !!row.description || !!row.price;
      if (!hasAnyData) continue;
      if (!row.name) {
        nextErrors[i] = true;
        continue;
      }
      normalized.push(row);
    }
    setServiceNameErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Em serviços, o nome do serviço é obrigatório.");
      return;
    }

    const legacyServices = normalized
      .map((item) => item.name)
      .filter(Boolean);

    setSavingServices(true);
    const ok = await updateBusiness(serviceBusiness.id, {
      serviceItems: normalized,
      services: legacyServices,
    });
    setSavingServices(false);
    if (!ok) {
      toast.error("Não foi possível salvar os serviços.");
      return;
    }

    setMyBusinesses((prev) =>
      prev.map((b) =>
        b.id === serviceBusiness.id
          ? { ...b, serviceItems: normalized, services: legacyServices }
          : b
      )
    );
    toast.success("Serviços salvos com sucesso.");
    setServiceBusiness(null);
  };

  const handleOpenEventsModal = (biz: BusinessFrontend) => {
    const current = biz.events || [];
    setEventItems(current);
    setEventFlyerFiles({});
    setEventsBusiness(biz);
  };

  const handleAddEvent = () => {
    setEventItems((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        date: "",
        location: "",
        isFree: true,
        price: "",
        flyerUrl: "",
        ticketUrl: "",
      },
    ]);
  };

  const handleRemoveEvent = (index: number) => {
    setEventItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEvents = async () => {
    if (!eventsBusiness || !session?.userId) return;
    const normalizedEvents: BusinessEvent[] = [];

    setSavingEvents(true);
    for (let i = 0; i < eventItems.length; i += 1) {
      const evt = eventItems[i];
      const hasAnyData =
        !!evt.title?.trim() ||
        !!evt.description?.trim() ||
        !!evt.date?.trim() ||
        !!evt.location?.trim() ||
        !!evt.price?.trim() ||
        !!evt.flyerUrl?.trim() ||
        !!evt.ticketUrl?.trim() ||
        !!eventFlyerFiles[i];
      if (!hasAnyData) continue;

      if (!evt.title?.trim() || !evt.date?.trim() || !evt.location?.trim()) {
        toast.error("Nos eventos, preencha pelo menos título, data e local.");
        setSavingEvents(false);
        return;
      }
      const eventDateIso = parseBrDateToIso(evt.date || "");
      if (!eventDateIso) {
        toast.error(`Data inválida no evento "${evt.title}". Use dd-mm-yyyy.`);
        setSavingEvents(false);
        return;
      }
      if (!evt.isFree && !evt.price?.trim()) {
        toast.error(`Informe o preço do evento "${evt.title}" ou marque entrada franca.`);
        setSavingEvents(false);
        return;
      }

      let flyerUrl = evt.flyerUrl?.trim() || "";
      const flyerFile = eventFlyerFiles[i];
      if (flyerFile) {
        const path = generateImagePath(eventsBusiness.id, `event-${i}`, flyerFile.name);
        const uploadedUrl = await uploadImage("business-images", path, flyerFile);
        if (uploadedUrl) flyerUrl = uploadedUrl;
      }

      normalizedEvents.push({
        title: evt.title.trim(),
        description: evt.description?.trim() || "",
        date: eventDateIso,
        location: evt.location.trim(),
        isFree: !!evt.isFree,
        price: evt.isFree ? "" : (evt.price?.trim() || ""),
        flyerUrl,
        ticketUrl: evt.ticketUrl?.trim() || "",
      });
    }

    const ok = await updateBusiness(eventsBusiness.id, { events: normalizedEvents });
    const syncResult = await replaceBusinessLinkedEvents(session.userId, eventsBusiness.id, normalizedEvents);
    setSavingEvents(false);
    if (!ok || !syncResult.ok) {
      toast.error("Não foi possível salvar os eventos.");
      return;
    }
    setMyBusinesses((prev) =>
      prev.map((b) => (b.id === eventsBusiness.id ? { ...b, events: normalizedEvents } : b))
    );
    toast.success("Eventos salvos com sucesso.");
    setEventsBusiness(null);
    setEventFlyerFiles({});
    const refreshedEvents = await getCommunityEventsByOwner(session.userId);
    setMyCommunityEvents(refreshedEvents);
  };

  const handleAddCoupon = () => {
    if (!couponForm.title.trim() || !couponForm.description.trim() || !couponForm.expiresAt) {
      toast.error("Preencha título, descrição e data limite antes de adicionar.");
      return;
    }
    const expiresAtIso = parseBrDateToIso(couponForm.expiresAt);
    if (!expiresAtIso) {
      toast.error("Data limite inválida. Use o formato dd-mm-yyyy.");
      return;
    }
    setCouponItems((prev) => [
      ...prev,
      {
        title: couponForm.title.trim(),
        description: couponForm.description.trim(),
        code: couponForm.code.trim(),
        expiresAt: expiresAtIso,
      },
    ]);
    setCouponForm({
      title: "",
      description: "",
      code: "",
      expiresAt: "",
    });
  };

  const handleRemoveCoupon = (index: number) => {
    setCouponItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCoupon = async () => {
    if (!couponBusiness) return;
    const hasDraftField =
      !!couponForm.title.trim() ||
      !!couponForm.description.trim() ||
      !!couponForm.code.trim() ||
      !!couponForm.expiresAt;

    const isDraftComplete =
      !!couponForm.title.trim() &&
      !!couponForm.description.trim() &&
      !!couponForm.expiresAt;

    if (hasDraftField && !isDraftComplete) {
      toast.error("Complete título, descrição e data limite da promoção atual ou limpe-os antes de salvar.");
      return;
    }

    const promotionsToSave = [...couponItems];
    if (isDraftComplete) {
      const expiresAtIso = parseBrDateToIso(couponForm.expiresAt);
      if (!expiresAtIso) {
        toast.error("Data limite inválida. Use o formato dd-mm-yyyy.");
        return;
      }
      promotionsToSave.push({
        title: couponForm.title.trim(),
        description: couponForm.description.trim(),
        code: couponForm.code.trim(),
        expiresAt: expiresAtIso,
      });
    }

    setSavingCoupon(true);
    const ok = await updateBusiness(couponBusiness.id, {
      promotions: promotionsToSave,
    });
    setSavingCoupon(false);
    if (!ok) {
      toast.error("Não foi possível salvar a promoção. Verifique se a coluna 'promotions' existe na tabela businesses.");
      return;
    }
    setMyBusinesses((prev) =>
      prev.map((b) =>
        b.id === couponBusiness.id ? { ...b, promotions: promotionsToSave } : b
      )
    );
    toast.success("Promoção salva com sucesso.");
    setCouponBusiness(null);
  };

  const handleOpenPdfPrivately = async (pdfUrl: string) => {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Falha ao carregar PDF");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      console.error("Erro ao abrir PDF privado:", error);
      toast.error("Não foi possível abrir o PDF agora.");
    }
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

  // Se tem sessão mas não tem perfil, aguarda um curto período antes de mostrar erro
  if (!user) {
    if (!showMissingProfileError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <PawPrint className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando seu perfil...</p>
          </div>
        </div>
      );
    }
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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-24">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
                <img src="/logo.webp" alt="Caramelinho logo" className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="font-extrabold text-lg sm:text-2xl tracking-tight caramelo-text-gradient truncate">Caramelinho</div>
                <div className="text-[10px] sm:text-sm font-semibold text-foreground/75 whitespace-nowrap overflow-hidden text-ellipsis">{"O SEU FARO FORA DO BRASIL"}</div>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link to="/perfil?tab=mensagens" onClick={() => setActiveTab("mensagens")} className="relative group">
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-secondary w-9 h-9 sm:w-10 sm:h-10">
                    <MessageCircle className="w-5 h-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/perfil">
                  <Button variant="outline" size="sm" className="rounded-full border-border hover:bg-secondary gap-1.5 sm:gap-2 px-2.5 sm:px-4 h-9 sm:h-10">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    <span className="font-medium max-w-[90px] sm:max-w-none truncate">{session?.name?.split(" ")[0] || "Perfil"}</span>
                  </Button>
                </Link>
              </div>
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
                  <TabsTrigger value="perfil" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </TabsTrigger>
                  <TabsTrigger value="negocios" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                    <Store className="w-4 h-4" />
                    Meus negócios
                  </TabsTrigger>
                  <TabsTrigger value="eventos" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                    <Calendar className="w-4 h-4" />
                    Meus Eventos
                  </TabsTrigger>
                  <TabsTrigger value="achadinhos" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                    <MapPin className="w-4 h-4" />
                    Achadinhos
                    {myCommunityFinds.some((find) => (find.upvotes || 0) - (find.downvotes || 0) <= -2) ? (
                      <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        !
                      </span>
                    ) : null}
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="verificacoes" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                      <BadgeCheck className="w-4 h-4" />
                      Verificações
                    </TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger value="analise-negocios" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                      <ClipboardCheck className="w-4 h-4" />
                      Análise de negócios
                    </TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger value="ownership" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                      <ShieldCheck className="w-4 h-4" />
                      Ownership
                    </TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger value="denuncias" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                      <Flag className="w-4 h-4" />
                      Denúncias
                    </TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger value="destaques" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                      <Megaphone className="w-4 h-4" />
                      Destaques
                    </TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger value="busca" className="justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-primary transition-all w-full">
                      <Search className="w-4 h-4" />
                      Busca
                    </TabsTrigger>
                  )}
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
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary transition-all w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </TabsList>
              </Card>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Tab: Profile */}
            <TabsContent value="perfil" className="mt-0">
              <Card className="p-6 border-border max-w-2xl">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl font-bold truncate">{user.name}</h1>
                      <p className="text-sm text-muted-foreground break-all sm:break-normal">{user.email}</p>
                    </div>
                  </div>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => {
                      setIsEditing(true);
                      setEditName(user.name);
                      setEditBio(user.bio);
                      setEditPhone(user.phone);
                      setEditLocation(user.location);
                    }} className="self-start sm:self-auto">
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
                        <div className="mt-1.5">
                          <label htmlFor="avatar" className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary">
                            Escolher imagem
                          </label>
                        </div>
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground">
                          Formatos aceitos: JPG, PNG e WEBP. Tamanho recomendado: 512x512 px. Tamanho máximo: 5MB.
                        </p>
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
            <TabsContent value="negocios" className="mt-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Meus negócios</h2>
                <Link to="/negocio/wizard">
                  <Button
                    size="sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar Novo negócio
                  </Button>
                </Link>
              </div>

              {myBusinesses.length === 0 ? (
                <Card className="p-8 text-center border-border">
                  <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Você ainda não cadastrou nenhum negócio.</p>
                  <Link to="/negocio/wizard"><Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar negócio
                  </Button></Link>
                </Card>
              ) : (
                <div id="meus-negocios-lista" className="space-y-4">
                  {myBusinesses.map((biz) => (
                    <Card key={biz.id} className="p-4 border-border">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                          <img
                            src={biz.logoUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=60"}
                            alt={biz.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link to={buildBusinessUrl(biz)} className="font-bold text-foreground hover:text-primary transition-colors">
                              {biz.name}
                            </Link>
                            {biz.moderationStatus === "pending" ? (
                              <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50">
                                Em análise
                              </Badge>
                            ) : null}
                            {biz.moderationStatus === "rejected" ? (
                              <Badge variant="outline" className="border-destructive/30 text-destructive">
                                Rejeitado
                              </Badge>
                            ) : null}
                            {(() => {
                              const status = getMyVerificationStatusByBusiness(biz.id);
                              if (!status) return null;
                              if (status === "pending") return <Badge variant="outline">Verificação pendente</Badge>;
                              if (status === "approved" && biz.ownerVerified) {
                                return (
                                  <Badge className="bg-emerald-600 text-white inline-flex items-center gap-1.5">
                                    <Lock className="w-3 h-3" />
                                    Verificado
                                  </Badge>
                                );
                              }
                              if (status === "approved" && !biz.ownerVerified) {
                                return <Badge variant="outline">Verificação expirada</Badge>;
                              }
                              return <Badge variant="outline" className="text-destructive border-destructive/30">Verificação rejeitada</Badge>;
                            })()}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {biz.address.city}, {biz.address.countryCode.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              {biz.averageRating.toFixed(1)} ({biz.reviews.length} {biz.reviews.length === 1 ? "avaliação" : "avaliações"})
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0">
                          {getCategoryLabel(biz.category).split(" (")[0]}
                        </Badge>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/60">
                        {getCategoryId(biz.category) === "food" &&
                          (biz.isVeganFriendly || biz.isVegetarianFriendly || biz.isGlutenFreeFriendly) ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {biz.isVeganFriendly ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                <Leaf className="w-3 h-3" />
                                Vegano
                              </span>
                            ) : null}
                            {biz.isVegetarianFriendly ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-lime-100 text-lime-800">
                                <Leaf className="w-3 h-3" />
                                Vegetariano
                              </span>
                            ) : null}
                            {biz.isGlutenFreeFriendly ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                                <WheatOff className="w-3 h-3" />
                                Sem Glúten
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/negocio/wizard?editBusinessId=${biz.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                              Editar
                            </Button>
                          </Link>
                          {getCategoryId(biz.category) === "food" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenMenuModal(biz)}
                            >
                              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                              Cardápio
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenServicesModal(biz)}
                            >
                              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                              Serviços
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEventsModal(biz)}
                          >
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Eventos
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCouponModal(biz)}
                          >
                            <TicketPercent className="w-3.5 h-3.5 mr-1.5" />
                            Promoções
                          </Button>
                          {!biz.ownerVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenVerificationModal(biz)}
                              disabled={getMyVerificationStatusByBusiness(biz.id) === "pending"}
                              title={
                                getMyVerificationStatusByBusiness(biz.id) === "pending"
                                  ? "Já existe uma solicitação pendente"
                                  : "Solicitar verificação"
                              }
                            >
                              <BadgeCheck className="w-3.5 h-3.5 mr-1.5" />
                              Solicitar verificação
                            </Button>
                          )}
                          <div className="ml-auto flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              aria-label={`Ver ${biz.name}`}
                              title="Ver negócio"
                            >
                              <Link to={buildBusinessUrl(biz)} target="_blank" rel="noreferrer">
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleDeleteMyBusiness(biz)}
                              aria-label={`Excluir ${biz.name}`}
                              title="Excluir negócio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="eventos" className="mt-0">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Meus Eventos</h2>
                </div>

                <Card className="p-5 border-border">
                  <h3 className="font-semibold mb-4">
                    {editingCommunityEventId ? "Editar evento" : "Criar novo evento"}
                  </h3>
                  <form onSubmit={handleCreateCommunityEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Título do evento *</Label>
                      <Input
                        className="mt-1.5"
                        value={communityEventForm.title}
                        onChange={(e) => setCommunityEventForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Noite de Samba Brasileira"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Descrição</Label>
                      <Textarea
                        className="mt-1.5 min-h-[90px]"
                        value={communityEventForm.description}
                        onChange={(e) => setCommunityEventForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Detalhes do evento, atrações e informações importantes."
                      />
                    </div>
                    <div>
                      <Label>Data *</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Input
                          value={communityEventForm.date}
                          onChange={(e) => setCommunityEventForm((prev) => ({ ...prev, date: e.target.value }))}
                          placeholder="dd-mm-yyyy"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const el = communityEventDatePickerRef.current as HTMLInputElement & { showPicker?: () => void };
                            if (!el) return;
                            if (typeof el.showPicker === "function") el.showPicker();
                            else el.click();
                          }}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <input
                          ref={communityEventDatePickerRef}
                          type="date"
                          value={normalizeDateForInput(communityEventForm.date)}
                          onChange={(e) =>
                            setCommunityEventForm((prev) => ({ ...prev, date: formatIsoToBr(e.target.value) }))
                          }
                          className="sr-only"
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Local *</Label>
                      <div className="mt-1.5">
                        <AddressAutocomplete
                          value={communityEventForm.location}
                          onChange={(val) => setCommunityEventForm((prev) => ({ ...prev, location: val }))}
                          onPlaceSelected={(place) =>
                            setCommunityEventForm((prev) => ({
                              ...prev,
                              location: place.formattedAddress || prev.location,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Vincular a negócio (opcional)</Label>
                      <Select
                        value={communityEventForm.businessId}
                        onValueChange={(v) => {
                          const selectedBusiness = myBusinesses.find((biz) => biz.id === v);
                          const autoLocation =
                            v !== "none" && selectedBusiness
                              ? [
                                selectedBusiness.address.street,
                                selectedBusiness.address.city,
                                selectedBusiness.address.state,
                                selectedBusiness.address.country,
                              ]
                                .filter(Boolean)
                                .join(", ")
                              : "";
                          const currencyPrefix =
                            v !== "none" && selectedBusiness
                              ? getCurrencyPrefixForCountry(selectedBusiness.address.countryCode || "")
                              : "";

                          setCommunityEventForm((prev) => ({
                            ...prev,
                            businessId: v,
                            location: v === "none" ? "" : autoLocation || prev.location,
                            price:
                              v === "none"
                                ? prev.price
                                : (!prev.isFree && !prev.price.trim() ? currencyPrefix : prev.price),
                          }));
                        }}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Selecionar negócio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem negócio vinculado</SelectItem>
                          {myBusinesses.map((biz) => (
                            <SelectItem key={biz.id} value={biz.id}>
                              {biz.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo de entrada</Label>
                      <Select
                        value={communityEventForm.isFree ? "free" : "paid"}
                        onValueChange={(v) =>
                          setCommunityEventForm((prev) => {
                            const nextIsFree = v === "free";
                            if (nextIsFree) {
                              return { ...prev, isFree: true, price: "" };
                            }
                            const selectedBusiness = myBusinesses.find((biz) => biz.id === prev.businessId);
                            const currencyPrefix = selectedBusiness
                              ? getCurrencyPrefixForCountry(selectedBusiness.address.countryCode || "")
                              : "";
                            return {
                              ...prev,
                              isFree: false,
                              price: prev.price.trim() ? prev.price : currencyPrefix,
                            };
                          })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Entrada franca</SelectItem>
                          <SelectItem value="paid">Evento pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!communityEventForm.isFree && (
                      <div>
                        <Label>Preço</Label>
                        <Input
                          className="mt-1.5"
                          value={communityEventForm.price}
                          onChange={(e) => setCommunityEventForm((prev) => ({ ...prev, price: e.target.value }))}
                          placeholder="Ex: CAD$ 25"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <Label>Link de ingressos (opcional)</Label>
                      <Input
                        className="mt-1.5"
                        value={communityEventForm.ticketUrl}
                        onChange={(e) => setCommunityEventForm((prev) => ({ ...prev, ticketUrl: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="community-event-flyer">Flyer do evento (opcional)</Label>
                      <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                        <label
                          htmlFor="community-event-flyer"
                          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary"
                        >
                          Escolher imagem
                        </label>
                        {communityEventFlyerFile ? (
                          <span className="text-xs text-emerald-700">
                            Arquivo selecionado: <strong>{communityEventFlyerFile.name}</strong>
                          </span>
                        ) : null}
                      </div>
                      <Input
                        id="community-event-flyer"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setCommunityEventFlyerFile(file);
                        }}
                      />
                      {(communityEventFlyerFile || communityEventForm.flyerUrl) && (
                        <div className="mt-2 flex items-start gap-3">
                          <img
                            src={communityEventFlyerFile ? URL.createObjectURL(communityEventFlyerFile) : communityEventForm.flyerUrl}
                            alt="Preview do flyer"
                            className="h-24 w-24 rounded-md object-cover border border-border"
                          />
                          <div className="flex flex-col gap-2">
                            {communityEventFlyerFile ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => setCommunityEventFlyerFile(null)}
                              >
                                Remover arquivo selecionado
                              </Button>
                            ) : null}
                            {communityEventForm.flyerUrl ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() =>
                                  setCommunityEventForm((prev) => ({
                                    ...prev,
                                    flyerUrl: "",
                                  }))
                                }
                              >
                                Remover flyer atual
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0" disabled={savingCommunityEvent}>
                          {savingCommunityEvent
                            ? (editingCommunityEventId ? "Salvando..." : "Publicando...")
                            : (editingCommunityEventId ? "Salvar alterações" : "Publicar evento")}
                        </Button>
                        {editingCommunityEventId && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingCommunityEventId(null);
                              setCommunityEventForm({
                                title: "",
                                description: "",
                                date: "",
                                location: "",
                                isFree: true,
                                price: "",
                                ticketUrl: "",
                                flyerUrl: "",
                                businessId: "none",
                              });
                              setCommunityEventFlyerFile(null);
                            }}
                          >
                            Cancelar edição
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </Card>

                <Card className="border-border overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h3 className="font-semibold">Eventos publicados</h3>
                  </div>
                  {myCommunityEvents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Você ainda não publicou eventos.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {myCommunityEvents.map((evt) => (
                        <div key={evt.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{evt.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(`${evt.date}T00:00:00`).toLocaleDateString("pt-BR")} · {evt.location}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              negócio vinculado:{" "}
                              <strong>
                                {evt.business_id
                                  ? (myBusinesses.find((b) => b.id === evt.business_id)?.name || "negócio não encontrado")
                                  : "Não vinculado"}
                              </strong>
                            </p>
                            {evt.description ? <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{evt.description}</p> : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEditCommunityEvent(evt)}
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleDeleteCommunityEvent(evt)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="achadinhos" className="mt-0">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Achadinhos</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gerencie os achadinhos que você publicou para a comunidade.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                    onClick={() => setShowCommunityFindForm((prev) => !prev)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {showCommunityFindForm ? "Fechar formulário" : "Novo achadinho"}
                  </Button>
                </div>

                {showCommunityFindForm && (
                  <AddCommunityFindForm
                    onCreated={async () => {
                      if (!session?.userId) return;
                      const finds = await getCommunityFindsByOwner(session.userId);
                      setMyCommunityFinds(finds);
                      setShowCommunityFindForm(false);
                    }}
                  />
                )}

                {myCommunityFinds.some((find) => (find.upvotes || 0) - (find.downvotes || 0) <= -2) && (
                  <Card className="border-amber-300 bg-amber-50">
                    <div className="p-4 text-sm text-amber-800">
                      Alguns achadinhos receberam muitos votos negativos. Revise e atualize ou remova para manter a qualidade das informações.
                    </div>
                  </Card>
                )}

                <Card className="border-border overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h3 className="font-semibold">Meus achadinhos publicados</h3>
                  </div>
                  {myCommunityFinds.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Você ainda não publicou nenhum achadinho.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {myCommunityFinds.map((find) => (
                        <div key={find.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{find.product_name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{find.location_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Publicado em {new Date(find.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">
                              {find.category}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEditCommunityFind(find)}
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleDeleteCommunityFind(find.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            <Dialog open={!!editingCommunityFind} onOpenChange={(open) => !open && setEditingCommunityFind(null)}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Editar achadinho</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-find-product">Nome do produto</Label>
                    <Input
                      id="edit-find-product"
                      className="mt-1.5"
                      value={editingCommunityFindForm.productName}
                      onChange={(e) =>
                        setEditingCommunityFindForm((prev) => ({ ...prev, productName: e.target.value }))
                      }
                      maxLength={140}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-find-location">Nome do local</Label>
                    <Input
                      id="edit-find-location"
                      className="mt-1.5"
                      value={editingCommunityFindForm.locationName}
                      onChange={(e) =>
                        setEditingCommunityFindForm((prev) => ({ ...prev, locationName: e.target.value }))
                      }
                      maxLength={180}
                    />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={editingCommunityFindForm.category}
                      onValueChange={(value) =>
                        setEditingCommunityFindForm((prev) => ({
                          ...prev,
                          category: value as CommunityFind["category"],
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comida">Comida</SelectItem>
                        <SelectItem value="beleza">Beleza</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingCommunityFind(null)}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                    onClick={handleSaveCommunityFindEdit}
                    disabled={editingCommunityFindSubmitting}
                  >
                    {editingCommunityFindSubmitting ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {isAdmin && (
              <TabsContent value="verificacoes" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Verificações</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analise solicitações de negócios que querem o selo de verificado.
                    </p>
                  </div>
                  <Card className="border-border overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center justify-between gap-4">
                      <Tabs value={verificationAdminView} onValueChange={(v) => setVerificationAdminView(v as "pendentes" | "verificados")}>
                        <TabsList>
                          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                          <TabsTrigger value="verificados">Verificados</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <Button variant="outline" size="sm" onClick={loadVerificationAdminData} disabled={verificationLoading}>
                        Atualizar
                      </Button>
                    </div>

                    {verificationAdminView === "pendentes" ? (
                      verificationLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Carregando solicitações...</div>
                      ) : verificationRequests.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhuma solicitação pendente.</div>
                      ) : (
                        <div className="divide-y divide-border">
                          {verificationRequests.map((request) => (
                            <div key={request.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold">{request.business?.name || "negócio"}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {request.business?.city || "Cidade não informada"}
                                  {request.business?.country_code ? `, ${request.business.country_code.toUpperCase()}` : ""}
                                </p>
                                <a
                                  href={request.instagram_post_url}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="text-sm text-primary underline mt-2 inline-block"
                                >
                                  Ver post do Instagram
                                </a>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(request.created_at).toLocaleString("pt-BR")}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleApproveVerification(request)}>Aprovar</Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => handleRejectVerification(request)}
                                >
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      (() => {
                        const verifiedBusinesses = allBusinesses.filter((b) => b.ownerVerified);
                        if (verifiedBusinesses.length === 0) {
                          return <div className="p-8 text-center text-muted-foreground">Nenhum negócio verificado no momento.</div>;
                        }
                        return (
                          <div className="divide-y divide-border">
                            {verifiedBusinesses.map((biz) => (
                              <div key={biz.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold">{biz.name}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {biz.address.city || "Cidade não informada"}
                                    {biz.address.countryCode ? `, ${biz.address.countryCode.toUpperCase()}` : ""}
                                  </p>
                                  {biz.ownerVerifiedUntil ? (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Válido até: {new Date(biz.ownerVerifiedUntil).toLocaleDateString("pt-BR")}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                    onClick={() => handleRemoveBusinessVerification(biz)}
                                  >
                                    Remover verificação
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    )}
                  </Card>
                </div>
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="analise-negocios" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Análise de negócios</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Revise novos cadastros antes de publicar no site.
                    </p>
                  </div>

                  <Card className="border-border overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center justify-between gap-4">
                      <h3 className="font-semibold">negócios em análise</h3>
                      <Button variant="outline" size="sm" onClick={loadBusinessModerationData} disabled={moderationLoading}>
                        Atualizar
                      </Button>
                    </div>

                    {moderationLoading ? (
                      <div className="p-8 text-center text-muted-foreground">Carregando negócios pendentes...</div>
                    ) : pendingModerationBusinesses.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">Nenhum negócio pendente de análise.</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {pendingModerationBusinesses.map((biz) => (
                          <div key={biz.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold">{biz.name}</h4>
                                <Badge variant="outline">Em análise</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {biz.address.city || "Cidade não informada"}
                                {biz.address.countryCode ? `, ${biz.address.countryCode.toUpperCase()}` : ""}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Dono: {biz.ownerName || "Usuário"} · Criado em {new Date(biz.createdAt).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => setModerationPreviewBusiness(biz)}>
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Ver detalhes
                              </Button>
                              <Button size="sm" onClick={() => handleModerationDecision(biz, "approved")}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => handleModerationDecision(biz, "rejected")}
                              >
                                <Ban className="w-3.5 h-3.5 mr-1.5" />
                                Rejeitar
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
              <TabsContent value="ownership" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Ownership</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aprove solicitações de donos ou transfira um negócio diretamente por email.
                    </p>
                  </div>

                  <Card className="p-6 border-border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Transferência direta
                    </h3>
                    <form onSubmit={handleDirectTransfer} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3">
                      <Select value={transferBusinessId} onValueChange={setTransferBusinessId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o negócio" />
                        </SelectTrigger>
                        <SelectContent>
                          {allBusinesses.map((biz) => (
                            <SelectItem key={biz.id} value={biz.id}>
                              {biz.name} · {biz.address.city}
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
                        <h3 className="font-semibold">Solicitações pendentes</h3>
                        <p className="text-sm text-muted-foreground">
                          Pedidos feitos pelo botão "Sou dono deste negócio".
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={loadOwnershipAdminData} disabled={ownershipLoading}>
                        Atualizar
                      </Button>
                    </div>

                    {ownershipLoading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Carregando solicitações...
                      </div>
                    ) : ownershipRequests.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Nenhuma solicitação pendente.
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {ownershipRequests.map((request) => (
                          <div key={request.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold">
                                  {request.business?.name || "negócio"}
                                </h4>
                                <Badge variant="secondary">
                                  {request.business?.city || "Cidade não informada"}
                                  {request.business?.country_code ? `, ${request.business.country_code.toUpperCase()}` : ""}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Solicitado por {request.requester_name || "Usuário"} · {request.requester_email || "sem email"}
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
              <TabsContent value="denuncias" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Denúncias</h2>
                    <p className="text-sm text-muted-foreground mt-1">Analise denúncias enviadas pelos usuários.</p>
                  </div>
                  <Card className="border-border overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center justify-between gap-4">
                      <h3 className="font-semibold">Fila de denúncias</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={reportsKind === "negocios" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setReportsKind("negocios")}
                          disabled={reportsLoading}
                        >
                          negócios
                        </Button>
                        <Button
                          variant={reportsKind === "achadinhos" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setReportsKind("achadinhos")}
                          disabled={reportsLoading}
                        >
                          Achadinhos
                        </Button>
                        <Button
                          variant={reportsView === "active" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setReportsView("active")}
                          disabled={reportsLoading}
                        >
                          Ativas
                        </Button>
                        <Button
                          variant={reportsView === "archived" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setReportsView("archived")}
                          disabled={reportsLoading}
                        >
                          Arquivadas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadReportsAdminData(reportsView)}
                          disabled={reportsLoading}
                        >
                          Atualizar
                        </Button>
                      </div>
                    </div>
                    {reportsLoading ? (
                      <div className="p-8 text-center text-muted-foreground">Carregando denúncias...</div>
                    ) : reportsKind === "negocios" && reports.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {reportsView === "archived" ? "Nenhuma denúncia arquivada." : "Nenhuma denúncia registrada."}
                      </div>
                    ) : reportsKind === "achadinhos" && communityFindReports.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {reportsView === "archived" ? "Nenhuma denúncia de achadinho arquivada." : "Nenhuma denúncia de achadinho registrada."}
                      </div>
                    ) : reportsKind === "negocios" ? (
                      <div className="divide-y divide-border">
                        {reports.map((r) => (
                          <div key={r.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                {r.business?.slug && r.business?.city && r.business?.country_code && r.business?.state_code ? (
                                  <a
                                    href={`/${r.business.country_code.toLowerCase()}/${r.business.state_code.toLowerCase()}/${slugify(r.business.city)}/${r.business.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold hover:underline text-primary"
                                  >
                                    {r.business?.name || "negócio"}
                                  </a>
                                ) : (
                                  <h4 className="font-semibold">{r.business?.name || "negócio"}</h4>
                                )}
                                <Badge variant={r.status === "pending" ? "secondary" : "default"}>{r.status}</Badge>
                                <Badge variant="outline">{r.reason}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {r.business?.city || "Cidade não informada"} {r.business?.country_code ? `, ${r.business.country_code.toUpperCase()}` : ""}
                              </p>
                              {r.details && <p className="text-sm mt-2">{r.details}</p>}
                              <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleReportStatus(r.id, "reviewing")}>Em análise</Button>
                              <Button size="sm" onClick={() => handleReportStatus(r.id, "resolved")}>Resolver</Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReportStatus(r.id, "rejected")}>Rejeitar</Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={reportsView === "archived" ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50" : ""}
                                disabled={reportsView === "archived" || (r.status !== "resolved" && r.status !== "rejected")}
                                onClick={() => handleArchiveReport(r)}
                              >
                                Arquivar
                              </Button>
                              {reportsView === "archived" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-sky-700 border-sky-300 hover:bg-sky-50"
                                  onClick={() => handleUnarchiveReport(r)}
                                >
                                  Desarquivar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {communityFindReports.map((r) => (
                          <div key={r.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold">{r.find?.product_name || "Achadinho"}</h4>
                                <Badge variant={r.status === "pending" ? "secondary" : "default"}>{r.status}</Badge>
                                <Badge variant="outline">{r.reason}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {r.find?.location_name || "Local não informado"}
                              </p>
                              {r.message?.message ? (
                                <p className="text-sm mt-2 text-foreground/80">
                                  Mensagem reportada: "{r.message.message}"
                                </p>
                              ) : null}
                              {r.details && <p className="text-sm mt-2">{r.details}</p>}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(r.created_at).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleCommunityFindReportStatus(r.id, "reviewing")}>Em análise</Button>
                              <Button size="sm" onClick={() => handleCommunityFindReportStatus(r.id, "resolved")}>Resolver</Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleCommunityFindReportStatus(r.id, "rejected")}>Rejeitar</Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={reportsView === "archived" ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50" : ""}
                                disabled={reportsView === "archived" || (r.status !== "resolved" && r.status !== "rejected")}
                                onClick={() => handleArchiveCommunityFindReport(r)}
                              >
                                Arquivar
                              </Button>
                              {reportsView === "archived" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-sky-700 border-sky-300 hover:bg-sky-50"
                                  onClick={() => handleUnarchiveCommunityFindReport(r)}
                                >
                                  Desarquivar
                                </Button>
                              )}
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
                      Gerencie campanhas de destaque por cidade, estado/província, país ou global.
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
                          <Label>negócio</Label>
                          <Select value={featuredForm.businessId} onValueChange={handleFeaturedBusinessChange}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Selecione o negócio" />
                            </SelectTrigger>
                            <SelectContent>
                              {allBusinesses.map((biz) => (
                                <SelectItem key={biz.id} value={biz.id}>
                                  {biz.name} · {biz.address.city}
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
                              <SelectItem value="state">Estado/Província</SelectItem>
                              <SelectItem value="country">País</SelectItem>
                              <SelectItem value="global">Global</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>País</Label>
                          <Input
                            value={featuredForm.countryCode}
                            onChange={(e) => setFeaturedForm((prev) => ({ ...prev, countryCode: e.target.value.toLowerCase() }))}
                            placeholder="ca"
                            className="mt-1.5"
                            disabled={featuredForm.scopeType === "global"}
                          />
                        </div>

                        <div>
                          <Label>Estado/Província</Label>
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
                          <Label>Início</Label>
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
                          <Label>Preço cobrado (centavos)</Label>
                          <Input
                            type="number"
                            value={featuredForm.priceCents}
                            onChange={(e) => setFeaturedForm((prev) => ({ ...prev, priceCents: e.target.value }))}
                            placeholder="9900"
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label>Observações</Label>
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
                                <h4 className="font-semibold">{placement.business?.name || "negócio removido"}</h4>
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
                                {new Date(placement.startsAt).toLocaleDateString("pt-BR")} até {new Date(placement.endsAt).toLocaleDateString("pt-BR")}
                                {placement.priceCents > 0 ? ` · ${(placement.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "CAD" })}` : ""}
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

            {/* Tab: Reviews */}


            {isAdmin && (
              <TabsContent value="busca">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Configuração de Busca</h2>
                    <p className="text-sm text-muted-foreground mt-1">Edite sin?nimos por categoria para melhorar a relev?ncia dos resultados.</p>
                  </div>
                  <Card className="p-6 border-border space-y-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={searchSynonymsCategory} onValueChange={setSearchSynonymsCategory}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(searchSynonymsConfig).map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sinônimos (separados por vírgula)</Label>
                      <Textarea
                        value={searchSynonymsDraft}
                        onChange={(e) => setSearchSynonymsDraft(e.target.value)}
                        className="mt-1.5 min-h-[120px]"
                        placeholder="Ex: advogado, jurídico, imigração, tradução"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleSaveSearchSynonyms}>Salvar sinônimos</Button>
                      <Button variant="outline" onClick={handleResetSearchSynonyms}>Restaurar padrão</Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            )}

            <TabsContent value="avaliacoes" className="mt-0">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-foreground">Avaliações</h2>
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
            <TabsContent value="mensagens" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversation List */}
                <div className="lg:col-span-1">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Mensagens</h2>
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
                          className={`w-full text-left p-3 rounded-lg transition-colors ${selectedConv?.id === conv.id
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
                              className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.senderId === session.userId
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
      <Dialog
        open={!!moderationPreviewBusiness}
        onOpenChange={(open) => {
          if (!open) setModerationPreviewBusiness(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Revisão de negócio</DialogTitle>
          </DialogHeader>
          {moderationPreviewBusiness && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Mídia enviada</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Logo</p>
                      {moderationPreviewBusiness.logoUrl ? (
                        <div className="w-20 h-20 rounded-md overflow-hidden border border-border bg-secondary/30">
                          <img
                            src={moderationPreviewBusiness.logoUrl}
                            alt="Logo enviada"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Não enviada</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Capa</p>
                      {moderationPreviewBusiness.heroImage ? (
                        <div className="w-full max-w-[220px] h-20 rounded-md overflow-hidden border border-border bg-secondary/30">
                          <img
                            src={moderationPreviewBusiness.heroImage}
                            alt="Capa enviada"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Não enviada</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Galeria</p>
                    {moderationPreviewBusiness.photos?.length ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {moderationPreviewBusiness.photos.slice(0, 8).map((url, idx) => (
                          <div key={`${url}-${idx}`} className="aspect-square rounded-md overflow-hidden border border-border bg-secondary/30">
                            <img
                              src={url}
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma foto na galeria</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="font-medium">{moderationPreviewBusiness.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Categoria</p>
                <p>{getCategoryLabel(moderationPreviewBusiness.category)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Descrição</p>
                <p>{moderationPreviewBusiness.description || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Endereço</p>
                <p>
                  {[
                    moderationPreviewBusiness.address.street,
                    moderationPreviewBusiness.address.city,
                    moderationPreviewBusiness.address.state,
                    moderationPreviewBusiness.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p>{moderationPreviewBusiness.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p>{moderationPreviewBusiness.email || "-"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModerationPreviewBusiness(null)}>
              Fechar
            </Button>
            {moderationPreviewBusiness && (
              <>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    void handleModerationDecision(moderationPreviewBusiness, "rejected");
                    setModerationPreviewBusiness(null);
                  }}
                >
                  Rejeitar
                </Button>
                <Button
                  onClick={() => {
                    void handleModerationDecision(moderationPreviewBusiness, "approved");
                    setModerationPreviewBusiness(null);
                  }}
                >
                  Aprovar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        className={`w-6 h-6 ${star <= editingReview.rating
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

      <Dialog
        open={creatingBusiness || !!editingBusiness}
        onOpenChange={(open) => {
          if (!open) {
            setCreatingBusiness(false);
            setEditingBusiness(null);
          }
        }}
      >
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
            <DialogTitle>{creatingBusiness ? "Adicionar Novo negócio" : `Editar ${editFormData.name || "negócio"}`}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-4">
              <div className="sm:col-span-2 border-b border-border pb-2">
                <h3 className="text-base font-semibold">Dados principais</h3>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-name">Nome do negócio *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => handleEditInputChange("name", e.target.value)}
                  placeholder="Ex: Brasil Tropical Bakery"
                  className="mt-1.5"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="edit-short-slug">Link curto do negócio</Label>
                <div className="mt-1.5 flex items-center rounded-md border border-input bg-background overflow-hidden">
                  <span className="px-3 py-2 text-sm text-muted-foreground bg-secondary/50 border-r border-input whitespace-nowrap">
                    caramelinho.com/go/
                  </span>
                  <input
                    id="edit-short-slug"
                    value={editFormData.shortSlug}
                    onChange={(e) => handleEditInputChange("shortSlug", e.target.value)}
                    placeholder="pizzaria-do-ze"
                    className="w-full h-10 px-3 bg-transparent text-sm outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Este é o link simples para compartilhar seu negócio em redes sociais, WhatsApp e cartões.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Exemplo: caramelinho.com/go/{editFormData.shortSlug || "pizzaria-do-ze"}
                </p>
                <p
                  className={`mt-1 text-xs ${shortSlugStatus === "available"
                    ? "text-emerald-700"
                    : shortSlugStatus === "taken" || shortSlugStatus === "invalid"
                      ? "text-red-600"
                      : "text-muted-foreground"
                    }`}
                >
                  {shortSlugMessage}
                </p>
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
                <Label htmlFor="edit-description">Descrição *</Label>
                <div className="mt-1 rounded-md border border-amber-300/70 bg-amber-50/70 px-3 py-2">
                  <p className="text-sm text-amber-900/90 leading-relaxed">
                    Esta é a informação mais importante da página do seu negócio. ï¿½0 ela que ajuda o cliente a entender
                    rapidamente o que você oferece, seus diferenciais e por que deve escolher você. Escreva de forma clara,
                    objetiva e humana: diga os principais serviços/produtos, o público atendido, região de atuação e pontos
                    fortes (ex.: rapidez, qualidade, atendimento em português, experiência, especialidades).
                  </p>
                </div>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => handleEditInputChange("description", e.target.value)}
                  placeholder="Descreva seu negócio..."
                  className="mt-1.5 min-h-[160px]"
                />
              </div>

              {getCategoryId(editFormData.category) === "food" ? (
                <div className="sm:col-span-2 rounded-lg border border-emerald-300/70 bg-emerald-50/70 p-4">
                  <h3 className="text-base font-semibold text-emerald-900">Públicos também atendidos</h3>
                  <p className="text-sm text-emerald-900/80 mt-1">
                    Marque os selos que seu negócio atende. Isso aparece no card, na página do negócio e também entra como critério de busca.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={!!editFormData.isVeganFriendly}
                        onChange={(e) =>
                          setEditFormData((prev) => ({ ...prev, isVeganFriendly: e.target.checked }))
                        }
                      />
                      <Leaf className="w-4 h-4 text-emerald-700" />
                      Vegano
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={!!editFormData.isVegetarianFriendly}
                        onChange={(e) =>
                          setEditFormData((prev) => ({ ...prev, isVegetarianFriendly: e.target.checked }))
                        }
                      />
                      <Leaf className="w-4 h-4 text-lime-700" />
                      Vegetariano
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={!!editFormData.isGlutenFreeFriendly}
                        onChange={(e) =>
                          setEditFormData((prev) => ({ ...prev, isGlutenFreeFriendly: e.target.checked }))
                        }
                      />
                      <WheatOff className="w-4 h-4 text-amber-700" />
                      Sem Glúten
                    </label>
                  </div>
                </div>
              ) : null}

              <div className="sm:col-span-2 border-b border-border pb-2 pt-1">
                <h3 className="text-base font-semibold">Oferta e conteúdo</h3>
              </div>

              {null}

              <div className="sm:col-span-2 rounded-lg border border-amber-300/70 bg-amber-50/70 p-4">
                <h3 className="text-base font-semibold text-amber-900">⚠️ Palavras-chave para busca (muito importante)</h3>
                <p className="text-sm text-amber-900/80 mt-2 leading-relaxed">
                  Essas palavras ajudam seu negócio a aparecer quando alguém procura por produtos e serviços. Use termos reais
                  que seus clientes digitam, incluindo variações e sinônimos. Exemplo: para <strong>mecânico</strong>, também use
                  <strong> oficina</strong>, <strong>manutenção automotiva</strong>, <strong>troca de óleo</strong>. Para <strong>restaurante brasileiro</strong>, adicione <strong>comida brasileira</strong>,
                  <strong> prato feito</strong>, <strong>almoço</strong>, <strong>jantar</strong>, <strong>delivery</strong>. Separe por vírgula e evite termos muito genéricos.
                </p>
                <Label htmlFor="edit-keywords" className="mt-3 block">Palavras-chave (separadas por vírgula)</Label>
                <Textarea
                  id="edit-keywords"
                  value={editFormData.keywords}
                  onChange={(e) => handleEditInputChange("keywords", e.target.value)}
                  placeholder="Ex: dentista, clareamento, odontologia, aparelhos"
                  className="mt-1.5 bg-white"
                  rows={3}
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
                <h3 className="text-base font-semibold">Horários</h3>
              </div>

              <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/10 p-4">
                <Label>Horários de funcionamento</Label>
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
                <h3 className="text-base font-semibold">Mídia</h3>
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
                  Existentes: {existingPhotos.length}/8 | Novas selecionadas: {editPhotoFiles.length} | Tamanho máx: 5MB | Formatos: JPG, PNG, WEBP
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
                <h3 className="text-base font-semibold">Localização</h3>
              </div>

              <div className="sm:col-span-2">
                <Label>Endereço</Label>
                <div className="mt-1.5">
                  <AddressAutocomplete
                    key={creatingBusiness ? "new-business-address" : editingBusiness?.id}
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
            <Button
              variant="outline"
              onClick={() => {
                setCreatingBusiness(false);
                setEditingBusiness(null);
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={handleSaveBusiness} disabled={isUploading}>
              {isUploading ? "Enviando Imagens..." : creatingBusiness ? "Criar negócio" : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!couponBusiness} onOpenChange={(open) => !open && setCouponBusiness(null)}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Promoções - {couponBusiness?.name || "negócio"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-5 py-4">
              <div className="space-y-3">
                <Label>Cupons cadastrados</Label>
                {couponItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma promoção cadastrada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {couponItems.map((item, idx) => (
                      <div key={`${item.code}-${idx}`} className="rounded-md border border-border p-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                          <p className="text-xs mt-1">
                            <span className="font-medium">Cupom:</span> {item.code} · <span className="font-medium">Validade:</span> {new Date(`${item.expiresAt}T00:00:00`).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Button type="button" size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleRemoveCoupon(idx)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="profile-coupon-title">Título da promoção</Label>
                <Input
                  id="profile-coupon-title"
                  className="mt-1.5"
                  value={couponForm.title}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: 15% OFF no fim de semana"
                />
              </div>
              <div>
                <Label htmlFor="profile-coupon-description">Descrição da promoção</Label>
                <Textarea
                  id="profile-coupon-description"
                  className="mt-1.5 min-h-[120px]"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Explique regras, itens participantes e condições."
                />
              </div>
              <div>
                <Label htmlFor="profile-coupon-code">Código promocional</Label>
                <Input
                  id="profile-coupon-code"
                  className="mt-1.5"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: CARAMELINHO15"
                />
              </div>
              <div>
                <Label htmlFor="profile-coupon-expiry">Data limite da promoção</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    id="profile-coupon-expiry"
                    type="text"
                    value={formatIsoToBr(couponForm.expiresAt)}
                    onChange={(e) => setCouponForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                    placeholder="dd-mm-yyyy"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const el = couponDatePickerRef.current as HTMLInputElement & { showPicker?: () => void };
                      if (!el) return;
                      if (typeof el.showPicker === "function") el.showPicker();
                      else el.click();
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                  </Button>
                  <input
                    ref={couponDatePickerRef}
                    type="date"
                    value={normalizeDateForInput(couponForm.expiresAt)}
                    onChange={(e) =>
                      setCouponForm((prev) => ({ ...prev, expiresAt: formatIsoToBr(e.target.value) }))
                    }
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div>
                <Button type="button" variant="outline" onClick={handleAddCoupon}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar promoção
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border bg-white px-1 pt-3 pb-1">
            <Button variant="outline" onClick={() => setCouponBusiness(null)} disabled={savingCoupon}>
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={handleSaveCoupon} disabled={savingCoupon}>
              {savingCoupon ? "Salvando..." : "Salvar promoção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!menuBusiness} onOpenChange={(open) => !open && setMenuBusiness(null)}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Cardápio - {menuBusiness?.name || "negócio"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-5 py-4">
              <div className="space-y-4 rounded-lg border border-emerald-300/70 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-emerald-900">ï¿½xï¿½ï¿½ï¸ Itens do cardápio</Label>
                    <p className="text-sm text-emerald-900/80 mt-1">
                      Adicione itens com nome, descrição e preço para facilitar a busca e conversão.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() =>
                      setMenuItems((prev) => [
                        ...prev,
                        {
                          name: "",
                          description: "",
                          price: getCurrencyPrefixForCountry(menuBusiness?.address.countryCode || ""),
                        },
                      ])
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar item
                  </Button>
                </div>

                <div className="space-y-3">
                  {menuItems.map((item, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-white space-y-3 relative group">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setMenuItems((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Nome do Item</Label>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              setMenuItems((prev) => {
                                const next = [...prev];
                                next[index].name = e.target.value;
                                return next;
                              })
                            }
                            placeholder="Ex: Pão de Queijo"
                            className={`h-8 text-sm mt-1 ${menuNameErrors[index] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Preço (opcional)</Label>
                          <Input
                            value={item.price}
                            onChange={(e) =>
                              setMenuItems((prev) => {
                                const next = [...prev];
                                next[index].price = e.target.value;
                                return next;
                              })
                            }
                            placeholder="Ex: CA$ 5.00"
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Descrição</Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            setMenuItems((prev) => {
                              const next = [...prev];
                              next[index].description = e.target.value;
                              return next;
                            })
                          }
                          placeholder="Ex: Porção com 6 unidades"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    </div>
                  ))}
                  {menuItems.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-border rounded-lg bg-white">
                      <p className="text-xs text-muted-foreground">Nenhum item no cardápio. Adicione o seu primeiro.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="menu-modal-pdf">Cardápio completo (PDF, opcional)</Label>
                <div className="mt-1.5">
                  <label
                    htmlFor="menu-modal-pdf"
                    className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary"
                  >
                    Escolher arquivo PDF
                  </label>
                </div>
                <Input
                  id="menu-modal-pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) {
                      setMenuPdfFile(null);
                      return;
                    }
                    if (file.type !== "application/pdf") {
                      toast.error("Formato inválido. O cardápio completo deve ser um arquivo PDF.");
                      return;
                    }
                    setMenuPdfFile(file);
                  }}
                  className="hidden"
                />
                {menuPdfFile && (
                  <p className="text-xs text-emerald-700">
                    Arquivo selecionado: <strong>{menuPdfFile.name}</strong> ({(menuPdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {menuPdfUrl && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-xs text-primary underline"
                      onClick={() => handleOpenPdfPrivately(menuPdfUrl)}
                    >
                      Ver PDF atual
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => {
                        setMenuPdfUrl("");
                        setMenuPdfFile(null);
                      }}
                    >
                      Remover PDF
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border bg-white px-1 pt-3 pb-1">
            <Button variant="outline" onClick={() => setMenuBusiness(null)} disabled={savingMenu}>
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={handleSaveMenu} disabled={savingMenu}>
              {savingMenu ? "Salvando..." : "Salvar cardápio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!serviceBusiness} onOpenChange={(open) => !open && setServiceBusiness(null)}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Serviços - {serviceBusiness?.name || "negócio"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-5 py-4">
              <div className="space-y-4 rounded-lg border border-sky-300/70 bg-sky-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sky-900">ï¿½x:ï¿½ï¸ Itens de serviço</Label>
                    <p className="text-sm text-sky-900/80 mt-1">
                      Cadastre nome, descrição e preço (opcional) de cada serviço.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-sky-300 text-sky-700 hover:bg-sky-50"
                    onClick={() =>
                      setServiceItems((prev) => [
                        ...prev,
                        {
                          name: "",
                          description: "",
                          price: getCurrencyPrefixForCountry(serviceBusiness?.address.countryCode || ""),
                        },
                      ])
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar serviço
                  </Button>
                </div>

                <div className="space-y-3">
                  {serviceItems.map((item, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-white space-y-3 relative group">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setServiceItems((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Nome do Serviço</Label>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              setServiceItems((prev) => {
                                const next = [...prev];
                                next[index].name = e.target.value;
                                return next;
                              })
                            }
                            placeholder="Ex: Troca de óleo"
                            className={`h-8 text-sm mt-1 ${serviceNameErrors[index] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Preço (opcional)</Label>
                          <Input
                            value={item.price}
                            onChange={(e) =>
                              setServiceItems((prev) => {
                                const next = [...prev];
                                next[index].price = e.target.value;
                                return next;
                              })
                            }
                            placeholder="Ex: CAD$ 49.90"
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Descrição</Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            setServiceItems((prev) => {
                              const next = [...prev];
                              next[index].description = e.target.value;
                              return next;
                            })
                          }
                          placeholder="Ex: Serviço com mão de obra inclusa"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    </div>
                  ))}
                  {serviceItems.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-border rounded-lg bg-white">
                      <p className="text-xs text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border bg-white px-1 pt-3 pb-1">
            <Button variant="outline" onClick={() => setServiceBusiness(null)} disabled={savingServices}>
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={handleSaveServices} disabled={savingServices}>
              {savingServices ? "Salvando..." : "Salvar serviços"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!eventsBusiness} onOpenChange={(open) => !open && setEventsBusiness(null)}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Eventos - {eventsBusiness?.name || "negócio"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-5 py-4">
              <div className="rounded-lg border border-violet-300/70 bg-violet-50/70 p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-violet-900">Agenda de eventos</h3>
                    <p className="text-sm text-violet-900/80 mt-1">
                      Divulgue datas, local, flyer e preço para atrair mais público.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-violet-300 text-violet-700 hover:bg-violet-50"
                    onClick={handleAddEvent}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar evento
                  </Button>
                </div>

                {eventItems.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-violet-300 rounded-lg bg-white/70">
                    <p className="text-sm text-muted-foreground">Nenhum evento cadastrado.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventItems.map((event, index) => {
                      const businessAddress = [eventsBusiness?.address.street, eventsBusiness?.address.city, eventsBusiness?.address.stateCode?.toUpperCase()]
                        .filter(Boolean)
                        .join(", ");
                      const isAtBusiness = businessAddress.length > 0 && (event.location || "").trim() === businessAddress;
                      return (
                        <div key={index} className="rounded-lg border border-violet-200 bg-white p-4 space-y-3 relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => handleRemoveEvent(index)}
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Título do evento *</Label>
                              <Input
                                className="mt-1"
                                value={event.title}
                                onChange={(e) =>
                                  setEventItems((prev) => {
                                    const next = [...prev];
                                    next[index] = { ...next[index], title: e.target.value };
                                    return next;
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Data *</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <Input
                                  type="text"
                                  value={formatIsoToBr(event.date)}
                                  onChange={(e) =>
                                    setEventItems((prev) => {
                                      const next = [...prev];
                                      next[index] = { ...next[index], date: e.target.value };
                                      return next;
                                    })
                                  }
                                  placeholder="dd-mm-yyyy"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    const el = eventDatePickerRefs.current[index] as (HTMLInputElement & { showPicker?: () => void }) | undefined;
                                    if (!el) return;
                                    if (typeof el.showPicker === "function") el.showPicker();
                                    else el.click();
                                  }}
                                >
                                  <Calendar className="w-4 h-4" />
                                </Button>
                                <input
                                  ref={(el) => {
                                    eventDatePickerRefs.current[index] = el;
                                  }}
                                  type="date"
                                  value={normalizeDateForInput(event.date)}
                                  onChange={(e) =>
                                    setEventItems((prev) => {
                                      const next = [...prev];
                                      next[index] = { ...next[index], date: formatIsoToBr(e.target.value) };
                                      return next;
                                    })
                                  }
                                  className="sr-only"
                                  tabIndex={-1}
                                  aria-hidden="true"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Local *</Label>
                            {businessAddress ? (
                              <div className="mt-1 mb-1">
                                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                  <input
                                    type="checkbox"
                                    checked={isAtBusiness}
                                    onChange={(e) =>
                                      setEventItems((prev) => {
                                        const next = [...prev];
                                        next[index] = {
                                          ...next[index],
                                          location: e.target.checked ? businessAddress : "",
                                        };
                                        return next;
                                      })
                                    }
                                  />
                                  No próprio estabelecimento
                                </label>
                              </div>
                            ) : null}
                            <Input
                              className="mt-2"
                              value={event.location}
                              onChange={(e) =>
                                setEventItems((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], location: e.target.value };
                                  return next;
                                })
                              }
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Descrição</Label>
                            <Textarea
                              className="mt-1"
                              rows={2}
                              value={event.description}
                              onChange={(e) =>
                                setEventItems((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], description: e.target.value };
                                  return next;
                                })
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Entrada</Label>
                              <Select
                                value={event.isFree ? "free" : "paid"}
                                onValueChange={(value) =>
                                  setEventItems((prev) => {
                                    const next = [...prev];
                                    const isFree = value === "free";
                                    const currentPrice = (next[index].price || "").trim();
                                    const hasNumber = /\d/.test(currentPrice);
                                    next[index] = {
                                      ...next[index],
                                      isFree,
                                      price: isFree
                                        ? ""
                                        : (hasNumber
                                          ? next[index].price
                                          : getCurrencyPrefixForCountry(eventsBusiness?.address.countryCode || "")),
                                    };
                                    return next;
                                  })
                                }
                              >
                                <SelectTrigger className="mt-1 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Entrada franca</SelectItem>
                                  <SelectItem value="paid">Evento pago</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {!event.isFree && (
                              <div>
                                <Label className="text-xs">Preço</Label>
                                <Input
                                  className="mt-1"
                                  value={event.price}
                                  onChange={(e) =>
                                    setEventItems((prev) => {
                                      const next = [...prev];
                                      next[index] = { ...next[index], price: e.target.value };
                                      return next;
                                    })
                                  }
                                  placeholder="Ex: CA$ 25"
                                />
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Flyer do evento</Label>
                            <div className="mt-1">
                              <label
                                htmlFor={`events-flyer-${index}`}
                                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary"
                              >
                                Escolher imagem do flyer
                              </label>
                            </div>
                            <Input
                              id={`events-flyer-${index}`}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                                  toast.error("Formato inválido para flyer. Use JPG, PNG ou WEBP.");
                                  return;
                                }
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error("Flyer muito grande. Limite de 5MB.");
                                  return;
                                }
                                setEventFlyerFiles((prev) => ({ ...prev, [index]: file }));
                              }}
                            />
                            {(event.flyerUrl || eventFlyerFiles[index]) && (
                              <img
                                src={eventFlyerFiles[index] ? URL.createObjectURL(eventFlyerFiles[index]) : (event.flyerUrl || "")}
                                alt="Preview do flyer"
                                className="h-24 w-24 rounded-md object-cover border border-border mt-2"
                              />
                            )}
                          </div>

                          <div>
                            <Label className="text-xs">Link para compra de ingressos (opcional)</Label>
                            <Input
                              className="mt-1"
                              value={event.ticketUrl || ""}
                              onChange={(e) =>
                                setEventItems((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], ticketUrl: e.target.value };
                                  return next;
                                })
                              }
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border bg-white px-1 pt-3 pb-1">
            <Button variant="outline" onClick={() => setEventsBusiness(null)} disabled={savingEvents}>
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={handleSaveEvents} disabled={savingEvents}>
              {savingEvents ? "Salvando..." : "Salvar eventos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!verificationBusiness} onOpenChange={(open) => !open && setVerificationBusiness(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar negócio Verificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Requisitos: mínimo de 5 avaliações e Instagram do negócio configurado.
            </div>
            <div className="text-sm text-muted-foreground">
              negócio: <strong>{verificationBusiness?.name}</strong><br />
              Avaliações atuais: <strong>{verificationBusiness?.reviews.length || 0}</strong><br />
              Instagram cadastrado: <strong>{verificationBusiness?.instagram ? "Sim" : "Não"}</strong>
            </div>
            <div>
              <Label htmlFor="verification-instagram-post">Link do post no Instagram marcando o Caramelinho *</Label>
              <Input
                id="verification-instagram-post"
                className="mt-1.5"
                value={instagramPostUrl}
                onChange={(e) => setInstagramPostUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationBusiness(null)} disabled={verificationSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitVerificationRequest} disabled={verificationSubmitting}>
              {verificationSubmitting ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ATENï¿½ï¿½O
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmDeleteMyBusiness}>
              Sim, apagar negócio
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

function parseBusinessHours(lines: string[] = []) {
  const defaults = createDefaultBusinessHours();
  const byDay = new Map(defaults.map((item) => [item.day.toLowerCase(), item]));
  for (const line of lines) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) continue;
    const rawDay = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (!rawDay || !rawValue) continue;
    const entry = byDay.get(rawDay.trim().toLowerCase());
    if (!entry) continue;
    const normalized = rawValue.toLowerCase();
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

function getDateInputDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatFeaturedScope(placement: FeaturedPlacementFrontend): string {
  if (placement.scopeType === "global") return "Global";
  if (placement.scopeType === "country") return `País: ${placement.countryCode.toUpperCase()}`;
  if (placement.scopeType === "state") {
    return `${placement.countryCode.toUpperCase()}/${placement.stateCode.toUpperCase()}`;
  }
  return `${placement.city}, ${placement.stateCode.toUpperCase()}`;
}

function parseBrDateToIso(value: string): string | null {
  const v = (value || "").trim().replace(/\//g, "-");
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeDateForInput(value: string): string {
  return parseBrDateToIso(value) || "";
}

function formatIsoToBr(value: string): string {
  const v = (value || "").trim();
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return v;
  return `${m[3]}-${m[2]}-${m[1]}`;
}



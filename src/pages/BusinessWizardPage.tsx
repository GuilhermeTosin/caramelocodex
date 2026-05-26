import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, ImageIcon, MapPin, MessageCircle, PawPrint, Sparkles, Upload, User, UtensilsCrossed, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AddressAutocomplete, { type AddressResult } from "@/components/AddressAutocomplete";
import SiteFooter from "@/components/SiteFooter";
import {
  BUSINESS_CATEGORY_OPTIONS,
  COUNTRIES,
  createBusiness,
  getCountryName,
  getCategoryId,
  getBusinessesByOwner,
  isBusinessSlugAvailable,
  slugify,
  updateBusiness,
} from "@/services/businesses";
import type { BusinessFrontend } from "@/types/database";
import { generateImagePath, uploadImage } from "@/services/storage";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
type BusinessHour = { day: string; enabled: boolean; open: string; close: string };

const TOTAL_STEPS = 6;

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

const sanitizePhoneLike = (value: string) =>
  (value || "").replace(/[^\d+\-()\s]/g, "").slice(0, 25);

const sanitizeTextNoSpaces = (value: string) => (value || "").trim().replace(/\s+/g, "");

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());

const normalizeSocialValue = (value: string): string => {
  return (value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^facebook\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .trim();
};

const buildInstagramUrl = (value: string): string => {
  const handle = normalizeSocialValue(value);
  return handle ? `https://instagram.com/${handle}` : "";
};

const buildFacebookUrl = (value: string): string => {
  const handle = normalizeSocialValue(value);
  return handle ? `https://facebook.com/${handle}` : "";
};

function createDefaultBusinessHours(): BusinessHour[] {
  return [
    { day: "Segunda", enabled: true, open: "09:00", close: "18:00" },
    { day: "Terca", enabled: true, open: "09:00", close: "18:00" },
    { day: "Quarta", enabled: true, open: "09:00", close: "18:00" },
    { day: "Quinta", enabled: true, open: "09:00", close: "18:00" },
    { day: "Sexta", enabled: true, open: "09:00", close: "18:00" },
    { day: "Sabado", enabled: true, open: "10:00", close: "14:00" },
    { day: "Domingo", enabled: false, open: "10:00", close: "14:00" },
  ];
}

function serializeBusinessHours(hours: BusinessHour[]) {
  return hours.map((hour) =>
    hour.enabled ? `${hour.day}: ${hour.open}-${hour.close}` : `${hour.day}: Fechado`
  );
}

function parseBusinessHours(lines: string[] = []): BusinessHour[] {
  const defaults = createDefaultBusinessHours();
  const map = new Map(defaults.map((h) => [h.day.toLowerCase(), { ...h }]));
  for (const raw of lines || []) {
    const text = String(raw || "").trim();
    const [rawDay, rawValue] = text.split(":");
    if (!rawDay || !rawValue) continue;
    const dayKey = rawDay.trim().toLowerCase();
    const existing = map.get(dayKey);
    if (!existing) continue;
    const value = rawValue.trim().toLowerCase();
    if (value.includes("fechado")) {
      existing.enabled = false;
      continue;
    }
    const m = value.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (!m) continue;
    existing.enabled = true;
    existing.open = m[1];
    existing.close = m[2];
  }
  return defaults.map((d) => map.get(d.day.toLowerCase()) || d);
}

export default function BusinessWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, unreadMessages } = useAuth();
  const editingBusinessId = (searchParams.get("editBusinessId") || "").trim();
  const isEditMode = !!editingBusinessId;
  const [step, setStep] = useState<WizardStep>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingEditBusiness, setLoadingEditBusiness] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessFrontend | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugMessage, setSlugMessage] = useState("Escolha um link curto para compartilhar seu negócio.");
  const [slugStatus, setSlugStatus] = useState<"idle" | "ok" | "error">("idle");
  const [nameError, setNameError] = useState("");
  const [contactErrors, setContactErrors] = useState({
    phone: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
  });

  const [form, setForm] = useState({
    name: "",
    shortSlug: "",
    category: "",
    description: "",
    keywords: "",
    services: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    street: "",
    city: "",
    state: "",
    stateCode: "",
    country: "",
    countryCode: "",
    attendanceType: "presencial" as "presencial" | "online" | "hibrido",
    postalCode: "",
    lat: 0,
    lng: 0,
    isVeganFriendly: false,
    isVegetarianFriendly: false,
    isGlutenFreeFriendly: false,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(createDefaultBusinessHours());
  const [existingLogoUrl, setExistingLogoUrl] = useState("");
  const [existingHeroUrl, setExistingHeroUrl] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [galleryTouched, setGalleryTouched] = useState(false);

  const progress = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);
  const StepIcon =
    step === 1
      ? Sparkles
      : step === 2
        ? FileText
        : step === 3
          ? MapPin
          : step === 4
            ? Clock3
            : step === 5
              ? ImageIcon
              : UtensilsCrossed;

  const updateField = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name") {
      const v = String(value || "").trim();
      setNameError(v ? "" : "Nome do negocio e obrigatorio.");
    }
  };

  const updateStep3Field = (field: "phone" | "email" | "website" | "instagram" | "facebook" | "whatsapp", rawValue: string) => {
    let value = rawValue;
    if (field === "phone" || field === "whatsapp") value = sanitizePhoneLike(rawValue);
    if (field === "email") value = sanitizeTextNoSpaces(rawValue).toLowerCase();
    if (field === "website" || field === "instagram" || field === "facebook") value = sanitizeTextNoSpaces(rawValue);
    updateField(field, value);

    setContactErrors((prev) => {
      const next = { ...prev };
      if (field === "email") {
        next.email = value.length === 0 || isValidEmail(value) ? "" : "Email inválido.";
      } else if (field === "phone") {
        next.phone = value.trim().length === 0 ? "" : "";
      } else if (field === "whatsapp") {
        next.whatsapp = "";
      } else {
        next[field] = "";
      }
      return next;
    });
  };

  const runSlugCheck = async () => {
    const slug = normalizeShortSlug(form.shortSlug);
    if (!slug) {
      setSlugStatus("error");
      setSlugMessage("Link curto é obrigatório.");
      setCheckingSlug(false);
      return false;
    }
    if (slug.length < 3) {
      setSlugStatus("error");
      setSlugMessage("Use pelo menos 3 caracteres.");
      return false;
    }
    if (slug.includes("caramelinho")) {
      setSlugStatus("error");
      setSlugMessage('Não use "caramelinho" no link curto.');
      return false;
    }
    setCheckingSlug(true);
    const available = await isBusinessSlugAvailable(slug, isEditMode ? editingBusinessId : undefined);
    setCheckingSlug(false);
    if (!available) {
      setSlugStatus("error");
      setSlugMessage("Esse link já está em uso.");
      return false;
    }
    setSlugStatus("ok");
    setSlugMessage("Disponível.");
    return true;
  };

  useEffect(() => {
    if (step !== 1) return;
    const slug = normalizeShortSlug(form.shortSlug);
    if (!slug) {
      setSlugStatus("idle");
      setSlugMessage("Digite um link curto único para seu negócio.");
      setCheckingSlug(false);
      return;
    }
    if (slug.length < 3) {
      setSlugStatus("error");
      setSlugMessage("Use pelo menos 3 caracteres.");
      setCheckingSlug(false);
      return;
    }
    if (slug.includes("caramelinho")) {
      setSlugStatus("error");
      setSlugMessage('Nao use "caramelinho" no link curto.');
      setCheckingSlug(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      const available = await isBusinessSlugAvailable(slug, isEditMode ? editingBusinessId : undefined);
      if (cancelled) return;
      setCheckingSlug(false);
      if (available) {
        setSlugStatus("ok");
        setSlugMessage("Disponivel.");
      } else {
        setSlugStatus("error");
        setSlugMessage("Esse link ja esta em uso.");
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.shortSlug, step]);

  useEffect(() => {
    if (!session || !isEditMode) return;
    let active = true;
    setLoadingEditBusiness(true);
    getBusinessesByOwner(session.userId)
      .then((items) => {
        if (!active) return;
        const biz = items.find((b) => b.id === editingBusinessId);
        if (!biz) {
          toast.error("Negócio não encontrado para edição.");
          navigate("/perfil?tab=negocios");
          return;
        }
        setEditingBusiness(biz);
        setForm({
          name: biz.name || "",
          shortSlug: biz.slug || "",
          category: getCategoryId(biz.category),
          description: biz.description || "",
          keywords: (biz.keywords || []).join(", "),
          services: "",
          phone: biz.phone || "",
          email: biz.email || "",
          website: biz.website || "",
          instagram: biz.instagram || "",
          facebook: biz.facebook || "",
          whatsapp: biz.whatsapp || "",
          street: biz.address.street || "",
          city: biz.address.city || "",
          state: biz.address.state || "",
          stateCode: biz.address.stateCode || "",
          country: biz.address.country || "",
          countryCode: biz.address.countryCode || "",
          attendanceType: biz.attendanceType || "presencial",
          postalCode: biz.address.postalCode || "",
          lat: biz.address.lat || 0,
          lng: biz.address.lng || 0,
          isVeganFriendly: !!biz.isVeganFriendly,
          isVegetarianFriendly: !!biz.isVegetarianFriendly,
          isGlutenFreeFriendly: !!biz.isGlutenFreeFriendly,
        });
        setBusinessHours(parseBusinessHours(biz.openingHours || []));
        setExistingLogoUrl(biz.logoUrl || "");
        setExistingHeroUrl(biz.heroImage || "");
        setExistingPhotos(biz.photos || []);
        setGalleryTouched(false);
      })
      .finally(() => {
        if (active) setLoadingEditBusiness(false);
      });
    return () => {
      active = false;
    };
  }, [session, isEditMode, editingBusinessId, navigate]);

  const validateCurrentStep = async () => {
    if (step === 1) {
      if (!form.name.trim() || !form.shortSlug.trim() || !form.category) {
        if (!form.name.trim()) setNameError("Nome do negocio e obrigatorio.");
        toast.error("Preencha nome, link curto e categoria.");
        return false;
      }
      setNameError("");
      return runSlugCheck();
    }
    if (step === 2) {
      if (!form.description.trim()) {
        toast.error("Preencha a descrição.");
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!form.phone.trim() || !form.email.trim()) {
        toast.error("Telefone e email são obrigatórios.");
        return false;
      }
      const phoneDigits = (form.phone.match(/\d/g) || []).length;
      if (phoneDigits < 8) {
        setContactErrors((prev) => ({ ...prev, phone: "Telefone inválido." }));
        toast.error("Informe um telefone válido.");
        return false;
      }
      if (!isValidEmail(form.email)) {
        setContactErrors((prev) => ({ ...prev, email: "Email inválido." }));
        toast.error("Informe um email válido.");
        return false;
      }
      setContactErrors({
        phone: "",
        email: "",
        website: "",
        instagram: "",
        facebook: "",
        whatsapp: "",
      });
      if (form.attendanceType === "online" && !form.countryCode.trim()) {
        toast.error("Selecione o país do negócio online.");
        return false;
      }
      if (form.attendanceType !== "online" && (!form.street.trim() || !form.city.trim() || !form.stateCode.trim())) {
        toast.error("Complete o endereço.");
        return false;
      }
      return true;
    }
    if (step === 4) return true;
    return true;
  };

  const goNext = async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    if (step < TOTAL_STEPS) setStep((prev) => (prev + 1) as WizardStep);
  };

  const goBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as WizardStep);
  };

  const handlePlaceSelected = (place: AddressResult) => {
    setForm((prev) => ({
      ...prev,
      street: place.formattedAddress || place.street || "",
      city: place.city || "",
      state: place.state || "",
      stateCode: place.stateCode || "",
      country: place.country || "",
      countryCode: place.countryCode || "",
      postalCode: place.postalCode || "",
      lat: place.lat || 0,
      lng: place.lng || 0,
    }));
  };

  const updateWizardBusinessHour = (
    day: string,
    changes: Partial<Pick<BusinessHour, "enabled" | "open" | "close">>
  ) => {
    setBusinessHours((prev) =>
      prev.map((hour) => {
        if (hour.day !== day) return hour;
        const next = { ...hour, ...changes };
        if (!next.enabled) return next;
        if (!next.open) next.open = "09:00";
        if (!next.close) next.close = "18:00";
        return next;
      })
    );
  };

  const removeGalleryPhotoAt = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryPhotoAt = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
    setGalleryTouched(true);
  };

  const handleSave = async () => {
    if (!session) {
      toast.error("Faça login para cadastrar seu negócio.");
      navigate("/entrar");
      return;
    }

    if (!form.name.trim()) {
      setNameError("Nome do negocio e obrigatorio.");
      setStep(1);
      toast.error("Preencha o nome do negocio.");
      return;
    }

    const slugOk = await runSlugCheck();
    if (!slugOk) return;

    const keywords = form.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      slug: normalizeShortSlug(form.shortSlug || form.name),
      categoryId: form.category,
      description: form.description.trim(),
      street: form.attendanceType === "online" ? "" : form.street.trim(),
      city: form.attendanceType === "online" ? "" : form.city.trim(),
      state: form.attendanceType === "online" ? "" : form.state.trim(),
      stateCode: form.attendanceType === "online" ? "" : form.stateCode.trim().toLowerCase(),
      country: form.attendanceType === "online" ? getCountryName(form.countryCode.trim().toLowerCase()) : form.country.trim(),
      countryCode: form.attendanceType === "online" ? form.countryCode.trim().toLowerCase() : form.countryCode.trim().toLowerCase(),
      attendanceType: form.attendanceType,
      postalCode: form.attendanceType === "online" ? "" : form.postalCode.trim(),
      lat: form.attendanceType === "online" ? 0 : (form.lat || 0),
      lng: form.attendanceType === "online" ? 0 : (form.lng || 0),
      services: [],
      keywords,
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      instagram: buildInstagramUrl(form.instagram),
      facebook: buildFacebookUrl(form.facebook),
      whatsapp: form.whatsapp.trim(),
      isVeganFriendly: getCategoryId(form.category) === "food" ? !!form.isVeganFriendly : false,
      isVegetarianFriendly: getCategoryId(form.category) === "food" ? !!form.isVegetarianFriendly : false,
      isGlutenFreeFriendly: getCategoryId(form.category) === "food" ? !!form.isGlutenFreeFriendly : false,
      openingHours: serializeBusinessHours(businessHours),
    };

    setIsSaving(true);
    try {
      let targetBusinessId = editingBusiness?.id || "";
      if (isEditMode) {
        if (!targetBusinessId) {
          toast.error("Negócio não encontrado para edição.");
          return;
        }
        const updated = await updateBusiness(targetBusinessId, payload);
        if (!updated) {
          toast.error("Não foi possível salvar as alterações.");
          return;
        }
      } else {
        const created = await createBusiness(session.userId, { ...payload, photos: [] });
        if (!created) {
          toast.error("Não foi possível criar o negócio.");
          return;
        }
        targetBusinessId = created.id;
      }

      const updates: Record<string, unknown> = {};

      if (logoFile && targetBusinessId) {
        const path = generateImagePath(targetBusinessId, "logo", logoFile.name);
        const url = await uploadImage("business-images", path, logoFile);
        if (url) updates.logoUrl = url;
      }

      if (heroFile && targetBusinessId) {
        const path = generateImagePath(targetBusinessId, "hero", heroFile.name);
        const url = await uploadImage("business-images", path, heroFile);
        if (url) updates.heroImage = url;
      }

      if ((photoFiles.length > 0 || (isEditMode && galleryTouched)) && targetBusinessId) {
        const uploaded: string[] = [];
        for (const file of photoFiles) {
          const path = generateImagePath(targetBusinessId, "photo", file.name);
          const url = await uploadImage("business-images", path, file);
          if (url) uploaded.push(url);
        }
        updates.photos = isEditMode ? [...existingPhotos, ...uploaded] : uploaded;
      }

      if (Object.keys(updates).length > 0 && targetBusinessId) {
        await updateBusiness(targetBusinessId, updates);
      }

      toast.success(
        isEditMode
          ? "Negócio atualizado com sucesso!"
          : "Negócio enviado para análise. Esse processo pode levar até 24 horas."
      );
      navigate("/perfil?tab=negocios");
    } finally {
      setIsSaving(false);
    }
  };

  const canShowFoodToggles = getCategoryId(form.category) === "food";
  const sharedHeader = (
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
          <div className="flex items-center gap-1.5 sm:gap-3">
            {session ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link to="/perfil?tab=mensagens" className="relative group">
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-secondary w-9 h-9 sm:w-10 sm:h-10">
                    <MessageCircle className="w-4 h-4" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
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
                    <span className="font-medium max-w-[90px] sm:max-w-none truncate">{session.name.split(" ")[0]}</span>
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
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        {sharedHeader}
        <main className="max-w-3xl mx-auto px-4 py-16">
          <Card className="p-8 text-center">
            <User className="w-10 h-10 mx-auto text-muted-foreground/60" />
            <h1 className="text-2xl font-bold mt-3">Entre para continuar</h1>
            <p className="text-muted-foreground mt-2">Você precisa estar logado para usar o cadastro guiado.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link to="/entrar">
                <Button>Entrar</Button>
              </Link>
              <Link to="/">
                <Button variant="outline">Voltar ao início</Button>
              </Link>
            </div>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (isEditMode && loadingEditBusiness) {
    return (
      <div className="min-h-screen bg-background">
        {sharedHeader}
        <main className="max-w-3xl mx-auto px-4 py-16">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold">Carregando edição...</h1>
            <p className="text-muted-foreground mt-2">Buscando os dados do negócio para preencher o wizard.</p>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-background">
      {sharedHeader}

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card className="p-6 border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Passo {step} de {TOTAL_STEPS}</p>
              <h1 className="text-2xl font-bold">
                {step === 1 && "Dados principais"}
                {step === 2 && "Descrição e busca"}
                {step === 3 && "Contato e Endereço"}
                {step === 4 && "Horários"}
                {step === 5 && "Mídia"}
                {step === 6 && "Revisão e confirmação"}
              </h1>
            </div>
            <StepIcon className="w-6 h-6 text-amber-500" />
          </div>

          <div className="h-2 rounded-full bg-secondary overflow-hidden mb-6">
            <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nome do negócio *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={`mt-1.5 ${nameError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {nameError ? <p className="mt-1 text-xs text-red-600">{nameError}</p> : null}
              </div>
              <div className="md:col-span-2">
                <Label>Link curto *</Label>
                <div className="mt-1.5 flex items-center rounded-md border border-input bg-background overflow-hidden">
                  <span className="px-3 py-2 text-sm text-muted-foreground bg-secondary/50 border-r border-input whitespace-nowrap">
                    caramelinho.com/go/
                  </span>
                  <input
                    value={form.shortSlug}
                    onChange={(e) => updateField("shortSlug", normalizeShortSlug(e.target.value))}
                    placeholder="pizzaria-do-ze"
                    className="w-full h-10 px-3 bg-transparent text-sm outline-none"
                  />
                </div>
                <p className={`mt-1 text-xs ${slugStatus === "ok" ? "text-emerald-700" : slugStatus === "error" ? "text-red-600" : "text-muted-foreground"}`}>
                  {checkingSlug ? "Verificando disponibilidade..." : slugMessage}
                </p>
              </div>
              <div className="md:col-span-2">
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Tipo de atendimento *</Label>
                <Select value={form.attendanceType} onValueChange={(v) => updateField("attendanceType", v)}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="Selecione o tipo de atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Somente online</SelectItem>
                    <SelectItem value="hibrido">Híbrido (presencial e online)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Descrição *</Label>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Esta é a informação mais importante da página do seu negócio. É ela que ajuda o cliente a entender rapidamente o que você oferece, seus diferenciais e por que deve escolher você. Escreva de forma clara, objetiva e humana: diga os principais serviços/produtos, o público atendido, região de atuação e pontos fortes (ex.: rapidez, qualidade, atendimento em português, experiência, especialidades).
                </p>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="mt-1.5 min-h-[140px]"
                  placeholder="Descreva claramente o que seu negócio oferece."
                />
              </div>
              <div>
                <Label>Palavras-chave</Label>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Essas palavras ajudam seu negócio a aparecer quando alguém procura por produtos e serviços. Use termos reais que seus clientes digitam, incluindo variações e sinônimos. Exemplo: para mecânico, também use oficina, manutenção automotiva, troca de óleo. Para restaurante brasileiro, adicione comida brasileira, prato feito, almoço, jantar, delivery. Separe por vírgula e evite termos muito genéricos.
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  Palavras-chave (separadas por vírgula)
                </p>
                <Textarea
                  value={form.keywords}
                  onChange={(e) => updateField("keywords", e.target.value)}
                  className="mt-1.5 min-h-[96px]"
                  placeholder="Ex: coxinha, padaria brasileira, almoço"
                />
              </div>
              {canShowFoodToggles && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-medium text-emerald-900 mb-2">Públicos também atendidos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={form.isVeganFriendly} onChange={(e) => updateField("isVeganFriendly", e.target.checked)} />
                      Vegano
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={form.isVegetarianFriendly} onChange={(e) => updateField("isVegetarianFriendly", e.target.checked)} />
                      Vegetariano
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={form.isGlutenFreeFriendly} onChange={(e) => updateField("isGlutenFreeFriendly", e.target.checked)} />
                      Sem Glúten
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Telefone *</Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => updateStep3Field("phone", e.target.value)}
                  className={`mt-1.5 ${contactErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  placeholder="+1 (514) 555-1234"
                />
                {contactErrors.phone ? <p className="mt-1 text-xs text-red-600">{contactErrors.phone}</p> : null}
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => updateStep3Field("email", e.target.value)}
                  className={`mt-1.5 ${contactErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  placeholder="contato@seudominio.com"
                />
                {contactErrors.email ? <p className="mt-1 text-xs text-red-600">{contactErrors.email}</p> : null}
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => updateStep3Field("website", e.target.value)}
                  className="mt-1.5"
                  placeholder="https://seusite.com"
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={form.instagram}
                  onChange={(e) => updateStep3Field("instagram", e.target.value)}
                  onBlur={() => updateField("instagram", buildInstagramUrl(form.instagram))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Facebook</Label>
                <Input
                  value={form.facebook}
                  onChange={(e) => updateStep3Field("facebook", e.target.value)}
                  onBlur={() => updateField("facebook", buildFacebookUrl(form.facebook))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.whatsapp}
                  onChange={(e) => updateStep3Field("whatsapp", e.target.value)}
                  className={`mt-1.5 ${contactErrors.whatsapp ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  placeholder="+1 (514) 555-1234"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço {form.attendanceType === "online" ? "(opcional)" : "*"}</Label>
                <div className="mt-1.5">
                  {form.attendanceType === "online" ? (
                    <div className="space-y-2">
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        Negócio 100% online: endereço físico não é obrigatório.
                      </div>
                      <div>
                        <Label>País do negócio online *</Label>
                        <Select
                          value={form.countryCode || ""}
                          onValueChange={(v) => {
                            updateField("countryCode", v.toLowerCase());
                            updateField("country", getCountryName(v.toLowerCase()));
                            updateField("state", "");
                            updateField("stateCode", "");
                            updateField("city", "");
                            updateField("street", "");
                            updateField("postalCode", "");
                            updateField("lat", 0);
                            updateField("lng", 0);
                          }}
                        >
                          <SelectTrigger className="mt-1.5 w-full">
                            <SelectValue placeholder="Selecione o país" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(COUNTRIES).map(([code, info]) => (
                              <SelectItem key={code} value={code}>
                                {info.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <AddressAutocomplete
                      value={form.street}
                      onChange={(v) => updateField("street", v)}
                      onPlaceSelected={handlePlaceSelected}
                    />
                  )}
                </div>
              </div>
              <div className="md:col-span-2 rounded-md border border-border p-3 text-sm">
                <p className="inline-flex items-center gap-2 font-medium">
                  <MapPin className="w-4 h-4" />
                  Resumo do endereço
                </p>
                <p className="text-muted-foreground mt-1">
                  {form.attendanceType === "online"
                    ? "Atendimento 100% online"
                    : (
                      <>
                        {form.street?.trim() || "Endereço não preenchido"}<br />
                        {[
                          form.city?.trim(),
                          form.stateCode?.trim() ? form.stateCode.toUpperCase() : "",
                          form.postalCode?.trim(),
                        ]
                          .filter(Boolean)
                          .join(" ") || "Cidade/UF não preenchidas"}
                      </>
                    )}
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-lg border border-border bg-secondary/10 p-4">
                <Label>Horários de funcionamento</Label>
                <div className="mt-3 space-y-2">
                  {businessHours.map((hour) => (
                    <div key={hour.day} className="grid grid-cols-[110px_90px_1fr_1fr] gap-2 items-center">
                      <span className="text-sm font-medium">{hour.day}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant={hour.enabled ? "default" : "outline"}
                        onClick={() => updateWizardBusinessHour(hour.day, { enabled: !hour.enabled })}
                      >
                        {hour.enabled ? "Aberto" : "Fechado"}
                      </Button>
                      <Input
                        type="time"
                        value={hour.open}
                        disabled={!hour.enabled}
                        onChange={(e) => updateWizardBusinessHour(hour.day, { open: e.target.value })}
                      />
                      <Input
                        type="time"
                        value={hour.close}
                        disabled={!hour.enabled}
                        onChange={(e) => updateWizardBusinessHour(hour.day, { close: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Logo</Label>
                <div className="mt-1.5">
                  <label htmlFor="wizard-logo" className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary">
                    Escolher imagem
                  </label>
                </div>
                <Input id="wizard-logo" type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                <p className="mt-1 text-xs text-muted-foreground">{logoFile ? logoFile.name : "Nenhum arquivo selecionado"}</p>
                {logoFile ? (
                  <div className="mt-2">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
                      <img src={URL.createObjectURL(logoFile)} alt="Prévia da logo" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : existingLogoUrl ? (
                  <div className="mt-2">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
                      <img src={existingLogoUrl} alt="Logo atual" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG e WEBP. Resolução ideal: 512x512 px. Tamanho máximo: 5MB.
                </p>
              </div>
              <div>
                <Label>Capa (banner)</Label>
                <div className="mt-1.5">
                  <label htmlFor="wizard-hero" className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary">
                    Escolher imagem
                  </label>
                </div>
                <Input id="wizard-hero" type="file" accept="image/*" className="hidden" onChange={(e) => setHeroFile(e.target.files?.[0] || null)} />
                <p className="mt-1 text-xs text-muted-foreground">{heroFile ? heroFile.name : "Nenhum arquivo selecionado"}</p>
                {heroFile ? (
                  <div className="mt-2">
                    <div className="relative w-44 h-20 rounded-md overflow-hidden border border-border">
                      <img src={URL.createObjectURL(heroFile)} alt="Prévia da capa" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : existingHeroUrl ? (
                  <div className="mt-2">
                    <div className="relative w-44 h-20 rounded-md overflow-hidden border border-border">
                      <img src={existingHeroUrl} alt="Capa atual" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG e WEBP. Resolução ideal: 1600x600 px. Tamanho máximo: 8MB.
                </p>
              </div>
              <div>
                <Label>Galeria de fotos (até 8)</Label>
                <div className="mt-1.5">
                  <label htmlFor="wizard-photos" className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-secondary">
                    Escolher imagens
                  </label>
                </div>
                <Input
                  id="wizard-photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const incoming = Array.from(e.target.files || []);
                    setPhotoFiles((prev) => {
                      const merged = [...prev];
                      for (const file of incoming) {
                        const exists = merged.some(
                          (f) =>
                            f.name === file.name &&
                            f.size === file.size &&
                            f.lastModified === file.lastModified
                        );
                        if (!exists) merged.push(file);
                        if (merged.length >= 8) break;
                      }
                      return merged.slice(0, 8);
                    });
                    e.currentTarget.value = "";
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: JPG, PNG e WEBP. Resolução ideal: 1280x720 px. Tamanho máximo: 8MB por imagem.
                </p>
                <p className="text-xs text-muted-foreground mt-1">{photoFiles.length} arquivo(s) selecionado(s).</p>
                {photoFiles.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {photoFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="relative w-full aspect-square rounded-md overflow-hidden border border-border group">
                        <img src={URL.createObjectURL(file)} alt="Prévia da galeria" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryPhotoAt(index)}
                          className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          aria-label="Remover foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {existingPhotos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {existingPhotos.slice(0, 8).map((url, index) => (
                      <div key={`${url}-${index}`} className="relative w-full aspect-square rounded-md overflow-hidden border border-border group">
                        <img src={url} alt="Foto atual" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingGalleryPhotoAt(index)}
                          className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          aria-label="Remover foto atual"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="grid grid-cols-1 gap-4">
              <Card className="p-4 border-emerald-200 bg-emerald-50">
                <p className="inline-flex items-center gap-2 text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Confira os dados antes de publicar
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p><strong>Negócio:</strong> {form.name || "-"}</p>
                  <p><strong>Link curto:</strong> caramelinho.com/go/{form.shortSlug || slugify(form.name) || "-"}</p>
                  <p><strong>Categoria:</strong> {BUSINESS_CATEGORY_OPTIONS.find((c) => c.id === form.category)?.label || "-"}</p>
                  <p><strong>Atendimento:</strong> {form.attendanceType === "online" ? "Online" : form.attendanceType === "hibrido" ? "Híbrido" : "Presencial"}</p>
                  <p>
                    <strong>{form.attendanceType === "online" ? "País:" : "Cidade:"}</strong>{" "}
                    {form.attendanceType === "online"
                      ? (form.country || getCountryName(form.countryCode || "") || "-")
                      : `${form.city || "-"} (${form.stateCode?.toUpperCase() || "-"})`}
                  </p>
                  <p><strong>Contato:</strong> {form.phone || "-"} / {form.email || "-"}</p>
                  <p><strong>Mídia:</strong> {logoFile ? "logo" : "sem logo"}, {heroFile ? "capa" : "sem capa"}, {photoFiles.length} foto(s)</p>
                </div>
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {getCategoryId(form.category) === "food" ? (
                    <>
                      <p className="font-semibold">Próximo passo recomendado: Cardápio</p>
                      <p className="mt-1">
                        Após publicar, você poderá adicionar seu cardápio item a item (nome, descrição e preço opcional)
                        ou enviar um cardápio completo em PDF. Isso facilita para o cliente encontrar pratos e produtos.
                        Você encontra essa opção em <strong>Perfil &gt; Meus Negócios</strong>, no botão <strong>Cardápio</strong> do seu negócio.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">Próximo passo recomendado: Serviços</p>
                      <p className="mt-1">
                        Após publicar, você poderá cadastrar seus serviços com nome, descrição e preço opcional.
                        Isso melhora sua presença nas buscas e ajuda o cliente a entender o que seu negócio oferece.
                        Você encontra essa opção em <strong>Perfil &gt; Meus Negócios</strong>, no botão <strong>Serviços</strong> do seu negócio.
                      </p>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={goBack} disabled={step === 1 || isSaving} className="w-full sm:w-auto">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>

            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            {step < TOTAL_STEPS ? (
              <Button onClick={goNext} disabled={isSaving} className="order-1 w-full sm:w-auto">
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving} className="order-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                {isSaving ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-pulse" />
                    {isEditMode ? "Salvando..." : "Publicando..."}
                  </>
                ) : (
                  <>
                    <PawPrint className="w-4 h-4 mr-2" />
                    {isEditMode ? "Salvar modificações" : "Confirmar e Publicar"}
                  </>
                )}
              </Button>
            )}
            {isEditMode && step < TOTAL_STEPS ? (
              <Button onClick={handleSave} disabled={isSaving} className="order-1 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                {isSaving ? "Salvando..." : "Salvar modificações"}
              </Button>
            ) : null}
          </div>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

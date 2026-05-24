// Tipos TypeScript compatíveis com o schema Supabase do Caramelinho

export interface Profile {
  id: string;
  name: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  role?: "user" | "admin";
  created_at: string;
}

export interface MenuItem {
  name: string;
  price: string;
  description: string;
}

export interface Promotion {
  title: string;
  description: string;
  code: string;
  expiresAt: string; // YYYY-MM-DD
}

export interface BusinessEvent {
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  location: string;
  isFree: boolean;
  price: string;
  flyerUrl?: string;
  ticketUrl?: string;
}

export interface CommunityEvent {
  id: string;
  owner_id: string;
  business_id: string | null;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  location: string;
  is_free: boolean;
  price: string;
  flyer_url: string | null;
  ticket_url: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export type CommunityFindCategory = "comida" | "beleza" | "casa" | "outros";

export interface CommunityFind {
  id: string;
  user_id: string;
  product_name: string;
  location_name: string;
  category: CommunityFindCategory;
  lat: number;
  lng: number;
  accuracy_meters: number | null;
  photo_url: string | null;
  upvotes: number;
  downvotes: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityFindWithVote extends CommunityFind {
  user_vote?: -1 | 1 | null;
}

export interface Review {
  id: string;
  business_id: string;
  user_id: string | null;
  user_name: string;
  user_avatar?: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  category_id: string;
  category?: string | null;
  description: string;
  hero_image: string | null;
  logo_url: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  country_code: string | null;
  state_code: string | null;
  attendance_type?: "presencial" | "online" | "hibrido" | null;
  postal_code: string | null;
  lat: number;
  lng: number;
  services: string[];
  service_items?: MenuItem[];
  keywords: string[];
  menu: MenuItem[];
  menu_pdf_url?: string | null;
  is_brazilian_owned?: boolean;
  serves_portuguese?: boolean;
  is_vegan_friendly?: boolean;
  is_vegetarian_friendly?: boolean;
  is_gluten_free_friendly?: boolean;
  photos: string[];
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  reviews: Review[];
  average_rating: number;
  owner_verified?: boolean;
  owner_verified_until?: string | null;
  moderation_status?: "pending" | "approved" | "rejected";
  moderation_reviewed_at?: string | null;
  moderation_reviewed_by?: string | null;
  opening_hours?: string[];
  promotions?: Promotion[];
  events?: BusinessEvent[];
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string | null;
  business_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  read: boolean;
}

// Tipos auxiliares para o frontend (camelCase)
export interface BusinessFrontend {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  slug: string;
  categoryId: string;
  category: string;
  description: string;
  heroImage: string;
  logoUrl: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    countryCode: string;
    stateCode: string;
    postalCode: string;
    lat: number;
    lng: number;
  };
  attendanceType: "presencial" | "online" | "hibrido";
  services: string[];
  serviceItems: MenuItem[];
  keywords: string[];
  menu: MenuItem[];
  menuPdfUrl?: string;
  isBrazilianOwned: boolean;
  servesPortuguese: boolean;
  isVeganFriendly: boolean;
  isVegetarianFriendly: boolean;
  isGlutenFreeFriendly: boolean;
  photos: string[];
  phone: string;
  email: string;
  website: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  reviews: Review[];
  averageRating: number;
  ownerVerified: boolean;
  ownerVerifiedUntil?: string;
  moderationStatus: "pending" | "approved" | "rejected";
  moderationReviewedAt?: string;
  moderationReviewedBy?: string;
  openingHours: string[];
  promotions: Promotion[];
  events: BusinessEvent[];
  createdAt: string;
}

export type FeaturedScopeType = "city" | "state" | "country" | "global";
export type FeaturedPlacementStatus = "active" | "paused" | "expired";

export interface FeaturedPlacement {
  id: string;
  business_id: string;
  scope_type: FeaturedScopeType;
  country_code: string | null;
  state_code: string | null;
  city: string | null;
  category: string | null;
  starts_at: string;
  ends_at: string;
  priority: number;
  status: FeaturedPlacementStatus;
  notes: string | null;
  price_cents: number | null;
  created_at: string;
  updated_at: string;
  business?: Business | null;
}

export interface FeaturedPlacementFrontend {
  id: string;
  businessId: string;
  business?: BusinessFrontend;
  scopeType: FeaturedScopeType;
  countryCode: string;
  stateCode: string;
  city: string;
  category: string;
  startsAt: string;
  endsAt: string;
  priority: number;
  status: FeaturedPlacementStatus;
  notes: string;
  priceCents: number;
}

export interface OwnerClaimRequest {
  id: string;
  business_id: string;
  requested_by: string;
  requester_email: string;
  requester_name: string;
  message: string;
  status: "pending" | "approved" | "rejected" | "canceled";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  business?: {
    id: string;
    name: string;
    city: string | null;
    country_code: string | null;
    owner_id: string;
  } | null;
}

export interface BusinessReport {
  id: string;
  business_id: string;
  reporter_user_id: string | null;
  reporter_email: string | null;
  reason: "fake" | "difamacao" | "golpe" | "conteudo_ofensivo" | "outro";
  details: string | null;
  status: "pending" | "reviewing" | "resolved" | "rejected";
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
  business?: {
    id: string;
    name: string;
    slug?: string | null;
    city: string | null;
    state_code?: string | null;
    country_code: string | null;
  } | null;
}

export interface BusinessVerificationRequest {
  id: string;
  business_id: string;
  owner_id: string;
  instagram_post_url: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  business?: {
    id: string;
    name: string;
    city: string | null;
    country_code: string | null;
    owner_verified?: boolean;
    owner_verified_until?: string | null;
  } | null;
}

export interface ConversationFrontend {
  id: string;
  participants: string[];
  businessId?: string;
  businessName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface MessageFrontend {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface UserFrontend {
  id: string;
  email: string;
  name: string;
  bio: string;
  phone: string;
  location: string;
  avatar: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface AuthSessionFrontend {
  userId: string;
  email: string;
  name: string;
  role?: "user" | "admin";
}

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

export interface Review {
  id: string;
  business_id: string;
  user_id: string | null;
  user_name: string;
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
  postal_code: string | null;
  lat: number;
  lng: number;
  services: string[];
  keywords: string[];
  menu: MenuItem[];
  menu_pdf_url?: string | null;
  is_brazilian_owned?: boolean;
  serves_portuguese?: boolean;
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
  opening_hours?: string[];
  promotions?: Promotion[];
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
  services: string[];
  keywords: string[];
  menu: MenuItem[];
  menuPdfUrl?: string;
  isBrazilianOwned: boolean;
  servesPortuguese: boolean;
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
  openingHours: string[];
  promotions: Promotion[];
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

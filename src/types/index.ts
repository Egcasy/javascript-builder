export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  images: string[];
  coverImage: string;
  venue: {
    name: string;
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  date: string;
  time: string;
  endTime?: string;
  category: EventCategory;
  tags: string[];
  ticketTypes: TicketType[];
  totalTickets: number;
  soldTickets: number;
  status: EventStatus;
  isFeatured: boolean;
  isHot: boolean;
  ageRestriction?: number;
  dressCode?: string;
  artists?: Artist[];
  organizer: Organizer;
  createdAt: string;
  updatedAt: string;
}

export type EventCategory = 
  | 'friday-night'
  | 'saturday-vibes' 
  | 'sunday-groove'
  | 'vip-premium'
  | 'beach-party'
  | 'pool-party'
  | 'club-event'
  | 'concert'
  | 'festival'
  | 'sports';

export type EventStatus = 'active' | 'hidden' | 'vip-only' | 'sold-out' | 'expired' | 'cancelled';

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  available: number;
  sold: number;
  maxPerOrder: number;
  benefits?: string[];
  isEarlyBird?: boolean;
  earlyBirdDeadline?: string;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  role: string;
}

export interface Organizer {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
  tier: SellerTier;
}

export type SellerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
}

export type UserRole = 'buyer' | 'seller' | 'admin' | 'super-admin';

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  ticketType: TicketType;
  quantity: number;
  totalPaid: number;
  qrCode: string;
  status: TicketStatus;
  purchasedAt: string;
  event?: Event;
}

export type TicketStatus = 'valid' | 'used' | 'transferred' | 'refunded' | 'expired';

export interface CartItem {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  price: number;
}

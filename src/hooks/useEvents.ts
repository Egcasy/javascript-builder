import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Event, EventCategory, EventStatus, TicketType } from "@/types";

interface FirestoreEvent {
  title?: string;
  description?: string;
  short_description?: string;
  cover_image?: string;
  images?: string[];
  date?: string;
  start_time?: string;
  end_time?: string;
  category?: EventCategory;
  tags?: string[];
  status?: EventStatus;
  is_featured?: boolean;
  is_hot?: boolean;
  age_restriction?: number;
  dress_code?: string;
  total_tickets?: number;
  sold_tickets?: number;
  created_at?: string;
  updated_at?: string;
  venue?: {
    name?: string;
    address?: string;
    city?: string;
  };
  organizer?: {
    id?: string;
    name?: string;
    logo?: string;
    verified?: boolean;
    tier?: "bronze" | "silver" | "gold" | "platinum";
  };
  ticket_types?: Array<{
    id?: string;
    name?: string;
    description?: string;
    price?: number;
    original_price?: number;
    quantity?: number;
    sold?: number;
    max_per_order?: number;
    benefits?: string[];
    is_early_bird?: boolean;
    early_bird_deadline?: string;
  }>;
}

const mapTicketType = (ticket: NonNullable<FirestoreEvent["ticket_types"]>[number]): TicketType => ({
  id: ticket.id ?? "",
  name: ticket.name ?? "General Admission",
  description: ticket.description,
  price: ticket.price ?? 0,
  originalPrice: ticket.original_price ?? undefined,
  available: Math.max((ticket.quantity ?? 0) - (ticket.sold ?? 0), 0),
  sold: ticket.sold ?? 0,
  maxPerOrder: ticket.max_per_order ?? 10,
  benefits: ticket.benefits ?? [],
  isEarlyBird: ticket.is_early_bird ?? false,
  earlyBirdDeadline: ticket.early_bird_deadline ?? undefined,
});

const mapEvent = (id: string, data: FirestoreEvent): Event => ({
  id,
  title: data.title ?? "",
  description: data.description ?? "",
  shortDescription: data.short_description ?? "",
  images: data.images ?? [],
  coverImage: data.cover_image ?? "",
  venue: {
    name: data.venue?.name ?? "TBA",
    address: data.venue?.address ?? "",
    city: data.venue?.city ?? "",
  },
  date: data.date ?? "",
  time: data.start_time ?? "",
  endTime: data.end_time ?? undefined,
  category: data.category ?? "concert",
  tags: data.tags ?? [],
  ticketTypes: (data.ticket_types ?? []).map(mapTicketType),
  totalTickets: data.total_tickets ?? 0,
  soldTickets: data.sold_tickets ?? 0,
  status: data.status ?? "active",
  isFeatured: Boolean(data.is_featured),
  isHot: Boolean(data.is_hot),
  ageRestriction: data.age_restriction ?? undefined,
  dressCode: data.dress_code ?? undefined,
  organizer: {
    id: data.organizer?.id ?? "",
    name: data.organizer?.name ?? "Organizer",
    logo: data.organizer?.logo ?? "",
    verified: Boolean(data.organizer?.verified),
    tier: data.organizer?.tier ?? "gold",
  },
  createdAt: data.created_at ?? "",
  updatedAt: data.updated_at ?? "",
});

export function useEvents(filters?: { category?: string; city?: string; search?: string }) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: async () => {
      const eventsRef = collection(db, "events");
      const constraints = [
        where("status", "in", ["active", "sold-out"]),
        orderBy("date", "asc"),
      ];

      if (filters?.category) {
        constraints.push(where("category", "==", filters.category));
      }
      if (filters?.city) {
        constraints.push(where("venue.city", "==", filters.city));
      }

      const snapshot = await getDocs(query(eventsRef, ...constraints));
      const events = snapshot.docs.map((docSnap) => mapEvent(docSnap.id, docSnap.data() as FirestoreEvent));

      if (filters?.search) {
        const searchValue = filters.search.toLowerCase();
        return events.filter((event) =>
          event.title.toLowerCase().includes(searchValue) ||
          event.venue.name.toLowerCase().includes(searchValue) ||
          event.venue.city.toLowerCase().includes(searchValue)
        );
      }

      return events;
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, "events", id));
      if (!snapshot.exists()) return null;
      return mapEvent(snapshot.id, snapshot.data() as FirestoreEvent);
    },
    enabled: !!id,
  });
}

export function useFeaturedEvents() {
  return useQuery({
    queryKey: ["events", "featured"],
    queryFn: async () => {
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(
        query(
          eventsRef,
          where("is_featured", "==", true),
          where("status", "in", ["active", "sold-out"]),
          orderBy("date", "asc"),
          limit(6)
        )
      );
      return snapshot.docs.map((docSnap) => mapEvent(docSnap.id, docSnap.data() as FirestoreEvent));
    },
  });
}

export function useHotEvents() {
  return useQuery({
    queryKey: ["events", "hot"],
    queryFn: async () => {
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(
        query(
          eventsRef,
          where("is_hot", "==", true),
          where("status", "in", ["active", "sold-out"]),
          orderBy("date", "asc"),
          limit(6)
        )
      );
      return snapshot.docs.map((docSnap) => mapEvent(docSnap.id, docSnap.data() as FirestoreEvent));
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DBEvent {
  id: string;
  seller_id: string;
  venue_id: string | null;
  title: string;
  description: string | null;
  short_description: string | null;
  cover_image: string | null;
  images: string[] | null;
  date: string;
  start_time: string;
  end_time: string | null;
  category: string;
  tags: string[] | null;
  status: string;
  is_featured: boolean;
  is_hot: boolean;
  age_restriction: number | null;
  dress_code: string | null;
  total_tickets: number;
  sold_tickets: number;
  created_at: string;
  updated_at: string;
  venue?: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  seller?: {
    id: string;
    business_name: string;
    logo_url: string | null;
    verified: boolean;
    tier: string;
  };
  ticket_types?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    original_price: number | null;
    quantity: number;
    sold: number;
    max_per_order: number;
    benefits: string[] | null;
    is_early_bird: boolean;
    early_bird_deadline: string | null;
  }[];
}

export function useEvents(filters?: { category?: string; city?: string; search?: string }) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          seller:sellers(*),
          ticket_types(*)
        `)
        .in('status', ['active', 'sold-out'])
        .order('date', { ascending: true });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.city) {
        query = query.eq('venues.city', filters.city);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as DBEvent[];
    }
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          seller:sellers(*),
          ticket_types(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as DBEvent | null;
    },
    enabled: !!id
  });
}

export function useFeaturedEvents() {
  return useQuery({
    queryKey: ['events', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          seller:sellers(*),
          ticket_types(*)
        `)
        .eq('is_featured', true)
        .in('status', ['active', 'sold-out'])
        .order('date', { ascending: true })
        .limit(6);
      
      if (error) throw error;
      return data as DBEvent[];
    }
  });
}

export function useHotEvents() {
  return useQuery({
    queryKey: ['events', 'hot'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          seller:sellers(*),
          ticket_types(*)
        `)
        .eq('is_hot', true)
        .in('status', ['active', 'sold-out'])
        .order('date', { ascending: true })
        .limit(6);
      
      if (error) throw error;
      return data as DBEvent[];
    }
  });
}

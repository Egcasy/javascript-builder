import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader || '' } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Return popular events for non-authenticated users
      const { data: popularEvents } = await supabase
        .from('events')
        .select('*')
        .in('status', ['active', 'sold-out'])
        .order('sold_tickets', { ascending: false })
        .limit(6);

      return new Response(
        JSON.stringify({ recommendations: popularEvents || [], reason: 'Popular events' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get user favorites
    const { data: favorites } = await supabase
      .from('favorites')
      .select('event_id')
      .eq('user_id', user.id);

    // Get past purchases
    const { data: orders } = await supabase
      .from('orders')
      .select('event_id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const favoriteEventIds = favorites?.map(f => f.event_id) || [];
    const purchasedEventIds = orders?.map(o => o.event_id) || [];
    const excludeIds = [...new Set([...favoriteEventIds, ...purchasedEventIds])];

    // Build recommendation query
    let query = supabase
      .from('events')
      .select(`
        *,
        venues:venue_id (name, city, address)
      `)
      .in('status', ['active', 'sold-out'])
      .gte('date', new Date().toISOString().split('T')[0]);

    // Apply preference filters
    if (preferences?.favorite_categories?.length) {
      query = query.in('category', preferences.favorite_categories);
    }

    // Get events from favorite cities via venue
    let cityFilteredEvents: any[] = [];
    if (preferences?.favorite_cities?.length) {
      const { data: venuesInCities } = await supabase
        .from('venues')
        .select('id')
        .in('city', preferences.favorite_cities);
      
      if (venuesInCities?.length) {
        const venueIds = venuesInCities.map(v => v.id);
        const { data } = await supabase
          .from('events')
          .select('*')
          .in('venue_id', venueIds)
          .in('status', ['active'])
          .gte('date', new Date().toISOString().split('T')[0])
          .limit(10);
        cityFilteredEvents = data || [];
      }
    }

    // Price range filter will be applied client-side since we need ticket_types join

    const { data: events, error } = await query
      .order('date', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    // Score and rank events
    const scoredEvents = (events || []).map(event => {
      let score = 0;
      
      // Boost for matching categories
      if (preferences?.favorite_categories?.includes(event.category)) {
        score += 30;
      }
      
      // Boost for hot events
      if (event.is_hot) score += 20;
      
      // Boost for featured events
      if (event.is_featured) score += 15;
      
      // Boost for events in favorite cities
      if (cityFilteredEvents.some(e => e.id === event.id)) {
        score += 25;
      }
      
      // Slight boost for popularity
      if (event.sold_tickets > 50) score += 10;
      
      // Don't recommend already purchased or favorited
      if (excludeIds.includes(event.id)) {
        score -= 100;
      }

      return { ...event, _score: score };
    });

    // Sort by score and take top 6
    const recommendations = scoredEvents
      .sort((a, b) => b._score - a._score)
      .slice(0, 6)
      .map(({ _score, ...event }) => event);

    console.log(`Generated ${recommendations.length} recommendations for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        recommendations,
        reason: preferences?.favorite_categories?.length 
          ? `Based on your interest in ${preferences.favorite_categories.slice(0, 2).join(', ')}`
          : 'Recommended for you'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Recommendation error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

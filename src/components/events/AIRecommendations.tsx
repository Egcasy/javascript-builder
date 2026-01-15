import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "./EventCard";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  title: string;
  short_description: string;
  cover_image: string;
  date: string;
  start_time: string;
  category: string;
  is_hot: boolean;
  is_featured: boolean;
  sold_tickets: number;
  total_tickets: number;
  venue_id: string;
  venues?: { name: string; city: string; address: string };
}

export const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-recommendations");

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      setReason(data.reason || "Recommended for you");
    } catch (err) {
      console.error("Recommendations error:", err);
      setError("Failed to load recommendations");
      
      // Fallback to popular events
      const { data: fallback } = await supabase
        .from("events")
        .select(`
          *,
          venues:venue_id (name, city, address)
        `)
        .in("status", ["active", "sold-out"])
        .order("sold_tickets", { ascending: false })
        .limit(6);

      setRecommendations(fallback || []);
      setReason("Popular events");
    } finally {
      setLoading(false);
    }
  };

  // Transform DB event to EventCard format
  const transformEvent = (event: Event) => ({
    id: event.id,
    title: event.title,
    shortDescription: event.short_description || "",
    coverImage: event.cover_image || "/placeholder.svg",
    date: event.date,
    time: event.start_time,
    isHot: event.is_hot,
    isFeatured: event.is_featured,
    soldTickets: event.sold_tickets || 0,
    totalTickets: event.total_tickets || 100,
    venue: {
      name: event.venues?.name || "Venue TBA",
      city: event.venues?.city || "",
      address: event.venues?.address || "",
    },
    ticketTypes: [],
    category: event.category as any,
    tags: [],
    images: [],
    description: "",
    status: "active" as const,
    organizer: { id: "", name: "", logo: "", verified: false, tier: "bronze" as const },
    createdAt: "",
    updatedAt: "",
  });

  if (loading) {
    return (
      <div className="py-12">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Finding events for you...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">For You</h2>
            <p className="text-muted-foreground">{reason}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchRecommendations}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((event, index) => (
          <EventCard
            key={event.id}
            event={transformEvent(event)}
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

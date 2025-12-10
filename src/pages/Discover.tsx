import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, Flame, Star, MapPin, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/layout/Layout";
import { EventCard } from "@/components/events/EventCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const categories = [
  { id: "all", label: "All Events", icon: "🎫" },
  { id: "friday-night", label: "Friday Night", icon: "🎉" },
  { id: "saturday-vibes", label: "Saturday", icon: "🔥" },
  { id: "sunday-groove", label: "Sunday", icon: "☀️" },
  { id: "concert", label: "Concerts", icon: "🎤" },
  { id: "festival", label: "Festivals", icon: "🎪" },
  { id: "beach-party", label: "Beach Party", icon: "🏖️" },
];

const cities = ["All Cities", "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"];

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "All Cities");
  const [sortBy, setSortBy] = useState<string>("date");

  // Fetch events from database
  const { data: events, isLoading } = useQuery({
    queryKey: ["discover-events", selectedCategory, selectedCity, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select(`*, venues(name, city, address), ticket_types(price)`)
        .in("status", ["active", "sold-out"]);

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      if (selectedCity !== "All Cities") {
        query = query.eq("venues.city", selectedCity);
      }

      if (sortBy === "date") {
        query = query.order("date", { ascending: true });
      } else if (sortBy === "popular") {
        query = query.order("sold_tickets", { ascending: false });
      }

      const { data } = await query;
      return data || [];
    },
  });

  // Fetch trending events
  const { data: trendingEvents } = useQuery({
    queryKey: ["trending-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select(`*, venues(name, city)`)
        .eq("status", "active")
        .eq("is_hot", true)
        .limit(5);
      return data || [];
    },
  });

  const filteredEvents = events?.filter((event: any) => {
    if (!searchQuery) return true;
    return (
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venues?.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery, category: selectedCategory, city: selectedCity });
  };

  // Transform DB events to match EventCard props
  const transformEvent = (event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description || "",
    shortDescription: event.short_description || "",
    images: event.images || [],
    coverImage: event.cover_image || "/placeholder.svg",
    venue: {
      name: event.venues?.name || "TBA",
      address: event.venues?.address || "",
      city: event.venues?.city || "",
    },
    date: event.date,
    time: event.start_time,
    category: event.category,
    tags: event.tags || [],
    ticketTypes: event.ticket_types?.map((t: any) => ({
      id: t.id,
      name: t.name,
      price: Number(t.price),
      available: t.quantity - (t.sold || 0),
      sold: t.sold || 0,
      maxPerOrder: t.max_per_order || 10,
    })) || [],
    totalTickets: event.total_tickets || 0,
    soldTickets: event.sold_tickets || 0,
    status: event.status,
    isFeatured: event.is_featured,
    isHot: event.is_hot,
    organizer: { id: event.seller_id, name: "Organizer", logo: "", verified: true, tier: "gold" as const },
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  });

  return (
    <Layout>
      <div className="min-h-screen pt-20">
        {/* Hero Search Section */}
        <section className="relative py-16 bg-gradient-dark overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center mb-8"
            >
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Discover <span className="gradient-text">Amazing Events</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Find concerts, parties, festivals and more happening near you
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSearch}
              className="max-w-4xl mx-auto"
            >
              <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-2xl border border-border">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search events, artists, venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-background border-border"
                  />
                </div>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full md:w-48 h-12">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" size="lg" className="h-12 px-8">
                  Search
                </Button>
              </div>
            </motion.form>
          </div>
        </section>

        {/* Trending Section */}
        {trendingEvents && trendingEvents.length > 0 && (
          <section className="py-12 container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="font-display text-xl font-bold">Trending Now</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {trendingEvents.map((event: any) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="flex-shrink-0 flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors min-w-[300px]"
                >
                  <img
                    src={event.cover_image || "/placeholder.svg"}
                    alt={event.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium line-clamp-1">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.venues?.city}</p>
                  </div>
                  <Badge variant="hot" className="ml-auto">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Hot
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Results */}
        <section className="container mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {isLoading ? "Loading..." : `${filteredEvents?.length || 0} events found`}
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEvents.map((event: any, index: number) => (
                <EventCard key={event.id} event={transformEvent(event)} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

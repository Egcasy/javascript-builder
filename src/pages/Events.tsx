import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  SlidersHorizontal, 
  Calendar,
  MapPin,
  X,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { EventCard } from "@/components/events/EventCard";
import { cn } from "@/lib/utils";
import { useEvents } from "@/hooks/useEvents";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const selectedCategory = searchParams.get("category") || "all";
  const selectedCity = searchParams.get("city") || "";

  const { data: categoryOptions = [] } = useQuery({
    queryKey: ["event-categories"],
    queryFn: async () => {
      const snapshot = await getDocs(query(collection(db, "event_categories"), orderBy("order", "asc")));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as { label: string }) }));
    },
  });

  const { data: allEvents = [] } = useEvents();

  const cities = Array.from(
    new Set(allEvents.map((event) => event.venue.city).filter(Boolean))
  ).sort();

  const categories = [
    { id: "all", label: "All Events" },
    ...categoryOptions.map((category) => ({ id: category.id, label: category.label })),
  ];

  const { data: filteredEvents = [], isLoading } = useEvents({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    city: selectedCity || undefined,
    search: searchQuery || undefined,
  });

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId === "all") {
      params.delete("category");
    } else {
      params.set("category", categoryId);
    }
    setSearchParams(params);
  };

  const handleCityChange = (city: string) => {
    const params = new URLSearchParams(searchParams);
    if (city === selectedCity) {
      params.delete("city");
    } else {
      params.set("city", city);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery("");
  };

  const hasActiveFilters = selectedCategory !== "all" || selectedCity || searchQuery;

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-hero border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Discover Events
            </h1>
            <p className="text-lg text-muted-foreground">
              Find and book tickets to the hottest events in Nigeria
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8"
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search events, venues, artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-5 w-5" />
                <span className="hidden md:inline">Filters</span>
              </Button>
            </div>
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar"
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                )}
              >
                {category.label}
              </button>
            ))}
          </motion.div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-6 rounded-xl bg-card border border-border"
            >
              <div className="grid md:grid-cols-3 gap-6">
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    City
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleCityChange(city)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm transition-all",
                          selectedCity === city
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Filter Placeholder */}
                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Range
                  </label>
                  <Button variant="outline" className="w-full justify-between">
                    Any Date
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-12">
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {categories.find((c) => c.id === selectedCategory)?.label}
                <button onClick={() => handleCategoryChange("all")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCity && (
              <Badge variant="secondary" className="gap-1">
                {selectedCity}
                <button onClick={() => handleCityChange(selectedCity)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                "{searchQuery}"
                <button onClick={() => setSearchQuery("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground">
            Showing <span className="text-foreground font-semibold">{filteredEvents.length}</span> events
          </p>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

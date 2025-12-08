import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Flame, Star, Ticket as TicketIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Event } from "@/types";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  index?: number;
  variant?: "default" | "featured" | "compact";
}

export function EventCard({ event, index = 0, variant = "default" }: EventCardProps) {
  const lowestPrice = Math.min(...event.ticketTypes.map(t => t.price));
  const soldPercentage = (event.soldTickets / event.totalTickets) * 100;
  const isAlmostSoldOut = soldPercentage > 80;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-NG", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
      >
        <Link to={`/events/${event.id}`} className="block group">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border card-hover">
            {/* Image */}
            <div className="relative aspect-[16/9] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-hero flex items-center justify-center">
                <TicketIcon className="h-20 w-20 text-muted-foreground/20" />
              </div>
              
              {/* Badges */}
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                {event.isHot && (
                  <Badge variant="hot" className="gap-1">
                    <Flame className="h-3 w-3" />
                    Hot
                  </Badge>
                )}
                {event.isFeatured && (
                  <Badge variant="featured" className="gap-1">
                    <Star className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
                {isAlmostSoldOut && (
                  <Badge variant="limited">Almost Sold Out</Badge>
                )}
              </div>

              {/* Date overlay */}
              <div className="absolute top-4 right-4 z-20 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-center min-w-[60px]">
                <div className="text-xs text-muted-foreground uppercase">
                  {new Date(event.date).toLocaleDateString("en-NG", { month: "short" })}
                </div>
                <div className="text-2xl font-display font-bold text-primary">
                  {new Date(event.date).getDate()}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {event.shortDescription}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {event.venue.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {event.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {event.totalTickets - event.soldTickets} left
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${soldPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {Math.round(soldPercentage)}% sold
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">From</span>
                  <p className="text-xl font-display font-bold text-primary">
                    {formatPrice(lowestPrice)}
                  </p>
                </div>
                <Button variant="hero" size="sm">
                  Get Tickets
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/events/${event.id}`} className="block group">
        <div className="relative overflow-hidden rounded-xl bg-card border border-border card-hover">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-hero flex items-center justify-center">
              <TicketIcon className="h-12 w-12 text-muted-foreground/20" />
            </div>
            
            {/* Badges */}
            <div className="absolute top-3 left-3 z-20 flex gap-1.5">
              {event.isHot && (
                <Badge variant="hot" className="gap-1 text-xs">
                  <Flame className="h-3 w-3" />
                  Hot
                </Badge>
              )}
              {isAlmostSoldOut && (
                <Badge variant="limited" className="text-xs">Limited</Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(event.date)} • {event.time}
            </div>

            <h3 className="font-display font-semibold group-hover:text-primary transition-colors line-clamp-1 mb-1">
              {event.title}
            </h3>

            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
              <MapPin className="h-3.5 w-3.5" />
              {event.venue.name}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-lg font-display font-bold text-primary">
                {formatPrice(lowestPrice)}
              </span>
              <span className="text-xs text-muted-foreground">
                {event.totalTickets - event.soldTickets} left
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

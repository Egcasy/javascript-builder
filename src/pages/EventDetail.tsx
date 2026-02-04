import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Share2, 
  Heart, 
  ChevronRight,
  Minus,
  Plus,
  Shield,
  Ticket,
  CheckCircle,
  Star,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { EventCard } from "@/components/events/EventCard";
import { TicketType } from "@/types";
import { toast } from "sonner";
import { useEvent, useEvents } from "@/hooks/useEvents";
import { useCart } from "@/contexts/CartContext";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(id || "");
  const { data: relatedEvents = [] } = useEvents();
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [isLiked, setIsLiked] = useState(false);
  const { addToCart } = useCart();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          Loading event details...
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Link to="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const updateQuantity = (ticketId: string, delta: number, max: number) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const newVal = Math.max(0, Math.min(max, current + delta));
      if (newVal === 0) {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticketId]: newVal };
    });
  };

  const getTotalPrice = () => {
    return Object.entries(selectedTickets).reduce((sum, [ticketId, qty]) => {
      const ticket = event.ticketTypes.find((t) => t.id === ticketId);
      return sum + (ticket?.price || 0) * qty;
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCheckout = async () => {
    if (getTotalTickets() === 0) {
      toast.error("Please select at least one ticket");
      return;
    }
    const ticketSelections = Object.entries(selectedTickets);
    for (const [ticketId, qty] of ticketSelections) {
      if (qty > 0) {
        await addToCart(ticketId, qty);
      }
    }
    toast.success("Tickets added to your cart");
    navigate("/cart");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const soldPercentage = (event.soldTickets / event.totalTickets) * 100;
  const related = relatedEvents.filter((e) => e.id !== event.id).slice(0, 3);

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/events" className="hover:text-foreground transition-colors">Events</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground truncate max-w-[200px]">{event.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-hero"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Ticket className="h-24 w-24 text-muted-foreground/20" />
              </div>
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {event.isHot && <Badge variant="hot">🔥 Hot</Badge>}
                {event.isFeatured && <Badge variant="featured">⭐ Featured</Badge>}
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-primary text-primary" : ""}`} />
                </Button>
                <Button variant="glass" size="icon" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            {/* Event Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="capitalize">
                  {event.category.replace("-", " ")}
                </Badge>
                {event.ageRestriction && (
                  <Badge variant="warning">{event.ageRestriction}+ Only</Badge>
                )}
                {event.dressCode && (
                  <Badge variant="outline">{event.dressCode}</Badge>
                )}
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-muted-foreground mb-6">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {formatDate(event.date)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {event.time} - {event.endTime}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {event.totalTickets - event.soldTickets} tickets left
                </span>
              </div>

              <div className="flex items-start gap-2 p-4 rounded-xl bg-card border border-border mb-6">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">{event.venue.name}</p>
                  <p className="text-sm text-muted-foreground">{event.venue.address}, {event.venue.city}</p>
                </div>
              </div>

              {/* Organizer */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">
                    {event.organizer.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{event.organizer.name}</p>
                    {event.organizer.verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {event.organizer.tier} Seller
                  </p>
                </div>
                <Badge variant="featured" className="capitalize">
                  {event.organizer.tier}
                </Badge>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="prose prose-invert max-w-none"
            >
              <h2 className="font-display text-2xl font-bold mb-4">About This Event</h2>
              <p className="text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </motion.div>

            {/* Artists */}
            {event.artists && event.artists.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="font-display text-2xl font-bold mb-4">Featured Artists</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.artists.map((artist) => (
                    <div
                      key={artist.id}
                      className="p-4 rounded-xl bg-card border border-border text-center"
                    >
                      <div className="h-16 w-16 rounded-full bg-gradient-accent mx-auto mb-3 flex items-center justify-center">
                        <Star className="h-8 w-8 text-accent-foreground" />
                      </div>
                      <p className="font-semibold">{artist.name}</p>
                      <p className="text-sm text-muted-foreground">{artist.role}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Ticket Selection */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 space-y-6"
            >
              {/* Ticket Card */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-display text-xl font-bold mb-4">Select Tickets</h3>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Availability</span>
                    <span className="text-primary font-medium">{Math.round(soldPercentage)}% sold</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full"
                      style={{ width: `${soldPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Ticket Types */}
                <div className="space-y-4 mb-6">
                  {event.ticketTypes.map((ticket) => (
                    <TicketSelector
                      key={ticket.id}
                      ticket={ticket}
                      quantity={selectedTickets[ticket.id] || 0}
                      onUpdate={(delta) => updateQuantity(ticket.id, delta, ticket.available - ticket.sold)}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">
                      {getTotalTickets()} ticket{getTotalTickets() !== 1 ? "s" : ""}
                    </span>
                    <span className="font-display text-2xl font-bold text-primary">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={getTotalTickets() === 0}
                >
                  {getTotalTickets() === 0 ? "Select Tickets" : "Proceed to Checkout"}
                </Button>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Shield className="h-4 w-4 text-success" />
                    Secure checkout with Paystack
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Instant QR-code delivery
                  </div>
                </div>
              </div>

              {/* Warning */}
              {soldPercentage > 80 && (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-semibold text-warning">Almost Sold Out!</p>
                    <p className="text-sm text-muted-foreground">
                      Only {event.totalTickets - event.soldTickets} tickets remaining
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Related Events */}
        <section className="mt-16 pt-16 border-t border-border">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
            You Might Also Like
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

interface TicketSelectorProps {
  ticket: TicketType;
  quantity: number;
  onUpdate: (delta: number) => void;
  formatPrice: (price: number) => string;
}

function TicketSelector({ ticket, quantity, onUpdate, formatPrice }: TicketSelectorProps) {
  const available = ticket.available - ticket.sold;
  const isSoldOut = available === 0;

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      quantity > 0 
        ? "bg-primary/5 border-primary/30" 
        : "bg-card border-border"
    } ${isSoldOut ? "opacity-50" : ""}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{ticket.name}</h4>
            {ticket.isEarlyBird && (
              <Badge variant="earlyBird" className="text-xs">Early Bird</Badge>
            )}
          </div>
          {ticket.description && (
            <p className="text-sm text-muted-foreground">{ticket.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-primary">
            {formatPrice(ticket.price)}
          </p>
          {ticket.originalPrice && (
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(ticket.originalPrice)}
            </p>
          )}
        </div>
      </div>

      {ticket.benefits && (
        <ul className="text-xs text-muted-foreground space-y-1 mb-3">
          {ticket.benefits.slice(0, 3).map((benefit, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-success" />
              {benefit}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {isSoldOut ? "Sold Out" : `${available} available`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdate(-1)}
            disabled={quantity === 0 || isSoldOut}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-semibold">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdate(1)}
            disabled={quantity >= Math.min(available, ticket.maxPerOrder) || isSoldOut}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

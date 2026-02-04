import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap, 
  Users, 
  Star,
  Play,
  Search,
  BadgeCheck,
  CreditCard,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import { EventCard } from "@/components/events/EventCard";
import { useEvents, useFeaturedEvents } from "@/hooks/useEvents";
import { useQuery } from "@tanstack/react-query";
import heroBg from "@/assets/hero-bg.jpg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

const iconMap = {
  search: Search,
  card: CreditCard,
  badge: BadgeCheck,
  phone: Smartphone,
  shield: Shield,
  zap: Zap,
  users: Users,
};

export default function Index() {
  const { data: featuredEvents = [] } = useFeaturedEvents();
  const { data: upcomingEvents = [] } = useEvents();
  const { data: features = [] } = useQuery({
    queryKey: ["homepage-features"],
    queryFn: async () => {
      const snapshot = await getDocs(query(collection(db, "homepage_features"), orderBy("order", "asc")));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as { title: string; description: string; icon: keyof typeof iconMap }) }));
    },
  });
  const { data: stats = [] } = useQuery({
    queryKey: ["homepage-stats"],
    queryFn: async () => {
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const sellersSnapshot = await getDocs(query(collection(db, "sellers"), where("verified", "==", true)));
      const reviewsSnapshot = await getDocs(collection(db, "event_reviews"));

      const totalEvents = eventsSnapshot.size;
      const totalTickets = eventsSnapshot.docs.reduce(
        (sum, docSnap) => sum + Number(docSnap.data().sold_tickets || 0),
        0
      );
      const verifiedSellers = sellersSnapshot.size;
      const averageRating =
        reviewsSnapshot.size > 0
          ? reviewsSnapshot.docs.reduce((sum, docSnap) => sum + Number(docSnap.data().rating || 0), 0) /
            reviewsSnapshot.size
          : 0;
      const satisfactionRate = Math.round((averageRating / 5) * 100);

      return [
        { value: totalEvents.toLocaleString(), label: "Events Hosted" },
        { value: totalTickets.toLocaleString(), label: "Tickets Sold" },
        { value: verifiedSellers.toLocaleString(), label: "Verified Sellers" },
        { value: `${satisfactionRate}%`, label: "Satisfaction Rate" },
      ];
    },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["homepage-categories"],
    queryFn: async () => {
      const categorySnapshot = await getDocs(query(collection(db, "event_categories"), orderBy("order", "asc")));
      return categorySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as { label: string; emoji: string }) }));
    },
  });
  const categoryCounts = upcomingEvents.reduce<Record<string, number>>((acc, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1;
    return acc;
  }, {});
  const { data: howItWorks = [] } = useQuery({
    queryKey: ["homepage-how-it-works"],
    queryFn: async () => {
      const snapshot = await getDocs(query(collection(db, "homepage_how_it_works"), orderBy("order", "asc")));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as { title: string; description: string; icon: keyof typeof iconMap }) }));
    },
  });
  const { data: trustBadges = [] } = useQuery({
    queryKey: ["homepage-trust-badges"],
    queryFn: async () => {
      const snapshot = await getDocs(query(collection(db, "homepage_trust_badges"), orderBy("order", "asc")));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as { label: string; detail: string; icon: keyof typeof iconMap }) }));
    },
  });
  const { data: testimonials = [] } = useQuery({
    queryKey: ["homepage-testimonials"],
    queryFn: async () => {
      const snapshot = await getDocs(query(collection(db, "homepage_testimonials"), orderBy("order", "asc")));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as { name: string; role: string; quote: string }) }));
    },
  });
  const { data: partners = [] } = useQuery({
    queryKey: ["homepage-partners"],
    queryFn: async () => {
      const snapshot = await getDocs(query(collection(db, "homepage_partners"), orderBy("order", "asc")));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as { name: string }) }));
    },
  });
  const { data: faqs = [] } = useQuery({
    queryKey: ["homepage-faqs"],
    queryFn: async () => {
      const snapshot = await getDocs(query(collection(db, "homepage_faqs"), orderBy("order", "asc")));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as { question: string; answer: string }) }));
    },
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={heroBg} 
            alt="Nightclub atmosphere" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/50" />
        </div>

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="hot" className="mb-6 gap-2 py-1.5 px-4">
                <Sparkles className="h-3.5 w-3.5" />
                Nigeria's Premier Ticket Marketplace
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            >
              Experience Events
              <br />
              <span className="gradient-text">Like Never Before</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8"
            >
              Discover, book, and secure tickets to the hottest parties, concerts, and 
              festivals. Verified sellers only. Instant QR-code delivery.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/events">
                <Button variant="hero" size="xl" className="gap-2 w-full sm:w-auto">
                  Explore Events
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="glass" size="xl" className="gap-2">
                <Play className="h-5 w-5" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-8 border-t border-border/50"
            >
              {stats.map((stat, index) => (
                <div key={index}>
                  <p className="font-display text-2xl md:text-3xl font-bold text-primary">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-gradient-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Explore By Category
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Find the perfect event for any night of the week
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Link
                  to={`/events?category=${category.id}`}
                  className="block p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-card-elevated transition-all duration-300 text-center group"
                >
                  {category.emoji ? (
                    <span className="text-3xl mb-3 block">{category.emoji}</span>
                  ) : null}
                  <h3 className="font-display font-semibold group-hover:text-primary transition-colors mb-1">
                    {category.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {(categoryCounts[category.id] || 0).toLocaleString()} events
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge variant="featured" className="mb-3">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                This Week's Hottest Events
              </h2>
            </div>
            <Link to="/events" className="hidden md:block">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.slice(0, 3).map((event, index) => (
              <EventCard key={event.id} event={event} index={index} variant="featured" />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link to="/events">
              <Button variant="outline" className="gap-2">
                View All Events
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* All Events Grid */}
      <section className="py-16 md:py-24 bg-gradient-dark">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Upcoming Events
              </h2>
              <p className="text-muted-foreground">
                Don't miss out on these amazing experiences
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {upcomingEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why Choose TixHub?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The most trusted platform for event tickets in Nigeria
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const FeatureIcon = iconMap[feature.icon] || Shield;
              return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-card border border-border text-center group hover:border-primary/50 transition-all"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <FeatureIcon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );})}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-gradient-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              Simple & Fast
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Book in Three Easy Steps
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From discovery to entry, TixHub keeps every step friction-free.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((step) => {
              const StepIcon = iconMap[step.icon] || Search;
              return (
              <div
                key={step.id}
                className="p-6 rounded-2xl bg-card border border-border text-center hover:border-primary/50 transition-all"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <StepIcon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* Trust & Partnerships */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              Trusted Nationwide
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Payments, Partners, and Protection You Can Count On
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From secure payments to verified sellers, TixHub keeps your night out seamless and safe.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {trustBadges.map((badge) => {
              const BadgeIcon = iconMap[badge.icon] || Shield;
              return (
              <div
                key={badge.id}
                className="p-6 rounded-2xl bg-card border border-border text-center hover:border-primary/50 transition-all"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <BadgeIcon className="h-6 w-6" />
                </div>
                <p className="font-display text-lg font-semibold mb-2">{badge.label}</p>
                <p className="text-sm text-muted-foreground">{badge.detail}</p>
              </div>
            );})}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center text-center text-sm text-muted-foreground">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="py-4 px-3 rounded-xl border border-dashed border-border bg-card/40"
              >
                {partner.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <Badge variant="featured" className="mb-3">
                <Star className="h-3 w-3 mr-1" />
                Loved by the Community
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Real Stories From Real Event‑Goers
              </h2>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Thousands of people use TixHub every weekend to discover new experiences, and they keep
              coming back.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all"
              >
                <p className="text-muted-foreground mb-6">“{testimonial.quote}”</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download CTA */}
      <section className="py-16 md:py-24 bg-gradient-dark">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center rounded-3xl border border-border bg-gradient-card p-8 md:p-12">
            <div>
              <Badge variant="secondary" className="mb-4">
                Coming Soon
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Take TixHub With You
              </h2>
              <p className="text-muted-foreground mb-6">
                Join the waitlist for the TixHub mobile app and get early access to exclusive drops,
                instant notifications, and personalized event alerts.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="you@email.com"
                  className="h-12 bg-background"
                />
                <Button variant="hero" size="lg" className="gap-2">
                  Join App Waitlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                No spam. Early access alerts only.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {["Smart alerts", "1‑tap checkout", "Offline tickets", "VIP drops"].map((perk) => (
                <div key={perk} className="p-4 rounded-2xl bg-card border border-border">
                  <p className="font-semibold mb-1">{perk}</p>
                  <p className="text-sm text-muted-foreground">Built for busy nights out.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              Quick Answers
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know before you book your next event.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border border-border rounded-2xl bg-card px-4"
                >
                  <AccordionTrigger className="font-display text-left text-lg font-semibold">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-dark">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-card border border-border p-8 md:p-16">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
            
            <div className="relative max-w-2xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                Ready to Experience the Best Events?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of event-goers who trust TixHub for secure, instant ticket purchases.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button variant="hero" size="xl" className="gap-2 w-full sm:w-auto">
                    <Sparkles className="h-5 w-5" />
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/seller/apply">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    Become a Seller
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

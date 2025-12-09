import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard,
  Calendar,
  Ticket,
  TrendingUp,
  DollarSign,
  Users,
  Plus,
  ArrowRight,
  Eye,
  Edit,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SellerDashboard() {
  const { user, isSeller } = useAuth();
  const navigate = useNavigate();

  // Fetch seller profile
  const { data: seller } = useQuery({
    queryKey: ['seller', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  // Fetch seller's events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['seller-events', seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      const { data } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          ticket_types(*)
        `)
        .eq('seller_id', seller.id)
        .order('date', { ascending: true });
      return data || [];
    },
    enabled: !!seller
  });

  // Fetch sales stats
  const { data: salesStats } = useQuery({
    queryKey: ['seller-stats', seller?.id],
    queryFn: async () => {
      if (!seller || !events) return { totalSales: 0, totalRevenue: 0, totalTickets: 0 };
      
      const eventIds = events.map(e => e.id);
      if (eventIds.length === 0) return { totalSales: 0, totalRevenue: 0, totalTickets: 0 };
      
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .in('event_id', eventIds)
        .eq('status', 'completed');

      const { count: ticketCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('order_id', (await supabase.from('orders').select('id').in('event_id', eventIds)).data?.map(o => o.id) || []);

      return {
        totalSales: orders?.length || 0,
        totalRevenue: orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
        totalTickets: ticketCount || 0
      };
    },
    enabled: !!seller && !!events
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!isSeller) {
    navigate('/seller/apply');
    return null;
  }

  const stats = [
    { 
      label: "Total Revenue", 
      value: formatPrice(salesStats?.totalRevenue || 0), 
      icon: DollarSign,
      color: "text-success"
    },
    { 
      label: "Total Sales", 
      value: salesStats?.totalSales || 0, 
      icon: TrendingUp,
      color: "text-primary"
    },
    { 
      label: "Tickets Sold", 
      value: salesStats?.totalTickets || 0, 
      icon: Ticket,
      color: "text-accent"
    },
    { 
      label: "Active Events", 
      value: events?.filter(e => e.status === 'active').length || 0, 
      icon: Calendar,
      color: "text-warning"
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Seller Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {seller?.business_name}
              </p>
            </div>
            <Link to="/seller/events/new" className="mt-4 md:mt-0">
              <Button variant="hero" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 md:p-6"
              >
                <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg bg-muted mb-3 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="font-display text-2xl md:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Events Section */}
          <div className="bg-card border border-border rounded-xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Your Events</h2>
              <Link to="/seller/events">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {eventsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading events...</div>
            ) : events?.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first event to start selling tickets
                </p>
                <Link to="/seller/events/new">
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events?.slice(0, 5).map((event) => (
                  <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                    {/* Event Image */}
                    <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {event.cover_image ? (
                        <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.date), 'MMM d, yyyy')} • {event.venue?.name || 'TBA'}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                      {event.status}
                    </Badge>

                    {/* Tickets Sold */}
                    <div className="hidden md:block text-right">
                      <p className="font-semibold">{event.sold_tickets} / {event.total_tickets}</p>
                      <p className="text-xs text-muted-foreground">tickets sold</p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/events/${event.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/seller/events/${event.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

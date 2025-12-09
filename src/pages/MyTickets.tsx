import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock,
  Download,
  QrCode,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

interface TicketWithDetails {
  id: string;
  qr_code: string;
  status: string;
  checked_in_at: string | null;
  created_at: string;
  ticket_type: {
    name: string;
    price: number;
    event: {
      id: string;
      title: string;
      cover_image: string | null;
      date: string;
      start_time: string;
      venue: {
        name: string;
        city: string;
      } | null;
    };
  };
}

export default function MyTickets() {
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          qr_code,
          status,
          checked_in_at,
          created_at,
          ticket_types (
            name,
            price,
            events (
              id,
              title,
              cover_image,
              date,
              start_time,
              venues (
                name,
                city
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((ticket: any) => ({
        id: ticket.id,
        qr_code: ticket.qr_code,
        status: ticket.status,
        checked_in_at: ticket.checked_in_at,
        created_at: ticket.created_at,
        ticket_type: {
          name: ticket.ticket_types?.name,
          price: ticket.ticket_types?.price,
          event: {
            id: ticket.ticket_types?.events?.id,
            title: ticket.ticket_types?.events?.title,
            cover_image: ticket.ticket_types?.events?.cover_image,
            date: ticket.ticket_types?.events?.date,
            start_time: ticket.ticket_types?.events?.start_time,
            venue: ticket.ticket_types?.events?.venues
          }
        }
      })) as TicketWithDetails[];
    },
    enabled: !!user
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Sign in to view your tickets</h2>
            <p className="text-muted-foreground mb-6">
              Access your purchased tickets and QR codes.
            </p>
            <Link to="/login">
              <Button variant="hero" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">My Tickets</h1>
          <p className="text-muted-foreground mb-8">
            {tickets?.length || 0} tickets purchased
          </p>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-muted-foreground">Loading tickets...</div>
            </div>
          ) : tickets?.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">No tickets yet</h2>
              <p className="text-muted-foreground mb-6">
                Browse events and purchase your first ticket!
              </p>
              <Link to="/events">
                <Button variant="hero" size="lg">Browse Events</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tickets?.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/50 transition-all"
                >
                  {/* Event Image */}
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {ticket.ticket_type.event.cover_image ? (
                      <img 
                        src={ticket.ticket_type.event.cover_image}
                        alt={ticket.ticket_type.event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Ticket className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    <Badge 
                      className="absolute top-3 right-3"
                      variant={ticket.status === 'valid' ? 'default' : 'secondary'}
                    >
                      {ticket.status === 'valid' ? 'Valid' : ticket.status === 'used' ? 'Used' : ticket.status}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <h3 className="font-display font-semibold mb-1 truncate">
                      {ticket.ticket_type.event.title}
                    </h3>
                    <p className="text-sm text-primary font-medium mb-3">
                      {ticket.ticket_type.name}
                    </p>

                    <div className="space-y-1 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(ticket.ticket_type.event.date), 'EEEE, MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{ticket.ticket_type.event.start_time}</span>
                      </div>
                      {ticket.ticket_type.event.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{ticket.ticket_type.event.venue.name}, {ticket.ticket_type.event.venue.city}</span>
                        </div>
                      )}
                    </div>

                    {ticket.status === 'used' && ticket.checked_in_at && (
                      <div className="flex items-center gap-2 text-success text-sm mb-4">
                        <CheckCircle2 className="h-4 w-4" />
                        Checked in at {format(new Date(ticket.checked_in_at), 'h:mm a')}
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <QrCode className="h-4 w-4" />
                      View QR Code
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Your Ticket</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="text-center">
              <div className="bg-foreground p-4 rounded-xl inline-block mb-4">
                <QRCodeSVG 
                  value={selectedTicket.qr_code}
                  size={200}
                  level="H"
                />
              </div>
              
              <h3 className="font-display font-semibold text-lg mb-1">
                {selectedTicket.ticket_type.event.title}
              </h3>
              <p className="text-primary font-medium mb-4">
                {selectedTicket.ticket_type.name}
              </p>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{format(new Date(selectedTicket.ticket_type.event.date), 'EEEE, MMMM d, yyyy')}</p>
                <p>{selectedTicket.ticket_type.event.start_time}</p>
              </div>

              <p className="text-xs text-muted-foreground mt-4 font-mono">
                {selectedTicket.qr_code}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar,
  Clock,
  MapPin,
  Image,
  Tag,
  Ticket,
  Plus,
  Trash2,
  Loader2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

interface TicketTypeForm {
  name: string;
  description: string;
  price: string;
  quantity: string;
  maxPerOrder: string;
  benefits: string;
}

const categories = [
  { value: 'friday-night', label: 'Friday Night' },
  { value: 'saturday-vibes', label: 'Saturday Vibes' },
  { value: 'sunday-groove', label: 'Sunday Groove' },
  { value: 'beach-party', label: 'Beach Party' },
  { value: 'pool-party', label: 'Pool Party' },
  { value: 'club-event', label: 'Club Event' },
  { value: 'concert', label: 'Concert' },
  { value: 'festival', label: 'Festival' },
];

export default function CreateEvent() {
  const { user, isSeller } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    coverImage: '',
    date: '',
    startTime: '',
    endTime: '',
    category: '',
    tags: '',
    ageRestriction: '',
    dressCode: '',
    isFeatured: false,
    isHot: false,
    venueId: '',
    newVenue: {
      name: '',
      address: '',
      city: ''
    }
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
    { name: 'General Admission', description: '', price: '', quantity: '', maxPerOrder: '10', benefits: '' }
  ]);

  // Fetch seller
  const { data: seller } = useQuery({
    queryKey: ['seller', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const sellerSnap = await getDoc(doc(db, "sellers", user.uid));
      return sellerSnap.exists() ? { id: sellerSnap.id, ...(sellerSnap.data() as { business_name?: string; logo_url?: string; tier?: string; verified?: boolean; }) } : null;
    },
    enabled: !!user
  });

  // Fetch existing venues
  const { data: venues } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const venueSnapshot = await getDocs(query(collection(db, "venues"), orderBy("name")));
      return venueSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as { name: string; address?: string; city?: string; }) }));
    }
  });

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', description: '', price: '', quantity: '', maxPerOrder: '10', benefits: '' }]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    }
  };

  const updateTicketType = (index: number, field: keyof TicketTypeForm, value: string) => {
    const updated = [...ticketTypes];
    updated[index][field] = value;
    setTicketTypes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !seller) {
      toast({ title: "Error", description: "Seller account required", variant: "destructive" });
      return;
    }

    if (!formData.title || !formData.date || !formData.startTime || !formData.category) {
      toast({ title: "Missing fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const validTickets = ticketTypes.filter(t => t.name && t.price && t.quantity);
    if (validTickets.length === 0) {
      toast({ title: "No tickets", description: "Add at least one ticket type", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Create venue if new
      let venueId = formData.venueId || null;
      let venueData = {
        name: "",
        address: "",
        city: "",
      };

      if (!venueId && formData.newVenue.name) {
        const newVenueRef = await addDoc(collection(db, "venues"), {
          name: formData.newVenue.name.trim(),
          address: formData.newVenue.address.trim(),
          city: formData.newVenue.city.trim(),
          created_at: serverTimestamp(),
        });
        venueId = newVenueRef.id;
        venueData = {
          name: formData.newVenue.name.trim(),
          address: formData.newVenue.address.trim(),
          city: formData.newVenue.city.trim(),
        };
      } else if (venueId && venues) {
        const existingVenue = venues.find((venue) => venue.id === venueId);
        venueData = {
          name: existingVenue?.name ?? "",
          address: existingVenue?.address ?? "",
          city: existingVenue?.city ?? "",
        };
      }

      const totalTickets = validTickets.reduce((sum, t) => sum + parseInt(t.quantity, 10), 0);
      const ticketTypesData = validTickets.map((ticket) => ({
        id: crypto.randomUUID(),
        name: ticket.name,
        description: ticket.description || "",
        price: parseFloat(ticket.price),
        quantity: parseInt(ticket.quantity, 10),
        sold: 0,
        max_per_order: parseInt(ticket.maxPerOrder, 10) || 10,
        benefits: ticket.benefits ? ticket.benefits.split(",").map((b) => b.trim()) : [],
      }));

      await addDoc(collection(db, "events"), {
        seller_id: seller.id,
        organizer: {
          id: seller.id,
          name: seller.business_name || "Organizer",
          logo: seller.logo_url || "",
          verified: Boolean(seller.verified),
          tier: seller.tier || "gold",
        },
        venue_id: venueId,
        venue: venueData,
        title: formData.title.trim(),
        description: formData.description || "",
        short_description: formData.shortDescription || "",
        cover_image: formData.coverImage || "",
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime || "",
        category: formData.category,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
        age_restriction: formData.ageRestriction ? parseInt(formData.ageRestriction, 10) : null,
        dress_code: formData.dressCode || "",
        is_featured: formData.isFeatured,
        is_hot: formData.isHot,
        total_tickets: totalTickets,
        sold_tickets: 0,
        ticket_types: ticketTypesData,
        ticket_type_ids: ticketTypesData.map((ticket) => ticket.id),
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      toast({ title: "Event created!", description: "Your event is now live" });
      navigate("/seller/dashboard");
    } catch (error) {
      console.error('Error creating event:', error);
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isSeller) {
    navigate('/seller/apply');
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Create Event</h1>
          <p className="text-muted-foreground mb-8">Fill in the details to list your event</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Neon Nights: Lagos After Dark"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    placeholder="Brief tagline for your event"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your event in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                  />
                </div>

                <div>
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="nightlife, premium, dj"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date & Time
              </h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Venue */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Venue
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Select Existing Venue</Label>
                  <Select value={formData.venueId} onValueChange={(v) => setFormData({ ...formData, venueId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a venue or add new below" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues?.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name} - {venue.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-center text-sm text-muted-foreground">or add a new venue</div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Venue Name</Label>
                    <Input
                      placeholder="e.g., Sky Lounge Lagos"
                      value={formData.newVenue.name}
                      onChange={(e) => setFormData({ ...formData, newVenue: { ...formData.newVenue, name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      placeholder="15 Admiralty Way"
                      value={formData.newVenue.address}
                      onChange={(e) => setFormData({ ...formData, newVenue: { ...formData.newVenue, address: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      placeholder="Lagos"
                      value={formData.newVenue.city}
                      onChange={(e) => setFormData({ ...formData, newVenue: { ...formData.newVenue, city: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Types */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Ticket Types
                </h2>
                <Button type="button" variant="outline" size="sm" onClick={addTicketType} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Type
                </Button>
              </div>
              
              <div className="space-y-6">
                {ticketTypes.map((ticket, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Ticket Type {index + 1}</span>
                      {ticketTypes.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTicketType(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          placeholder="e.g., VIP"
                          value={ticket.name}
                          onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          placeholder="Brief description"
                          value={ticket.description}
                          onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Price (₦) *</Label>
                        <Input
                          type="number"
                          placeholder="25000"
                          value={ticket.price}
                          onChange={(e) => updateTicketType(index, 'price', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={ticket.quantity}
                          onChange={(e) => updateTicketType(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Max Per Order</Label>
                        <Input
                          type="number"
                          placeholder="10"
                          value={ticket.maxPerOrder}
                          onChange={(e) => updateTicketType(index, 'maxPerOrder', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Benefits (comma-separated)</Label>
                        <Input
                          placeholder="VIP access, Free drink"
                          value={ticket.benefits}
                          onChange={(e) => updateTicketType(index, 'benefits', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Additional Options</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="ageRestriction">Age Restriction</Label>
                  <Input
                    id="ageRestriction"
                    type="number"
                    placeholder="21"
                    value={formData.ageRestriction}
                    onChange={(e) => setFormData({ ...formData, ageRestriction: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dressCode">Dress Code</Label>
                  <Input
                    id="dressCode"
                    placeholder="Smart Casual"
                    value={formData.dressCode}
                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(v) => setFormData({ ...formData, isFeatured: v })}
                  />
                  <Label>Featured Event</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isHot}
                    onCheckedChange={(v) => setFormData({ ...formData, isHot: v })}
                  />
                  <Label>Hot Event</Label>
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" variant="hero" size="xl" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Event...
                </>
              ) : (
                <>
                  Create Event
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}

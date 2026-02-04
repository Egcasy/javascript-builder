import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Users, Ticket, DollarSign, Calendar, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell } from "recharts";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22c55e", "#eab308", "#ef4444"];

export default function SellerAnalytics() {
  const navigate = useNavigate();
  const { user, isSeller } = useAuth();

  // Fetch seller data
  const { data: seller } = useQuery({
    queryKey: ["seller", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const sellerSnap = await getDoc(doc(db, "sellers", user.uid));
      return sellerSnap.exists() ? { id: sellerSnap.id, ...(sellerSnap.data() as any) } : null;
    },
    enabled: !!user,
  });

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["seller-analytics", seller?.id],
    queryFn: async () => {
      if (!seller) return null;

      const eventsSnapshot = await getDocs(
        query(collection(db, "events"), where("seller_id", "==", seller.id))
      );
      const events = eventsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));

      const eventIds = events?.map((e) => e.id) || [];

      const ordersSnapshot = await getDocs(
        query(collection(db, "orders"), where("event_id", "in", eventIds), where("status", "==", "completed"))
      );
      const orders = ordersSnapshot.docs.map((docSnap) => docSnap.data());

      // Calculate stats
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const totalTicketsSold = events?.reduce((sum, e) => sum + (e.sold_tickets || 0), 0) || 0;
      const totalEvents = events?.length || 0;
      const activeEvents = events?.filter((e) => e.status === "active").length || 0;

      // Sales by day (last 7 days)
      const salesByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayOrders = orders?.filter((o) => o.created_at.startsWith(dateStr)) || [];
        salesByDay.push({
          date: date.toLocaleDateString("en-US", { weekday: "short" }),
          sales: dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
          tickets: dayOrders.length,
        });
      }

      // Sales by event category
      const categoryMap: Record<string, number> = {};
      events?.forEach((event) => {
        const cat = event.category || "other";
        const eventOrders = orders?.filter((o) => o.event_id === event.id) || [];
        categoryMap[cat] = (categoryMap[cat] || 0) + eventOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      });
      const salesByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

      // Top events
      const topEvents = events
        ?.map((e) => ({
          name: e.title,
          tickets: e.sold_tickets || 0,
          revenue: orders?.filter((o) => o.event_id === e.id).reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        totalRevenue,
        totalTicketsSold,
        totalEvents,
        activeEvents,
        salesByDay,
        salesByCategory,
        topEvents,
      };
    },
    enabled: !!seller,
  });

  if (!user || !isSeller) {
    navigate("/seller/apply");
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(price);
  };

  const stats = [
    {
      title: "Total Revenue",
      value: formatPrice(analytics?.totalRevenue || 0),
      icon: DollarSign,
      change: "+12.5%",
      positive: true,
    },
    {
      title: "Tickets Sold",
      value: analytics?.totalTicketsSold || 0,
      icon: Ticket,
      change: "+8.2%",
      positive: true,
    },
    {
      title: "Total Events",
      value: analytics?.totalEvents || 0,
      icon: Calendar,
      change: `${analytics?.activeEvents || 0} active`,
      positive: true,
    },
    {
      title: "Avg. Ticket Price",
      value: formatPrice((analytics?.totalRevenue || 0) / Math.max(analytics?.totalTicketsSold || 1, 1)),
      icon: BarChart3,
      change: "+3.1%",
      positive: true,
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">Track your event performance and sales</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        <div className={`flex items-center gap-1 mt-1 text-sm ${stat.positive ? "text-green-500" : "text-red-500"}`}>
                          {stat.positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {stat.change}
                        </div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">By Event</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <Card className="lg:col-span-2 bg-card border-border">
                  <CardHeader>
                    <CardTitle>Sales This Week</CardTitle>
                    <CardDescription>Daily revenue and ticket sales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics?.salesByDay || []}>
                          <defs>
                            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#salesGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>By Category</CardTitle>
                    <CardDescription>Revenue distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={analytics?.salesByCategory || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics?.salesByCategory?.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {analytics?.salesByCategory?.map((cat, index) => (
                        <div key={cat.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="capitalize">{cat.name.replace("-", " ")}</span>
                          </div>
                          <span className="font-medium">{formatPrice(cat.value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="events">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Top Performing Events</CardTitle>
                  <CardDescription>Events ranked by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.topEvents || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" width={150} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyTickets from "./pages/MyTickets";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import SellerApply from "./pages/SellerApply";
import SellerDashboard from "./pages/seller/Dashboard";
import SellerAnalytics from "./pages/seller/Analytics";
import CreateEvent from "./pages/seller/CreateEvent";
import QRScanner from "./pages/seller/QRScanner";
import PromoCodes from "./pages/seller/PromoCodes";
import PaymentCallback from "./pages/PaymentCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/seller/apply" element={<SellerApply />} />
              <Route path="/seller/dashboard" element={<SellerDashboard />} />
              <Route path="/seller/analytics" element={<SellerAnalytics />} />
              <Route path="/seller/events/new" element={<CreateEvent />} />
              <Route path="/seller/scanner" element={<QRScanner />} />
              <Route path="/seller/promo-codes" element={<PromoCodes />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

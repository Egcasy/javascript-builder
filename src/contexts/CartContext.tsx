import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  ticket_type_id: string;
  quantity: number;
  ticketType?: {
    id: string;
    name: string;
    price: number;
    event_id: string;
    event?: {
      id: string;
      title: string;
      cover_image: string | null;
      date: string;
    };
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (ticketTypeId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        ticket_type_id,
        quantity,
        ticket_types (
          id,
          name,
          price,
          event_id,
          events (
            id,
            title,
            cover_image,
            date
          )
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching cart:', error);
    } else if (data) {
      const formattedItems = data.map((item: any) => ({
        id: item.id,
        ticket_type_id: item.ticket_type_id,
        quantity: item.quantity,
        ticketType: item.ticket_types ? {
          id: item.ticket_types.id,
          name: item.ticket_types.name,
          price: item.ticket_types.price,
          event_id: item.ticket_types.event_id,
          event: item.ticket_types.events
        } : undefined
      }));
      setItems(formattedItems);
    }
    setLoading(false);
  };

  const addToCart = async (ticketTypeId: string, quantity: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add tickets to your cart",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .upsert({
        user_id: user.id,
        ticket_type_id: ticketTypeId,
        quantity
      }, {
        onConflict: 'user_id,ticket_type_id'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Added to cart",
        description: "Tickets added successfully"
      });
      fetchCart();
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    } else {
      fetchCart();
    }
  };

  const removeFromCart = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    } else {
      fetchCart();
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setItems([]);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = item.ticketType?.price ?? 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
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
    const cartSnapshot = await getDocs(collection(db, "users", user.uid, "cart_items"));
    const formattedItems = cartSnapshot.docs.map((docSnap) => {
      const data = docSnap.data() as CartItem;
      return {
        id: docSnap.id,
        ticket_type_id: data.ticket_type_id,
        quantity: data.quantity,
        ticketType: data.ticketType,
      };
    });
    setItems(formattedItems);
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

    try {
      const eventSnapshot = await getDocs(
        query(collection(db, "events"), where("ticket_type_ids", "array-contains", ticketTypeId))
      );
      const eventDoc = eventSnapshot.docs[0];
      const eventData = eventDoc?.data() as any;
      const ticketType = eventData?.ticket_types?.find((ticket: any) => ticket.id === ticketTypeId);

      const cartItemRef = doc(db, "users", user.uid, "cart_items", ticketTypeId);
      const existingSnapshot = await getDoc(cartItemRef);
      const existingQuantity = existingSnapshot.exists()
        ? (existingSnapshot.data() as { quantity?: number }).quantity || 0
        : 0;
      const nextQuantity = existingQuantity + quantity;

      await setDoc(
        cartItemRef,
        {
          ticket_type_id: ticketTypeId,
          quantity: nextQuantity,
          ticketType: ticketType
            ? {
                id: ticketTypeId,
                name: ticketType.name,
                price: ticketType.price,
                event_id: eventDoc?.id,
                event: eventDoc
                  ? {
                      id: eventDoc.id,
                      title: eventData?.title || "Event",
                      cover_image: eventData?.cover_image || null,
                      date: eventData?.date || "",
                    }
                  : undefined,
              }
            : undefined,
        },
        { merge: true }
      );

      toast({
        title: "Added to cart",
        description: "Tickets added successfully",
      });
      fetchCart();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      await updateDoc(doc(db, "users", user!.uid, "cart_items", itemId), { quantity });
      fetchCart();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "users", user!.uid, "cart_items", itemId));
      fetchCart();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const cartSnapshot = await getDocs(collection(db, "users", user.uid, "cart_items"));
    await Promise.all(cartSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
    setItems([]);
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

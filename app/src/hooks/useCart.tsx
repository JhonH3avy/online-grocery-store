import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
  productId: string;
  quantity: number;
}

interface CartContextType {
  cartItems: Record<string, number>;
  cartDrawerOpen: boolean;
  setCartItems: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setCartDrawerOpen: (open: boolean) => void;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const getTotalItems = () => {
    return Object.values(cartItems).reduce((sum: number, quantity: unknown) => sum + (quantity as number), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartDrawerOpen,
      setCartItems,
      setCartDrawerOpen,
      getTotalItems
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
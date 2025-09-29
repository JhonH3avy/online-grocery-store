import React, { createContext, useContext, ReactNode } from 'react';
import { CartState, CartHandlers } from '../components/layout/AppLayout';

interface CartContextType {
  cartState: CartState;
  cartHandlers: CartHandlers;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
  cartState: CartState;
  cartHandlers: CartHandlers;
}

export function CartProvider({ children, cartState, cartHandlers }: CartProviderProps) {
  return (
    <CartContext.Provider value={{ cartState, cartHandlers }}>
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
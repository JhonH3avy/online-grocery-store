import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { cartService } from '../services/cartService';
import { useAuth } from './useAuth';
import { Product } from '../components/ProductCard';

interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  couponCode?: string;
  discount?: number;
  createdAt: string;
  updatedAt: string;
}

interface CartContextType {
  cartItems: Record<string, number>;
  cartProducts: Product[];
  cart: Cart | null;
  loading: boolean;
  hasInitializedCart: boolean;
  
  // Actions
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasInitializedCart, setHasInitializedCart] = useState(false);

  // Load cart function
  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      
      if (response.success && response.data) {
        setCart(response.data);
        
        // Extract cart items and products
        const items: Record<string, number> = {};
        const products: Product[] = [];
        
        if (response.data.items && Array.isArray(response.data.items)) {
          response.data.items.forEach((item: CartItem) => {
            items[item.productId] = item.quantity;
            if (item.product && !products.find(p => p.id === item.product.id)) {
              products.push(item.product);
            }
          });
        }
        
        setCartItems(items);
        setCartProducts(products);
      } else {
        // Initialize empty cart state
        setCartItems({});
        setCartProducts([]);
        setCart(null);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Initialize empty cart state on error
      setCartItems({});
      setCartProducts([]);
      setCart(null);
    } finally {
      setLoading(false);
      setHasInitializedCart(true);
    }
  };

  // Add to cart function
  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      // Optimistically update UI
      const newQuantity = (cartItems[productId] || 0) + quantity;
      setCartItems(prev => ({
        ...prev,
        [productId]: newQuantity
      }));

      // Call API
      const response = await cartService.addToCart({ productId, quantity });
      
      if (response.success) {
        // Reload cart to get accurate server state
        await loadCart();
        toast.success('Added to cart!');
      } else {
        // Revert optimistic update on failure
        setCartItems(prev => ({
          ...prev,
          [productId]: (prev[productId] || quantity) - quantity
        }));
        throw new Error(response.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  // Update cart item function
  const updateCartItem = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      // Optimistically update UI
      setCartItems(prev => ({
        ...prev,
        [productId]: quantity
      }));

      // Find cart item ID for API call
      const cartItem = cart?.items?.find((item: CartItem) => item.productId === productId);
      if (cartItem) {
        const response = await cartService.updateCartItem(cartItem.id, { quantity });
        if (response.success) {
          await loadCart(); // Reload to get accurate state
        } else {
          throw new Error(response.error || 'Failed to update cart');
        }
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      toast.error('Failed to update cart');
      // Reload cart to get accurate state
      await loadCart();
    }
  };

  // Remove from cart function
  const removeFromCart = async (productId: string) => {
    try {
      // Optimistically update UI
      setCartItems(prev => {
        const newItems = { ...prev };
        delete newItems[productId];
        return newItems;
      });

      // Find cart item ID for API call
      const cartItem = cart?.items?.find((item: CartItem) => item.productId === productId);
      if (cartItem) {
        const response = await cartService.removeFromCart(cartItem.id);
        if (response.success) {
          await loadCart(); // Reload to get accurate state
          toast.success('Removed from cart');
        } else {
          throw new Error(response.error || 'Failed to remove from cart');
        }
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast.error('Failed to remove from cart');
      // Reload cart to get accurate state
      await loadCart();
    }
  };

  // Clear cart function
  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCartItems({});
      setCartProducts([]);
      setCart(null);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  // Initialize cart when auth state changes
  useEffect(() => {
    if (hasInitializedCart) {
      // Cart state change detected - reload cart
      loadCart();
    } else if (isAuthenticated || !hasInitializedCart) {
      // Initial load or user just logged in
      loadCart();
    }
  }, [isAuthenticated, user?.id, hasInitializedCart]);

  // Handle cart migration when user logs in
  useEffect(() => {
    if (isAuthenticated && hasInitializedCart) {
      cartService.migrateLocalCart().then(() => {
        loadCart(); // Reload after migration
      }).catch(error => {
        console.error('Failed to migrate local cart:', error);
        loadCart(); // Still reload cart even if migration fails
      });
    }
  }, [isAuthenticated, hasInitializedCart]);

  const value: CartContextType = {
    cartItems,
    cartProducts,
    cart,
    loading,
    hasInitializedCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
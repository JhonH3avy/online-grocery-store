import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigation } from '../Navigation';
import { Footer } from './Footer';
import { CartDrawer } from '../CartDrawer';
import { AuthModal } from '../auth';
import { CheckoutModal } from '../CheckoutModal';
import { cartService } from '../../services/cartService';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { Product } from '../ProductCard';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Cart state - shared across all pages
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<any>(null);
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [hasInitializedCart, setHasInitializedCart] = useState(false);
  const [lastAuthState, setLastAuthState] = useState<boolean | null>(null);
  
  // Categories state for footer
  const [categories, setCategories] = useState<any[]>([]);

  // Initialize cart when auth state changes
  useEffect(() => {
    const initializeCart = async () => {
      if (isAuthenticated !== lastAuthState) {
        setLastAuthState(isAuthenticated);
        
        if (isAuthenticated && user && !hasInitializedCart) {
          try {
            const cartResponse = await cartService.getCart();
            if (cartResponse.data && cartResponse.data.items?.length > 0) {
              const itemsMap: Record<string, number> = {};
              cartResponse.data.items.forEach((item: any) => {
                itemsMap[item.productId] = item.quantity;
              });
              setCartItems(itemsMap);
              setCart(cartResponse.data);
              
              const productsResponse = await productService.getProducts();
              if (productsResponse.data?.products) {
                setCartProducts(productsResponse.data.products);
              }
              
              toast.success('Cart loaded successfully');
            }
            setHasInitializedCart(true);
          } catch (error) {
            console.error('Failed to load cart:', error);
          }
        } else if (!isAuthenticated && hasInitializedCart) {
          setCartItems({});
          setCart(null);
          setCartProducts([]);
          setHasInitializedCart(false);
        }
      }
    };

    initializeCart();
  }, [isAuthenticated, user, hasInitializedCart, lastAuthState]);

  // Load categories for footer
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesResponse = await categoryService.getCategories();
        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Cart management functions
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const newQuantity = (cartItems[productId] || 0) + quantity;
      await cartService.addToCart({ productId, quantity });
      
      setCartItems(prev => ({
        ...prev,
        [productId]: newQuantity
      }));
      
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleUpdateCartItem = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveFromCart(productId);
      return;
    }

    try {
      await cartService.updateCartItem(productId, { quantity: newQuantity });
      setCartItems(prev => ({
        ...prev,
        [productId]: newQuantity
      }));
    } catch (error) {
      console.error('Failed to update cart item:', error);
      toast.error('Failed to update cart');
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    try {
      await cartService.removeFromCart(productId);
      setCartItems(prev => {
        const newItems = { ...prev };
        delete newItems[productId];
        return newItems;
      });
      toast.success('Removed from cart');
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast.error('Failed to remove from cart');
    }
  };

  const handleClearCart = async () => {
    try {
      await cartService.clearCart();
      setCartItems({});
      setCart(null);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setCartDrawerOpen(false);
    setShowCheckoutModal(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation Header */}
      <Navigation 
        cartItems={cartItems}
        products={cartProducts}
        onCartDrawerOpen={() => setCartDrawerOpen(true)}
      />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <Footer categories={categories} />
      
      {/* Cart Drawer */}
      <CartDrawer
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
        cartItems={cartItems}
        products={cartProducts}
        weightUnit={weightUnit}
        onWeightUnitChange={setWeightUnit}
        onQuantityChange={handleUpdateCartItem}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleProceedToCheckout}
      />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      {/* Checkout Modal */}
      <CheckoutModal
        open={showCheckoutModal}
        onOpenChange={setShowCheckoutModal}
        cartItems={cartItems}
        cartProducts={cartProducts}
        weightUnit={weightUnit}
        onCheckoutSuccess={handleClearCart}
      />
    </div>
  );
}
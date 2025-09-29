import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigation } from '../Navigation';
import { Footer } from './Footer';
import { CartDrawer } from '../CartDrawer';
import { AuthModal } from '../auth';
import { CheckoutModal } from '../CheckoutModal';
import { CartProvider } from '../../contexts/CartContext';
import { cartService } from '../../services/cartService';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { healthCheck } from '../../services/api';
import { Product } from '../ProductCard';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: ReactNode;
}

export interface CartState {
  cartItems: Record<string, number>;
  cart: any;
  cartProducts: Product[];
  weightUnit: 'kg' | 'lb';
  cartDrawerOpen: boolean;
  showAuthModal: boolean;
  showCheckoutModal: boolean;
  serverStatus: 'checking' | 'online' | 'offline';
}

export interface CartHandlers {
  handleAddToCart: (product: Product, quantity: number) => Promise<void>;
  handleQuantityChange: (productId: string, quantity: number) => Promise<void>;
  handleRemoveItem: (productId: string) => Promise<void>;
  setWeightUnit: (unit: 'kg' | 'lb') => void;
  setCartDrawerOpen: (open: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  setShowCheckoutModal: (show: boolean) => void;
  handleCheckout: () => Promise<void>;
  handleCheckoutSuccess: () => Promise<void>;
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
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Categories state for footer
  const [categories, setCategories] = useState<any[]>([]);

  // Check server health and initialize data
  useEffect(() => {
    const initializeApp = async () => {
      setServerStatus('checking')
      try {
        // Check server health
        const healthResponse = await healthCheck()
        if (!healthResponse.success) {
          throw new Error('Server health check failed')
        }
        
        setServerStatus('online')
        toast.success('Connected to server')
        
        // Load initial data
        await loadCategories()
        await loadCart()
        setHasInitializedCart(true)
        
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setServerStatus('offline')
        toast.error('Server unavailable - please check your connection')
      }
    }

    initializeApp()
  }, [])

  // Load cart from API or localStorage
  const loadCart = async () => {
    try {
      // Always try to get cart from server first (works for both authenticated and anonymous users)
      const response = await cartService.getCart()
      if (response.success && response.data) {
        setCart(response.data)
        // Update cart items from API response
        const newCartItems: Record<string, number> = {}
        const newCartProducts: Product[] = []
        
        // Add null/undefined checks for items array
        if (response.data.items && Array.isArray(response.data.items)) {
          response.data.items.forEach((item: any) => {
            if (item && item.productId) {
              newCartItems[item.productId] = item.quantity || 0
              if (item.product) {
                newCartProducts.push(item.product)
              }
            }
          })
        }
        
        setCartItems(newCartItems)
        setCartProducts(newCartProducts)
      } else if (!isAuthenticated) {
        // If server call failed and user is anonymous, fallback to localStorage
        const localCartItems = cartService.getLocalCartItems()
        const newCartItems: Record<string, number> = {}
        
        if (Array.isArray(localCartItems)) {
          localCartItems.forEach(item => {
            if (item && item.productId) {
              newCartItems[item.productId] = item.quantity || 0
            }
          })
        }
        
        setCartItems(newCartItems)
        
        // Fetch product details for items in cart
        if (localCartItems && localCartItems.length > 0) {
          try {
            const productIds = localCartItems.map(item => item.productId).filter(Boolean)
            // We need to fetch products by IDs - this would require a new API endpoint
            // For now, we'll keep the existing products in the cart
            setCartProducts(cartProducts.filter(product => productIds.includes(product.id)))
          } catch (error) {
            console.error('Failed to fetch cart product details:', error)
          }
        } else {
          setCartProducts([])
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      // Cart errors are non-critical, just log them
      // Set empty cart state to prevent undefined errors
      setCartItems({})
      setCartProducts([])
    }
  }

  // Reload cart when authentication status changes
  useEffect(() => {
    // Skip if this is the initial render or we haven't done the initial cart load yet
    if (serverStatus === 'checking' || !hasInitializedCart) {
      return
    }
    
    // Check if authentication state actually changed
    if (lastAuthState === null) {
      // First time setting the authentication state after initialization
      setLastAuthState(isAuthenticated)
      return
    }
    
    if (lastAuthState === isAuthenticated) {
      // No actual change in authentication state
      return
    }
    
    // Authentication state actually changed - update cart
    setLastAuthState(isAuthenticated)
    
    if (isAuthenticated) {
      cartService.migrateLocalCart().then(() => {
        // Reload cart after migration
        loadCart()
      }).catch(error => {
        console.error('Failed to migrate local cart:', error)
        // Still load cart even if migration fails
        loadCart()
      })
    } else {
      // User logged out, just load cart normally (anonymous cart)
      loadCart()
    }
  }, [isAuthenticated, serverStatus, hasInitializedCart])

  // Load categories for footer
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

  useEffect(() => {
    loadCategories();
  }, []);

  // Cart management functions
  const handleAddToCart = async (product: Product, quantity: number) => {
    if (serverStatus !== 'online') {
      toast.error('Cannot add to cart - server offline')
      return
    }

    try {
      const response = await cartService.addToCart({ 
        productId: product.id, 
        quantity 
      })
      
      if (response.success) {
        // Update local state
        setCartItems(prev => ({
          ...prev,
          [product.id]: (prev[product.id] || 0) + quantity
        }))

        // Add product to cart products if not already there
        setCartProducts(prev => {
          const existingProduct = prev.find(p => p.id === product.id)
          if (!existingProduct) {
            return [...prev, product]
          }
          return prev
        })

        toast.success(`${product.name} agregado al carrito`)
        
        // Reload cart for authenticated users to get server state
        if (isAuthenticated) {
          loadCart()
        }
      } else {
        throw new Error(response.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add item to cart')
    }
  }

  const handleQuantityChange = async (productId: string, quantity: number) => {
    if (serverStatus !== 'online') {
      toast.error('Cannot update cart - server offline')
      return
    }

    try {
      if (quantity <= 0) {
        await handleRemoveItem(productId)
        return
      }

      // Update local state immediately for better UX
      setCartItems(prev => ({
        ...prev,
        [productId]: quantity
      }))

      if (isAuthenticated) {
        // Find cart item and update via API
        const cartItem = cart?.items?.find((item: any) => item.productId === productId)
        if (cartItem) {
          const response = await cartService.updateCartItem(cartItem.id, { quantity })
          if (response.success) {
            loadCart() // Reload cart from server
          }
        }
      } else {
        // For anonymous users, update local storage
        const response = await cartService.updateCartItem(productId, { quantity })
        if (response.success) {
          // Local storage already updated by cartService
        }
      }
    } catch (error) {
      console.error('Failed to update cart item:', error)
      toast.error('Failed to update cart')
      // Revert local state on error
      await loadCart()
    }
  }

  const handleRemoveItem = async (productId: string) => {
    if (serverStatus !== 'online') {
      toast.error('Cannot remove item - server offline')
      return
    }

    try {
      // Update local state immediately
      setCartItems(prev => {
        const newItems = { ...prev }
        delete newItems[productId]
        return newItems
      })

      // Remove from cart products
      setCartProducts(prev => prev.filter(product => product.id !== productId))

      if (isAuthenticated) {
        // Find cart item and remove via API
        const cartItem = cart?.items?.find((item: any) => item.productId === productId)
        if (cartItem) {
          const response = await cartService.removeFromCart(cartItem.id)
          if (response.success) {
            loadCart() // Reload cart from server
          }
        }
      } else {
        // For anonymous users, remove from local storage
        const response = await cartService.removeFromCart(productId)
        if (response.success) {
          // Local storage already updated by cartService
        }
      }

      const product = cartProducts.find(p => p.id === productId)
      if (product) {
        toast.success(`${product.name} eliminado del carrito`)
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error)
      toast.error('Failed to remove item')
      // Revert local state on error
      await loadCart()
    }
  }

  const handleCheckout = async () => {
    if (Object.keys(cartItems).length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please sign in to proceed with checkout');
      setShowAuthModal(true);
      return;
    }

    // Open checkout modal
    setShowCheckoutModal(true);
    setCartDrawerOpen(false);
  }

  const handleCheckoutSuccess = async () => {
    // Clear local cart state
    setCartItems({});
    setCartProducts([]);
    setCart(null);
    
    // Reload cart from server to confirm it's empty
    await loadCart();
  }

  // Create cart state and handlers objects for passing to children
  const cartState: CartState = {
    cartItems,
    cart,
    cartProducts,
    weightUnit,
    cartDrawerOpen,
    showAuthModal,
    showCheckoutModal,
    serverStatus
  };

  const cartHandlers: CartHandlers = {
    handleAddToCart,
    handleQuantityChange,
    handleRemoveItem,
    setWeightUnit,
    setCartDrawerOpen,
    setShowAuthModal,
    setShowCheckoutModal,
    handleCheckout,
    handleCheckoutSuccess
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation Header */}
      <Navigation 
        cartItems={cartItems}
        products={cartProducts}
        onCartDrawerOpen={() => setCartDrawerOpen(true)}
      />
      
      {/* Main Content - Use CartProvider to share cart state and handlers */}
      <main className="flex-1">
        <CartProvider cartState={cartState} cartHandlers={cartHandlers}>
          {children}
        </CartProvider>
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
        onQuantityChange={handleQuantityChange}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
        onSuccess={() => {
          setShowAuthModal(false);
          toast.success('Successfully signed in! You can now proceed with checkout.');
        }}
      />
      
      {/* Checkout Modal */}
      <CheckoutModal
        open={showCheckoutModal}
        onOpenChange={setShowCheckoutModal}
        cartItems={cartItems}
        cartProducts={cartProducts}
        weightUnit={weightUnit}
        onCheckoutSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
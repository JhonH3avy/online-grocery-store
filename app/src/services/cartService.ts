import { apiClient, ApiResponse } from './api';
import { Product } from '../components/ProductCard';

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
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

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  userId?: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CheckoutRequest {
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    type: 'credit_card' | 'debit_card' | 'paypal';
    cardNumber?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cvv?: string;
  };
  userId?: string;
}

// Local storage cart structure for anonymous users
interface LocalCartItem {
  productId: string;
  quantity: number;
}

interface LocalCart {
  items: LocalCartItem[];
  updatedAt: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to check if user is authenticated
const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Local storage cart operations for anonymous users
const localCartOperations = {
  getCart: (): LocalCart => {
    const cartData = localStorage.getItem('anonymous_cart');
    if (cartData) {
      try {
        return JSON.parse(cartData);
      } catch (error) {
        console.error('Error parsing local cart data:', error);
      }
    }
    return { items: [], updatedAt: new Date().toISOString() };
  },

  saveCart: (cart: LocalCart): void => {
    localStorage.setItem('anonymous_cart', JSON.stringify({
      ...cart,
      updatedAt: new Date().toISOString()
    }));
  },

  addItem: (productId: string, quantity: number): void => {
    const cart = localCartOperations.getCart();
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    
    localCartOperations.saveCart(cart);
  },

  updateItem: (productId: string, quantity: number): void => {
    const cart = localCartOperations.getCart();
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      localCartOperations.saveCart(cart);
    }
  },

  removeItem: (productId: string): void => {
    const cart = localCartOperations.getCart();
    cart.items = cart.items.filter(item => item.productId !== productId);
    localCartOperations.saveCart(cart);
  },

  clearCart: (): void => {
    localStorage.removeItem('anonymous_cart');
  },

  // Migrate local cart to server when user logs in
  migrateToServer: async (): Promise<void> => {
    if (!isAuthenticated()) return;
    
    const localCart = localCartOperations.getCart();
    if (localCart.items.length === 0) return;

    try {
      // Add each item to the server cart
      for (const item of localCart.items) {
        await cartService.addToCart({
          productId: item.productId,
          quantity: item.quantity
        });
      }
      
      // Clear local cart after successful migration
      localCartOperations.clearCart();
    } catch (error) {
      console.error('Failed to migrate local cart to server:', error);
    }
  }
};

export const cartService = {
  // Get user's cart (server-side for authenticated users, local storage for anonymous)
  getCart: async (): Promise<ApiResponse<Cart>> => {
    if (isAuthenticated()) {
      // For authenticated users, get cart from server
      return apiClient.get<Cart>('/cart');
    } else {
      // For anonymous users, simulate API response with local storage data
      const localCart = localCartOperations.getCart();
      
      // We'll return a simplified response - products need to be fetched separately
      const mockCart: Cart = {
        id: 'local-cart',
        items: [],
        totalItems: localCart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: 0,
        tax: 0,
        total: 0,
        createdAt: localCart.updatedAt,
        updatedAt: localCart.updatedAt
      };

      return {
        success: true,
        data: mockCart
      };
    }
  },

  // Add item to cart
  addToCart: async (data: AddToCartRequest): Promise<ApiResponse<Cart>> => {
    if (isAuthenticated()) {
      return apiClient.post<Cart>('/cart/items', data);
    } else {
      // Add to local storage for anonymous users
      localCartOperations.addItem(data.productId, data.quantity);
      return cartService.getCart(); // Return updated cart
    }
  },

  // Update cart item quantity
  updateCartItem: async (itemId: string, data: UpdateCartItemRequest): Promise<ApiResponse<Cart>> => {
    if (isAuthenticated()) {
      return apiClient.put<Cart>(`/cart/items/${itemId}`, data);
    } else {
      // For local cart, itemId is actually the productId
      localCartOperations.updateItem(itemId, data.quantity);
      return cartService.getCart(); // Return updated cart
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId: string): Promise<ApiResponse<Cart>> => {
    if (isAuthenticated()) {
      return apiClient.delete<Cart>(`/cart/items/${itemId}`);
    } else {
      // For local cart, itemId is actually the productId
      localCartOperations.removeItem(itemId);
      return cartService.getCart(); // Return updated cart
    }
  },

  // Clear entire cart
  clearCart: async (): Promise<ApiResponse<{ message: string }>> => {
    if (isAuthenticated()) {
      return apiClient.delete<{ message: string }>('/cart/clear');
    } else {
      localCartOperations.clearCart();
      return {
        success: true,
        data: { message: 'Cart cleared successfully' }
      };
    }
  },

  // Apply coupon to cart
  applyCoupon: async (code: string): Promise<ApiResponse<Cart>> => {
    if (isAuthenticated()) {
      return apiClient.post<Cart>('/cart/coupon', { code });
    } else {
      // Coupons not supported for anonymous users
      return {
        success: false,
        error: 'Please sign in to apply coupons'
      };
    }
  },

  // Remove coupon from cart
  removeCoupon: async (): Promise<ApiResponse<Cart>> => {
    if (isAuthenticated()) {
      return apiClient.delete<Cart>('/cart/coupon');
    } else {
      return {
        success: false,
        error: 'Please sign in to manage coupons'
      };
    }
  },

  // Checkout cart (requires authentication)
  checkout: async (data: CheckoutRequest): Promise<ApiResponse<{ orderId: string; message: string }>> => {
    if (!isAuthenticated()) {
      return {
        success: false,
        error: 'Authentication required for checkout'
      };
    }
    return apiClient.post<{ orderId: string; message: string }>('/cart/checkout', data);
  },

  // Get local cart items for anonymous users
  getLocalCartItems: (): LocalCartItem[] => {
    if (isAuthenticated()) {
      return []; // No local cart for authenticated users
    }
    return localCartOperations.getCart().items;
  },

  // Migrate local cart to server when user logs in
  migrateLocalCart: localCartOperations.migrateToServer,

  // Migrate cart back to localStorage when user logs out
  migrateToLocal: async (): Promise<void> => {
    if (!isAuthenticated()) return;
    
    try {
      // Get the current server cart
      const response = await cartService.getCart();
      if (response.success && response.data && response.data.items.length > 0) {
        // Convert server cart items to local format and save to localStorage
        const localItems: LocalCartItem[] = response.data.items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          name: item.product.name,
          imageUrl: item.product.imageUrl || ''
        }));

        // Save to localStorage (this will be used after logout)
        const localCart = {
          items: localItems,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('anonymous_cart', JSON.stringify(localCart));
      }
    } catch (error) {
      console.error('Failed to migrate cart to localStorage:', error);
    }
  }
};

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

export const cartService = {
  // Get user's cart
  getCart: async (userId?: string): Promise<ApiResponse<Cart>> => {
    const endpoint = userId ? `/cart?userId=${userId}` : '/cart';
    return apiClient.get<Cart>(endpoint);
  },

  // Add item to cart
  addToCart: async (data: AddToCartRequest): Promise<ApiResponse<Cart>> => {
    return apiClient.post<Cart>('/cart/items', data);
  },

  // Update cart item quantity
  updateCartItem: async (itemId: string, data: UpdateCartItemRequest): Promise<ApiResponse<Cart>> => {
    return apiClient.put<Cart>(`/cart/items/${itemId}`, data);
  },

  // Remove item from cart
  removeFromCart: async (itemId: string): Promise<ApiResponse<Cart>> => {
    return apiClient.delete<Cart>(`/cart/items/${itemId}`);
  },

  // Clear entire cart
  clearCart: async (userId?: string): Promise<ApiResponse<{ message: string }>> => {
    const endpoint = userId ? `/cart/clear?userId=${userId}` : '/cart/clear';
    return apiClient.delete<{ message: string }>(endpoint);
  },

  // Apply coupon to cart
  applyCoupon: async (code: string, userId?: string): Promise<ApiResponse<Cart>> => {
    const data = userId ? { code, userId } : { code };
    return apiClient.post<Cart>('/cart/coupon', data);
  },

  // Remove coupon from cart
  removeCoupon: async (userId?: string): Promise<ApiResponse<Cart>> => {
    const endpoint = userId ? `/cart/coupon?userId=${userId}` : '/cart/coupon';
    return apiClient.delete<Cart>(endpoint);
  },

  // Checkout cart
  checkout: async (data: CheckoutRequest): Promise<ApiResponse<{ orderId: string; message: string }>> => {
    return apiClient.post<{ orderId: string; message: string }>('/cart/checkout', data);
  },
};

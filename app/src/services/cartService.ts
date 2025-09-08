import { apiClient, ApiResponse } from './api';
import { Product } from '../components/ProductCard';

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export const cartService = {
  // Get user's cart
  getCart: async (): Promise<ApiResponse<Cart>> => {
    return apiClient.get<Cart>('/cart');
  },

  // Add item to cart
  addToCart: async (data: AddToCartRequest): Promise<ApiResponse<CartItem>> => {
    return apiClient.post<CartItem>('/cart/items', data);
  },

  // Update cart item quantity
  updateCartItem: async (itemId: string, data: UpdateCartItemRequest): Promise<ApiResponse<CartItem>> => {
    return apiClient.put<CartItem>(`/cart/items/${itemId}`, data);
  },

  // Remove item from cart
  removeFromCart: async (itemId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/cart/items/${itemId}`);
  },

  // Clear entire cart
  clearCart: async (): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>('/cart');
  },
};

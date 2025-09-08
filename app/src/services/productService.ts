import { apiClient, ApiResponse } from './api';
import { Product } from '../components/ProductCard';

// Product API Service
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export const productService = {
  // Get all products with optional filtering
  getProducts: async (filters?: ProductFilters): Promise<ApiResponse<ProductsResponse>> => {
    const queryParams = new URLSearchParams();
    
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.subcategory) queryParams.append('subcategory', filters.subcategory);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());

    const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<ProductsResponse>(endpoint);
  },

  // Get single product by ID
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    return apiClient.get<Product>(`/products/${id}`);
  },

  // Get products by category
  getProductsByCategory: async (categoryId: string): Promise<ApiResponse<Product[]>> => {
    return apiClient.get<Product[]>(`/products/category/${categoryId}`);
  },

  // Search products
  searchProducts: async (query: string): Promise<ApiResponse<Product[]>> => {
    return apiClient.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
  },

  // Get featured products
  getFeaturedProducts: async (): Promise<ApiResponse<Product[]>> => {
    return apiClient.get<Product[]>('/products/featured');
  },

  // Check product availability
  checkAvailability: async (id: string): Promise<ApiResponse<{ available: boolean; stock: number }>> => {
    return apiClient.get<{ available: boolean; stock: number }>(`/products/availability/${id}`);
  },
};

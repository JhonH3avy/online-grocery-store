import { apiClient, ApiResponse } from './api';
import { Product } from '../components/ProductCard';

// Product API Service
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  limit?: number;
  page?: number;
  availability?: boolean;
  featured?: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const productService = {
  // Get all products with optional filtering
  getProducts: async (filters?: ProductFilters): Promise<ApiResponse<ProductsResponse>> => {
    const queryParams = new URLSearchParams();
    
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.subcategory) queryParams.append('subcategory', filters.subcategory);
    if (filters?.search) queryParams.append('q', filters.search);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.availability !== undefined) queryParams.append('availability', filters.availability.toString());
    if (filters?.featured !== undefined) queryParams.append('featured', filters.featured.toString());

    const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<ProductsResponse>(endpoint);
  },

  // Search products
  searchProducts: async (query: string, filters?: Omit<ProductFilters, 'search'>): Promise<ApiResponse<ProductsResponse>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.subcategory) queryParams.append('subcategory', filters.subcategory);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());

    return apiClient.get<ProductsResponse>(`/products/search?${queryParams.toString()}`);
  },

  // Get featured products
  getFeaturedProducts: async (limit = 8): Promise<ApiResponse<Product[]>> => {
    return apiClient.get<Product[]>(`/products/featured?limit=${limit}`);
  },

  // Get single product by ID
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    return apiClient.get<Product>(`/products/${id}`);
  },
};

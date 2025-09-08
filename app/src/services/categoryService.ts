import { apiClient, ApiResponse } from './api';

// Category Types
export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export const categoryService = {
  // Get all categories with subcategories
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return apiClient.get<Category[]>('/categories');
  },

  // Get specific category by ID
  getCategory: async (id: string): Promise<ApiResponse<Category>> => {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  // Get subcategories for a category
  getSubcategories: async (categoryId: string): Promise<ApiResponse<Subcategory[]>> => {
    return apiClient.get<Subcategory[]>(`/categories/${categoryId}/subcategories`);
  },
};

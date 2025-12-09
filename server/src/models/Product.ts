import { normalizeString } from '../utils/stringUtils';
import { db } from '../services/drizzle';
import { eq, and, desc, ilike, gte, lte, or, sql } from 'drizzle-orm';
import { products, categories, subcategories } from '../db/schema';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  image_url?: string;
  category_id: string;
  subcategory_id: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  unit: string;
  imageUrl?: string;
  categoryId: string;
  subcategoryId: string;
  isFeatured?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  unit?: string;
  imageUrl?: string;
  categoryId?: string;
  subcategoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ProductSearchOptions {
  page?: number;
  limit?: number;
  categoryId?: string;
  subcategoryId?: string;
  categoryName?: string;    // Support filtering by category name (slug)
  subcategoryName?: string; // Support filtering by subcategory name (slug)
  featured?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export class ProductModel {
  static async findById(id: string): Promise<Product | null> {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isActive, true)))
      .limit(1);
    return (rows[0] as any) || null;
  }

  static async create(productData: CreateProductData): Promise<Product> {
    const id = crypto.randomUUID();
    const now = new Date();
    const rows = await db
      .insert(products)
      .values({
        id,
        name: productData.name,
        description: productData.description ?? null,
        price: String(productData.price),
        unit: productData.unit,
        imageUrl: productData.imageUrl ?? null,
        categoryId: productData.categoryId,
        subcategoryId: productData.subcategoryId,
        isActive: true,
        isFeatured: productData.isFeatured || false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return rows[0] as any;
  }

  static async update(id: string, productData: UpdateProductData): Promise<Product | null> {
    const now = new Date();
    const updateData: any = { updatedAt: now };
    if (productData.name) updateData.name = productData.name;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.price) updateData.price = String(productData.price);
    if (productData.unit) updateData.unit = productData.unit;
    if (productData.imageUrl !== undefined) updateData.imageUrl = productData.imageUrl;
    if (productData.categoryId) updateData.categoryId = productData.categoryId;
    if (productData.subcategoryId) updateData.subcategoryId = productData.subcategoryId;
    if (productData.isActive !== undefined) updateData.isActive = productData.isActive;
    if (productData.isFeatured !== undefined) updateData.isFeatured = productData.isFeatured;

    const rows = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return (rows[0] as any) || null;
  }

  static async list(options: ProductSearchOptions = {}): Promise<{ products: Product[], total: number }> {
    const { page = 1, limit = 10, categoryId, subcategoryId, categoryName, subcategoryName, featured, search, minPrice, maxPrice } = options;
    const offset = (page - 1) * limit;

    // Filters applied to the main list query
    const filters: any[] = [eq(products.isActive, true)];
    // Build a separate filter set for the count query to avoid referencing
    // tables that aren't joined in that specific query (prevents FROM-clause errors)
    const countFilters: any[] = [eq(products.isActive, true)];
    if (categoryId) {
      filters.push(eq(products.categoryId, categoryId));
      countFilters.push(eq(products.categoryId, categoryId));
    }
    if (subcategoryId) {
      filters.push(eq(products.subcategoryId, subcategoryId));
      countFilters.push(eq(products.subcategoryId, subcategoryId));
    }
    if (featured !== undefined) {
      filters.push(eq(products.isFeatured, featured));
      countFilters.push(eq(products.isFeatured, featured));
    }
    if (search) {
      filters.push(ilike(products.name, `%${search}%`));
      countFilters.push(ilike(products.name, `%${search}%`));
    }
    if (minPrice !== undefined) {
      filters.push(gte(products.price as any, String(minPrice)));
      countFilters.push(gte(products.price as any, String(minPrice)));
    }
    if (maxPrice !== undefined) {
      filters.push(lte(products.price as any, String(maxPrice)));
      countFilters.push(lte(products.price as any, String(maxPrice)));
    }

    // Name-based filters via joins
    let joined: any = db.select({ p: products }).from(products);
    if (categoryName) {
      const normalizedCategoryName = normalizeString(categoryName);
      joined = joined.innerJoin(categories, eq(products.categoryId, categories.id));
      // emulate slug or normalized name match
      const categorySlugFilter = or(
        eq(categories.slug as any, categoryName),
        eq(categories.slug as any, normalizedCategoryName)
      ) as any;
      filters.push(categorySlugFilter);
      countFilters.push(categorySlugFilter);
    }
    if (subcategoryName) {
      const normalizedSubcategoryName = normalizeString(subcategoryName);
      joined = joined.innerJoin(subcategories, eq(products.subcategoryId, subcategories.id));
      const subcategorySlugFilter = or(
        eq(subcategories.slug as any, subcategoryName),
        eq(subcategories.slug as any, normalizedSubcategoryName)
      ) as any;
      filters.push(subcategorySlugFilter);
      countFilters.push(subcategorySlugFilter);
    }

    // Build count query with the same joins to avoid missing FROM references
    let countQuery: any = db.select({ count: sql<number>`COUNT(*)` }).from(products);
    if (categoryName) {
      countQuery = countQuery.innerJoin(categories, eq(products.categoryId, categories.id));
    }
    if (subcategoryName) {
      countQuery = countQuery.innerJoin(subcategories, eq(products.subcategoryId, subcategories.id));
    }

    const listQuery = joined
      .where(and(...filters))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
    const countQueryFinal = countQuery.where(and(...countFilters));

    if (process.env.DB_LOG_QUERIES === 'true') {
      try {
        const lsql = (listQuery as any).toSQL?.();
        const csql = (countQueryFinal as any).toSQL?.();
        console.log('[Products:list] SQL:', lsql?.sql);
        console.log('[Products:list] Params:', lsql?.params);
        console.log('[Products:count] SQL:', csql?.sql);
        console.log('[Products:count] Params:', csql?.params);
      } catch (e) {
        console.log('[Products] Failed to dump SQL', e);
      }
    }

    const [rows, countRows] = await Promise.all([
      listQuery,
      countQueryFinal,
    ]);

    const list = rows.map((r: any) => r.p ?? r);
    const total = Number(countRows[0]?.count ?? 0);
    return { products: list as any, total };
  }

  static async getFeatured(limit: number = 8): Promise<Product[]> {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit);
    return rows as any;
  }

  static async getByCategory(categoryId: string, limit: number = 20): Promise<Product[]> {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.categoryId, categoryId)))
      .orderBy(products.name)
      .limit(limit);
    return rows as any;
  }

  static async getByCategoryName(categoryName: string, limit: number = 20): Promise<Product[]> {
    const normalizedName = normalizeString(categoryName);
    const rows = await db
      .select({ p: products })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), or(eq(categories.slug as any, categoryName), eq(categories.slug as any, normalizedName)) as any))
      .orderBy(products.name)
      .limit(limit);
    return rows.map(r => r.p) as any;
  }

  static async getBySubcategoryName(subcategoryName: string, limit: number = 20): Promise<Product[]> {
    const normalizedName = normalizeString(subcategoryName);
    const rows = await db
      .select({ p: products })
      .from(products)
      .innerJoin(subcategories, eq(products.subcategoryId, subcategories.id))
      .where(and(eq(products.isActive, true), or(eq(subcategories.slug as any, subcategoryName), eq(subcategories.slug as any, normalizedName)) as any))
      .orderBy(products.name)
      .limit(limit);
    return rows.map(r => r.p) as any;
  }

  static async delete(id: string): Promise<boolean> {
    const rows = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id });
    return rows.length > 0;
  }
}

export default ProductModel;